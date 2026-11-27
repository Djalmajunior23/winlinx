import React, { useState } from 'react';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Play, 
  RotateCcw, 
  Layers, 
  Filter, 
  Eye, 
  Code2,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface BPFProgram {
  id: string;
  name: string;
  type: 'kprobe' | 'tracepoint' | 'lsm' | 'sockops';
  hookTarget: string;
  description: string;
  cCodeSnippet: string;
  bytecodeVerified: boolean;
  active: boolean;
}

interface BPFEvent {
  timestamp: string;
  pid: number;
  comm: string;
  hook: string;
  details: string;
  verdict: 'PERMIT' | 'BLOCK' | 'AUDIT';
}

const INITIAL_BPF_PROGRAMS: BPFProgram[] = [
  {
    id: 'bpf-execve-monitor',
    name: 'trace_execve_tamper',
    type: 'tracepoint',
    hookTarget: 'sys_enter_execve',
    description: 'Monitora criação de processos sem overhead de ptrace e detecta binários em /tmp e caminhos anômalos.',
    cCodeSnippet: `SEC("tracepoint/syscalls/sys_enter_execve")
int trace_execve(struct trace_event_raw_sys_enter *ctx) {
    char filename[256];
    bpf_probe_read_user_str(filename, sizeof(filename), (void *)ctx->args[0]);
    if (filename[0] == '/' && filename[1] == 't' && filename[2] == 'm' && filename[3] == 'p') {
        bpf_printk("[ALERT] Execve disparado em /tmp: %s\\n", filename);
    }
    return 0;
}`,
    bytecodeVerified: true,
    active: true
  },
  {
    id: 'bpf-lsm-bprm',
    name: 'lsm_block_unauthorized_exec',
    type: 'lsm',
    hookTarget: 'bpf_lsm_bprm_check_security',
    description: 'Hook no Linux Security Module (LSM) que bloqueia diretamente em Ring 0 a execução de arquivos sem hash homologado.',
    cCodeSnippet: `SEC("lsm/bprm_check_security")
int BPF_PROG(restrict_unauthorized, struct linux_binprm *bprm) {
    if (is_blacklisted_inode(bprm->file->f_inode)) {
        return -EPERM; // Retorna permissão negada antes de carregar ELF
    }
    return 0;
}`,
    bytecodeVerified: true,
    active: false
  },
  {
    id: 'bpf-socket-filter',
    name: 'sock_block_c2_syn',
    type: 'sockops',
    hookTarget: 'sock_ops/tcp_connect',
    description: 'Inspeciona soquetes TCP na camada de transporte do Kernel e descarta pacotes SYN para C2 (porta 4444).',
    cCodeSnippet: `SEC("sockops")
int bpf_sockmap_filter(struct bpf_sock_ops *skops) {
    if (skops->op == BPF_SOCK_OPS_ACTIVE_ESTABLISHED_CB) {
        if (bpf_ntohl(skops->remote_port) == 4444) {
            return -1; // Aborta handshake TCP imediatamente
        }
    }
    return 0;
}`,
    bytecodeVerified: true,
    active: false
  }
];

const INITIAL_EVENTS: BPFEvent[] = [
  { timestamp: '12:40:01', pid: 1042, comm: 'bash', hook: 'sys_enter_execve', details: 'filename="/bin/ls"', verdict: 'PERMIT' },
  { timestamp: '12:40:05', pid: 1337, comm: 'kworker_rev', hook: 'sys_enter_execve', details: 'filename="/tmp/.hidden/nc" args="-e /bin/sh 4444"', verdict: 'AUDIT' },
  { timestamp: '12:40:08', pid: 2110, comm: 'python3.11', hook: 'sys_enter_execve', details: 'cap_setuid+ep invocado', verdict: 'AUDIT' }
];

interface EBPFProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordForensicLogs?: (newLogs: any[]) => void;
}

export const EBPFKernelTracerView: React.FC<EBPFProps> = ({ onCaptureFlag, onRecordForensicLogs }) => {
  const [programs, setPrograms] = useState<BPFProgram[]>(INITIAL_BPF_PROGRAMS);
  const [events, setEvents] = useState<BPFEvent[]>(INITIAL_EVENTS);
  const [selectedProg, setSelectedProg] = useState<BPFProgram>(INITIAL_BPF_PROGRAMS[0]);
  const [tracingActive, setTracingActive] = useState<boolean>(true);
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  const toggleProgram = (progId: string) => {
    setPrograms(prev => prev.map(p => {
      if (p.id === progId) {
        const nextActive = !p.active;
        if (nextActive) {
          setEvents(evs => [
            {
              timestamp: new Date().toLocaleTimeString(),
              pid: 412,
              comm: 'bpftool',
              hook: p.hookTarget,
              details: `Programa eBPF '${p.name}' verificado pelo in-kernel verifier (412 instruções) e anexado!`,
              verdict: 'PERMIT'
            },
            ...evs
          ]);
          setFlagUnlocked(true);
        }
        return { ...p, active: nextActive };
      }
      return p;
    }));
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">eBPF Kernel Observability & Segurança em Tempo Real</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  TETRAGON / CILIUM eBPF ARCHITECTURE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Execução de bytecode verificado no Kernel Ring 0 (kprobes, tracepoints e BPF LSM) sem recompilar módulos e com zero overhead.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearEvents}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              Limpar Ring Buffer
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>eBPF Verifier: PASS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Programas e Código C */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Programas eBPF Carregados</span>
            </h3>

            <div className="space-y-2">
              {programs.map(prog => (
                <div
                  key={prog.id}
                  onClick={() => setSelectedProg(prog)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    selectedProg.id === prog.id
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 font-mono">{prog.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                      {prog.type}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2">{prog.description}</p>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">Hook: {prog.hookTarget}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleProgram(prog.id);
                      }}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition cursor-pointer ${
                        prog.active 
                          ? 'bg-emerald-500 text-slate-950 font-bold' 
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {prog.active ? 'Ativo (Hooked)' : 'Anexar Hook'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor de Código BPF e Feed do Ring Buffer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Código C Restrito (Clang/LLVM BPF Target): {selectedProg.name}.c
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">JIT_COMPILED (x86_64)</span>
            </div>

            <pre className="p-3.5 bg-slate-900 rounded-xl font-mono text-xs text-emerald-300 border border-slate-800 overflow-x-auto">
              <code>{selectedProg.cCodeSnippet}</code>
            </pre>
          </div>

          {/* Event Stream do Ring Buffer */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Ring Buffer Telemetry (Perf Event Output)
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Total Eventos: {events.length}</span>
            </div>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800 pb-2">
                    <th className="py-2 px-3">Hora</th>
                    <th className="py-2 px-3">PID</th>
                    <th className="py-2 px-3">Processo</th>
                    <th className="py-2 px-3">Hook BPF</th>
                    <th className="py-2 px-3">Detalhes</th>
                    <th className="py-2 px-3">Veredito</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {events.map((ev, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 text-slate-400">{ev.timestamp}</td>
                      <td className="py-2 px-3 text-cyan-400">{ev.pid}</td>
                      <td className="py-2 px-3 font-bold text-slate-200">{ev.comm}</td>
                      <td className="py-2 px-3 text-emerald-400">{ev.hook}</td>
                      <td className="py-2 px-3 text-slate-300 select-all">{ev.details}</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          ev.verdict === 'BLOCK' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          ev.verdict === 'AUDIT' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {ev.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {flagUnlocked && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hook eBPF anexado em tempo real com auditoria de Ring 0 ativa!</span>
                </div>
                <div className="px-2.5 py-1 bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-mono font-bold rounded">
                  FLAG&#123;WINLINX_EBPF_KERNEL_TRACER_ARMED_2026&#125;
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
