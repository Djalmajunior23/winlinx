import React from 'react';
import { 
  Shield, 
  Terminal, 
  BookOpen, 
  ArrowLeftRight, 
  Award, 
  Flame, 
  CheckCircle2, 
  FolderGit2,
  Cpu,
  ShieldAlert,
  Layers,
  Activity,
  Lock,
  Network,
  FileSearch,
  Crosshair,
  ShieldCheck,
  FolderTree,
  Bug,
  Bot,
  Cloud,
  HardDrive
} from 'lucide-react';
import { OperationalPosture } from '../types/simulator';

export type ActiveTab = 
  | 'dashboard' 
  | 'modules' 
  | 'processes'
  | 'anatomy'
  | 'kernel'
  | 'memory'
  | 'filesystem'
  | 'security-audit'
  | 'registry'
  | 'firewall'
  | 'forensics'
  | 'ipc'
  | 'drivers'
  | 'sandbox'
  | 'reversing'
  | 'network-pivot'
  | 'adversary'
  | 'soar'
  | 'mem-forensics'
  | 'yara-sigma'
  | 'cloud-k8s'
  | 'threat-injector'
  | 'lab-builder'
  | 'dual-lab' 
  | 'comparator' 
  | 'labs' 
  | 'certificate' 
  | 'syscalls' 
  | 'edr';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  completedTasksCount: number;
  totalTasksCount: number;
  flagsFoundCount: number;
  activeAlertsCount?: number;
  posture?: OperationalPosture;
  onTogglePosture?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  completedTasksCount,
  totalTasksCount,
  flagsFoundCount,
  activeAlertsCount = 0,
  posture = 'blue-team',
  onTogglePosture
}) => {
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  WinLinx
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-semibold">
                  ULTIMATE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Simulador de SOs (Aberto vs Fechado) & Cibersegurança
              </p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden xl:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('kernel')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'kernel'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Kernel</span>
            </button>

            <button
              onClick={() => setActiveTab('processes')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'processes'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Processos</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'memory'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memória</span>
            </button>

            <button
              onClick={() => setActiveTab('filesystem')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'filesystem'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-amber-400" />
              <span>Sistemas de Arquivos</span>
            </button>

            <button
              onClick={() => setActiveTab('security-audit')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'security-audit'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Bug className="w-3.5 h-3.5 text-rose-400" />
              <span>Auditoria de Vulns</span>
            </button>

            <button
              onClick={() => setActiveTab('registry')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'registry'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Registro</span>
            </button>

            <button
              onClick={() => setActiveTab('firewall')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'firewall'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-teal-400" />
              <span>Firewall</span>
            </button>

            <button
              onClick={() => setActiveTab('forensics')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'forensics'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5 text-amber-400" />
              <span>Logs & SIEM</span>
            </button>

            <button
              onClick={() => setActiveTab('ipc')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'ipc'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span>IPC Pipes</span>
            </button>

            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'drivers'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Drivers/BYOVD</span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'sandbox'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
              <span>Sandbox</span>
            </button>

            <button
              onClick={() => setActiveTab('reversing')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'reversing'
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5 text-blue-400" />
              <span>Reversa (PE/ELF)</span>
            </button>

            <button
              onClick={() => setActiveTab('network-pivot')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'network-pivot'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              <span>AD & Pivot</span>
            </button>

            <button
              onClick={() => setActiveTab('adversary')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'adversary'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-400" />
              <span>Campanhas APT</span>
            </button>

            <button
              onClick={() => setActiveTab('soar')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'soar'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>SOAR Autônomo</span>
            </button>

            <button
              onClick={() => setActiveTab('mem-forensics')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'mem-forensics'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Volatility RAM</span>
            </button>

            <button
              onClick={() => setActiveTab('yara-sigma')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'yara-sigma'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5 text-amber-400" />
              <span>YARA & SIGMA</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud-k8s')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'cloud-k8s'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloud & K8s</span>
            </button>

            <button
              onClick={() => setActiveTab('soar')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'soar'
                  ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>SOAR Autônomo</span>
            </button>

            <button
              onClick={() => setActiveTab('mem-forensics')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'mem-forensics'
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              <span>Volatility RAM</span>
            </button>

            <button
              onClick={() => setActiveTab('yara-sigma')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'yara-sigma'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5 text-amber-400" />
              <span>YARA & SIGMA</span>
            </button>

            <button
              onClick={() => setActiveTab('cloud-k8s')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'cloud-k8s'
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloud & K8s</span>
            </button>

            <button
              onClick={() => setActiveTab('threat-injector')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'threat-injector'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
              <span>Threat Injector</span>
            </button>

            <button
              onClick={() => setActiveTab('lab-builder')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'lab-builder'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lab Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('labs')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'labs'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Labs</span>
            </button>

            <button
              onClick={() => setActiveTab('dual-lab')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'dual-lab'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Dual-Shell</span>
            </button>

            <button
              onClick={() => setActiveTab('comparator')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'comparator'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Comparador</span>
            </button>

            <button
              onClick={() => setActiveTab('edr')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'edr'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>EDR SOC</span>
              {activeAlertsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </nav>

          {/* Gamificação / Postura Operacional / Progresso */}
          <div className="flex items-center space-x-2.5">
            {/* Seletor de Postura Operacional: Red Team vs Blue Team */}
            {onTogglePosture && (
              <button
                onClick={onTogglePosture}
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                  posture === 'blue-team'
                    ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300 shadow-sm'
                    : 'bg-rose-950/60 border-rose-700/80 text-rose-300 shadow-sm'
                }`}
                title="Alternar Postura Operacional (Ataque vs Defesa)"
              >
                {posture === 'blue-team' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Blue Team (Defesa)</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                    <span>Red Team (Ataque)</span>
                  </>
                )}
              </button>
            )}

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{flagsFoundCount} Flags</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{progressPercent}%</span>
            </div>

            <button
              onClick={() => setActiveTab('certificate')}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition"
              title="Certificado & Evidências"
            >
              <Award className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
