import React, { useState } from 'react';
import { 
  Cpu, 
  FileCode, 
  Terminal, 
  Layers, 
  Binary, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle, 
  Search,
  Code2,
  ArrowRight
} from 'lucide-react';
import { OSType } from '../types/simulator';

interface BinaryFormat {
  id: string;
  name: string;
  os: OSType;
  magic: string;
  architecture: string;
  sections: {
    name: string;
    virtualAddress: string;
    virtualSize: string;
    rawSize: string;
    characteristics: string;
    entropy: number; // 0 a 8.0 (> 7.2 geralmente compactado/criptografado)
  }[];
  imports: {
    library: string;
    functions: string[];
    riskScore: 'CRÍTICA' | 'MÉDIA' | 'BAIXA';
  }[];
  assemblySnippet: {
    address: string;
    opcode: string;
    instruction: string;
    annotation: string;
  }[];
}

const BINARY_CATALOG: BinaryFormat[] = [
  {
    id: 'bin-pe-implant',
    name: 'agent_implant.exe (Windows PE32+)',
    os: 'windows',
    magic: 'MZ (0x4D 0x5A) -> PE Signature (0x50 0x45 0x00 0x00)',
    architecture: 'x86_64 (AMD64)',
    sections: [
      { name: '.text', virtualAddress: '0x00001000', virtualSize: '0x0001A400', rawSize: '0x0001A800', characteristics: 'IMAGE_SCN_MEM_EXECUTE | IMAGE_SCN_MEM_READ', entropy: 6.4 },
      { name: '.rdata', virtualAddress: '0x0001C000', virtualSize: '0x00008200', rawSize: '0x00008400', characteristics: 'IMAGE_SCN_MEM_READ', entropy: 4.8 },
      { name: '.data', virtualAddress: '0x00025000', virtualSize: '0x00003100', rawSize: '0x00002000', characteristics: 'IMAGE_SCN_MEM_READ | IMAGE_SCN_MEM_WRITE', entropy: 3.2 },
      { name: '.upx1', virtualAddress: '0x00029000', virtualSize: '0x00045000', rawSize: '0x00045000', characteristics: 'IMAGE_SCN_MEM_EXECUTE | IMAGE_SCN_MEM_WRITE', entropy: 7.85 }
    ],
    imports: [
      { library: 'KERNEL32.dll', functions: ['VirtualAllocEx', 'WriteProcessMemory', 'CreateRemoteThread', 'IsDebuggerPresent'], riskScore: 'CRÍTICA' },
      { library: 'ADVAPI32.dll', functions: ['OpenProcessToken', 'LookupPrivilegeValueW', 'AdjustTokenPrivileges'], riskScore: 'CRÍTICA' },
      { library: 'WS2_32.dll', functions: ['WSAStartup', 'connect', 'send', 'recv'], riskScore: 'MÉDIA' }
    ],
    assemblySnippet: [
      { address: '0x140001000', opcode: '48 83 EC 28', instruction: 'sub rsp, 28h', annotation: 'Alocação de Shadow Space na Stack x64' },
      { address: '0x140001004', opcode: '65 48 8B 04 25 60 00 00 00', instruction: 'mov rax, gs:[60h]', annotation: 'Acesso direto ao PEB (Process Environment Block)!' },
      { address: '0x14000100D', opcode: '48 8B 40 18', instruction: 'mov rax, [rax+18h]', annotation: 'Lê PEB->Ldr para enumeração manual de módulos DLL' },
      { address: '0x140001011', opcode: '48 8B 70 20', instruction: 'mov rsi, [rax+20h]', annotation: 'Acesso a InMemoryOrderModuleList (Evasão de IAT)' },
      { address: '0x140001015', opcode: 'E8 46 0A 00 00', instruction: 'call find_api_by_hash', annotation: 'API Hashing (Mitigação de detecção estática)' }
    ]
  },
  {
    id: 'bin-elf-dropper',
    name: 'dropper.elf (Linux ELF64)',
    os: 'linux',
    magic: '0x7F 0x45 0x4C 0x46 (\\x7fELF)',
    architecture: 'x86_64 (System V AMD64 ABI)',
    sections: [
      { name: '.text', virtualAddress: '0x00401000', virtualSize: '0x00004200', rawSize: '0x00004200', characteristics: 'SHF_ALLOC | SHF_EXECINSTR (R-X)', entropy: 6.1 },
      { name: '.rodata', virtualAddress: '0x00406000', virtualSize: '0x00001500', rawSize: '0x00001500', characteristics: 'SHF_ALLOC (R)', entropy: 4.5 },
      { name: '.got.plt', virtualAddress: '0x00408000', virtualSize: '0x00000300', rawSize: '0x00000300', characteristics: 'SHF_WRITE | SHF_ALLOC (RW)', entropy: 2.1 },
      { name: '.bss', virtualAddress: '0x00408300', virtualSize: '0x00000800', rawSize: '0x00000000', characteristics: 'SHF_WRITE | SHF_ALLOC (RW - Uninitialized)', entropy: 0.0 }
    ],
    imports: [
      { library: 'libc.so.6', functions: ['ptrace', 'mmap', 'mprotect', 'fork', 'execve'], riskScore: 'CRÍTICA' },
      { library: 'libpthread.so.0', functions: ['pthread_create'], riskScore: 'BAIXA' }
    ],
    assemblySnippet: [
      { address: '0x00401020', opcode: 'bf 00 00 00 00', instruction: 'mov edi, 0', annotation: 'Argumento 1 para ptrace: PTRACE_TRACEME' },
      { address: '0x00401025', opcode: '31 f6', instruction: 'xor esi, esi', annotation: 'pid = 0' },
      { address: '0x00401027', opcode: 'b8 65 00 00 00', instruction: 'mov eax, 101', annotation: 'Syscall número 101 (sys_ptrace)' },
      { address: '0x0040102C', opcode: '0f 05', instruction: 'syscall', annotation: 'Transição Ring 3 -> Ring 0 para detecção de GDB' },
      { address: '0x0040102E', opcode: '83 f8 ff', instruction: 'cmp eax, -1', annotation: 'Se ptrace falhar, aborta (Anti-Debugging detectado)' }
    ]
  }
];

export const BinaryReverseEngineeringView: React.FC = () => {
  const [selectedBinary, setSelectedBinary] = useState<BinaryFormat>(BINARY_CATALOG[0]);
  const [activeSubTab, setActiveSubTab] = useState<'headers' | 'imports' | 'disasm'>('disasm');
  const [flagUnlocked, setFlagUnlocked] = useState<boolean>(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Engenharia Reversa & Descompilação (PE vs ELF)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-950 text-blue-300 border border-blue-800">
                  GHIDRA / IDA PRO LITE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspeção estática de cabeçalhos PE/ELF, análise de entropia de seções (UPX packing), IAT/GOT-PLT e desmontagem x86_64.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {BINARY_CATALOG.map(bin => (
              <button
                key={bin.id}
                onClick={() => setSelectedBinary(bin)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedBinary.id === bin.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {bin.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navegação entre seções da engenharia reversa */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('disasm')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'disasm' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Desmontador Assembly x86_64</span>
        </button>

        <button
          onClick={() => setActiveSubTab('headers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'headers' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Seções & Entropia (Packing Check)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('imports')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === 'imports' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Tabela de Importações (IAT / GOT)</span>
        </button>
      </div>

      {/* Conteúdo da Sub-Aba: Assembly Disassembly */}
      {activeSubTab === 'disasm' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-200 font-mono">Disassembly de {selectedBinary.name}</span>
              <span className="text-[11px] text-slate-500 ml-2">EntryPoint: {selectedBinary.assemblySnippet[0].address}</span>
            </div>
            <button
              onClick={() => setFlagUnlocked(true)}
              className="px-2.5 py-1 rounded bg-blue-950 hover:bg-blue-900 border border-blue-800 text-blue-300 text-xs font-mono transition cursor-pointer"
            >
              Auditar Fluxo de Controle
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80 pb-2">
                  <th className="py-2 px-3">Endereço</th>
                  <th className="py-2 px-3">Opcode Hex</th>
                  <th className="py-2 px-3">Instrução x86_64</th>
                  <th className="py-2 px-3">Comentário Forense</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {selectedBinary.assemblySnippet.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition">
                    <td className="py-2 px-3 text-cyan-400 select-all">{line.address}</td>
                    <td className="py-2 px-3 text-slate-500">{line.opcode}</td>
                    <td className="py-2 px-3 text-amber-300 font-bold">{line.instruction}</td>
                    <td className="py-2 px-3 text-slate-400 flex items-center space-x-1.5">
                      <span className="text-purple-400">#</span>
                      <span className={line.annotation.includes('Anti-Debugging') || line.annotation.includes('PEB') ? 'text-rose-400 font-semibold' : ''}>
                        {line.annotation}
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
                <span>Análise de fluxo estático concluída. Identificada rotina de evasão de debugger via PEB/ptrace!</span>
              </div>
              <div className="px-2.5 py-1 bg-blue-900/80 border border-blue-700 text-blue-200 text-xs font-mono font-bold rounded">
                FLAG&#123;WINLINX_REVERSE_ENGINEERING_DISASM_2026&#125;
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo da Sub-Aba: Seções & Entropia */}
      {activeSubTab === 'headers' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="text-xs text-slate-400">
            Assinatura Magic do Cabeçalho: <span className="font-mono text-cyan-400 font-bold">{selectedBinary.magic}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 pb-2">
                  <th className="py-2 px-3">Seção</th>
                  <th className="py-2 px-3">Endereço Virtual</th>
                  <th className="py-2 px-3">Tamanho Virtual</th>
                  <th className="py-2 px-3">Tamanho Raw</th>
                  <th className="py-2 px-3">Entropia (0-8)</th>
                  <th className="py-2 px-3">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {selectedBinary.sections.map((sec, idx) => {
                  const isHighEntropy = sec.entropy > 7.0;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-bold text-slate-200">{sec.name}</td>
                      <td className="py-2 px-3 text-slate-400">{sec.virtualAddress}</td>
                      <td className="py-2 px-3 text-slate-400">{sec.virtualSize}</td>
                      <td className="py-2 px-3 text-slate-400">{sec.rawSize}</td>
                      <td className="py-2 px-3">
                        <div className="flex items-center space-x-2">
                          <span className={`font-bold ${isHighEntropy ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {sec.entropy.toFixed(2)}
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${isHighEntropy ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${(sec.entropy / 8) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        {isHighEntropy ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                            PACKED / ENCRYPTED (UPX)
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            STANDARD
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conteúdo da Sub-Aba: IAT / GOT Imports */}
      {activeSubTab === 'imports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedBinary.imports.map((imp, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 font-mono">{imp.library}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  imp.riskScore === 'CRÍTICA' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}>
                  Risco: {imp.riskScore}
                </span>
              </div>
              <ul className="mt-3 space-y-1 font-mono text-xs">
                {imp.functions.map((fn, fIdx) => (
                  <li key={fIdx} className="text-slate-300 flex items-center space-x-2">
                    <ArrowRight className="w-3 h-3 text-cyan-400" />
                    <span className={fn.includes('Alloc') || fn.includes('ptrace') || fn.includes('WriteProcess') ? 'text-rose-300 font-semibold' : ''}>
                      {fn}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
