import React, { useState } from 'react';
import { Flame, Network, ShieldCheck } from 'lucide-react';
import { assessInboundTcp, parseTcpPort } from '../core/networkDefense';
import type { ForensicLogRecord, OSProcess, OSType } from '../types/simulator';

interface HostFirewallSimulatorProps {
  hosts: Record<OSType, {
    firewall: { active: boolean; blockedPorts: number[] };
    processes: OSProcess[];
  }>;
  onBlockPort: (os: OSType, port: number) => void;
  onProbe: (record: ForensicLogRecord) => void;
}

export function HostFirewallSimulator({ hosts, onBlockPort, onProbe }: HostFirewallSimulatorProps) {
  const [selectedOS, setSelectedOS] = useState<OSType>('linux');
  const [testPort, setTestPort] = useState('4444');
  const [testedPort, setTestedPort] = useState<number | null>(null);
  const { firewall, processes } = hosts[selectedOS];
  const port = parseTcpPort(testPort);
  const result = testedPort === null ? null : assessInboundTcp(testedPort, firewall, processes);
  const message = result?.outcome === 'filtered' ? 'Filtrada pelo firewall · sem resposta TCP simulada'
    : result?.outcome === 'open' ? 'Aberta · SYN → SYN-ACK → ACK'
    : 'Fechada · TCP RST, sem processo em escuta';

  const handleTestConnection = () => {
    if (port === null) return;
    const { outcome, listener } = assessInboundTcp(port, firewall, processes);
    setTestedPort(port);
    onProbe({
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString(),
      os: selectedOS,
      source: selectedOS === 'linux' ? 'audit.log' : 'Security.evtx',
      facility: 'SIM_TCP',
      severity: outcome === 'open' && listener?.isSuspicious ? 'WARNING' : 'INFO',
      user: 'aluno',
      computer: selectedOS === 'linux' ? 'WINLINX-LNX-01' : 'WINLINX-WIN-2026',
      processName: listener?.name,
      details: `Sonda TCP simulada, porta ${port}. Resultado: ${outcome === 'filtered' ? 'filtrada' : outcome === 'open' ? 'aberta' : 'fechada'}.`
    });
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
                setTestedPort(null);
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
                setTestedPort(null);
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
            <span className="text-[10px] text-slate-500 font-mono">Status: {firewall.active ? 'HABILITADO' : 'DESABILITADO'}</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {firewall.blockedPorts.length === 0 && <p className="text-slate-400">Sem bloqueios explícitos de entrada.</p>}
            {firewall.blockedPorts.map(port => (
              <div key={port} className="p-2.5 rounded border border-rose-800 bg-rose-950/40 text-rose-300">
                {port}/TCP · Bloqueio explícito
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200">Processos em escuta no cenário</h3>
            <ul className="text-xs text-slate-300 space-y-1">
              {processes.filter(process => process.status !== 'stopped' && process.networkPort !== undefined).map(process => (
                <li key={process.pid}>{process.networkPort}/TCP · {process.name} (PID {process.pid})</li>
              ))}
            </ul>
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
              Simule a chegada de um TCP SYN ao host virtual e compare o filtro de entrada com os processos em escuta.
            </p>

            <div className="space-y-2">
              <label htmlFor="tcp-port" className="text-[10px] text-slate-400 uppercase font-mono block">Porta Alvo:</label>
              <div className="flex gap-2">
                <input
                  id="tcp-port"
                  type="text"
                  inputMode="numeric"
                  value={testPort}
                  onChange={e => { setTestPort(e.target.value); setTestedPort(null); }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  placeholder="Ex: 4444 ou 8089"
                />
                <button
                  onClick={handleTestConnection}
                  disabled={port === null}
                  className="px-4 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Testar Porta
                </button>
              </div>
            </div>

            {port === null && <p className="text-xs text-amber-300">Informe uma porta TCP entre 1 e 65535.</p>}
            {result && (
              <div role="status" className="p-4 rounded-xl border border-slate-700 bg-slate-950 text-xs text-slate-200 space-y-2">
                <p>{testedPort}/TCP · {message}</p>
                {result.listener && <p>Processo em escuta: {result.listener.name} (PID {result.listener.pid})</p>}
              </div>
            )}
            <button
              type="button"
              disabled={port === null || firewall.blockedPorts.includes(port)}
              onClick={() => {
                if (port === null) return;
                onBlockPort(selectedOS, port);
                setTestedPort(null);
              }}
              className="text-xs rounded border border-slate-700 px-3 py-2 text-cyan-300 disabled:opacity-40"
            >
              Bloquear entrada TCP no simulador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
