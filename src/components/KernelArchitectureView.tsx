import React, { useState } from 'react';
import { OSType } from '../types/simulator';
import { 
  Cpu, 
  Layers, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Lock, 
  ArrowDown, 
  ArrowUp, 
  FileCode, 
  Database, 
  Radio, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface KernelBlock {
  id: string;
  name: string;
  ring: 'Ring 3' | 'Transition' | 'Ring 0';
  layer: string;
  description: string;
  securityImpact: string;
  attackSurface: string;
  mitigation: string;
  sourceType: 'Open-Source (GPLv2)' | 'Proprietary (Closed-Source)';
}

const LINUX_KERNEL_BLOCKS: KernelBlock[] = [
  // Ring 3
  {
    id: 'lnx-apps',
    name: 'Aplicações & Shells (bash, sh, nginx, auditd)',
    ring: 'Ring 3',
    layer: 'Espaço de Usuário (User Space)',
    description: 'Processos convencionais sem acesso direto a hardware ou memória protegida. Executam instruções de máquina não privilegiadas.',
    securityImpact: 'Se um processo for comprometido, seu raio de destruição fica contido aos privilégios do seu UID/GID.',
    attackSurface: 'Buffer Overflows em stack/heap, injeção de comandos, sequestro de variáveis de ambiente (LD_PRELOAD).',
    mitigation: 'Compilação com ASLR (/proc/sys/kernel/randomize_va_space), Stack Canaries (-fstack-protector), DEP/NX.',
    sourceType: 'Open-Source (GPLv2)'
  },
  {
    id: 'lnx-glibc',
    name: 'GNU C Library (glibc / musl)',
    ring: 'Ring 3',
    layer: 'Bibliotecas Padrão de Sistema',
    description: 'Camada de abstração que empacota chamadas de sistema POSIX em funções C amigáveis (ex: malloc, printf, open, fork).',
    securityImpact: 'Converte funções de biblioteca em instruções de interrupção ou SYSCALL para transição ao Kernel.',
    attackSurface: 'Vulnerabilidades de Heap (use-after-free, double free), exploração ret2libc contornando DEP.',
    mitigation: 'Hardening de alocadores de memória, glibc heap integrity checks, KASLR.',
    sourceType: 'Open-Source (GPLv2)'
  },
  // Transition
  {
    id: 'lnx-syscall-gate',
    name: 'Interface de Chamadas de Sistema (SYSCALL / sys_enter)',
    ring: 'Transition',
    layer: 'Ponte de Transição de Hardware (Ring 3 -> Ring 0)',
    description: 'Instrução do processador (SYSCALL em x86_64, INT 0x80 em x86) que salva o contexto da CPU e altera o nível de privilégio no registrador MSR_LSTAR.',
    securityImpact: 'Ponto crítico de fronteira: valida argumentos recebidos de ponteiros de usuário antes de transferir ao Kernel.',
    attackSurface: 'Ponteiros de usuário maliciosos passados para o Kernel (User-to-Kernel Pointer Dereference), ataques Meltdown/Spectre.',
    mitigation: 'KPTI (Kernel Page Table Isolation), validação estrita com copy_from_user() e copy_to_user().',
    sourceType: 'Open-Source (GPLv2)'
  },
  // Ring 0
  {
    id: 'lnx-vfs',
    name: 'Virtual File System (VFS)',
    ring: 'Ring 0',
    layer: 'Sub-Kernel: Gerenciamento de Arquivos',
    description: 'Abstração universal no Kernel Linux onde "tudo é arquivo" (ext4, btrfs, /proc, /sys, pipes, sockets).',
    securityImpact: 'Aplica permissões POSIX (rwx, SUID, SGID, Sticky Bit), ACLs e Linux Capabilities antes de delegar aos drivers.',
    attackSurface: 'Escalação via binários SUID mal configurados, race conditions com symlinks (/tmp).',
    mitigation: 'Montagem de partições temporárias com noexec, nosuid, nodev.',
    sourceType: 'Open-Source (GPLv2)'
  },
  {
    id: 'lnx-cfs',
    name: 'Completely Fair Scheduler (CFS) & Process Core',
    ring: 'Ring 0',
    layer: 'Sub-Kernel: Escalonamento & Ciclo de Vida',
    description: 'Algoritmo de escalonamento baseado em árvores Red-Black que gerencia prioridades de execução (nice) e threads no processador.',
    securityImpact: 'Garante isolamento temporal e gerenciamento de namespaces de processo (PID Namespaces em contêineres).',
    attackSurface: 'Ataques de negação de serviço (fork bomb), manipulação de structs de processo via exploits de kernel.',
    mitigation: 'Limites de processo via cgroups (pids.max) e pam_limits.',
    sourceType: 'Open-Source (GPLv2)'
  },
  {
    id: 'lnx-mmu',
    name: 'Gerenciador de Memória Virtual (MMU & Paging)',
    ring: 'Ring 0',
    layer: 'Sub-Kernel: Gerenciamento de Memória Privilegiada',
    description: 'Controla a tabela de páginas de 4 níveis em x86_64, traduzindo endereços virtuais de processos para memória física na RAM.',
    securityImpact: 'Implementa proteção de páginas (Read/Write/Execute), isolando a memória de cada processo e do Kernel.',
    attackSurface: 'Kernel Null Pointer Dereference, exploração de corrupção de memória no Kernel.',
    mitigation: 'KASLR (randomização da base do Kernel), SMEP (Supervisor Mode Execution Prevention), SMAP.',
    sourceType: 'Open-Source (GPLv2)'
  },
  {
    id: 'lnx-netfilter',
    name: 'Pilha de Rede & Hooks Netfilter',
    ring: 'Ring 0',
    layer: 'Sub-Kernel: Filtragem de Pacotes de Rede',
    description: 'Mecanismo interno do Kernel Linux para inspeção e controle de pacotes IP nos estágios PREROUTING, INPUT, FORWARD, OUTPUT e POSTROUTING.',
    securityImpact: 'Base do iptables, nftables e UFW para defesa contra acessos não autorizados e C2.',
    attackSurface: 'Pacotes TCP malformados (IP fragmentation attacks, buffer overflow em drivers de rede).',
    mitigation: 'Regras restritivas de firewall de host com política padrão DROP, TCP SYN Cookies.',
    sourceType: 'Open-Source (GPLv2)'
  },
  {
    id: 'lnx-lkm',
    name: 'Módulos Carregáveis de Kernel (LKMs / Drivers)',
    ring: 'Ring 0',
    layer: 'Sub-Kernel: Extensibilidade e Drivers de Dispositivo',
    description: 'Código que é inserido dinamicamente no Kernel em execução (insmod / modprobe) compartilhando o espaço irrestrito de memória Ring 0.',
    securityImpact: 'Arquitetura Monolítica: se um módulo falhar ou contiver backdoor, o Kernel inteiro é comprometido.',
    attackSurface: 'Rootkits de Kernel (LKM Rootkits que ocultam processos alterando sys_call_table ou listas encadeadas).',
    mitigation: 'Assinatura obrigatória de módulos de Kernel (CONFIG_MODULE_SIG_FORCE), Secure Boot UEFI.',
    sourceType: 'Open-Source (GPLv2)'
  }
];

const WINDOWS_KERNEL_BLOCKS: KernelBlock[] = [
  // Ring 3
  {
    id: 'win-apps',
    name: 'Aplicações de Usuário (cmd, powershell, explorer.exe)',
    ring: 'Ring 3',
    layer: 'Espaço de Usuário (User Mode)',
    description: 'Programas executando sob contexto de credenciais locais ou de domínio, limitados pelo mecanismo de integridade (UAC).',
    securityImpact: 'Executam com Integrity Level Medium ou Low, exigindo elevação consentida para alterar arquivos do sistema.',
    attackSurface: 'Injeção de DLLs, sequestro de caminhos não cotados (Unquoted Service Path), exploração de permissões fracas.',
    mitigation: 'UAC no nível máximo, AppLocker / WDAC, DEP e ASLR forçados pelo Exploit Guard.',
    sourceType: 'Proprietary (Closed-Source)'
  },
  {
    id: 'win-subsystems',
    name: 'Subsistemas de Ambiente & DLLs (kernel32, user32, csrss.exe, lsass.exe)',
    ring: 'Ring 3',
    layer: 'Subsistema Win32 & Serviços de Segurança',
    description: 'Camada de emulação Win32 que traduz APIs documentadas para chamadas internas não documentadas na NTDLL.DLL.',
    securityImpact: 'O lsass.exe gerencia tokens de segurança, autenticação NTLM e tickets Kerberos.',
    attackSurface: 'Dumping de senhas de memória do lsass.exe com Mimikatz, impersonação de tokens com SeImpersonatePrivilege.',
    mitigation: 'Ativação de RunAsPPL (Protected Process Light) e Credential Guard (VBS - Virtualization-Based Security).',
    sourceType: 'Proprietary (Closed-Source)'
  },
  {
    id: 'win-ntdll',
    name: 'NTDLL.DLL (Native System Service Stubs)',
    ring: 'Ring 3',
    layer: 'Interface de Sistema Nativo do Windows',
    description: 'A biblioteca mais baixa do espaço de usuário do Windows. Contém as rotinas Nt* e Zw* que executam a instrução de transição SYSENTER/SYSCALL.',
    securityImpact: 'Ponto final do User-Mode antes da troca de privilégio para o Kernel NT.',
    attackSurface: 'API Hooking em nível de usuário por malwares e EDRs que monitoram chamadas nativas.',
    mitigation: 'Chamadas diretas de Syscalls (Direct Syscalls / Hell\'s Gate) para contornar hooks de EDR.',
    sourceType: 'Proprietary (Closed-Source)'
  },
  // Transition
  {
    id: 'win-gate',
    name: 'KiFastSystemCall / SYSENTER & SSDT (System Service Dispatch Table)',
    ring: 'Transition',
    layer: 'Ponte de Transição de Hardware (Ring 3 -> Ring 0)',
    description: 'Mecanismo de hardware que transfere a execução para a rotina KiSystemService no ntoskrnl.exe, consultando a tabela SSDT pelo número da Syscall.',
    securityImpact: 'Valida se o processo chamador possui privilégios de acesso e copia parâmetros de Ring 3 para buffers de Kernel seguros.',
    attackSurface: 'Histórico de SSDT Hooking (modificação de ponteiros de chamada por rootkits antigos).',
    mitigation: 'PatchGuard (Kernel Patch Protection - KPP) em processadores x64 que gera Blue Screen (BSOD) se a SSDT for alterada.',
    sourceType: 'Proprietary (Closed-Source)'
  },
  // Ring 0
  {
    id: 'win-executive',
    name: 'Windows Executive (ntoskrnl.exe)',
    ring: 'Ring 0',
    layer: 'Kernel Híbrido: Serviços Executivos de Alto Nível',
    description: 'Conjunto de subsistemas que implementam o modelo de objetos do Windows: Object Manager, Process and Thread Manager, Memory Manager (Mm) e Security Reference Monitor (SRM).',
    securityImpact: 'O SRM (Security Reference Monitor) avalia toda tentativa de acesso a objetos comparando a DACL do objeto com o Token do usuário.',
    attackSurface: 'Vulnerabilidades de corrupção de memória em serviços executivos, manipulação de tokens com privilégios.',
    mitigation: 'Driver Signature Enforcement (DSE), SMEP, SMAP, KASLR.',
    sourceType: 'Proprietary (Closed-Source)'
  },
  {
    id: 'win-microkernel',
    name: 'Microkernel NT (ntoskrnl.exe - Núcleo de Baixo Nível)',
    ring: 'Ring 0',
    layer: 'Kernel Híbrido: Escalonamento de Threads & Sincronização',
    description: 'Núcleo minimalista responsável exclusivamente pelo escalonamento de threads, interrupções (IRQLs), DPCs (Deferred Procedure Calls) e sincronização multiprocessador.',
    securityImpact: 'Não pode ser paginado para o disco; executa no nível mais crítico e determinístico do processador.',
    attackSurface: 'Ataques de tempo e interrupção, escalação através de exploits de hardware da CPU.',
    mitigation: 'HVCI (Hypervisor-Protected Code Integrity) isolando páginas de código do Kernel via Virtual Secure Mode (VSM).',
    sourceType: 'Proprietary (Closed-Source)'
  },
  {
    id: 'win-win32k',
    name: 'Win32k.sys (Subsistema Gráfico em Modo Kernel)',
    ring: 'Ring 0',
    layer: 'Kernel Híbrido: Gerenciador de Janelas & GDI',
    description: 'Componente legado movido do Ring 3 para o Ring 0 no Windows NT 4.0 por motivos de desempenho para gerenciar janelas e renderização gráfica.',
    securityImpact: 'Historicamente o componente com maior superfície de ataque e CVEs de escalação de privilégios locais (LPE) no Windows.',
    attackSurface: 'Use-After-Free e Race Conditions em funções gráficas (CreateWindowEx, SetWindowLong).',
    mitigation: 'AppContainer e políticas de bloqueio de Win32k Syscalls em processos restritos (Edge, Chrome Sandbox).',
    sourceType: 'Proprietary (Closed-Source)'
  },
  {
    id: 'win-hal',
    name: 'Hardware Abstraction Layer (HAL - hal.dll)',
    ring: 'Ring 0',
    layer: 'Kernel Híbrido: Abstração de Hardware Físico',
    description: 'Biblioteca proprietária que esconde detalhes específicos de chipsets, placas-mãe, APIC e temporizadores do restante do Kernel NT.',
    securityImpact: 'Permite que o mesmo executável ntoskrnl.exe rode em diferentes arquiteturas sem recompilação.',
    attackSurface: 'Firmware Rootkits e manipulação de registradores de controle da placa-mãe.',
    mitigation: 'Secured-Core PC, Intel Boot Guard, TPM 2.0 e UEFI Secure Boot.',
    sourceType: 'Proprietary (Closed-Source)'
  }
];

export const KernelArchitectureView: React.FC = () => {
  const [selectedOS, setSelectedOS] = useState<OSType>('linux');
  const [activeBlockId, setActiveBlockId] = useState<string>(
    selectedOS === 'linux' ? 'lnx-apps' : 'win-apps'
  );

  const blocks = selectedOS === 'linux' ? LINUX_KERNEL_BLOCKS : WINDOWS_KERNEL_BLOCKS;
  const currentBlock = blocks.find(b => b.id === activeBlockId) || blocks[0];

  const handleSelectOS = (os: OSType) => {
    setSelectedOS(os);
    setActiveBlockId(os === 'linux' ? 'lnx-apps' : 'win-apps');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header com Seletor de Arquitetura */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Kernel Internals & Hardware Privilege Rings</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Anatomia Comparativa de Kernel: Monolítico vs Híbrido NT
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Explore como as chamadas de sistema cruzam a fronteira de hardware entre o <span className="text-amber-400 font-mono">Ring 3 (Modo Usuário)</span> e o <span className="text-red-400 font-mono">Ring 0 (Modo Kernel Privilegiado)</span>, analisando as superfícies de ataque e as defesas modernas.
            </p>
          </div>

          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => handleSelectOS('linux')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedOS === 'linux'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Linux (Monolítico / Open-Source)</span>
            </button>
            <button
              onClick={() => handleSelectOS('windows')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedOS === 'windows'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Windows NT (Híbrido / Proprietário)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Pilha de Arquitetura Interativa vs Inspetor de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pilha de Camadas do SO (Esquerda) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-slate-300">Pilha de Execução de Baixo Nível</span>
            </div>
            <span className="font-mono text-cyan-400">Clique em qualquer bloco para inspecionar</span>
          </div>

          {/* Grupo Ring 3: Espaço de Usuário */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/60">Ring 3</span>
                <span>Espaço de Usuário (User-Mode - Sem Acesso Direto a Hardware)</span>
              </div>
              <span className="text-[10px] lowercase text-amber-500 font-mono">CPL = 3</span>
            </div>

            {blocks
              .filter(b => b.ring === 'Ring 3')
              .map(block => (
                <button
                  key={block.id}
                  onClick={() => setActiveBlockId(block.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    activeBlockId === block.id
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-amber-700/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <FileCode className={`w-4 h-4 ${activeBlockId === block.id ? 'text-amber-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs">{block.name}</div>
                      <div className="text-[11px] text-slate-400">{block.layer}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
          </div>

          {/* Gateway de Transição de Hardware */}
          <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Transição de Hardware & Syscall Dispatcher</span>
              </div>
              <div className="flex items-center space-x-1 text-[10px] text-purple-400 font-mono">
                <ArrowDown className="w-3 h-3 animate-bounce" />
                <span>Ring 3 ➔ Ring 0</span>
              </div>
            </div>

            {blocks
              .filter(b => b.ring === 'Transition')
              .map(block => (
                <button
                  key={block.id}
                  onClick={() => setActiveBlockId(block.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    activeBlockId === block.id
                      ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-purple-700/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Zap className={`w-4 h-4 ${activeBlockId === block.id ? 'text-purple-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs">{block.name}</div>
                      <div className="text-[11px] text-slate-400">{block.layer}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
          </div>

          {/* Grupo Ring 0: Espaço Privilegiado de Kernel */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-red-400 uppercase tracking-wider mb-1">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-red-900/60 border border-red-700/60">Ring 0</span>
                <span>Espaço de Kernel (Supervisor Mode - Acesso Total à Máquina)</span>
              </div>
              <span className="text-[10px] lowercase text-red-500 font-mono">CPL = 0</span>
            </div>

            {blocks
              .filter(b => b.ring === 'Ring 0')
              .map(block => (
                <button
                  key={block.id}
                  onClick={() => setActiveBlockId(block.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    activeBlockId === block.id
                      ? 'bg-red-500/20 border-red-400 text-white shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-red-700/60 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Cpu className={`w-4 h-4 ${activeBlockId === block.id ? 'text-red-400' : 'text-slate-500'}`} />
                    <div>
                      <div className="font-bold text-xs">{block.name}</div>
                      <div className="text-[11px] text-slate-400">{block.layer}</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
          </div>
        </div>

        {/* Painel do Inspetor Técnico & Cibersegurança (Direita) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl sticky top-24 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                  currentBlock.ring === 'Ring 0' 
                    ? 'bg-red-950 border border-red-800 text-red-400'
                    : currentBlock.ring === 'Ring 3'
                    ? 'bg-amber-950 border border-amber-800 text-amber-400'
                    : 'bg-purple-950 border border-purple-800 text-purple-400'
                }`}>
                  {currentBlock.ring}
                </span>
                <span className="text-slate-400 text-xs font-mono">{currentBlock.sourceType}</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {currentBlock.name}
              </h2>
              <p className="text-xs text-cyan-400 font-mono mt-0.5">{currentBlock.layer}</p>
            </div>

            {/* Descrição Arquitetural */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Papel no Sistema Operacional</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                {currentBlock.description}
              </p>
            </div>

            {/* Impacto em Cibersegurança */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-400 flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Fronteira de Segurança & Isolamento</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-emerald-950/40">
                {currentBlock.securityImpact}
              </p>
            </div>

            {/* Superfície de Ataque */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-red-400 flex items-center space-x-2">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Vetor Ofensivo / Superfície de Ataque</span>
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed bg-red-950/30 p-3 rounded-lg border border-red-900/50 font-mono">
                {currentBlock.attackSurface}
              </p>
            </div>

            {/* Mitigação Recomendada */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-cyan-400 flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Mitigação & Hardening Recomendado</span>
              </div>
              <p className="text-xs text-cyan-200/90 leading-relaxed bg-cyan-950/30 p-3 rounded-lg border border-cyan-900/50">
                {currentBlock.mitigation}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
