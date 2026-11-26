import React, { useState } from 'react';
import { 
  Network, 
  Server, 
  Laptop, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  Lock, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Users,
  Database
} from 'lucide-react';

interface NetworkHost {
  id: string;
  name: string;
  ip: string;
  role: string;
  os: 'windows' | 'linux';
  compromised: boolean;
  services: string[];
  vulnerabilities: string[];
  credentialsDiscovered: string[];
}

const INITIAL_HOSTS: NetworkHost[] = [
  {
    id: 'host-workstation',
    name: 'WS-ALUNO-01',
    ip: '192.168.10.15',
    role: 'Ponto de Acesso Inicial (Initial Foothold)',
    os: 'windows',
    compromised: true,
    services: ['WinRM 5985', 'SMB 445', 'RPC 135'],
    vulnerabilities: ['Unquoted Service Path no serviço CustomUpdater'],
    credentialsDiscovered: ['ALUNO-PC\\Aluno (Sessão Atual)', 'Hash NTLM em cache no LSASS']
  },
  {
    id: 'host-linux-jump',
    name: 'SRV-LINUX-JUMP',
    ip: '192.168.10.20',
    role: 'Servidor Bastion / Jump Server',
    os: 'linux',
    compromised: false,
    services: ['SSH 22', 'Nginx 80', 'Docker Engine 2375'],
    vulnerabilities: ['Chave SSH id_rsa reutilizada nos perfis de automação', 'Socket Docker exposto'],
    credentialsDiscovered: []
  },
  {
    id: 'host-dc',
    name: 'CORP-DC-01 (Domain Controller)',
    ip: '192.168.10.2',
    role: 'Controlador de Domínio Active Directory',
    os: 'windows',
    compromised: false,
    services: ['Kerberos 88', 'LDAP 389', 'DNS 53', 'SMB 445'],
    vulnerabilities: ['Kerberoasting na conta de serviço svc_mssql', 'AS-REP Roasting'],
    credentialsDiscovered: []
  }
];

export const NetworkTopologyPivotView: React.FC = () => {
  const [hosts, setHosts] = useState<NetworkHost[]>(INITIAL_HOSTS);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [pivotLogs, setPivotLogs] = useState<string[]>([
    '[192.168.10.15] Sessão interativa ativa como ALUNO-PC\\Aluno. Sub-rede 192.168.10.0/24 descoberta.'
  ]);

  const advanceLateralMovement = () => {
    if (activeStep === 1) {
      // Movimentação para o Jump Server Linux via SSH
      setHosts(prev => prev.map(h => h.id === 'host-linux-jump' ? {
        ...h,
        compromised: true,
        credentialsDiscovered: ['id_rsa (Chave privada sem passphrase)', 'root via Docker Socket Breakout']
      } : h));
      setPivotLogs(prev => [
        ...prev,
        '[PIVOT] Movimentação lateral para SRV-LINUX-JUMP (192.168.10.20) via credencial descoberta no VFS.',
        '[EXPLOIT] Escape do container Docker via montagem de /var/run/docker.sock obtendo root!',
        '[RECON] Descoberta da rota para o Controlador de Domínio CORP-DC-01 (192.168.10.2).'
      ]);
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Movimentação para o Domain Controller via Kerberoasting / Pass-the-Ticket
      setHosts(prev => prev.map(h => h.id === 'host-dc' ? {
        ...h,
        compromised: true,
        credentialsDiscovered: ['CORP\\Administrator (Domain Admin Token)', 'Golden Ticket TGT']
      } : h));
      setPivotLogs(prev => [
        ...prev,
        '[KERBEROS] Solicitação de Ticket TGS para SPN MSSQLSvc/corp-dc-01.corp.local.',
        '[CRACK] Hash Kerberoast extraído e quebrado offline.',
        '[COMPROMETIMENTO TOTAL] Autenticação Pass-the-Ticket bem-sucedida como Domain Admin!',
        '[FLAG] FLAG{WINLINX_LATERAL_MOVEMENT_DOMAIN_DOMINATED_2026}'
      ]);
      setActiveStep(3);
    }
  };

  const resetPivot = () => {
    setHosts(INITIAL_HOSTS);
    setActiveStep(1);
    setPivotLogs([
      '[192.168.10.15] Sessão interativa ativa como ALUNO-PC\\Aluno. Sub-rede 192.168.10.0/24 descoberta.'
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Topologia de Rede & Movimentação Lateral</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  BLOODHOUND / ACTIVE DIRECTORY LAB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulação de pivoteamento entre Windows Workstation, Linux Jump Server e Domain Controller via Kerberos e SSH.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {activeStep < 3 ? (
              <button
                onClick={advanceLateralMovement}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <span>Avançar Pivoteamento (Etapa {activeStep}/2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-xl text-xs font-bold">
                Domínio Comprometido (Domain Dominance)
              </div>
            )}

            <button
              onClick={resetPivot}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
              title="Resetar Movimentação"
            >
              Resetar
            </button>
          </div>
        </div>
      </div>

      {/* Mapa Visual de Hosts da Rede */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {hosts.map((host, idx) => {
          const isCompromised = host.compromised;
          return (
            <div
              key={host.id}
              className={`p-5 rounded-2xl border transition-all relative ${
                isCompromised
                  ? 'bg-rose-950/20 border-rose-500/50 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {host.os === 'windows' ? (
                    <Laptop className="w-5 h-5 text-cyan-400" />
                  ) : (
                    <Server className="w-5 h-5 text-amber-400" />
                  )}
                  <span className="text-sm font-bold text-slate-200">{host.name}</span>
                </div>
                {isCompromised ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center space-x-1">
                    <ShieldAlert className="w-3 h-3" />
                    <span>COMPROMETIDO</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>ISOLADO</span>
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="text-slate-400">IP: <span className="font-mono text-slate-200">{host.ip}</span></div>
                <div className="text-slate-400">Função: <span className="text-slate-300">{host.role}</span></div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">Serviços Expostos:</span>
                  <div className="flex flex-wrap gap-1">
                    {host.services.map((svc, sIdx) => (
                      <span key={sIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                        {svc}
                      </span>
                    ))}
                  </div>
                </div>

                {host.credentialsDiscovered.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-semibold text-rose-400 flex items-center space-x-1 mb-1">
                      <Key className="w-3 h-3" />
                      <span>Credenciais Obtidas:</span>
                    </span>
                    <ul className="space-y-0.5 text-[11px] font-mono text-rose-300">
                      {host.credentialsDiscovered.map((c, cIdx) => (
                        <li key={cIdx}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Terminal de Execução do Pivot */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Terminal de Pivoteamento & Rastro de Ataque</span>
        </div>

        <div className="space-y-1.5 font-mono text-xs">
          {pivotLogs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-emerald-400 select-none">&gt;</span>
              <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800' : log.includes('COMPROMETIMENTO') ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
