import React, { useState } from 'react';
import { 
  Cloud, 
  Terminal, 
  Layers, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  Lock,
  Cpu
} from 'lucide-react';

interface RuntimePolicy {
  id: string;
  name: string;
  engine: 'Falco' | 'AppArmor' | 'SELinux';
  ruleSnippet: string;
  description: string;
  status: 'ACTIVE' | 'AUDIT_ONLY';
}

const RUNTIME_POLICIES: RuntimePolicy[] = [
  {
    id: 'pol-falco-terminal',
    name: 'Falco Rule: Terminal Spawn in Production Container',
    engine: 'Falco',
    ruleSnippet: `- rule: Terminal shell in container
  desc: A shell was spawned inside a running production container
  condition: container.id != host and proc.name in (bash, sh, zsh)
  output: "[CRITICAL] Shell spawned in container (user=%user.name pod=%k8s.pod.name cmd=%proc.cmdline)"
  priority: CRITICAL`,
    description: 'Detecta invasores abrindo sessões interativas dentro de pods Kubernetes em produção.',
    status: 'ACTIVE'
  },
  {
    id: 'pol-apparmor-docker',
    name: 'AppArmor Profile: docker-default-hardened',
    engine: 'AppArmor',
    ruleSnippet: `profile docker-default-hardened flags=(attach_disconnected,mediate_deleted) {
  # Bloquear escrita em /proc/sys e /sys
  deny /proc/sys/** wklx,
  deny /sys/** wklx,
  # Proibir montagem de cgroups e raw sockets
  deny mount,
  deny network raw,
}`,
    description: 'Perfil LSM do Linux que impede o contêiner de alterar configurações do Kernel do host.',
    status: 'ACTIVE'
  },
  {
    id: 'pol-selinux-k8s',
    name: 'SELinux MCS Multi-Category Isolation',
    engine: 'SELinux',
    ruleSnippet: `type=AVC msg=audit(1764264000.123:456): avc:  denied  { read } for  pid=1450 comm="cat" name="shadow" dev="sda1" ino=131450 scontext=system_u:system_r:container_t:s0:c123,c456 tcontext=system_u:object_r:shadow_t:s0 tclass=file permissive=0`,
    description: 'Isolamento mandatário de categorias de segurança (MCS) impedindo containers de acessar arquivos do host.',
    status: 'ACTIVE'
  }
];

interface ContainerRuntimeProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordForensicLogs?: (newLogs: any[]) => void;
}

export const ContainerRuntimeSecurityView: React.FC<ContainerRuntimeProps> = ({ onCaptureFlag, onRecordForensicLogs }) => {
  const [policies, setPolicies] = useState<RuntimePolicy[]>(RUNTIME_POLICIES);
  const [selectedPol, setSelectedPol] = useState<RuntimePolicy>(RUNTIME_POLICIES[0]);
  const [simulatedAlerts, setSimulatedAlerts] = useState<string[]>([
    '[Falco Engine] 48 regras de detecção carregadas via BPF driver.',
    '[LSM AppArmor] Perfil docker-default aplicado em 12 containers.'
  ]);
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  const simulateBreachAttempt = () => {
    setSimulatedAlerts(prev => [
      `[12:48:10 CRITICAL] Falco alert: Terminal shell in container (user=root pod=frontend-web-7d4f cmd="/bin/sh -i")`,
      `[12:48:12 BLOCKED] AppArmor negou permissão: Tentativa de montagem de /sys/fs/cgroup descartada com -EPERM!`,
      `[DEFESA ATIVA] Pod comprometido isolado automaticamente via NetworkPolicy.`,
      `FLAG{WINLINX_CONTAINER_RUNTIME_SECURITY_FALCO_2026}`,
      ...prev
    ]);
    setFlagUnlocked(true);
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
                <h1 className="text-xl font-bold text-slate-100">Segurança de Runtime em Containers (Falco / AppArmor / SELinux)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-sky-950 text-sky-300 border border-sky-800">
                  KUBERNETES RUNTIME THREAT DETECTION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Defesa contínua de cargas de trabalho em nuvem, detecção de shells anômalos em pods e aplicação de perfis LSM de contenção estrita.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={simulateBreachAttempt}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/20 transition cursor-pointer"
            >
              Simular Invasão de Pod
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Políticas e Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Regras de Proteção de Runtime</span>
            </h3>

            <div className="space-y-2">
              {policies.map(pol => (
                <div
                  key={pol.id}
                  onClick={() => setSelectedPol(pol)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedPol.id === pol.id
                      ? 'bg-sky-950/30 border-sky-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{pol.engine}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {pol.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-1">{pol.name}</div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{pol.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {/* Visualizador de Regra */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-mono font-bold text-slate-200">
                Definição de Política: {selectedPol.name}
              </span>
              <span className="text-[10px] font-mono text-sky-400">{selectedPol.engine} YAML</span>
            </div>

            <pre className="p-3.5 bg-slate-900 rounded-xl font-mono text-xs text-sky-300 border border-slate-800 overflow-x-auto whitespace-pre-wrap">
              <code>{selectedPol.ruleSnippet}</code>
            </pre>
          </div>

          {/* Console de Alertas de Runtime */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-mono font-bold text-slate-200">Console de Alertas do Pod / Falco</span>
              </div>
            </div>

            <div className="space-y-1.5 font-mono text-xs text-slate-300 max-h-52 overflow-y-auto">
              {simulatedAlerts.map((alt, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-sky-400">&gt;</span>
                  <span className={alt.includes('CRITICAL') ? 'text-rose-400 font-bold' : alt.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 p-1 rounded' : 'text-slate-300'}>
                    {alt}
                  </span>
                </div>
              ))}
            </div>

            {flagUnlocked && (
              <div className="p-3 bg-sky-950/30 border border-sky-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2 text-xs text-sky-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Ataque em container detectado e mitigado pelo motor de runtime Falco + LSM!</span>
                </div>
                <div className="px-2.5 py-1 bg-sky-900 border border-sky-700 text-sky-200 text-xs font-mono font-bold rounded">
                  FLAG&#123;WINLINX_CONTAINER_RUNTIME_SECURITY_FALCO_2026&#125;
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
