import { saveAttempt } from '../core/attemptHistory';
import { AttemptHistory } from './AttemptHistory';
import React, { useState } from 'react';
import { buildAttemptReport, downloadAttemptReport, incorrectEvidence, matchesLabObservation, verifyLabState, type LabSession } from '../core/labSession';
import type { CommandResult, LabDefinition, LabTask, OSType, ForensicLogRecord } from '../types/simulator';
import { Terminal } from './Terminal';
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
  activeLabId: string;
  labs: LabDefinition[];
  session: LabSession;
  storageNotice?: string;
  onRetrySave?: () => void;
  onSessionChange: () => void;
  onOpenTool: (tab: 'firewall' | 'forensics' | 'security-audit') => void;
  onSelectLab: (id: string) => void;
  onResetSession: () => void;
  onTaskCompleted: (taskId: string, flag?: string) => void;
  onLabFinished: (id: string, duration: number) => void;
  completedTasks: Set<string>;
  onExecuteCommand: (os: OSType, command: string) => CommandResult;
  onRecordLogs: (logs: ForensicLogRecord[]) => void;
}

export function LabRunnerView({
  activeLabId, labs, session, storageNotice, onRetrySave, onSessionChange, onOpenTool, onSelectLab, onResetSession, onTaskCompleted, onLabFinished,
  completedTasks, onExecuteCommand, onRecordLogs
}: LabRunnerViewProps) {
  const currentLab = labs.find(lab => lab.id === activeLabId) ?? labs[0];
  const [activeOS, setActiveOS] = useState<OSType>(currentLab.tasks[0]?.targetOS === 'windows' ? 'windows' : 'linux');
  const [hint, setHint] = useState<{ id: string; level: number } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [archiveStatus, setArchiveStatus] = useState<{ attemptId: string; status: 'saving' | 'saved' | 'error' }>();
  const archiveAttempt = async () => {
    const attemptId = session.id;
    setArchiveStatus({ attemptId, status: 'saving' });
    try {
      await saveAttempt({ attemptId, title: currentLab.title, finishedAt: new Date().toISOString(),
        report: structuredClone(buildAttemptReport(currentLab.id, session)) });
      setArchiveStatus({ attemptId, status: 'saved' });
    } catch {
      setArchiveStatus({ attemptId, status: 'error' });
    }
  };
  const [, refresh] = useState(0);
  const { linux: linuxEngine, windows: windowsEngine } = session;

  const completeTask = (task: LabTask, note: string) => {
    if (session.completed.has(task.id)) return;
    session.completed.add(task.id);
    onSessionChange();
    setFeedback(note);
    onTaskCompleted(task.id, task.flagReward);
    if (currentLab.tasks.every(item => session.completed.has(item.id))) {
      void archiveAttempt();
      onLabFinished(currentLab.id, Math.max(0, Math.floor((Date.now() - Date.parse(session.startedAt)) / 1000)));
    }
    refresh(value => value + 1);
  };

  const handleExecuteCommand = (command: string) => {
    const result = onExecuteCommand(activeOS, command);

    setFeedback(result.exitCode === 0
      ? 'Comando executado. Confira se a saída contém a evidência pedida na tarefa.'
      : 'O comando falhou. Confira o sistema, o alvo ou os parâmetros e tente novamente.');
    let flag: string | undefined;
    for (const task of currentLab.tasks) {
      if (session.completed.has(task.id) || task.verify || !matchesLabObservation(task, activeOS, command, result)) continue;
      if (task.requires?.some(id => !session.completed.has(id))) {
        setFeedback('Conclua as tarefas anteriores exigidas por este objetivo.');
        continue;
      }
      if (task.evidence?.length) {
        session.observed.add(task.id);
        setFeedback('Fonte de evidência consultada. Registre seu achado na tarefa.');
      } else {
        completeTask(task, 'Objetivo confirmado no simulador.');
        flag = task.flagReward ?? flag;
      }
    }

    return { ...result, flag };
  };

  const submitEvidence = (task: LabTask, data: FormData) => {
    if (!session.observed.has(task.id)) {
      setFeedback('Consulte a fonte de evidência da tarefa nesta tentativa.');
      return;
    }
    const answers = (task.evidence ?? []).map((_, index) => String(data.get(String(index)) ?? '').trim());
    const incorrect = incorrectEvidence(task, answers);
    if (incorrect.length) {
      setFeedback(`Revise a evidência para: ${incorrect.join(', ')}.`);
      return;
    }
    session.answers.set(task.id, answers);
    completeTask(task, 'Achado confirmado com a evidência da tentativa.');
  };

  const verifyTask = (task: LabTask) => {
    const check = verifyLabState(task, session);
    const os = task.targetOS === 'windows' ? 'windows' : 'linux';
    onRecordLogs([{
      id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(), os, source: os === 'linux' ? 'audit.log' : 'Security.evtx',
      facility: 'LAB_VERIFY', severity: check.passed ? 'INFO' : 'WARNING',
      user: 'aluno', computer: os === 'linux' ? 'WINLINX-LNX-01' : 'WINLINX-WIN-2026', details: check.message
    }]);
    if (check.passed) completeTask(task, check.message);
    else setFeedback(check.message);
  };

  const labCompletedTasks = session.completed.size;
  const isLabFullyCompleted = labCompletedTasks === currentLab.tasks.length;

  return (
    <div className="space-y-6">
      <button type="button" className="text-xs text-cyan-300" onClick={() => setShowHistory(value => !value)}>
        {showHistory ? 'Ocultar histórico de tentativas' : 'Abrir histórico de tentativas'}
      </button>
      {showHistory && <AttemptHistory key={archiveStatus?.status} />}
      {/* Seletor Rápido de Labs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {labs.map(lab => {
          const isSelected = lab.id === currentLab.id;
          const completedCount = lab.tasks.filter(t => completedTasks.has(t.id)).length;
          const isDone = completedCount === lab.tasks.length;

          return (
            <button
              key={lab.id}
              onClick={() => onSelectLab(lab.id)}
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
                  onClick={() => { onResetSession(); setHint(null); setFeedback('Nova tentativa iniciada.'); }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                  title="Reiniciar máquinas para o estado inicial"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reiniciar máquinas</span>
                </button>
              </div>

              <p className="text-xs text-slate-400">Histórico: {currentLab.tasks.filter(task => completedTasks.has(task.id)).length}/{currentLab.tasks.length} · Tentativa atual: {labCompletedTasks}/{currentLab.tasks.length}</p>
              <button type="button" className="text-xs text-cyan-300" onClick={() => downloadAttemptReport(buildAttemptReport(currentLab.id, session))}>Exportar evidências da tentativa</button>
              <div className="flex flex-wrap gap-3 text-xs text-cyan-300">
                <button type="button" onClick={() => onOpenTool('firewall')}>Firewall da sessão</button>
                <button type="button" onClick={() => onOpenTool('security-audit')}>Auditoria da sessão</button>
                <button type="button" onClick={() => onOpenTool('forensics')}>Logs forenses</button>
              </div>
              {storageNotice && (
                <div className="space-y-1 text-xs text-amber-300">
                  <p role="alert">{storageNotice}</p>
                  {onRetrySave && <button type="button" onClick={onRetrySave} className="underline">Tentar salvar novamente</button>}
                </div>
              )}
              <p role="status" className="text-xs text-slate-300">{feedback}</p>
              {currentLab.tasks.map((task) => {
                const isCompleted = session.completed.has(task.id);
                const hintLevel = hint?.id === task.id ? hint.level : 0;

                return (
                  <div
                    key={session.id + task.id}
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

                    {!isCompleted && task.evidence?.length && (
                      <form className="space-y-2 text-xs" onSubmit={event => {
                        event.preventDefault();
                        submitEvidence(task, new FormData(event.currentTarget));
                      }}>
                        {task.evidence.map((field, index) => (
                          <label key={field.label} className="block text-slate-300">
                            {field.label}
                            <input name={String(index)} required maxLength={256}
                              className="block w-full rounded border border-slate-700 bg-slate-900 px-2 py-1" />
                          </label>
                        ))}
                        <button className="text-cyan-300" type="submit">Registrar achado</button>
                      </form>
                    )}
                    {!isCompleted && task.verify && (
                      <button type="button" className="text-xs text-cyan-300" onClick={() => verifyTask(task)}>
                        Verificar estado do alvo
                      </button>
                    )}
                    <div className="pt-1 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => setHint({ id: task.id, level: (hintLevel + 1) % 3 })}
                        className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
                      >
                        <Lightbulb className="w-3 h-3" />
                        <span>{['Ver orientação', 'Ver dica de comando', 'Ocultar dica'][hintLevel]}</span>
                      </button>

                      {task.flagReward && isCompleted && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-emerald-400" />
                          <span>Flag coletada</span>
                        </span>
                      )}
                    </div>

                    {hintLevel > 0 && (
                      <div className="p-2 rounded bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-200 font-mono">
                        {hintLevel === 1 ? task.objective : task.hint}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isLabFullyCompleted && archiveStatus?.attemptId !== session.id && (
              <button type="button" className="text-xs text-cyan-300" onClick={() => void archiveAttempt()}>Guardar dossiê no histórico</button>
            )}
            {isLabFullyCompleted && archiveStatus?.attemptId === session.id && archiveStatus.status === 'saved' && (
              <p role="status" className="text-xs text-emerald-300">Dossiê guardado no histórico deste navegador.</p>
            )}
            {isLabFullyCompleted && archiveStatus?.attemptId === session.id && archiveStatus.status === 'error' && (
              <p role="alert" className="text-xs text-amber-300">O dossiê não foi guardado no histórico.
                <button type="button" className="ml-2 underline" onClick={() => void archiveAttempt()}>Tentar guardar novamente</button>
              </p>
            )}
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
                key={`${currentLab.id}-${activeOS}-${session.id}`}
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
                key={`${currentLab.id}-${activeOS}-${session.id}`}
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
}
