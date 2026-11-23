import React, { useState } from 'react';
import { PRACTICAL_LABS } from '../data/labs';
import { LabDefinition, LabTask, OSType } from '../types/simulator';
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
}

export const LabRunnerView: React.FC<LabRunnerViewProps> = ({
  activeLabId,
  onTaskCompleted,
  completedTasks
}) => {
  const [selectedLabId, setSelectedLabId] = useState<string>(activeLabId || PRACTICAL_LABS[0].id);
  const [activeOS, setActiveOS] = useState<OSType>('linux');
  const [showHintForTaskId, setShowHintForTaskId] = useState<string | null>(null);

  const [linuxEngine, setLinuxEngine] = useState(() => new LinuxSimulatorEngine(createInitialLinuxFS()));
  const [windowsEngine, setWindowsEngine] = useState(() => new WindowsSimulatorEngine(createInitialWindowsFS()));

  const [linuxState, setLinuxState] = useState({
    cwd: linuxEngine.getCurrentDir(),
    user: linuxEngine.getCurrentUser()
  });

  const [winState, setWinState] = useState({
    cwd: windowsEngine.getCurrentDir(),
    user: windowsEngine.getCurrentUser()
  });

  const currentLab = PRACTICAL_LABS.find(l => l.id === selectedLabId) || PRACTICAL_LABS[0];

  const handleResetLab = () => {
    const newLinux = new LinuxSimulatorEngine(createInitialLinuxFS());
    const newWin = new WindowsSimulatorEngine(createInitialWindowsFS());
    setLinuxEngine(newLinux);
    setWindowsEngine(newWin);
    setLinuxState({ cwd: newLinux.getCurrentDir(), user: newLinux.getCurrentUser() });
    setWinState({ cwd: newWin.getCurrentDir(), user: newWin.getCurrentUser() });
  };

  const handleExecuteCommand = (cmd: string) => {
    let res: { output: string; error?: string; exitCode: number; flag?: string } = { output: '', exitCode: 0 };

    if (activeOS === 'linux') {
      const exec = linuxEngine.execute(cmd);
      setLinuxState({ cwd: linuxEngine.getCurrentDir(), user: linuxEngine.getCurrentUser() });
      res = {
        output: exec.output,
        error: exec.error,
        exitCode: exec.exitCode,
        flag: exec.stateChanges?.flagDiscovered
      };
    } else {
      const exec = windowsEngine.execute(cmd);
      setWinState({ cwd: windowsEngine.getCurrentDir(), user: windowsEngine.getCurrentUser() });
      res = {
        output: exec.output,
        error: exec.error,
        exitCode: exec.exitCode,
        flag: exec.stateChanges?.flagDiscovered
      };
    }

    // Validação automática de tarefas do laboratório atual
    currentLab.tasks.forEach(task => {
      if (completedTasks.has(task.id)) return;

      const isTargetOS = task.targetOS === 'both' || task.targetOS === activeOS;
      if (!isTargetOS) return;

      let matched = false;

      // Se há um comando específico de validação ou se a saída contém o texto esperado
      if (task.validationCommand && cmd.toLowerCase().includes(task.validationCommand.toLowerCase().split(' ')[0])) {
        if (task.expectedOutputSubstring && res.output.includes(task.expectedOutputSubstring)) {
          matched = true;
        } else if (!task.expectedOutputSubstring && res.exitCode === 0) {
          matched = true;
        }
      } else if (task.expectedOutputSubstring && res.output.includes(task.expectedOutputSubstring)) {
        matched = true;
      }

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
                // Se a primeira tarefa for de windows, já ajusta o terminal
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
            {/* Cabeçalho do Lab */}
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

            {/* Cenário do Mundo Real */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                <span>Cenário do Mundo Real:</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {currentLab.realWorldScenario}
              </p>
            </div>

            {/* Técnicas MITRE ATT&CK */}
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

            {/* Lista de Tarefas Práticas */}
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
                  <span>Reset Lab</span>
                </button>
              </div>

              {currentLab.tasks.map((task, idx) => {
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

                      {/* Badge do SO Alvo */}
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

                    {/* Dica Expansível */}
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
          {/* Seletor de Terminal da Tarefa */}
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

          {/* Terminal */}
          <div className="h-[520px]">
            {activeOS === 'linux' ? (
              <Terminal
                osType="linux"
                currentDir={linuxState.cwd}
                currentUser={linuxState.user}
                onExecuteCommand={handleExecuteCommand}
                title="Linux Lab Host - Prática de SO Aberto"
                suggestedCommands={['ls -la', 'find / -perm -4000', 'chmod 755 /bin/find', 'ps aux | grep /tmp', 'cat /var/log/auth.log']}
              />
            ) : (
              <Terminal
                osType="windows"
                currentDir={winState.cwd}
                currentUser={winState.user}
                onExecuteCommand={handleExecuteCommand}
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
