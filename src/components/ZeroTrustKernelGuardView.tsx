import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  FileCheck, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Server
} from 'lucide-react';

interface ZeroTrustPolicy {
  id: string;
  name: string;
  enforcementMode: 'AUDIT' | 'BLOCK';
  subsystem: 'ima' | 'dm-verity' | 'secure-boot' | 'tpm-attestation';
  targetPath: string;
  expectedMeasurement: string;
  status: 'VERIFIED' | 'TAMPERED';
}

const INITIAL_ZT_POLICIES: ZeroTrustPolicy[] = [
  {
    id: 'ima-app-exec',
    name: 'Linux IMA (Integrity Measurement Architecture)',
    enforcementMode: 'BLOCK',
    subsystem: 'ima',
    targetPath: '/usr/bin/sudo e /sbin/init',
    expectedMeasurement: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    status: 'VERIFIED'
  },
  {
    id: 'dm-verity-root',
    name: 'Android / Linux dm-verity Read-Only RootFS',
    enforcementMode: 'BLOCK',
    subsystem: 'dm-verity',
    targetPath: 'dev/mapper/rootfs (Hash Tree Merkle Root)',
    expectedMeasurement: 'merkle:93e921d7b0f1bc42a201c18274d89a71a06e902b419b9101c548a27d6052f891',
    status: 'VERIFIED'
  },
  {
    id: 'tpm-pcr-quote',
    name: 'TPM 2.0 PCR Remote Attestation (PCR 0-7)',
    enforcementMode: 'BLOCK',
    subsystem: 'tpm-attestation',
    targetPath: 'Secure Boot & Shim / GRUB Measured Boot Log',
    expectedMeasurement: 'pcr7_sha256:4a8b71d9e2098c11aa50b4f8841029415712c9bf10e4a77e112d83a1b02931bc',
    status: 'VERIFIED'
  }
];

interface ZeroTrustProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordForensicLogs?: (newLogs: any[]) => void;
}

export const ZeroTrustKernelGuardView: React.FC<ZeroTrustProps> = ({ onCaptureFlag, onRecordForensicLogs }) => {
  const [policies, setPolicies] = useState<ZeroTrustPolicy[]>(INITIAL_ZT_POLICIES);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    '[Linux IMA] Subsystem inicializado: /sys/kernel/security/ima/policy carregada com appraise_type=imasig.',
    '[dm-verity] Bloco de integridade verificado com Merkle Tree cryptográfica: integridade de 100%.',
    '[TPM 2.0] Medição de PCR 7 compatível com a cadeia criptográfica de Secure Boot do UEFI.'
  ]);
  const [tamperTriggered, setTamperTriggered] = useState<boolean>(false);
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  const simulateTampering = () => {
    setTamperTriggered(true);
    setPolicies(prev => prev.map(p => {
      if (p.id === 'ima-app-exec') {
        return { ...p, status: 'TAMPERED' };
      }
      return p;
    }));

    setAuditLogs(prev => [
      `[SECURITY BREACH DETECTED] Tentativa de modificação de bytes no binário /usr/bin/sudo detectada!`,
      `[IMA APPRAISE] Hash calculado em tempo de execução diverge do atributo de segurança estendido (security.ima).`,
      `[BLOCK ENFORCED] Syscall execve abortada com -EACCES (Permission Denied). Execução do binário adulterado impedida em Ring 0!`,
      ...prev
    ]);

    setFlagUnlocked(true);
    if (onCaptureFlag) {
      onCaptureFlag('FLAG{WINLINX_LINUX_IMA_DMVERITY_INTEGRITY_VERIFIED_2026}');
    }

    if (onRecordForensicLogs) {
      onRecordForensicLogs([{
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        source: 'kernel:ima',
        eventId: 1800,
        level: 'Critical',
        description: 'IMA appraise: integridade violada em /usr/bin/sudo. Execução negada por política de Zero Trust.'
      }]);
    }
  };

  const resetPolicies = () => {
    setTamperTriggered(false);
    setPolicies(INITIAL_ZT_POLICIES);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Linux IMA & Zero Trust Kernel Architecture
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              Integrity Measurement Architecture (IMA), dm-verity e Atestação Remota com TPM 2.0: Validação criptográfica de binários antes da execução.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={resetPolicies}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-2 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Resetar</span>
            </button>
            <button
              onClick={simulateTampering}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Injetar Modificação Maliciosa em Binário</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Subsistemas de Integridade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {policies.map(policy => (
          <div 
            key={policy.id}
            className={`border rounded-2xl p-5 transition ${
              policy.status === 'TAMPERED'
                ? 'bg-rose-950/20 border-rose-500/40 ring-1 ring-rose-500/30'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                policy.status === 'TAMPERED' 
                  ? 'bg-rose-900/60 text-rose-300 border border-rose-700' 
                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}>
                {policy.status}
              </span>
              <span className="text-[10px] font-mono text-slate-400">Modo: {policy.enforcementMode}</span>
            </div>

            <h3 className="text-sm font-bold text-white mb-2">{policy.name}</h3>
            
            <div className="space-y-2 text-xs">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block font-semibold text-[11px]">Alvo Monitorado:</span>
                <span className="text-slate-200 font-mono text-[11px] truncate block">{policy.targetPath}</span>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 block font-semibold text-[11px]">Medição Criptográfica Esperada:</span>
                <span className="text-emerald-400 font-mono text-[10px] break-all block">{policy.expectedMeasurement}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Logs do Kernel IMA */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2 text-slate-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Telemetria de Integridade do Kernel (IMA / dm-verity)</span>
          </div>
          <span className="text-[11px] text-slate-500">Zero Trust Kernel Ring 0</span>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto">
          {auditLogs.map((log, index) => (
            <div 
              key={index} 
              className={`p-2 rounded border ${
                log.includes('SECURITY BREACH') || log.includes('BLOCK ENFORCED') 
                  ? 'bg-rose-950/30 border-rose-900/60 text-rose-300 font-bold' 
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
        </div>

        {flagUnlocked && (
          <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tentativa de execução de binário adulterado bloqueada em tempo real pelo Linux IMA!</span>
            </div>
            <div className="px-2.5 py-1 bg-emerald-900 border border-emerald-700 text-emerald-200 font-bold rounded">
              FLAG&#123;WINLINX_LINUX_IMA_DMVERITY_INTEGRITY_VERIFIED_2026&#125;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
