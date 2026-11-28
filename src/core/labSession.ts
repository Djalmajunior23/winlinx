import { assessInboundTcp } from './networkDefense';
import { createInitialLinuxFS, createInitialWindowsFS } from './defaultFileSystem';
import { LinuxSimulatorEngine } from './linuxEngine';
import { WindowsSimulatorEngine } from './windowsEngine';
import type { CommandResult, ForensicLogRecord, LabTask, OSType } from '../types/simulator';

export function createLabSession() {
  return {
    revision: 0,
    id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
    startedAt: new Date().toISOString(),
    linux: new LinuxSimulatorEngine(createInitialLinuxFS()),
    windows: new WindowsSimulatorEngine(createInitialWindowsFS()),
    completed: new Set<string>(),
    observed: new Set<string>(),
    answers: new Map<string, string[]>(),
    logs: [] as ForensicLogRecord[]
  };
}

export type LabSession = ReturnType<typeof createLabSession>;

export function matchesLabObservation(task: LabTask, os: OSType, command: string, result: CommandResult) {
  if (result.exitCode !== 0 || (task.targetOS !== 'both' && task.targetOS !== os)) return false;
  if (task.validateWithEngineFlag) {
    return Boolean(task.flagReward && result.stateChanges?.flagDiscovered === task.flagReward);
  }
  const normalize = (value: string) => {
    const trimmed = value.trim().replace(/\s+/g, ' ');
    return os === 'windows' ? trimmed.toLowerCase() : trimmed;
  };
  const entered = normalize(command);
  return [task.validationCommand, ...(task.alternativeCommands ?? [])].some(candidate => {
    if (!candidate) return false;
    const expected = normalize(candidate);
    return entered === expected;
  }) && (!task.expectedOutputSubstring || result.output.includes(task.expectedOutputSubstring));
}

export function incorrectEvidence(task: LabTask, answers: string[]) {
  return (task.evidence ?? []).filter(({ expected }, index) =>
    answers[index]?.trim().toLowerCase() !== expected.trim().toLowerCase()
  ).map(field => field.label);
}

export function recordAttemptLogs(labId: string, session: LabSession, logs: ForensicLogRecord[]) {
  session.logs.push(...logs.map(log => ({ ...log, labId, attemptId: session.id })));
}

export function executeLabCommand(labId: string, session: LabSession, os: OSType, command: string) {
  const result = session[os].execute(command);
  if (result.forensicLogs) recordAttemptLogs(labId, session,
    result.forensicLogs.map(log => ({ ...log, commandExitCode: result.exitCode })));
  return result;
}

export function buildAttemptReport(labId: string, session: LabSession) {
  return {
    version: 1, labId, attemptId: session.id, startedAt: session.startedAt,
    completedTasks: [...session.completed], submittedEvidence: Object.fromEntries(session.answers),
    logs: session.logs
  };
}

export type AttemptReport = ReturnType<typeof buildAttemptReport>;

export function downloadAttemptReport(report: AttemptReport) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `winlinx-${report.labId}-${report.attemptId}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function verifyLabState(task: LabTask, session: LabSession) {
  if (task.requires?.some(id => !session.completed.has(id))) {
    return { passed: false, message: 'Conclua a investigação correspondente antes da verificação.' };
  }

  const criterion = task.verify;
  if (!criterion) return { passed: false, message: 'Esta tarefa não possui um critério de estado.' };

  switch (criterion.kind) {
    case 'tcp-filtered': {
      if (task.targetOS === 'both') return { passed: false, message: 'Selecione um sistema operacional para a sonda.' };
      const { port } = criterion;
      const engine = session[task.targetOS];
      const result = assessInboundTcp(port, engine.getFirewallStatus(), engine.getProcesses());
      const status = { open: 'aberta', closed: 'fechada', filtered: 'filtrada' };
      return {
        passed: result.outcome === 'filtered',
        message: `Sonda simulada: ${port}/TCP ${status[result.outcome]}. O objetivo exige filtragem de entrada nesta porta.`
      };
    }
    case 'registry-value': {
      const entry = session.windows.getRegistryValue(criterion.key, criterion.name);
      const passed = entry?.type === criterion.valueType && entry.value === criterion.value;
      return {
        passed,
        message: passed ? `Valor ${criterion.name} confirmado no Registro simulado.`
          : `O tipo ou o conteúdo de ${criterion.name} no Registro simulado ainda difere do objetivo.`
      };
    }
    case 'windows-service-path': {
      const passed = session.windows.hasQuotedUpdaterPath() && session.windows.isUpdaterRunning();
      return {
        passed,
        message: passed ? 'Caminho entre aspas e serviço em execução confirmados no simulador.'
          : 'Confira as aspas no caminho e se o serviço continua em execução.'
      };
    }
    case 'linux-sudo-policy': {
      const passed = session.linux.requiresSudoPasswordForStudent();
      return {
        passed,
        message: passed ? 'Configuração do alvo confirmada no simulador.'
          : 'A política simulada ainda não exige senha para a conta aluno.'
      };
    }
  }
}
