import React from 'react';
import { 
  Shield, 
  Terminal, 
  BookOpen, 
  ArrowLeftRight, 
  Award, 
  Flame,
  CheckCircle2,
  FolderGit2
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'modules' | 'dual-lab' | 'comparator' | 'labs' | 'certificate';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  completedTasksCount: number;
  totalTasksCount: number;
  flagsFoundCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  completedTasksCount,
  totalTasksCount,
  flagsFoundCount
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
                  v1.0 OS-SEC
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Simulador de SOs (Aberto vs Fechado) & Cibersegurança
              </p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span>Visão Geral</span>
            </button>

            <button
              onClick={() => setActiveTab('modules')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'modules'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Módulos de SO</span>
            </button>

            <button
              onClick={() => setActiveTab('labs')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'labs'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Labs Práticos</span>
            </button>

            <button
              onClick={() => setActiveTab('comparator')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'comparator'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Comparador Linux vs Win</span>
            </button>

            <button
              onClick={() => setActiveTab('dual-lab')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                activeTab === 'dual-lab'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Dual-Shell Playground</span>
            </button>
          </nav>

          {/* Gamificação / Progresso do Aluno */}
          <div className="flex items-center space-x-3">
            {/* Flags */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-medium">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>{flagsFoundCount} Flags</span>
            </div>

            {/* Progresso de Tarefas */}
            <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{progressPercent}% Concluído</span>
            </div>

            {/* Botão de Certificado / Conquistas */}
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
