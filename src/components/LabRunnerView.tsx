import React, { useState } from 'react';
import { PRACTICAL_LABS } from '../data/labs';
import { CommandResult, OSType, SyscallTrace, EDRAlert, ForensicLogRecord } from '../types/simulator';
import { Terminal } from './Terminal';
import { LinuxSimulatorEngine } from '../core/linuxEngine';
import { WindowsSimulatorEngine } from '../core/windowsEngine';
import { createInitialLinuxFS, createInitialWindowsFS } from '../core/defaultFileSystem';
import { 
  Terminal as TerminalIcon, 
  CheckCircle2, 
  Circle, 
  Lightbulb, 
  Target, 
  Clock, 
  Award, 
  Flame, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface LabRunnerViewProps {
  activeLabId?: string;
  onTaskCompleted: (taskId: string, flag?: string) => void;
  completedTasks: Set<string>;
  permissionsSession: {
    linux: LinuxSimulatorEngine;
    windows: WindowsSimulatorEngine;
  };
  onResetPermissionsSession: () => void;
  onRecordSyscalls?: (traces: SyscallTrace[]) => void;
  onRecordEDRAlerts?: (alerts: EDRAlert[]) => void;
  onRecordForensicLogs?: (logs: ForensicLogRecord[]) => void;
}

export const LabRunnerView: React.FC<LabRunnerViewProps> = ({
  activeLabId,
  onTaskCompleted,
  completedTasks,
  permissionsSession,
  onResetPermissionsSession,
  onRecordSyscalls,
  onRecordEDRAlerts,
  onRecordForensicLogs
}) => {
  const [selectedLabId, setSelectedLabId] = useState<string>(activeLabId || PRACTICAL_LABS[0].id);
  const [activeOS, setActiveOS] = useState<OSType>(() =>
    PRACTICAL_LABS.find(lab => lab.id === selectedLabId)?.tasks[0]?.targetOS === 'windows' ? 'windows' : 'linux'
  );
  const [showHintForTaskId, setShowHintForTaskId] = useState<string | null>(null);

  const [labLinux, setLabLinux] = useState(() => new LinuxSimulatorEngine(createInitialLinuxFS()));
  const [labWindows, setLabWindows] = useState(() => new WindowsSimulatorEngine(createInitialWindowsFS()));
  const [, setPromptRevision] = useState(0);
  const [terminalRevision, setTerminalRevision] = useState(0);

  const currentLab = PRACTICAL_LABS.find(l => l.id === selectedLabId) || PRACTICAL_LABS[0];
  const isPermissionsLab = currentLab.id === 'lab-permissions-dacl';
  const linuxEngine = isPermissionsLab ? permissionsSession.linux : labLinux;
  const windowsEngine = isPermissionsLab ? permissionsSession.windows : labWindows;

  const handleResetLab = () => {
    if (isPermissionsLab) {
      onResetPermissionsSession();
    } else {
      setLabLinux(new LinuxSimulatorEngine(createInitialLinuxFS()));
      setLabWindows(new WindowsSimulatorEngine(createInitialWindowsFS()));
    }
    setTerminalRevision(previous => previous + 1);
  };

  const handleExecuteCommand = (cmd: string) => {
    const engine = activeOS === 'linux' ? linuxEngine : windowsEngine;
    const result: CommandResult = engine.execute(cmd);
    setPromptRevision(previous => previous + 1);
    if (result.syscalls) onRecordSyscalls?.(result.syscalls);
    if (result.edrAlerts) onRecordEDRAlerts?.(result.edrAlerts);
    if (result.forensicLogs) onRecordForensicLogs?.(result.forensicLogs);

    const res = {
      output: result.output,
      error: result.error,
      exitCode: result.exitCode,
      flag: result.stateChanges?.flagDiscovered
    };
    if (res.exitCode !== 0) return res;

    currentLab.tasks.forEach(task => {
      if (completedTasks.has(task.id)) return;

      const isTargetOS = task.targetOS === 'both' || task.targetOS === activeOS;
      if (!isTargetOS) return;

      const command = cmd.trim().replace(/\s+/g, ' ');
      const enteredCommand = activeOS === 'windows' ? command.toLowerCase() : command;
      const expectedCommand = activeOS === 'windows' ? task.validationCommand?.toLowerCase() : task.validationCommand;
      const matchesCommand = expectedCommand && (
        enteredCommand === expectedCommand || enteredCommand.startsWith(`${expectedCommand} `)
      );
      const matched = task.validateWithEngineFlag
        ? task.flagReward !== undefined && res.flag === task.flagReward
        : matchesCommand && (!task.expectedOutputSubstring || res.output.includes(task.expectedOutputSubstring));

      if (matched) {
        onTaskCompleted(task.id, task.flagReward);
        if (task.flagReward) {
          res.flag = task.flagReward;
        }
      }
    });

    return res;
  };

  const labCompletedTasks = currentLab.tasks.filter(t => completedTasks.has(t.id)).length;
  const isLabFullyCompleted = labCompletedTasks === currentLab.tasks.length;

  return (
    <div className="space-y-6">
      {/* Seletor Rápido de Labs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {PRACTICAL_LABS.map(lab => {
          const isSelected = lab.id === currentLab.id;
          const completedCount = lab.tasks.filter(t => completedTasks.has(t.id)).length;
          const isDone = completedCount === lab.tasks.length;

          return (
            <button
              key={lab.id}
              onClick={() => {
                setSelectedLabId(lab.id);
                if (lab.tasks[0]?.targetOS === 'windows') {
                  setActiveOS('windows');
                } else {
                  setActiveOS('linux');
                }
              }}
              className={`px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition flex items-center space-x-2 ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-600" />
              )}
              <span>{lab.title.split(':')[0]}</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded text-slate-400 font-mono">
                {completedCount}/{lab.tasks.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel do Laboratório & Guia de Tarefas */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="space-y-2 border-b border-slate-800/80 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold uppercase">
                  {currentLab.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {currentLab.durationMinutes} min
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-100">
                {currentLab.title}
              </h2>
              <p className="text-xs text-slate-300">
                {currentLab.description}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Cenário do Mundo Real:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentLab.realWorldScenario}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Mapeamento MITRE ATT&CK:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentLab.mitreTechniques.map(m => (
                  <span
                    key={m.id}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/50 font-mono"
                  >
                    {m.id} - {m.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Tarefas do Laboratório ({labCompletedTasks}/{currentLab.tasks.length})
                </h3>
                <button
                  onClick={handleResetLab}
                  className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                  title="Reiniciar máquinas para o estado inicial"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reiniciar máquinas</span>
                </button>
              </div>

              {currentLab.tasks.map((task) => {
                const isCompleted = completedTasks.has(task.id);
                const isHintOpen = showHintForTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 rounded-lg border transition space-y-2 ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-800/50'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <h4 className={`text-xs font-semibold ${isCompleted ? 'text-emerald-300' : 'text-slate-200'}`}>
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {task.instructions}
                          </p>
                        </div>
                      </div>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold shrink-0 ${
                        task.targetOS === 'linux'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : task.targetOS === 'windows'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/60'
                          : 'bg-purple-950 text-purple-400 border border-purple-800/60'
                      }`}>
                        {task.targetOS}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => setShowHintForTaskId(isHintOpen ? null : task.id)}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>{isHintOpen ? 'Ocultar dica' : 'Ver dica de comando'}</span>
                      </button>

                      {task.flagReward && isCompleted && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-emerald-400" />
                          <span>Flag coletada</span>
                        </span>
                      )}
                    </div>

                    {isHintOpen && (
                      <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200 font-mono">
                        {task.hint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isLabFullyCompleted && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 to-cyan-950 border border-emerald-500/40 text-center space-y-2 animate-in fade-in">
                <Award className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-300">
                  Parabéns! Laboratório Concluído com Sucesso!
                </h4>
                <p className="text-xs text-slate-300">
                  Você dominou os conceitos de segurança deste módulo prático.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Console Interativo do Aluno */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-300">
              Ambiente de Execução Ativo:
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveOS('linux')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                  activeOS === 'linux'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Linux Host (Bash)</span>
              </button>

              <button
                onClick={() => setActiveOS('windows')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                  activeOS === 'windows'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Windows Host (PowerShell)</span>
              </button>
            </div>
          </div>

          <div className="h-[520px]">
            {activeOS === 'linux' ? (
              <Terminal
                key={`${currentLab.id}-${activeOS}-${terminalRevision}`}
                osType="linux"
                currentDir={linuxEngine.getCurrentDir()}
                currentUser={linuxEngine.getCurrentUser()}
                onExecuteCommand={handleExecuteCommand}
                onAutoComplete={(prefix) => linuxEngine.getAutoCompleteOptions(prefix)}
                title="Linux Lab Host - Prática de SO Aberto"
                suggestedCommands={['ls -la', 'find / -perm -4000', 'chmod 755 /bin/find', 'ps aux | grep /tmp', 'cat /var/log/auth.log']}
              />
            ) : (
              <Terminal
                key={`${currentLab.id}-${activeOS}-${terminalRevision}`}
                osType="windows"
                currentDir={windowsEngine.getCurrentDir()}
                currentUser={windowsEngine.getCurrentUser()}
                onExecuteCommand={handleExecuteCommand}
                onAutoComplete={(prefix) => windowsEngine.getAutoCompleteOptions(prefix)}
                title="Windows Lab Host - Prática de SO Fechado"
                suggestedCommands={[
                  'dir',
                  'icacls "C:\\Program Files\\Custom App"',
                  'icacls "C:\\Program Files\\Custom App" /remove "BUILTIN\\Users"',
                  'netstat -ano',
                  'sc qc WinVulnerableUpdater',
                  'Get-EventLog -LogName Security'
                ]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
