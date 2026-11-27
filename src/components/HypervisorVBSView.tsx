import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Layers, 
  Cpu, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Server,
  Zap,
  Activity
} from 'lucide-react';

interface VTLZone {
  id: string;
  name: string;
  vtlLevel: 'VTL 0 (Normal World)' | 'VTL 1 (Secure World - Trustlet)';
  ringLevel: string;
  components: string[];
  securityFunction: string;
  status: 'ACTIVE' | 'ENFORCING' | 'ISOLATED';
}

const VTL_ZONES: VTLZone[] = [
  {
    id: 'vtl-0',
    name: 'Normal OS World (VTL 0)',
    vtlLevel: 'VTL 0 (Normal World)',
    ringLevel: 'Ring 3 (Apps) & Ring 0 (NT Kernel & Drivers)',
    components: ['ntoskrnl.exe', 'Kernel Drivers (.sys)', 'lsass.exe (User-mode)', 'Explorer / Chrome'],
    securityFunction: 'Execução do sistema operacional convencional. Caso o Ring 0 seja comprometido por um rootkit, a chave do cofre continua segura em VTL 1.',
    status: 'ACTIVE'
  },
  {
    id: 'vtl-1',
    name: 'Secure World / Credential Guard (VTL 1)',
    vtlLevel: 'VTL 1 (Secure World - Trustlet)',
    ringLevel: 'Ring 0 Seguro & Trustlets Isolados (Hyper-V Microkernel)',
    components: ['LsaIso.exe (Isolated LSA)', 'HVCI / KMCI Enforcer', 'Virtual Secure Mode (VSM)', 'Secure Key Storage (TPM 2.0 Sealed)'],
    securityFunction: 'As credenciais em texto claro e chaves mestre de autenticação NTLM/Kerberos residem exclusivamente aqui, inacessíveis até mesmo por drivers maliciosos em Ring 0 de VTL 0.',
    status: 'ENFORCING'
  }
];

interface HypervisorProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordForensicLogs?: (newLogs: any[]) => void;
}

export const HypervisorVBSView: React.FC<HypervisorProps> = ({ onCaptureFlag, onRecordForensicLogs }) => {
  const [vbsEnabled, setVbsEnabled] = useState<boolean>(true);
  const [hvciEnabled, setHvciEnabled] = useState<boolean>(true);
  const [credGuardEnabled, setCredGuardEnabled] = useState<boolean>(true);
  const [mimikatzIntercepted, setMimikatzIntercepted] = useState<boolean>(false);
  const [attackLogs, setAttackLogs] = useState<string[]>([
    '[Hypervisor Microkernel] Hyper-V Virtual Secure Mode (VSM) inicializado com suporte a SLAT e Intel VT-x/EPT.',
    '[VTL 1 Trustlet] LsaIso.exe carregado no espaço de memória isolado protegido por Second Level Address Translation.',
    '[HVCI Integrity] Code Integrity Ring 0 ativo: execução de páginas sem assinatura digital WHQL bloqueada por hardware.'
  ]);
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  const simulateMimikatzDump = () => {
    if (credGuardEnabled && vbsEnabled) {
      setMimikatzIntercepted(true);
      setAttackLogs(prev => [
        `[ATTACK INTERCEPTED] 18:24:12 - Processo não autorizado tentou abrir HANDLE de leitura de memória física em LSASS (PID 840).`,
        `[VTL 1 REJECTION] O Hyper-V interceptou o acesso: os hashes NTLM solicitados estão isolados em LsaIso.exe (VTL 1).`,
        `[MEMÓRIA PURGADA] Dump retornado com ponteiros nulos (0x0000000000000000) e falha de autorização STATUS_ACCESS_DENIED.`,
        ...prev
      ]);
      setFlagUnlocked(true);
      if (onCaptureFlag) {
        onCaptureFlag('FLAG{WINLINX_HYPERVISOR_VBS_CREDENTIAL_GUARD_SECURED_2026}');
      }
      if (onRecordForensicLogs) {
        onRecordForensicLogs([{
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          source: 'Microsoft-Windows-DeviceGuard/Operational',
          eventId: 7000,
          level: 'Warning',
          description: 'Acesso de leitura direta à memória de autenticação foi interceptado pelo Credential Guard VTL 1.'
        }]);
      }
    } else {
      setAttackLogs(prev => [
        `[VBS DESATIVADO] ALERTA: LSASS executando sem isolamento de hardware.`,
        `[COMPROMETIMENTO] Hashes NTLM e tickets Kerberos extraídos da memória RAM desprotegida!`,
        ...prev
      ]);
    }
  };

  const resetSimulation = () => {
    setMimikatzIntercepted(false);
    setVbsEnabled(true);
    setHvciEnabled(true);
    setCredGuardEnabled(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Cpu className="w-6 h-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Virtualization-Based Security (VBS) & Credential Guard
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              Arquitetura de isolamento por Hypervisor do Windows NT: Virtual Trust Levels (VTL 0 vs VTL 1), HVCI e proteção contra Mimikatz.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={resetSimulation}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resetar</span>
            </button>
            <button
              onClick={simulateMimikatzDump}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Simular Ataque Mimikatz (LSASS Dump)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de VTLs (Virtual Trust Levels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {VTL_ZONES.map(zone => (
          <div 
            key={zone.id}
            className={`border rounded-2xl p-6 transition ${
              zone.id === 'vtl-1' 
                ? 'bg-blue-950/20 border-blue-500/30 ring-1 ring-blue-500/20' 
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${zone.id === 'vtl-1' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                  {zone.id === 'vtl-1' ? <ShieldCheck className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{zone.name}</h3>
                  <span className="text-xs font-mono text-slate-400">{zone.vtlLevel}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                zone.id === 'vtl-1' ? 'bg-blue-900/60 text-blue-300 border border-blue-700' : 'bg-slate-800 text-slate-300'
              }`}>
                {zone.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block font-semibold mb-1">Camada de Privilégio:</span>
                <span className="text-slate-200 font-mono">{zone.ringLevel}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block font-semibold mb-1">Componentes Chave:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {zone.components.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded font-mono text-[11px] border border-slate-800">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed pt-1">
                {zone.securityFunction}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Painel de Controle de Hardening de Hardware */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-cyan-400" />
          <span>Configuração de Hardware & Políticas de Isolamento do Hypervisor</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Virtualization-Based Security (VBS)</div>
              <div className="text-[11px] text-slate-400">SLAT & Hyper-V VSM</div>
            </div>
            <button 
              onClick={() => setVbsEnabled(!vbsEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                vbsEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {vbsEnabled ? 'ATIVO' : 'DESATIVADO'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Hypervisor Code Integrity (HVCI)</div>
              <div className="text-[11px] text-slate-400">W^X Enforced at Hypervisor Level</div>
            </div>
            <button 
              onClick={() => setHvciEnabled(!hvciEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                hvciEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {hvciEnabled ? 'ATIVO' : 'DESATIVADO'}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-200">Credential Guard (LsaIso)</div>
              <div className="text-[11px] text-slate-400">Isolação de NTLM/Kerberos em VTL 1</div>
            </div>
            <button 
              onClick={() => setCredGuardEnabled(!credGuardEnabled)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                credGuardEnabled ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {credGuardEnabled ? 'ATIVO' : 'DESATIVADO'}
            </button>
          </div>
        </div>
      </div>

      {/* Terminal de Eventos do Hypervisor */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2 text-slate-300">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="font-bold">Console de Telemetria do Hypervisor VSM</span>
          </div>
          <span className="text-[11px] text-slate-500">Live Memory Sentry</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attackLogs.map((log, index) => (
            <div 
              key={index} 
              className={`p-2 rounded border ${
                log.includes('INTERCEPTED') || log.includes('REJECTION') 
                  ? 'bg-rose-950/30 border-rose-900/60 text-rose-300 font-bold' 
                  : log.includes('COMPROMETIMENTO')
                  ? 'bg-amber-950/30 border-amber-900/60 text-amber-300'
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {flagUnlocked && (
          <div className="mt-4 p-3 bg-blue-950/40 border border-blue-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Mimikatz neutralizado por isolamento de hardware VBS / Credential Guard!</span>
            </div>
            <div className="px-2.5 py-1 bg-blue-900 border border-blue-700 text-blue-200 font-bold rounded">
              FLAG&#123;WINLINX_HYPERVISOR_VBS_CREDENTIAL_GUARD_SECURED_2026&#125;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
