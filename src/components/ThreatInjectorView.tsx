import React, { useState, useEffect } from 'react';
import {
  Flame,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Play,
  RotateCcw,
  Activity,
  Clock,
  Lock,
  CheckCircle2,
  Cpu,
  HardDrive,
  Network
} from 'lucide-react';
import { OSType } from '../types/simulator';

interface ThreatScenario {
  id: string;
  title: string;
  type: 'Ransomware' | 'Cryptominer' | 'Kernel Rootkit';
  targetOS: OSType;
  severity: 'CRÍTICA' | 'ALTA';
  mitreId: string;
  description: string;
  impactMetrics: {
    cpuLoad: number;
    filesAffected: number;
    memoryLeakMb: number;
  };
  remediationSteps: {
    id: string;
    step: string;
    command: string;
  }[];
}

export interface ThreatInjectorViewProps {
  onExecuteRemediation?: (os: OSType, command: string) => void;
  onExecuteCommand?: (os: OSType, command: string) => void;
  flagsFound?: string[];
}

export const ThreatInjectorView: React.FC<ThreatInjectorViewProps> = ({
  onExecuteRemediation,
  onExecuteCommand,
  flagsFound = []
}) => {
  const handleExecute = onExecuteRemediation || onExecuteCommand;
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-ransomware');
  const [attackActive, setAttackActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(180);
  const [systemHealth, setSystemHealth] = useState<number>(100);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const scenarios: ThreatScenario[] = [
    {
      id: 'scen-ransomware',
      title: 'Surto de Ransomware em Tempo Real (Criptografia de Arquivos)',
      type: 'Ransomware',
      targetOS: 'linux',
      severity: 'CRÍTICA',
      mitreId: 'T1486',
      description: 'Um executável malicioso foi descarregado em /tmp e iniciou a criptografia de arquivos do diretório /home/aluno, anexando a extensão .locked e criando uma nota de resgate.',
      impactMetrics: {
        cpuLoad: 88,
        filesAffected: 14,
        memoryLeakMb: 120
      },
      remediationSteps: [
        { id: 'step-1', step: 'Identificar e matar o processo malicioso (PID 1337)', command: 'kill -9 1337' },
        { id: 'step-2', step: 'Bloquear porta de C2 do atacante no Firewall', command: 'ufw deny 4444' },
        { id: 'step-3', step: 'Restaurar arquivos comprometidos a partir da chave forense', command: 'restore-files' }
      ]
    },
    {
      id: 'scen-cryptominer',
      title: 'Infiltração de Cryptominer Oculto (Sequestro de Recursos)',
      type: 'Cryptominer',
      targetOS: 'windows',
      severity: 'ALTA',
      mitreId: 'T1496',
      description: 'Um minerador de criptomoedas opera sob processo masquerading no Windows consumindo 95% de processamento e comunicando-se com a pool de mineração na porta 8089.',
      impactMetrics: {
        cpuLoad: 96,
        filesAffected: 0,
        memoryLeakMb: 350
      },
      remediationSteps: [
        { id: 'step-win-1', step: 'Localizar e encerrar processo do minerador (PID 4992)', command: 'Stop-Process -Id 4992' },
        { id: 'step-win-2', step: 'Bloquear conexão de saída para a pool de mineração', command: 'netsh advfirewall firewall add rule name="Block 8089" dir=in action=block protocol=TCP localport=8089' },
        { id: 'step-win-3', step: 'Remover permissões inseguras em diretórios de programas', command: 'icacls "C:\\Program Files\\Custom App" /remove "BUILTIN\\Users"' }
      ]
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  // Efeito de contagem regressiva e redução de saúde durante o ataque
  useEffect(() => {
    let timer: any;
    if (attackActive && timeLeft > 0 && systemHealth > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setSystemHealth(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0) {
      setAttackActive(false);
    }
    return () => clearInterval(timer);
  }, [attackActive, timeLeft, systemHealth]);

  const handleStartAttack = () => {
    setAttackActive(true);
    setTimeLeft(180);
    setSystemHealth(100);
    setCompletedSteps(new Set());
  };

  const handleStopAttack = () => {
    setAttackActive(false);
    setSystemHealth(100);
    setTimeLeft(180);
  };

  const handleApplyStep = (stepId: string, cmd: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
    setSystemHealth(prev => Math.min(100, prev + 25));
    if (handleExecute) {
      handleExecute(currentScenario.targetOS, cmd);
    }
  };

  const isScenarioMitigated = currentScenario.remediationSteps.every(s => completedSteps.has(s.id));

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className={`p-3.5 rounded-2xl border transition-all ${attackActive
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
              : 'bg-gradient-to-br from-amber-500/20 to-rose-500/20 border-amber-500/30 text-amber-400'
              }`}>
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Threat Injector & Centro de Resposta a Incidentes (IR)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-mono">
                  Live Attack Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Simule incidentes de segurança cibernética em tempo real. Dispare ataques de Ransomware ou Cryptominers e treine a atuação de <strong>Blue Team sob pressão de tempo</strong>!
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center space-x-3">
            {attackActive ? (
              <button
                onClick={handleStopAttack}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center space-x-2 border border-slate-700 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Interromper Simulação</span>
              </button>
            ) : (
              <button
                onClick={handleStartAttack}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold transition flex items-center space-x-2 shadow-lg shadow-rose-600/30"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Injetar Ameaça no SO</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Status ao Vivo */}
        {attackActive && (
          <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Tempo Restante:
              </span>
              <span className="font-mono text-base font-bold text-amber-400">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" /> Saúde do SO:
              </span>
              <span className={`font-mono text-base font-bold ${systemHealth > 50 ? 'text-emerald-400' : systemHealth > 25 ? 'text-amber-400' : 'text-rose-400 animate-pulse'
                }`}>
                {systemHealth}%
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-rose-400" /> Carga de CPU Injetada:
              </span>
              <span className="font-mono text-base font-bold text-rose-400">
                {currentScenario.impactMetrics.cpuLoad}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Seletor de Cenários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map(scen => (
          <div
            key={scen.id}
            onClick={() => { setSelectedScenarioId(scen.id); setAttackActive(false); }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-lg ${selectedScenarioId === scen.id
              ? 'bg-slate-800/90 border-cyan-500/70 ring-1 ring-cyan-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {scen.type} • {scen.mitreId}
              </span>
              <span className="text-xs font-mono text-slate-400 uppercase">
                {scen.targetOS}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-2">{scen.title}</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{scen.description}</p>
          </div>
        ))}
      </div>

      {/* Checklist de Resposta a Incidentes (IR) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Checklist de Mitigação & Remediação de Incidente
          </h3>
          {isScenarioMitigated && (
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Ameaça Neutralizada com Sucesso!
            </span>
          )}
        </div>

        <div className="space-y-3">
          {currentScenario.remediationSteps.map((step, idx) => {
            const isDone = completedSteps.has(step.id);
            return (
              <div
                key={step.id}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDone
                  ? 'bg-emerald-950/20 border-emerald-900/40 opacity-75'
                  : 'bg-slate-950 border-slate-800'
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${isDone ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">{step.step}</span>
                    <code className="text-[11px] font-mono text-cyan-300 mt-0.5 block">{step.command}</code>
                  </div>
                </div>

                <button
                  onClick={() => handleApplyStep(step.id, step.command)}
                  disabled={isDone}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center space-x-1.5 ${isDone
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                    }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{isDone ? 'Executado' : 'Aplicar Remediação'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
