import React, { useState } from 'react';
import { 
  Cpu, 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Terminal, 
  Play, 
  Flame, 
  AlertTriangle,
  Code2
} from 'lucide-react';

export const VirtualMemoryInspector: React.FC = () => {
  const [isAslrEnabled, setIsAslrEnabled] = useState(true);
  const [isDepEnabled, setIsDepEnabled] = useState(true);
  const [selectedProcessName, setSelectedProcessName] = useState('lsass.exe');
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [randomSeed, setRandomSeed] = useState(0x7fff5a40);

  const handleRandomizeMemory = () => {
    if (isAslrEnabled) {
      setRandomSeed(Math.floor(0x70000000 + Math.random() * 0x0fffffff));
    }
  };

  const getBaseAddr = (offset: number) => {
    const base = isAslrEnabled ? randomSeed : 0x00400000;
    return '0x' + (base + offset).toString(16).toUpperCase();
  };

  const handleSimulateShellcodeInjection = () => {
    if (isDepEnabled) {
      setSimulationResult(
        `🛡️ [BLOQUEIO DE DEP / NX ATIVADO]
Hardware Status: O bit NX (No-Execute) da CPU impediu a execução de instruções na página de Stack/Heap!
Código de Erro: EXCEPTION_ACCESS_VIOLATION (0xC0000005)
Ataque de injeção de shellcode neutralizado pelo Sistema Operacional.`
      );
    } else {
      setSimulationResult(
        `🚨 [ALERTA DE SEGURANÇA CRÍTICO: DEP DESATIVADO!]
O processador executou as instruções a partir da página de dados (Stack) via NOP Sled (0x90)!
Shellcode executado com sucesso no contexto do processo!
🚩 FLAG{WINLINX_MEMORY_DEP_NX_EXPLOIT_DEMO_2026}`
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
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Inspetor de Memória Virtual, ASLR & DEP/NX (Hardware & OS Security)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Simule a organização de páginas de memória de um processo (Stack, Heap, Code, Data) e teste a eficácia de defesas de hardware e kernel contra exploits de corrupção de memória.
            </p>
          </div>

          <button
            onClick={handleRandomizeMemory}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 text-xs font-semibold self-start sm:self-auto transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Simular Reinicialização (ASLR Shuffle)</span>
          </button>
        </div>

        {/* Controles de Mitigação */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-300">Processo Alvo:</span>
            <select
              value={selectedProcessName}
              onChange={e => setSelectedProcessName(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-cyan-300 rounded px-2 py-0.5 font-mono focus:outline-none"
            >
              <option value="lsass.exe">lsass.exe (Windows Security Authority)</option>
              <option value="sshd">sshd (Linux OpenSSH Server)</option>
              <option value="nginx">nginx (Web Server Worker)</option>
            </select>
          </div>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={isAslrEnabled}
              onChange={e => {
                setIsAslrEnabled(e.target.checked);
                if (e.target.checked) handleRandomizeMemory();
              }}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="font-semibold text-slate-300">ASLR Habilitado (Randomização de Layout)</span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <input
              type="checkbox"
              checked={isDepEnabled}
              onChange={e => setIsDepEnabled(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span className="font-semibold text-slate-300">DEP / NX Habilitado (Write XOR Execute)</span>
          </label>
        </div>
      </div>

      {/* Grid Principal: Mapa de Memória Virtual + Laboratório de Exploração */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Mapa de Seções de Memória Virtual */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              Espaço de Endereçamento Virtual (VASP) do {selectedProcessName}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Arquitetura x86_64</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {/* Kernel Space */}
            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">KERNEL SPACE (Ring 0)</span>
                <span className="text-[10px] text-slate-500">0xFFFF800000000000 - 0xFFFFFFFFFFFFFFFF</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Reservado para os drivers e código do Kernel. Inacessível diretamente pelo processo comum (provoca Falha de Segmentação / Access Violation).
              </p>
            </div>

            {/* Stack */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">STACK / PILHA (Cresce para baixo ↓)</span>
                <span className="text-[10px] text-cyan-400">{getBaseAddr(0x80000)} [RW{isDepEnabled ? '-' : 'X'}]</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Variáveis locais, endereços de retorno das funções (Saved RIP) e registros. Protegida por <strong>Stack Canaries</strong> e <strong>NX bit</strong>.
              </p>
            </div>

            {/* Shared Libraries */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-300">SHARED LIBS / DLLs (ntdll.dll / libc.so)</span>
                <span className="text-[10px] text-slate-500">{getBaseAddr(0x40000)} [R-X]</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Bibliotecas compartilhadas mapeadas pelo sistema operacional na memória virtual.
              </p>
            </div>

            {/* Heap */}
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300">HEAP / ALOCAÇÃO DINÂMICA (Cresce para cima ↑)</span>
                <span className="text-[10px] text-amber-400">{getBaseAddr(0x20000)} [RW{isDepEnabled ? '-' : 'X'}]</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Memória alocada via <code>malloc()</code> ou <code>HeapAlloc()</code>. Sujeita a vulnerabilidades de Use-After-Free e Heap Spraying.
              </p>
            </div>

            {/* Data / BSS */}
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">.DATA & .BSS (Variáveis Globais e Estáticas)</span>
                <span className="text-[10px] text-slate-500">{getBaseAddr(0x10000)} [RW-]</span>
              </div>
            </div>

            {/* Text / Code */}
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300">.TEXT / CÓDIGO EXECUTÁVEL</span>
                <span className="text-[10px] text-emerald-400">{getBaseAddr(0x00000)} [R-X]</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Instruções puras do programa. O SO marca esta seção como estritamente de Leitura e Execução (proíbe escrita direta para evitar auto-modificação de código).
              </p>
            </div>
          </div>
        </div>

        {/* Laboratório de Teste de Exploração & DEP Bypass */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Simulador de Teste de Injeção de Código (DEP/NX Test)
            </h3>
            <p className="text-xs text-slate-400">
              Teste o que acontece quando um atacante tenta injetar instruções na pilha ou heap com as proteções ligadas ou desligadas.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
              <span className="text-slate-500 block uppercase">Payload Simulador:</span>
              <code className="text-amber-300 break-all">
                \x90\x90\x90\x90\x31\xc0\x50\x68\x2f\x2f\x73\x68\x68\x2f\x62\x69\x6e\x89\xe3\x50\x53\x89\xe1\xb0\x0b\xcd\x80
              </code>
              <span className="text-[10px] text-slate-500 block">NOP Sled + Execve Shellcode</span>
            </div>

            <button
              onClick={handleSimulateShellcodeInjection}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Injetar e Executar Payload na Stack</span>
            </button>

            {simulationResult && (
              <div className={`p-4 rounded-xl border text-xs font-mono whitespace-pre-wrap leading-relaxed ${
                isDepEnabled
                  ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300 animate-pulse'
              }`}>
                {simulationResult}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
