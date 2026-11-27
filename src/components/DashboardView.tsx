import React, { useState } from 'react';
import { 
  Shield, 
  Terminal, 
  BookOpen, 
  ArrowLeftRight, 
  Award, 
  Flame, 
  CheckCircle2, 
  Lock, 
  Code, 
  Cpu, 
  FolderGit2,
  Play,
  Layers,
  Activity,
  FolderTree,
  Bug,
  Network,
  FileSearch,
  Crosshair,
  ShieldAlert,
  ShieldCheck,
  Bot,
  HardDrive,
  Globe,
  Radio,
  FileCode,
  Box,
  Binary,
  Cloud,
  Key
} from 'lucide-react';
import { PRACTICAL_LABS } from '../data/labs';
import { CURRICULUM_MODULES } from '../data/modules';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onSelectLab: (labId: string) => void;
  completedTasks: Set<string>;
  flagsFound: string[];
}

interface CapabilityCard {
  id: ActiveTab;
  title: string;
  category: 'Arquitetura de SO' | 'Ciberdefesa & SOC' | 'Engenharia Reversa & Ameaças' | 'Cloud & Sistemas Especiais';
  description: string;
  badge: string;
  icon: any;
  accentColor: string;
}

const CAPABILITIES_CATALOG: CapabilityCard[] = [
  // Categoria 1: Arquitetura de SO & Baixo Nível
  {
    id: 'kernel',
    title: 'Anatomia do Kernel',
    category: 'Arquitetura de SO',
    description: 'Ring 3 vs Ring 0, MMU, transição de Syscalls no Linux Monolítico vs Windows NT Híbrido.',
    badge: 'RING 0 ARCHITECTURE',
    icon: Layers,
    accentColor: 'from-purple-500/20 to-purple-950/40 text-purple-400 border-purple-500/30'
  },
  {
    id: 'processes',
    title: 'Processos & Árvore Hierárquica',
    category: 'Arquitetura de SO',
    description: 'systemd/kthreadd vs smss/csrss/lsass, detecção de Masquerading e injeções.',
    badge: 'PSTREE / TASKLIST',
    icon: Activity,
    accentColor: 'from-emerald-500/20 to-emerald-950/40 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'memory',
    title: 'Memória Virtual & ASLR/DEP',
    category: 'Arquitetura de SO',
    description: 'VASP, Stack, Heap, W^X violations e bypass de randomização de memória.',
    badge: 'VIRTUAL MEMORY',
    icon: Cpu,
    accentColor: 'from-cyan-500/20 to-cyan-950/40 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'filesystem',
    title: 'Sistemas de Arquivos & Permissões',
    category: 'Arquitetura de SO',
    description: 'ext4 Inodes, POSIX octal, SUID vs NTFS Master File Table ($MFT), DACLs e Alternate Data Streams.',
    badge: 'POSIX VS NTFS',
    icon: FolderTree,
    accentColor: 'from-amber-500/20 to-amber-950/40 text-amber-400 border-amber-500/30'
  },
  {
    id: 'ipc',
    title: 'Comunicação Inter-Processos (IPC)',
    category: 'Arquitetura de SO',
    description: 'Pipes anônimos/nomeados (mkfifo), Unix Domain Sockets vs Windows Named Pipes (\\.\\pipe\\).',
    badge: 'IPC & NAMED PIPES',
    icon: Network,
    accentColor: 'from-indigo-500/20 to-indigo-950/40 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'drivers',
    title: 'Drivers de Kernel & BYOVD',
    category: 'Arquitetura de SO',
    description: 'Módulos Linux LKMs (lsmod/rmmod) e drivers .sys com exploração BYOVD (CVE-2018-19320).',
    badge: 'RING 0 DRIVERS',
    icon: Cpu,
    accentColor: 'from-cyan-500/20 to-cyan-950/40 text-cyan-400 border-cyan-500/30'
  },

  // Categoria 2: Ciberdefesa, EDR & SOC
  {
    id: 'security-audit',
    title: 'Scanner & Auditoria de Vulnerabilidades',
    category: 'Ciberdefesa & SOC',
    description: 'Auditoria automatizada de postura de segurança de SO, detecção de SUID e Unquoted Services.',
    badge: 'HARDENING 0-100%',
    icon: Bug,
    accentColor: 'from-rose-500/20 to-rose-950/40 text-rose-400 border-rose-500/30'
  },
  {
    id: 'registry',
    title: 'Windows Registry & RunAsPPL',
    category: 'Ciberdefesa & SOC',
    description: 'Navegação em Hives HKLM, chaves de persistência e proteção do LSASS em modo Protected Process Light.',
    badge: 'REGEDIT & HIVE',
    icon: Lock,
    accentColor: 'from-blue-500/20 to-blue-950/40 text-blue-400 border-blue-500/30'
  },
  {
    id: 'firewall',
    title: 'Firewalls de Host (Netfilter vs WFP)',
    category: 'Ciberdefesa & SOC',
    description: 'Regras de filtragem de pacotes com UFW, iptables e netsh advfirewall com simulador de TCP SYN.',
    badge: 'KERNEL FIREWALL',
    icon: Network,
    accentColor: 'from-teal-500/20 to-teal-950/40 text-teal-400 border-teal-500/30'
  },
  {
    id: 'forensics',
    title: 'Logs Forenses (SIEM & Event Viewer)',
    category: 'Ciberdefesa & SOC',
    description: 'Auditoria em tempo real de Event IDs (4688, 7045, 4672) e Linux auditd / auth.log.',
    badge: 'SIEM & AUDITD',
    icon: FileSearch,
    accentColor: 'from-amber-500/20 to-amber-950/40 text-amber-400 border-amber-500/30'
  },
  {
    id: 'edr',
    title: 'EDR SOC & Telemetria em Tempo Real',
    category: 'Ciberdefesa & SOC',
    description: 'Monitoramento contínuo de alertas MITRE ATT&CK decorrentes de ações disparadas no terminal.',
    badge: 'EDR TELEMETRY',
    icon: ShieldAlert,
    accentColor: 'from-rose-500/20 to-rose-950/40 text-rose-400 border-rose-500/30'
  },
  {
    id: 'soar',
    title: 'Assistente Autônomo SOAR',
    category: 'Ciberdefesa & SOC',
    description: 'Playbooks automatizados de contenção, isolamento de host e aprovações Human-in-the-Loop.',
    badge: 'AUTOMATION & SOAR',
    icon: Bot,
    accentColor: 'from-teal-500/20 to-teal-950/40 text-teal-400 border-teal-500/30'
  },

  // Categoria 3: Engenharia Reversa & Ameaças
  {
    id: 'sandbox',
    title: 'Sandbox Forense & Detonação de Malware',
    category: 'Engenharia Reversa & Ameaças',
    description: 'Detonação contida de malwares reais, evasão de Anti-VM e cálculo de Threat Score (0 a 10).',
    badge: 'CUCKOO / ANY.RUN',
    icon: Box,
    accentColor: 'from-purple-500/20 to-purple-950/40 text-purple-400 border-purple-500/30'
  },
  {
    id: 'reversing',
    title: 'Engenharia Reversa de Binários (PE vs ELF)',
    category: 'Engenharia Reversa & Ameaças',
    description: 'Cabeçalhos MZ/PE e ELF, seções, análise de entropia (packing UPX) e desmontador x86_64.',
    badge: 'GHIDRA / IDA LITE',
    icon: Binary,
    accentColor: 'from-blue-500/20 to-blue-950/40 text-blue-400 border-blue-500/30'
  },
  {
    id: 'mem-forensics',
    title: 'Forense de Memória RAM (Volatility)',
    category: 'Engenharia Reversa & Ameaças',
    description: 'Inspeção de memory.raw com plugins windows.malfind, psscan (DKOM) e linux.check_syscall.',
    badge: 'VOLATILITY 3',
    icon: HardDrive,
    accentColor: 'from-indigo-500/20 to-indigo-950/40 text-indigo-400 border-indigo-500/30'
  },
  {
    id: 'yara-sigma',
    title: 'Threat Hunting (YARA & SIGMA Studio)',
    category: 'Engenharia Reversa & Ameaças',
    description: 'Criação de assinaturas YARA com varredura em VFS/RAM e conversão de regras SIGMA para Splunk/Elastic.',
    badge: 'DETECTION ENG',
    icon: FileCode,
    accentColor: 'from-amber-500/20 to-amber-950/40 text-amber-400 border-amber-500/30'
  },
  {
    id: 'threat-injector',
    title: 'Threat Injector & Centro de Resposta (IR)',
    category: 'Engenharia Reversa & Ameaças',
    description: 'Injeção ativa de Ransomware, Cryptominer e Rootkit com contagem regressiva de triagem.',
    badge: 'LIVE INCIDENT',
    icon: Flame,
    accentColor: 'from-rose-500/20 to-rose-950/40 text-rose-400 border-rose-500/30'
  },
  {
    id: 'adversary',
    title: 'Campanhas APT & Emulação de Adversários',
    category: 'Engenharia Reversa & Ameaças',
    description: 'Emulação passo a passo de ataques da APT29 (Cozy Bear) e LockBit 3.0 via MITRE ATT&CK.',
    badge: 'CALDERA / APT',
    icon: Crosshair,
    accentColor: 'from-rose-500/20 to-rose-950/40 text-rose-400 border-rose-500/30'
  },

  // Categoria 4: Cloud, Rede, Red Team & OT
  {
    id: 'network-pivot',
    title: 'Pivoteamento de Rede & Active Directory',
    category: 'Cloud & Sistemas Especiais',
    description: 'Movimentação lateral entre Workstation, Jump Server e Domain Controller via Kerberos e SSH.',
    badge: 'BLOODHOUND / AD',
    icon: Network,
    accentColor: 'from-emerald-500/20 to-emerald-950/40 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'cloud-k8s',
    title: 'Segurança em Nuvem & Contêineres (K8s)',
    category: 'Cloud & Sistemas Especiais',
    description: 'Container breakout via Docker Socket, privilégios excessivos e extração de credenciais IMDSv1.',
    badge: 'DOCKER & K8S',
    icon: Cloud,
    accentColor: 'from-sky-500/20 to-sky-950/40 text-sky-400 border-sky-500/30'
  },
  {
    id: 'edr-evasion',
    title: 'Evasão de EDR (Direct Syscalls)',
    category: 'Cloud & Sistemas Especiais',
    description: 'Contorno de hooks em user-mode via Hell\'s Gate / Halos Gate e restauração com Unhooking.',
    badge: 'DIRECT SYSCALLS',
    icon: ShieldAlert,
    accentColor: 'from-rose-500/20 to-rose-950/40 text-rose-400 border-rose-500/30'
  },
  {
    id: 'hashcat',
    title: 'Criptoanálise & Quebra de Credenciais',
    category: 'Cloud & Sistemas Especiais',
    description: 'Quebra acelerada de hashes Linux /etc/shadow ($6$), Windows NTLM e Kerberos TGS (Hashcat).',
    badge: 'HASHCAT LITE',
    icon: Key,
    accentColor: 'from-amber-500/20 to-amber-950/40 text-amber-400 border-amber-500/30'
  },
  {
    id: 'threat-intel',
    title: 'Inteligência de Ameaças (MISP CTI)',
    category: 'Cloud & Sistemas Especiais',
    description: 'Feed de IOCs correlacionados, atribuição de grupos estado-nação e exportação de pacotes STIX 2.1.',
    badge: 'MISP / OPENCTI',
    icon: Globe,
    accentColor: 'from-cyan-500/20 to-cyan-950/40 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'ics-ot',
    title: 'Sistemas Industriais & OT (SCADA / Modbus)',
    category: 'Cloud & Sistemas Especiais',
    description: 'Simulação de PLC industrial Siemens, injeção Modbus TCP (Force Single Coil) e binwalk em firmware.',
    badge: 'SCADA & OT',
    icon: Radio,
    accentColor: 'from-orange-500/20 to-orange-950/40 text-orange-400 border-orange-500/30'
  }
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onSelectLab,
  completedTasks,
  flagsFound
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalTasks = PRACTICAL_LABS.reduce((acc, l) => acc + l.tasks.length, 0);
  const completedCount = completedTasks.size;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const categories = ['Todos', 'Arquitetura de SO', 'Ciberdefesa & SOC', 'Engenharia Reversa & Ameaças', 'Cloud & Sistemas Especiais'];

  const filteredCards = CAPABILITIES_CATALOG.filter(card => {
    const matchesCategory = selectedCategory === 'Todos' || card.category === selectedCategory;
    const matchesSearch = card.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          card.badge.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner Central */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>WinLinx Cyber Range • Central Unificada de Treinamento em SO & Ciberdefesa</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            Dashboard de Módulos & Laboratórios WinLinx
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Selecione qualquer módulo abaixo para abrir os simuladores práticos de baixo nível: de arquitetura de kernel e auditoria forense a engenharia reversa, movimentação lateral e evasão de defesas.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab('dual-lab')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Terminal className="w-4 h-4 fill-slate-950" />
              <span>Abrir Dual-Shell (Linux vs Windows)</span>
            </button>

            <button
              onClick={() => setActiveTab('comparator')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Comparador de Comandos</span>
            </button>

            <button
              onClick={() => setActiveTab('lab-builder')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center space-x-2 transition cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4 text-emerald-400" />
              <span>Lab Builder (CTF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{progressPercent}%</span>
            <span className="text-xs text-slate-400 block">Progresso nos Labs</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{flagsFound.length}</span>
            <span className="text-xs text-slate-400 block">Flags Capturadas</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{CAPABILITIES_CATALOG.length}</span>
            <span className="text-xs text-slate-400 block">Módulos Especializados</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{PRACTICAL_LABS.length}</span>
            <span className="text-xs text-slate-400 block">Cenários Práticos</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros & Busca do Dashboard */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Filtrar simuladores e módulos..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>
      </div>

      {/* Grid Central de Cards de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCards.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => setActiveTab(card.id)}
              className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.accentColor} border shadow-inner`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    {card.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {card.title}
                  </h3>
                  <span className="text-[11px] text-cyan-500/80 font-medium block mt-0.5">
                    {card.category}
                  </span>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Acessar Simulador</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
