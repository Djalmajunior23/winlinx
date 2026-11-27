import React, { useState } from 'react';
import { 
  Eye, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Key, 
  Lock, 
  Server,
  Crosshair,
  Radio
} from 'lucide-react';

interface HoneyAsset {
  id: string;
  name: string;
  type: 'HoneyToken (AWS Key)' | 'HoneyFile (Passwords.docx)' | 'HoneyService (SSH Port 2222)' | 'HoneySPN (Kerberos)';
  location: string;
  status: 'ARMED' | 'TRIGGERED';
  attackerDetails?: string;
}

const INITIAL_HONEY_ASSETS: HoneyAsset[] = [
  {
    id: 'asset-1',
    name: 'AKIAIOSFODNN7EXAMPLE (Honey AWS Key)',
    type: 'HoneyToken (AWS Key)',
    location: 'C:\\Users\\Aluno\\.aws\\credentials e /home/aluno/.aws/credentials',
    status: 'ARMED'
  },
  {
    id: 'asset-2',
    name: 'senhas_contabilidade_2026.docx',
    type: 'HoneyFile (Passwords.docx)',
    location: 'C:\\Users\\Aluno\\Desktop\\Documentos Confidenciais\\',
    status: 'ARMED'
  },
  {
    id: 'asset-3',
    name: 'Cowrie SSH Honeypot Daemon',
    type: 'HoneyService (SSH Port 2222)',
    location: '0.0.0.0:2222 (Linux Service)',
    status: 'ARMED'
  },
  {
    id: 'asset-4',
    name: 'svc_backup_admin (Fake SPN)',
    type: 'HoneySPN (Kerberos)',
    location: 'Active Directory CORP.LOCAL',
    status: 'ARMED'
  }
];

interface HoneypotProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordForensicLogs?: (newLogs: any[]) => void;
}

export const HoneypotDeceptionView: React.FC<HoneypotProps> = ({ onCaptureFlag, onRecordForensicLogs }) => {
  const [assets, setAssets] = useState<HoneyAsset[]>(INITIAL_HONEY_ASSETS);
  const [deceptionLogs, setDeceptionLogs] = useState<string[]>([
    '[Deception Grid] 4 armadilhas ativas na rede e nos sistemas de arquivos locais.',
    '[Canary Monitor] Alertas conectados diretamente ao SIEM/SOC com zero falsos-positivos.'
  ]);
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  const triggerHoneyAsset = (assetId: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        setDeceptionLogs(l => [
          `[DECEPTION ALERT] Armadilha ativada! Tipo: ${a.type}`,
          `[DETALHE] Invasor acessou recurso isca '${a.name}' em '${a.location}'.`,
          `[CONTENÇÃO AUTOMÁTICA] IP do invasor (192.168.10.15) bloqueado no firewall e credencial rastreada!`,
          `FLAG{WINLINX_DECEPTION_HONEYTOKEN_TRIGGERED_2026}`,
          ...l
        ]);
        setFlagUnlocked(true);
        return { ...a, status: 'TRIGGERED', attackerDetails: 'IP: 192.168.10.15 (Host Aluno Comprometido)' };
      }
      return a;
    }));
  };

  const resetGrid = () => {
    setAssets(INITIAL_HONEY_ASSETS);
    setDeceptionLogs([
      '[Deception Grid] 4 armadilhas ativas na rede e nos sistemas de arquivos locais.',
      '[Canary Monitor] Alertas conectados diretamente ao SIEM/SOC com zero falsos-positivos.'
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Cyber Deception & Honeypots (Honeytokens & Canary Tokens)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-950 text-amber-300 border border-amber-800">
                  DECEPTION TECHNOLOGY & ACTIVE DEFENSE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Implantação de arquivos isca, credenciais monitoradas e serviços simulados que geram alertas com 100% de precisão (falso positivo zero).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={resetGrid}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
              title="Resetar Armadilhas"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Armadilhas Deception */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assets.map(asset => {
          const isTriggered = asset.status === 'TRIGGERED';
          return (
            <div
              key={asset.id}
              className={`p-5 rounded-2xl border transition-all ${
                isTriggered 
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-lg' 
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">{asset.name}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isTriggered 
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse' 
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {asset.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-slate-400">Tipo: <span className="text-amber-400 font-semibold">{asset.type}</span></div>
                <div className="text-slate-400">Local: <span className="font-mono text-slate-300">{asset.location}</span></div>
                {asset.attackerDetails && (
                  <div className="text-rose-300 font-mono text-[11px] pt-1">
                    Atacante Identificado: {asset.attackerDetails}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                {!isTriggered ? (
                  <button
                    onClick={() => triggerHoneyAsset(asset.id)}
                    className="px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Tocar Isca (Simular Intruso)</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-rose-400 flex items-center space-x-1">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Alerta Disparado no SOC</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal de Auditoria Deception */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Terminal do Deception Sensor / Canary Console</span>
        </div>
        <div className="space-y-1 font-mono text-xs text-slate-300">
          {deceptionLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-amber-400">&gt;</span>
              <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 p-1 rounded' : log.includes('ALERT') ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>

        {flagUnlocked && (
          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-amber-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Intruso atraído para o Honeytoken e bloqueado com alerta de alta fidelidade!</span>
            </div>
            <div className="px-2.5 py-1 bg-amber-900 border border-amber-700 text-amber-200 text-xs font-mono font-bold rounded">
              FLAG&#123;WINLINX_DECEPTION_HONEYTOKEN_TRIGGERED_2026&#125;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
