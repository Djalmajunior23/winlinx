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
  Activity
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'modules' 
  | 'processes'
  | 'anatomy'
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  completedTasksCount,
  totalTasksCount,
  flagsFoundCount,
  activeAlertsCount = 0
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
                  PRO
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
              onClick={() => setActiveTab('processes')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'processes'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Processos do SO</span>
            </button>

            <button
              onClick={() => setActiveTab('anatomy')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'anatomy'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Anatomia & Recursos</span>
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
              <span>Labs Práticos</span>
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
              onClick={() => setActiveTab('syscalls')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'syscalls'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Syscalls</span>
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

          {/* Gamificação / Progresso do Aluno */}
          <div className="flex items-center space-x-2.5">
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
