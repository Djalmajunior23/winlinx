import { createLabSession, type LabSession } from './labSession';
import { LinuxSimulatorEngine } from './linuxEngine';
import { WindowsSimulatorEngine } from './windowsEngine';
import type { ForensicLogRecord, LabDefinition } from '../types/simulator';

const LEGACY_KEY = 'winlinx_lab_workspace_v1';
const MANIFEST_KEY = 'winlinx_lab_workspace_v2';
const ARCHIVE_KEY = `${MANIFEST_KEY}:archive`;
const attemptKey = (labId: string) => `${MANIFEST_KEY}:lab:${labId}`;

interface LabWorkspace {
  activeLabId: string;
  openInLabs: boolean;
  customLabs: LabDefinition[];
  sessions: Record<string, LabSession>;
  archivedLogs: ForensicLogRecord[];
}

type StorageAccess = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function snapshot(session: LabSession) {
  return {
    id: session.id,
    startedAt: session.startedAt,
    linux: session.linux.snapshot(),
    windows: session.windows.snapshot(),
    completed: [...session.completed],
    observed: [...session.observed],
    answers: [...session.answers],
    logs: session.logs
  };
}

type SessionSnapshot = ReturnType<typeof snapshot>;

function restoreSession(data: SessionSnapshot): LabSession {
  if (!data || typeof data.id !== 'string' || !Number.isFinite(Date.parse(data.startedAt))
    || !Array.isArray(data.completed) || !Array.isArray(data.observed) || !Array.isArray(data.answers)
    || !Array.isArray(data.logs) || data.logs.some(log => !log || typeof log.id !== 'string') || !isMachine(data.linux) || !isMachine(data.windows)
    || typeof data.linux.firewallActive !== 'boolean' || typeof data.linux.pythonSetuidCapability !== 'boolean'
    || !data.windows.registryData || typeof data.windows.registryData !== 'object') {
    throw new Error('Estado de máquina inválido.');
  }

  return {
    id: data.id, startedAt: data.startedAt, revision: 0,
    linux: LinuxSimulatorEngine.fromSnapshot(data.linux),
    windows: WindowsSimulatorEngine.fromSnapshot(data.windows),
    completed: new Set(data.completed), observed: new Set(data.observed),
    answers: new Map(data.answers), logs: data.logs
  };
}

function isMachine(data: SessionSnapshot['linux'] | SessionSnapshot['windows'] | undefined) {
  return data?.rootFS?.type === 'dir' && typeof data.currentDir === 'string' && typeof data.currentUser === 'string'
    && Boolean(data.envVars && typeof data.envVars === 'object')
    && Array.isArray(data.processes) && Array.isArray(data.firewallBlockedPorts);
}

function isCustomLab(lab: LabDefinition | null): lab is LabDefinition {
  return Boolean(lab && typeof lab.id === 'string' && /^lab-custom-[a-z0-9-]+$/i.test(lab.id)
    && typeof lab.title === 'string' && typeof lab.description === 'string'
    && Array.isArray(lab.learningGoals) && Array.isArray(lab.mitreTechniques)
    && Array.isArray(lab.tasks) && lab.tasks.every(task => task && typeof task.id === 'string' && typeof task.title === 'string'));
}

interface WorkspaceMetadata {
  activeLabId?: string;
  openInLabs?: boolean;
  customLabs?: LabDefinition[];
}

function recoverWorkspace(
  officialLabs: LabDefinition[],
  metadata: WorkspaceMetadata,
  loadAttempt: (labId: string) => SessionSnapshot | undefined,
  archivedLogs: ForensicLogRecord[],
  onCorruption: () => void
): LabWorkspace {
  const defaultId = officialLabs[0].id;
  const savedCustom = metadata.customLabs ?? [];
  const customLabs = Array.isArray(savedCustom) ? savedCustom.filter(isCustomLab) : [];
  if (!Array.isArray(savedCustom) || customLabs.length !== savedCustom.length) onCorruption();
  const sessions: Record<string, LabSession> = Object.fromEntries([...officialLabs, ...customLabs].flatMap(lab => {
    try {
      const data = loadAttempt(lab.id);
      return data === undefined ? [] : [[lab.id, restoreSession(data)]];
    } catch {
      onCorruption();
      return [[lab.id, createLabSession()]];
    }
  }));
  if (!Object.hasOwn(sessions, defaultId)) sessions[defaultId] = createLabSession();
  const candidate = metadata.activeLabId;
  const activeLabId = candidate && Object.hasOwn(sessions, candidate) ? candidate : defaultId;
  const currentLogIds = new Set(Object.values(sessions).flatMap(session => session.logs.map(log => log.id)));
  return {
    activeLabId, openInLabs: metadata.openInLabs === true, customLabs, sessions,
    archivedLogs: archivedLogs.filter(log => log && typeof log.id === 'string' && !currentLogIds.has(log.id))
  };
}

export function createLabWorkspaceStore() {
  const written = new Map<string, { session: LabSession; revision: number }>();
  let writtenMetadata: string | undefined;
  let writtenArchive: ForensicLogRecord[] | undefined;
  let needsLegacyCleanup = false;

  function load(storage: StorageAccess | null, officialLabs: LabDefinition[]) {
    let recoveryFailed = storage === null;
    const onCorruption = () => { recoveryFailed = true; };
    const read = (key: string) => {
      try { return storage?.getItem(key) ?? null; } catch { onCorruption(); return null; }
    };
    const parse = (raw: string | null) => {
      if (raw === null) return undefined;
      try { return JSON.parse(raw); } catch { onCorruption(); return undefined; }
    };

    const rawMetadata = read(MANIFEST_KEY);
    if (rawMetadata === null) {
      const rawLegacy = read(LEGACY_KEY);
      const legacy = parse(rawLegacy);
      const valid = legacy?.version === 1 && legacy.sessions && typeof legacy.sessions === 'object';
      if (rawLegacy !== null && !valid) onCorruption();
      if (valid) {
        needsLegacyCleanup = true;
        const workspace = recoverWorkspace(officialLabs, legacy,
          id => Object.hasOwn(legacy.sessions, id) ? legacy.sessions[id] : undefined,
          Array.isArray(legacy.archivedLogs) ? legacy.archivedLogs : [], onCorruption);
        return { ...workspace, recoveryFailed };
      }
    }

    const metadata = parse(rawMetadata);
    if (rawMetadata !== null && metadata?.version !== 2) onCorruption();
    const archived = parse(read(ARCHIVE_KEY));
    if (archived !== undefined && !Array.isArray(archived)) onCorruption();
    const storedIds = new Map<string, string>();
    const workspace = recoverWorkspace(officialLabs, metadata?.version === 2 ? metadata : {},
      id => {
        const raw = read(attemptKey(id));
        if (raw === null) return undefined;
        const data = JSON.parse(raw);
        if (data?.version !== 2) throw new Error('Formato de tentativa desconhecido.');
        if (typeof data.session?.id !== 'string') throw new Error('Identificador de tentativa inválido.');
        storedIds.set(id, data.session.id);
        return data.session;
      },
      Array.isArray(archived) ? archived : [], onCorruption);

    for (const [id, storedId] of storedIds) {
      const session = workspace.sessions[id];
      // Recovery creates a different attempt ID; leave it pending for the next save.
      if (session && session.id === storedId) {
        written.set(id, { session, revision: session.revision });
      }
    }
    if (metadata?.version === 2 && Array.isArray(metadata.customLabs) && metadata.customLabs.length === workspace.customLabs.length) {
      writtenMetadata = rawMetadata ?? undefined;
    }
    if (Array.isArray(archived) && archived.length === workspace.archivedLogs.length) writtenArchive = workspace.archivedLogs;
    return { ...workspace, recoveryFailed };
  }

  function save(storage: StorageAccess, workspace: LabWorkspace) {
    // Archive before replacing the old machines so an interrupted reset retains their evidence.
    if (writtenArchive !== workspace.archivedLogs) {
      storage.setItem(ARCHIVE_KEY, JSON.stringify(workspace.archivedLogs));
      writtenArchive = workspace.archivedLogs;
    }

    let failure: unknown;
    for (const [id, session] of Object.entries(workspace.sessions)) {
      const previous = written.get(id);
      if (previous?.session === session && previous.revision === session.revision) continue;
      try {
        storage.setItem(attemptKey(id), JSON.stringify({ version: 2, session: snapshot(session) }));
        written.set(id, { session, revision: session.revision });
      } catch (error) {
        failure ??= error;
      }
    }
    if (failure) throw failure;

    const metadata = JSON.stringify({
      version: 2, activeLabId: workspace.activeLabId, openInLabs: workspace.openInLabs, customLabs: workspace.customLabs
    });
    if (writtenMetadata !== metadata) {
      storage.setItem(MANIFEST_KEY, metadata);
      writtenMetadata = metadata;
    }
    if (needsLegacyCleanup) {
      try { storage.removeItem(LEGACY_KEY); } catch { /* Version 2 is already committed. */ }
      needsLegacyCleanup = false;
    }
  }

  return { load, save };
}
