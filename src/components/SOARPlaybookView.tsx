import React, { useState } from 'react';
import { 
  Bot, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  Zap, 
  Clock, 
  AlertTriangle,
  Lock,
  Network
} from 'lucide-react';
import { OSType } from '../types/simulator';

interface SOARActionStep {
  id: string;
  name: string;
  category: 'Detecção' | 'Contenção' | 'Erradicação' | 'Recuperação';
  automated: boolean;
  requiresApproval: boolean;
  commandExecuted: string;
  targetOS: OSType;
  status: 'pending' | 'running' | 'completed' | 'waiting_approval';
}

interface SOARPlaybook {
  id: string;
  name: string;
  triggerEvent: string;
  severity: 'CRÍTICA' | 'ALTA';
  description: string;
  steps: SOARActionStep[];
}

const PLAYBOOKS_CATALOG: SOARPlaybook[] = [
  {
    id: 'playbook-ransomware',
    name: 'Playbook: Contenção Rápida de Ransomware em Lote',
    triggerEvent: 'EDR Event: Alta taxa de escrita em disco com extensão .locked + vssadmin delete',
    severity: 'CRÍTICA',
    description: 'Automatiza o isolamento de rede do endpoint afetado, mata a árvore do processo malicioso e reverte arquivos criptografados via VSS.',
    steps: [
      {
        id: 'step-1',
        name: 'Isolamento de Host no Firewall de Kernel (WFP / Netfilter)',
        category: 'Contenção',
        automated: true,
        requiresApproval: false,
        commandExecuted: 'netsh advfirewall firewall set allprofiles state on && netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound',
        targetOS: 'windows',
        status: 'pending'
      },
      {
        id: 'step-2',
        name: 'Terminação Forçada da Árvore de Processos Maliciosos',
        category: 'Erradicação',
        automated: true,
        requiresApproval: false,
        commandExecuted: 'Stop-Process -Id 4992 -Force',
        targetOS: 'windows',
        status: 'pending'
      },
      {
        id: 'step-3',
        name: 'Revogação de Tokens de Sessão e Redefinição de Credenciais Kerberos',
        category: 'Erradicação',
        automated: false,
        requiresApproval: true,
        commandExecuted: 'Revoke-KerberosTicket -Account "CORP\\Aluno"',
        targetOS: 'windows',
        status: 'pending'
      },
      {
        id: 'step-4',
        name: 'Restauração de Arquivos Criptografados via Snapshot VSS',
        category: 'Recuperação',
        automated: true,
        requiresApproval: false,
        commandExecuted: 'restore-files',
        targetOS: 'windows',
        status: 'pending'
      }
    ]
  },
  {
    id: 'playbook-lkm-rootkit',
    name: 'Playbook: Resposta Automatizada a Rootkit LKM Linux',
    triggerEvent: 'Auditd Alerta: Tentativa de modificação em sys_call_table por módulo não assinado',
    severity: 'CRÍTICA',
    description: 'Isola o servidor Linux, descarrega o módulo LKM não autenticado e valida a integridade do Kernel.',
    steps: [
      {
        id: 'step-1',
        name: 'Bloqueio de Saída C2 no Netfilter/UFW',
        category: 'Contenção',
        automated: true,
        requiresApproval: false,
        commandExecuted: 'ufw deny 4444',
        targetOS: 'linux',
        status: 'pending'
      },
      {
        id: 'step-2',
        name: 'Descarregamento Forçado do Módulo Rootkit do Kernel',
        category: 'Erradicação',
        automated: true,
        requiresApproval: false,
        commandExecuted: 'rmmod rootkit_diamorphine',
        targetOS: 'linux',
        status: 'pending'
      },
      {
        id: 'step-3',
        name: 'Reinicialização do Daemon Auditd e Restauração de Hooks',
        category: 'Recuperação',
        automated: true,
        requiresApproval: false,
        commandExecuted: 'systemctl restart auditd',
        targetOS: 'linux',
        status: 'pending'
      }
    ]
  }
];

export const SOARPlaybookView: React.FC = () => {
  const [selectedPlaybook, setSelectedPlaybook] = useState<SOARPlaybook>(PLAYBOOKS_CATALOG[0]);
  const [steps, setSteps] = useState<SOARActionStep[]>(PLAYBOOKS_CATALOG[0].steps);
  const [executing, setExecuting] = useState<boolean>(false);
  const [executionLogs, setExecutionLogs] = useState<string[]>([
    'Orquestrador SOAR WinLinx inicializado. Aguardando disparo de playbook...'
  ]);
  const [waitingApprovalStep, setWaitingApprovalStep] = useState<SOARActionStep | null>(null);

  const startPlaybook = () => {
    setExecuting(true);
    setWaitingApprovalStep(null);
    setExecutionLogs([
      `[TRIGGER] Disparo automático do ${selectedPlaybook.name}`,
      `[ALERTA] ${selectedPlaybook.triggerEvent}`
    ]);

    let stepIndex = 0;

    const processNextStep = () => {
      if (stepIndex >= steps.length) {
        setExecuting(false);
        setExecutionLogs(prev => [
          ...prev,
          '[SOAR CONCLUÍDO] Todos os nós de resposta e recuperação foram executados com êxito!',
          'FLAG{WINLINX_SOAR_AUTOMATION_PLAYBOOK_EXECUTED_2026}'
        ]);
        return;
      }

      const current = steps[stepIndex];

      if (current.requiresApproval && current.status !== 'completed') {
        setWaitingApprovalStep(current);
        setSteps(prev => prev.map(s => s.id === current.id ? { ...s, status: 'waiting_approval' } : s));
        setExecutionLogs(prev => [
          ...prev,
          `[HUMAN-IN-THE-LOOP] Ação de alto impacto requer autorização do analista: '${current.name}'`
        ]);
        return;
      }

      setSteps(prev => prev.map(s => s.id === current.id ? { ...s, status: 'running' } : s));
      setExecutionLogs(prev => [
        ...prev,
        `[EXECUÇÃO NÓ ${stepIndex + 1}] Executando: ${current.commandExecuted}`
      ]);

      setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === current.id ? { ...s, status: 'completed' } : s));
        setExecutionLogs(prev => [
          ...prev,
          `[OK NÓ ${stepIndex + 1}] '${current.name}' finalizado com sucesso.`
        ]);
        stepIndex++;
        processNextStep();
      }, 700);
    };

    processNextStep();
  };

  const handleApproveAction = () => {
    if (!waitingApprovalStep) return;
    const currentId = waitingApprovalStep.id;
    setWaitingApprovalStep(null);
    setExecutionLogs(prev => [
      ...prev,
      `[APROVAÇÃO CONCEDIDA] Analista autorizou a execução de '${waitingApprovalStep.name}'.`
    ]);

    setSteps(prev => prev.map(s => s.id === currentId ? { ...s, status: 'running' } : s));

    setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === currentId ? { ...s, status: 'completed' } : s));
      setExecutionLogs(prev => [
        ...prev,
        `[OK] '${waitingApprovalStep.name}' finalizado.`
      ]);

      const nextIdx = steps.findIndex(s => s.id === currentId) + 1;
      continueAfterApproval(nextIdx);
    }, 700);
  };

  const continueAfterApproval = (startIndex: number) => {
    let stepIndex = startIndex;
    const processNext = () => {
      if (stepIndex >= steps.length) {
        setExecuting(false);
        setExecutionLogs(prev => [
          ...prev,
          '[SOAR CONCLUÍDO] Todos os nós de resposta e recuperação foram executados com êxito!',
          'FLAG{WINLINX_SOAR_AUTOMATION_PLAYBOOK_EXECUTED_2026}'
        ]);
        return;
      }
      const current = steps[stepIndex];
      setSteps(prev => prev.map(s => s.id === current.id ? { ...s, status: 'running' } : s));
      setExecutionLogs(prev => [
        ...prev,
        `[EXECUÇÃO NÓ ${stepIndex + 1}] Executando: ${current.commandExecuted}`
      ]);
      setTimeout(() => {
        setSteps(prev => prev.map(s => s.id === current.id ? { ...s, status: 'completed' } : s));
        setExecutionLogs(prev => [
          ...prev,
          `[OK NÓ ${stepIndex + 1}] '${current.name}' finalizado com sucesso.`
        ]);
        stepIndex++;
        processNext();
      }, 700);
    };
    processNext();
  };

  const resetPlaybook = (pb: SOARPlaybook) => {
    setSelectedPlaybook(pb);
    setSteps(pb.steps.map(s => ({ ...s, status: 'pending' })));
    setExecuting(false);
    setWaitingApprovalStep(null);
    setExecutionLogs([
      `Playbook selecionado: ${pb.name}. Pronto para execução.`
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">SOAR: Assistente Autônomo de Resposta a Incidentes</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  SPLUNK SOAR / CORTEX XSOAR LITE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Orquestração automatizada de contenção no Kernel, erradicação de ameaças e decisões com Human-in-the-Loop.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {PLAYBOOKS_CATALOG.map(pb => (
              <button
                key={pb.id}
                onClick={() => resetPlaybook(pb)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedPlaybook.id === pb.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {pb.name.includes('Ransomware') ? 'Ransomware' : 'Rootkit LKM'}
              </button>
            ))}

            <button
              disabled={executing}
              onClick={startPlaybook}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-lg transition cursor-pointer ${
                executing
                  ? 'bg-indigo-900/60 text-indigo-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-indigo-600/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{executing ? 'Executando...' : 'Disparar Playbook'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagrama de Nós do Fluxo do Playbook */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span>Pipeline de Execução ({selectedPlaybook.name})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {steps.map((st, idx) => {
            const isCompleted = st.status === 'completed';
            const isRunning = st.status === 'running';
            const isWaiting = st.status === 'waiting_approval';

            return (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                    : isRunning
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/40 animate-pulse'
                    : isWaiting
                    ? 'bg-amber-950/30 border-amber-500/60'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                      Nó {idx + 1} • {st.category}
                    </span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isRunning && <Clock className="w-4 h-4 text-indigo-400 animate-spin" />}
                    {isWaiting && <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />}
                  </div>

                  <h4 className="text-xs font-bold text-slate-200 mb-1">{st.name}</h4>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-cyan-300 break-all mb-2">
                    {st.commandExecuted}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">
                    {st.requiresApproval ? 'Requer Aprovação' : '100% Automático'}
                  </span>
                  <span className={`font-bold ${
                    isCompleted ? 'text-emerald-400' : isWaiting ? 'text-amber-400' : isRunning ? 'text-indigo-400' : 'text-slate-500'
                  }`}>
                    {st.status.toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal / Card de Human-in-the-Loop */}
        {waitingApprovalStep && (
          <div className="p-4 bg-amber-950/40 border border-amber-600 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-300">Decisão Humana Solicitada (Human-in-the-Loop)</div>
                <div className="text-xs text-slate-300">
                  O SOAR pausou no passo: <strong>{waitingApprovalStep.name}</strong>. Confirma a execução imediata?
                </div>
              </div>
            </div>
            <button
              onClick={handleApproveAction}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-lg transition cursor-pointer"
            >
              Aprovar & Continuar
            </button>
          </div>
        )}
      </div>

      {/* Terminal de Auditoria do SOAR */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Terminal de Ações Orquestradas (SOAR Engine)</span>
        </div>
        <div className="space-y-1 font-mono text-xs text-slate-300">
          {executionLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-indigo-400">&gt;</span>
              <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800' : log.includes('OK') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
