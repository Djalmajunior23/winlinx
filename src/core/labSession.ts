import { assessInboundTcp } from './networkDefense';
import { createInitialLinuxFS, createInitialWindowsFS } from './defaultFileSystem';
import { LinuxSimulatorEngine } from './linuxEngine';
import { WindowsSimulatorEngine } from './windowsEngine';
import type { CommandResult, ForensicLogRecord, LabTask, OSType } from '../types/simulator';

export function createLabSession() {
  return {
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

export function downloadAttempt(labId: string, session: LabSession) {
  const json = JSON.stringify({
    version: 1, labId, attemptId: session.id, startedAt: session.startedAt,
    completedTasks: [...session.completed], submittedEvidence: Object.fromEntries(session.answers),
    logs: session.logs
  }, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `winlinx-${labId}-${session.id}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function verifyLabState(task: LabTask, session: LabSession) {
  if (task.requires?.some(id => !session.completed.has(id))) {
    return { passed: false, message: 'Conclua a investigação correspondente antes da verificação.' };
  }

  if (task.verify === 'linux-tcp-filtered' || task.verify === 'windows-tcp-filtered') {
    const isLinux = task.verify === 'linux-tcp-filtered';
    const port = isLinux ? 4444 : 8089;
    const engine = isLinux ? session.linux : session.windows;
    const result = assessInboundTcp(port, engine.getFirewallStatus(), engine.getProcesses());
    const status = { open: 'aberta', closed: 'fechada', filtered: 'filtrada' };
    return {
      passed: result.outcome === 'filtered',
      message: `Sonda simulada: ${port}/TCP ${status[result.outcome]}. O objetivo exige filtragem de entrada nesta porta.`
    };
  }

  const passed = task.verify === 'windows-service-path' ? session.windows.hasQuotedUpdaterPath() && session.windows.isUpdaterRunning()
    : task.verify === 'windows-ppl' ? session.windows.isLsaPplConfigured()
    : task.verify === 'linux-sudo-policy' && session.linux.requiresSudoPasswordForStudent();
  const confirmation = task.verify === 'windows-service-path'
    ? 'Caminho entre aspas e serviço em execução confirmados no simulador.'
    : 'Configuração do alvo confirmada no simulador.';
  return {
    passed,
    message: passed ? confirmation
      : 'O estado do alvo ainda não atende ao objetivo. Consulte a dica de correção e verifique novamente.'
  };
}
