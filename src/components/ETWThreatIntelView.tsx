import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Activity, 
  Radio, 
  Eye, 
  FileSearch,
  Filter,
  Layers,
  Cpu
} from 'lucide-react';

interface ETWEvent {
  id: string;
  timestamp: string;
  provider: string;
  opcode: string;
  pid: number;
  processName: string;
  details: string;
  threatLevel: 'ALTO' | 'MÉDIO' | 'INFORMATIVO';
}

const INITIAL_ETW_EVENTS: ETWEvent[] = [
  {
    id: 'etw-1',
    timestamp: '12:45:10',
    provider: 'Microsoft-Windows-Threat-Intelligence (ETW-Ti)',
    opcode: 'KERNEL_THREATINT_ALLOCVM_REMOTE',
    pid: 2110,
    processName: 'powershell.exe',
    details: 'Alocação de memória remota em svchost.exe (Target PID 920) com proteção PAGE_EXECUTE_READWRITE!',
    threatLevel: 'ALTO'
  },
  {
    id: 'etw-2',
    timestamp: '12:45:14',
    provider: 'Microsoft-Windows-Threat-Intelligence (ETW-Ti)',
    opcode: 'KERNEL_THREATINT_SUSPICIOUS_SYSCALL',
    pid: 2110,
    processName: 'powershell.exe',
    details: 'Transição Ring 3 -> Ring 0 executada fora da área homologada da ntdll.dll (Direct Syscall detectada via MSR_LSTAR).',
    threatLevel: 'ALTO'
  },
  {
    id: 'etw-3',
    timestamp: '12:45:22',
    provider: 'Microsoft-Windows-Kernel-Process',
    opcode: 'PROCESS_CREATE',
    pid: 920,
    processName: 'svchost.exe',
    details: 'Thread secundária criada via NtCreateThreadEx apontando para payload refletido.',
    threatLevel: 'MÉDIO'
  }
];

interface ETWProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordForensicLogs?: (newLogs: any[]) => void;
}

export const ETWThreatIntelView: React.FC<ETWProps> = ({ onCaptureFlag, onRecordForensicLogs }) => {
  const [events, setEvents] = useState<ETWEvent[]>(INITIAL_ETW_EVENTS);
  const [tracing, setTracing] = useState<boolean>(true);
  const [filterProvider, setFilterProvider] = useState<string>('Todos');
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  const simulateETWSession = () => {
    setEvents(prev => [
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        provider: 'Microsoft-Windows-Threat-Intelligence (ETW-Ti)',
        opcode: 'KERNEL_THREATINT_SET_THREAD_CONTEXT',
        pid: 2110,
        processName: 'powershell.exe',
        details: 'Modificação de registradores de CPU RIP/RSP da thread alvo (Process Hollowing detectado pelo Kernel NT)!',
        threatLevel: 'ALTO'
      },
      ...prev
    ]);
    setFlagUnlocked(true);
  };

  const filteredEvents = filterProvider === 'Todos' 
    ? events 
    : events.filter(e => e.provider.includes(filterProvider));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">ETW-Ti: Telemetria de Kernel Threat Intelligence do Windows</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-950 text-blue-300 border border-blue-800">
                  EVENT TRACING FOR WINDOWS (RING 0 SENSOR)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoramento de baixo nível imune a unhooking de user-mode. O kernel NT inspeciona transições de syscalls, injeções remotas e violações de integridade.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={simulateETWSession}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              Simular Injeção de Memória
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-blue-950/80 border border-blue-700 text-blue-300 text-xs font-mono font-bold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>Sessão ETW-Ti: LOGGING</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Eventos ETW-Ti */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-mono font-bold text-slate-200">
              Trace Consumer Buffer (GUID: &#123;F4E1897C-BB5D-4668-AC1D-6164C93D2480&#125;)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Provedor:</span>
            <select
              value={filterProvider}
              onChange={e => setFilterProvider(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none"
            >
              <option value="Todos">Todos os Provedores</option>
              <option value="Threat-Intelligence">Threat-Intelligence (ETW-Ti)</option>
              <option value="Kernel-Process">Kernel-Process</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800 pb-2">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Provedor de Kernel</th>
                <th className="py-2 px-3">Opcode / Evento</th>
                <th className="py-2 px-3">PID</th>
                <th className="py-2 px-3">Processo</th>
                <th className="py-2 px-3">Diagnóstico Telemetria</th>
                <th className="py-2 px-3">Nível</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filteredEvents.map(ev => (
                <tr key={ev.id} className="hover:bg-slate-900/40">
                  <td className="py-2 px-3 text-slate-400">{ev.timestamp}</td>
                  <td className="py-2 px-3 text-blue-400 font-bold">{ev.provider.split(' ')[0]}</td>
                  <td className="py-2 px-3 text-cyan-300">{ev.opcode}</td>
                  <td className="py-2 px-3 text-slate-400">{ev.pid}</td>
                  <td className="py-2 px-3 font-bold text-slate-200">{ev.processName}</td>
                  <td className="py-2 px-3 text-slate-300 select-all max-w-md">{ev.details}</td>
                  <td className="py-2 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      ev.threatLevel === 'ALTO' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      ev.threatLevel === 'MÉDIO' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-slate-900 text-slate-400'
                    }`}>
                      {ev.threatLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {flagUnlocked && (
          <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Injeção de código detectada na camada de Kernel via ETW-Ti sem depender de hooks da ntdll!</span>
            </div>
            <div className="px-2.5 py-1 bg-blue-900 border border-blue-700 text-blue-200 text-xs font-mono font-bold rounded">
              FLAG&#123;WINLINX_ETW_TI_KERNEL_INJECTION_DETECTED_2026&#125;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
