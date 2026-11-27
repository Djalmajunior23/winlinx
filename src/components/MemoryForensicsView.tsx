import React, { useState } from 'react';
import { 
  Cpu, 
  Terminal, 
  Search, 
  ShieldAlert, 
  CheckCircle2, 
  Activity, 
  Layers, 
  FileText,
  Flame,
  ArrowRight
} from 'lucide-react';

interface VolatilityPluginOutput {
  id: string;
  name: string;
  command: string;
  os: 'windows' | 'linux';
  description: string;
  output: string;
  flagRevealed?: string;
}

const VOLATILITY_PLUGINS: VolatilityPluginOutput[] = [
  {
    id: 'vol-psscan',
    name: 'windows.psscan',
    command: 'vol.py -f memdump.raw windows.psscan',
    os: 'windows',
    description: 'Varre pools de memória física procurando blocos _EPROCESS desvinculados por rootkits DKOM (Direct Kernel Object Manipulation).',
    output: `PID     PPID    ImageFileName       Offset(V)           Threads  Handles  CreateTime
4       0       System              0xffff8001a1200080  142      0        2026-11-26 20:00:01
520     4       smss.exe            0xffff8001a2400120  5        42       2026-11-26 20:00:02
840     720     svchost.exe         0xffff8001a4500300  28       410      2026-11-26 20:00:05
4992    1450    updater_svc.exe     0xffff8001a7800900  4        88       2026-11-26 20:05:12
6660    840     ghost_beacon.exe    0xffff8001a9100140  2        14       2026-11-26 20:10:45 [UNLINKED DKOM PROCESS!]

[ALERTA DE ROOTKIT] Processo ghost_beacon.exe (PID 6660) foi desvinculado da lista duplamente encadeada ActiveProcessLinks!`,
    flagRevealed: 'FLAG{WINLINX_VOLATILITY_DKOM_UNLINKED_PROCESS_2026}'
  },
  {
    id: 'vol-malfind',
    name: 'windows.malfind',
    command: 'vol.py -f memdump.raw windows.malfind',
    os: 'windows',
    description: 'Encontra regiões VAD (Virtual Address Descriptor) de memória com proteção PAGE_EXECUTE_READWRITE (RWX) contendo shellcode injetado.',
    output: `Process: explorer.exe Pid: 1450 Address: 0x2400000 Size: 0x4000
Protection: PAGE_EXECUTE_READWRITE
0x000002400000  4d 5a 90 00 03 00 00 00 04 00 00 00 ff ff 00 00  MZ..............
0x000002400010  b8 00 00 00 00 00 00 00 40 00 00 00 00 00 00 00  ........@.......
0x000002400020  fc 48 83 e4 f0 e8 c8 00 00 00 41 51 41 50 52 51  .H........AQAPRQ  <-- Shellcode NOP/Payload!

[DETECTADO] Região RWX suspeita encontrada dentro do processo legítimo explorer.exe. Violação clara da política W^X!`,
    flagRevealed: 'FLAG{WINLINX_VOLATILITY_MALFIND_RWX_INJECTION_2026}'
  },
  {
    id: 'vol-linux-syscall',
    name: 'linux.check_syscall',
    command: 'vol.py -f linux_mem.lime linux.check_syscall',
    os: 'linux',
    description: 'Inspeciona a tabela de chamadas de sistema (sys_call_table) no Kernel Linux procurando ponteiros manipulados por LKMs.',
    output: `Table Index   Syscall Name        Address             Expected Symbol           Hook Status
__NR_read     sys_read            0xffffffff81240100  sys_read                  OK
__NR_write    sys_write           0xffffffff81240800  sys_write                 OK
__NR_kill     sys_kill            0xffffffffa0150240  [LKM: rootkit_diamorphine] HOOKED!
__NR_getdents sys_getdents64      0xffffffffa0150580  [LKM: rootkit_diamorphine] HOOKED!

[ALERTA DE KERNEL] Ponteiros da sys_call_table foram sequestrados para funções internas de módulo não homologado!`,
    flagRevealed: 'FLAG{WINLINX_VOLATILITY_LINUX_HOOKED_SYSCALL_2026}'
  }
];

export const MemoryForensicsView: React.FC = () => {
  const [selectedPlugin, setSelectedPlugin] = useState<VolatilityPluginOutput>(VOLATILITY_PLUGINS[0]);
  const [running, setRunning] = useState<boolean>(false);
  const [consoleOutput, setConsoleOutput] = useState<string>(VOLATILITY_PLUGINS[0].output);

  const handleRunPlugin = (plugin: VolatilityPluginOutput) => {
    setSelectedPlugin(plugin);
    setRunning(true);
    setConsoleOutput('Carregando profile de símbolos e desreferenciando estruturas de kernel na RAM...');
    setTimeout(() => {
      setRunning(false);
      setConsoleOutput(plugin.output);
    }, 450);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Análise Forense de Memória RAM (Volatility 3 Lite)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  RAM ARTIFACT CARVING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Descoberta de processos ocultos por DKOM, identificação de injeções de código em regiões RWX e ganchos de sys_call_table.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Plugins */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Plugins de Volatility</span>
            </h3>

            <div className="space-y-2">
              {VOLATILITY_PLUGINS.map(plugin => {
                const isSelected = plugin.id === selectedPlugin.id;
                return (
                  <div
                    key={plugin.id}
                    onClick={() => handleRunPlugin(plugin)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 font-mono">{plugin.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        plugin.os === 'windows' ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {plugin.os}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{plugin.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Terminal do Volatility */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold text-slate-200">{selectedPlugin.command}</span>
              </div>
              {running && <span className="text-xs font-mono text-indigo-400 animate-pulse">Running plugin...</span>}
            </div>

            <pre className="flex-1 overflow-y-auto font-mono text-xs text-slate-300 p-2 select-text leading-relaxed whitespace-pre-wrap">
              {consoleOutput}
            </pre>

            {selectedPlugin.flagRevealed && !running && (
              <div className="mt-2 pt-3 border-t border-slate-800 flex items-center justify-between bg-indigo-950/20 p-2.5 rounded-xl border border-indigo-900/40">
                <div className="flex items-center space-x-2 text-xs text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  <span>Artefato volátil validado com sucesso na memória física!</span>
                </div>
                <div className="px-2.5 py-1 bg-indigo-900/80 border border-indigo-700 text-indigo-200 text-xs font-mono font-bold rounded">
                  {selectedPlugin.flagRevealed}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
