import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Network, 
  Flame, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  XCircle,
  Play
} from 'lucide-react';

interface HostFirewallSimulatorProps {
  linuxBlockedPorts: number[];
  windowsBlockedPorts: number[];
  onExecuteLinuxRule?: (cmd: string) => void;
  onExecuteWindowsRule?: (cmd: string) => void;
}

export const HostFirewallSimulator: React.FC<HostFirewallSimulatorProps> = ({
  linuxBlockedPorts,
  windowsBlockedPorts,
  onExecuteLinuxRule,
  onExecuteWindowsRule
}) => {
  const [selectedOS, setSelectedOS] = useState<'linux' | 'windows'>('linux');
  const [testPort, setTestPort] = useState('4444');
  const [testResult, setTestResult] = useState<string | null>(null);

  const isPortBlocked = (port: number) => {
    return selectedOS === 'linux' 
      ? linuxBlockedPorts.includes(port) 
      : windowsBlockedPorts.includes(port);
  };

  const handleTestConnection = () => {
    const portNum = parseInt(testPort, 10);
    if (isNaN(portNum)) {
      setTestResult('Informe uma porta numérica válida.');
      return;
    }

    const blocked = isPortBlocked(portNum);

    if (blocked) {
      setTestResult(
        `🛡️ [CONEXÃO BLOQUEADA PELO FIREWALL DE HOST]
Destino: 127.0.0.1:${portNum}
Status: REJECT / DROP pelo subsistema de segurança (${selectedOS === 'linux' ? 'Netfilter / iptables' : 'Windows Filtering Platform - WFP'}).
O pacote TCP SYN foi descartado em silêncio. Nenhum dado trafegou.`
      );
    } else {
      setTestResult(
        `⚠️ [CONEXÃO ESTABELECIDA COM SUCESSO - PORTA ABERTA!]
Destino: 127.0.0.1:${portNum}
Status: TCP Handshake Concluído (SYN -> SYN-ACK -> ACK).
Alerta: A porta está exposta e desprotegida contra conexões remotas não autorizadas!`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Network className="w-5 h-5 text-emerald-400" />
                Simulador de Firewalls de Host (Netfilter/UFW vs Windows Filtering Platform/WFP)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Controle de tráfego de rede na camada de Kernel. Bloqueie conexões de comando e controle (C2) e filtre portas locais em Linux e Windows.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setSelectedOS('linux');
                setTestPort('4444');
                setTestResult(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                selectedOS === 'linux' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linux (Netfilter / UFW)
            </button>
            <button
              onClick={() => {
                setSelectedOS('windows');
                setTestPort('8089');
                setTestResult(null);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                selectedOS === 'windows' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Windows (WFP / netsh)
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Regras Ativas + Testador de Conexão */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Regras Ativas */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Regras do Firewall Ativas — {selectedOS === 'linux' ? 'iptables / UFW' : 'Windows Advanced Firewall'}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Status: HABILITADO</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {selectedOS === 'linux' ? (
              <>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Porta 22/TCP (SSH)</span>
                  <span className="text-emerald-400 font-bold">ACCEPT (ALLOW)</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Porta 80/TCP (HTTP)</span>
                  <span className="text-emerald-400 font-bold">ACCEPT (ALLOW)</span>
                </div>
                {linuxBlockedPorts.map(p => (
                  <div key={p} className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 flex items-center justify-between text-rose-300">
                    <span>Porta {p}/TCP (Tráfego Malicioso C2)</span>
                    <span className="font-bold">DROP / DENY [REGRA DE DEFESA]</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Porta 135/TCP (RPC Endpoint)</span>
                  <span className="text-emerald-400 font-bold">ALLOW</span>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span>Porta 3389/TCP (RDP)</span>
                  <span className="text-emerald-400 font-bold">ALLOW</span>
                </div>
                {windowsBlockedPorts.map(p => (
                  <div key={p} className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 flex items-center justify-between text-rose-300">
                    <span>Porta {p}/TCP (Serviço Vulnerável Não Homologado)</span>
                    <span className="font-bold">BLOCK [REGRA DE DEFESA]</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Dicas de Comandos */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <span className="text-[10px] text-slate-500 uppercase font-mono block">Comandos Recomendados de Defesa:</span>
            {selectedOS === 'linux' ? (
              <code className="text-emerald-300 block bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px]">
                ufw deny 4444   (ou: iptables -A INPUT -p tcp --dport 4444 -j DROP)
              </code>
            ) : (
              <code className="text-blue-300 block bg-slate-900 p-2 rounded border border-slate-800 font-mono text-[11px]">
                netsh advfirewall firewall add rule name="Block 8089" dir=in action=block protocol=TCP localport=8089
              </code>
            )}
          </div>
        </div>

        {/* Simulador de Sonda / Port Scanner */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Sonda de Tráfego de Rede (Testador de Porta)
            </h3>
            <p className="text-xs text-slate-400">
              Dispare um pacote TCP SYN para verificar se a porta está protegida pelo firewall do sistema operacional.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 uppercase font-mono block">Porta Alvo:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testPort}
                  onChange={e => setTestPort(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  placeholder="Ex: 4444 ou 8089"
                />
                <button
                  onClick={handleTestConnection}
                  className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Testar Porta
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`p-4 rounded-xl border text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                isPortBlocked(parseInt(testPort, 10))
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300 animate-pulse'
              }`}>
                {testResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
