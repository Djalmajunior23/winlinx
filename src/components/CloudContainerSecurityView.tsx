import React, { useState } from 'react';
import { 
  Cloud, 
  Server, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Key, 
  AlertTriangle,
  Play,
  RotateCcw
} from 'lucide-react';

interface ContainerEscapeScenario {
  id: string;
  name: string;
  technique: string;
  mitreId: string;
  description: string;
  commandSimulated: string;
  remediationAdvice: string;
}

const ESCAPE_SCENARIOS: ContainerEscapeScenario[] = [
  {
    id: 'scen-docker-sock',
    name: 'Container Escape via Docker Socket (/var/run/docker.sock)',
    technique: 'Abuso de montagem indevida do socket daemon do host',
    mitreId: 'T1611 (Escape to Host)',
    description: 'Um container com /var/run/docker.sock montado executa comandos na API do Docker do host como root!',
    commandSimulated: 'docker run -it -v /:/host_fs ubuntu chroot /host_fs',
    remediationAdvice: 'Nunca expor o docker.sock em contêineres de produção. Utilizar rootless containers ou Kaniko.'
  },
  {
    id: 'scen-privileged-sys-admin',
    name: 'Container Privilegiado & CAP_SYS_ADMIN',
    technique: 'Container iniciado com flag --privileged ou capability excessiva',
    mitreId: 'T1611 (Escape to Host)',
    description: 'Permite carregar módulos de kernel (LKMs) ou montar dispositivos do host direto pelo namespace do container.',
    commandSimulated: 'mkdir /tmp/cgrp && mount -t cgroup -o rdma cgroup /tmp/cgrp',
    remediationAdvice: 'Aplicar Pod Security Admission (PSA) em modo Restricted e proibir containers com securityContext.privileged=true.'
  },
  {
    id: 'scen-imds-ssrf',
    name: 'Exfiltração de IAM Role via Cloud IMDSv1 (SSRF)',
    technique: 'Requisição GET sem cabeçalho para 169.254.169.254',
    mitreId: 'T1552.005 (Cloud Instance Metadata API)',
    description: 'Atacante aproveita falha SSRF em aplicação web para obter chaves temporárias AWS/GCP.',
    commandSimulated: 'curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/AdminRole',
    remediationAdvice: 'Forçar o uso exclusivo de IMDSv2 (que exige token de sessão PUT prévio) ou limitar hop limit para 1 em pods.'
  }
];

export const CloudContainerSecurityView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<ContainerEscapeScenario>(ESCAPE_SCENARIOS[0]);
  const [executed, setExecuted] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[K8s / Cloud Security Inspector] Ambiente de contêineres isolado pronto.'
  ]);

  const runEscapeSimulation = () => {
    setExecuted(true);
    setLogs(l => [
      ...l,
      `[SIMULAÇÃO] Disparando técnica: ${selectedScenario.technique}`,
      `[EXEC] ${selectedScenario.commandSimulated}`,
      `[BREAKOUT] Escape do namespace do contêiner confirmado! Acesso ao host ou Role de nuvem obtido.`,
      `FLAG{WINLINX_CLOUD_CONTAINER_SECURITY_BREACHED_2026}`
    ]);
  };

  const resetSim = (scen: ContainerEscapeScenario) => {
    setSelectedScenario(scen);
    setExecuted(false);
    setLogs([`[K8s / Cloud Security Inspector] Cenário alternado para: ${scen.name}`]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Segurança em Nuvem & Contêineres (K8s / Docker)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-950 text-sky-300 border border-sky-800">
                  KUBERNETES WORKLOAD DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulador de Container Breakout, Namespaces/Cgroups do Kernel Linux e abuso de APIs de metadados de nuvem (IMDSv1).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {ESCAPE_SCENARIOS.map(scen => (
              <button
                key={scen.id}
                onClick={() => resetSim(scen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedScenario.id === scen.id
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {scen.id.replace('scen-', '').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cenário Ativo */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-200">{selectedScenario.name}</span>
            <span className="text-[11px] text-sky-400 font-mono ml-2">{selectedScenario.mitreId}</span>
          </div>
          <button
            onClick={runEscapeSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Simular Fuga de Container</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">{selectedScenario.description}</p>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-slate-300 block">Comando de Exploração:</span>
          <code className="text-xs font-mono text-sky-300 block bg-slate-950 p-2.5 rounded border border-slate-800">
            {selectedScenario.commandSimulated}
          </code>
        </div>

        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-xs text-emerald-300 flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-200">Mitigação & Hardening Recomendado:</strong>
            {selectedScenario.remediationAdvice}
          </div>
        </div>

        {executed && (
          <div className="p-3 bg-sky-950/30 border border-sky-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-sky-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Cenário de Container Breakout auditado com sucesso!</span>
            </div>
            <div className="px-2.5 py-1 bg-sky-900 border border-sky-700 text-sky-200 text-xs font-mono font-bold rounded">
              FLAG&#123;WINLINX_CLOUD_CONTAINER_SECURITY_BREACHED_2026&#125;
            </div>
          </div>
        )}
      </div>

      {/* Terminal de Auditoria de Pod / Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Terminal de Execução do Container</span>
        </div>
        <div className="space-y-1 font-mono text-xs text-slate-300">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-sky-400">&gt;</span>
              <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 p-1 rounded' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
