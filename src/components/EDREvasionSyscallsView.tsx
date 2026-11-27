import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Play, 
  RotateCcw, 
  Terminal, 
  AlertTriangle, 
  CheckCircle2, 
  Activity,
  Code2,
  Lock,
  Cpu
} from 'lucide-react';

interface HookedFunction {
  name: string;
  ssn: string; // System Service Number
  cleanBytes: string;
  hookedBytes: string;
  isHooked: boolean;
  edrVendor: string;
}

const INITIAL_NTDLL_FUNCTIONS: HookedFunction[] = [
  {
    name: 'NtAllocateVirtualMemory',
    ssn: '0x0018',
    cleanBytes: '4c 8b d1 b8 18 00 00 00 0f 05 c3', // mov r10, rcx; mov eax, 18h; syscall; ret
    hookedBytes: 'e9 42 7a 10 7f 90 90 90 0f 05 c3', // jmp EDR_Hook_Handler
    isHooked: true,
    edrVendor: 'CrowdStrike / Defender EDR Sensor'
  },
  {
    name: 'NtProtectVirtualMemory',
    ssn: '0x0050',
    cleanBytes: '4c 8b d1 b8 50 00 00 00 0f 05 c3',
    hookedBytes: 'e9 12 3b 14 7f 90 90 90 0f 05 c3',
    isHooked: true,
    edrVendor: 'CrowdStrike / Defender EDR Sensor'
  },
  {
    name: 'NtCreateThreadEx',
    ssn: '0x00c1',
    cleanBytes: '4c 8b d1 b8 c1 00 00 00 0f 05 c3',
    hookedBytes: 'e9 99 82 12 7f 90 90 90 0f 05 c3',
    isHooked: true,
    edrVendor: 'SentinelOne / CarbonBlack Sensor'
  },
  {
    name: 'NtWriteVirtualMemory',
    ssn: '0x003a',
    cleanBytes: '4c 8b d1 b8 3a 00 00 00 0f 05 c3',
    hookedBytes: '4c 8b d1 b8 3a 00 00 00 0f 05 c3',
    isHooked: false,
    edrVendor: 'Limpo (Sem Hook)'
  }
];

export const EDREvasionSyscallsView: React.FC = () => {
  const [functions, setFunctions] = useState<HookedFunction[]>(INITIAL_NTDLL_FUNCTIONS);
  const [evasionMode, setEvasionMode] = useState<'hells-gate' | 'unhooking'>('hells-gate');
  const [executed, setExecuted] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[EDR Inspector] Mapeando espaço de endereçamento de ntdll.dll carregada em memória.',
    '[HOOK DETECTADO] 3 APIs críticas de injeção contêm desvios JMP para módulos de segurança.'
  ]);

  const executeEvasion = () => {
    setExecuted(true);
    if (evasionMode === 'hells-gate') {
      setLogs(l => [
        ...l,
        `[HELL'S GATE] Varrendo memória adjacente para resolução dinâmica dos SSNs.`,
        `[SSN RESOLVIDO] NtAllocateVirtualMemory -> SSN 0x0018 obtido via Hell's Gate Stub.`,
        `[DIRECT SYSCALL] Instrução 'syscall' executada diretamente em assembly inline sem passar pelo JMP do EDR!`,
        `[ETW-Ti ALERT] Kernel detectou transição Ring 3 -> Ring 0 com RIP fora da área homologada da ntdll.dll.`,
        `FLAG{WINLINX_EDR_DIRECT_SYSCALL_HELLS_GATE_2026}`
      ]);
    } else {
      // Unhooking (Perun's Fart)
      setFunctions(prev => prev.map(f => ({ ...f, isHooked: false, hookedBytes: f.cleanBytes })));
      setLogs(l => [
        ...l,
        `[PERUN'S FART] Lendo arquivo limpo 'ntdll.dll' diretamente do disco (\\Device\\HarddiskVolume3\\...).`,
        `[UNHOOKING] Substituindo a seção .text de ntdll.dll em memória virtual pelos bytes originais do disco.`,
        `[SUCESSO] Todos os ganchos inline do EDR foram removidos! Memória restaurada para estado pristine.`,
        `FLAG{WINLINX_EDR_DIRECT_SYSCALL_HELLS_GATE_2026}`
      ]);
    }
  };

  const resetHooks = () => {
    setFunctions(INITIAL_NTDLL_FUNCTIONS);
    setExecuted(false);
    setLogs([
      '[EDR Inspector] Sensores de EDR recarregados. Hooks reaplicados nos stubs de ntdll.dll.'
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Evasão de EDR: Syscalls Diretas & Unhooking</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-950 text-rose-300 border border-rose-800">
                  HELL'S GATE / HALOS GATE / PERUN'S FART
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mapeamento de hooks em user-mode (ntdll.dll), resolução dinâmica de SSN e contorno de sensores antivírus.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setEvasionMode('hells-gate'); setExecuted(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                evasionMode === 'hells-gate' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Hell's Gate (Syscall Direta)
            </button>
            <button
              onClick={() => { setEvasionMode('unhooking'); setExecuted(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                evasionMode === 'unhooking' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Unhooking (Perun's Fart)
            </button>
            <button
              onClick={resetHooks}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
              title="Resetar Hooks"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Disassembly de Hooks de User-Mode */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-200">Inspeção de Memória: Stubs de ntdll.dll</span>
            <span className="text-[11px] text-slate-500 ml-2">Base Address: 0x00007ffd14a00000</span>
          </div>
          <button
            onClick={executeEvasion}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Disparar Técnica: {evasionMode === 'hells-gate' ? "Hell's Gate" : "Unhooking"}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800 pb-2">
                <th className="py-2 px-3">Syscall API</th>
                <th className="py-2 px-3">SSN</th>
                <th className="py-2 px-3">Instruções em Memória (Bytes)</th>
                <th className="py-2 px-3">Status do EDR</th>
                <th className="py-2 px-3">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {functions.map((fn, idx) => (
                <tr key={idx} className={`hover:bg-slate-900/40 ${fn.isHooked ? 'text-rose-300' : 'text-slate-300'}`}>
                  <td className="py-2.5 px-3 font-bold select-all">{fn.name}</td>
                  <td className="py-2.5 px-3 text-cyan-400">{fn.ssn}</td>
                  <td className="py-2.5 px-3">
                    <span className={fn.isHooked ? 'text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded' : 'text-emerald-400'}>
                      {fn.isHooked ? fn.hookedBytes : fn.cleanBytes}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">{fn.edrVendor}</td>
                  <td className="py-2.5 px-3">
                    {fn.isHooked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold flex items-center space-x-1 w-max">
                        <AlertTriangle className="w-3 h-3" />
                        <span>INTERCEPTADA (JMP)</span>
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center space-x-1 w-max">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ORIGINAL (PRISTINE)</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {executed && (
          <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-rose-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Técnica de bypass de EDR executada com sucesso! Sensores de Ring 3 contornados.</span>
            </div>
            <div className="px-2.5 py-1 bg-rose-900 border border-rose-700 text-rose-200 text-xs font-mono font-bold rounded">
              FLAG&#123;WINLINX_EDR_DIRECT_SYSCALL_HELLS_GATE_2026&#125;
            </div>
          </div>
        )}
      </div>

      {/* Terminal de Evasão */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Terminal de Depuração de Evasão</span>
        </div>
        <div className="space-y-1 font-mono text-xs text-slate-300">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-rose-400">&gt;</span>
              <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 p-1 rounded' : log.includes('SUCESSO') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
