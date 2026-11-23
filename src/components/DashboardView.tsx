import React from 'react';
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
  Play
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

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onSelectLab,
  completedTasks,
  flagsFound
}) => {
  const totalTasks = PRACTICAL_LABS.reduce((acc, l) => acc + l.tasks.length, 0);
  const completedCount = completedTasks.size;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>Especialização em Cibersegurança • Módulo de Sistemas Operacionais</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-tight">
            WinLinx: O Simulador Prático de SOs (Código Aberto vs Fechado)
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Aprenda a arquitetura interna do <strong className="text-emerald-400">GNU/Linux</strong> e do <strong className="text-blue-400">Microsoft Windows</strong> através da prática realista. Investigue privilégios, controle de acesso (POSIX vs DACL), telemetria e hunting de anomalias em um ambiente seguro de simulação.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setActiveTab('labs')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Iniciar Laboratórios Práticos</span>
            </button>

            <button
              onClick={() => setActiveTab('comparator')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center space-x-2 transition"
            >
              <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
              <span>Comparador Linux vs Windows</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas e Progresso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{progressPercent}%</span>
            <span className="text-xs text-slate-400 block">Progresso nas Tarefas</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
            <Flame className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{flagsFound.length}</span>
            <span className="text-xs text-slate-400 block">Flags de Segurança</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <Code className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{CURRICULUM_MODULES.length}</span>
            <span className="text-xs text-slate-400 block">Módulos de Ensino</span>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-100">{PRACTICAL_LABS.length}</span>
            <span className="text-xs text-slate-400 block">Laboratórios Práticos</span>
          </div>
        </div>
      </div>

      {/* Grid: Código Aberto vs Código Fechado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linux Box */}
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-emerald-900/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-lg font-bold text-emerald-400">Linux (Código Aberto)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              POSIX / Monolítico
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            No Linux, a transparência total permite auditar chamadas de sistema, recompilar o kernel com hardening estrito e usufruir de ferramentas consagradas de cibersegurança como Kali, Debian e Ubuntu Server.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Modelo de Permissões:</span>
              <strong className="text-slate-200">POSIX UGO & SUID/SGID</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Gerenciador de Serviços:</span>
              <strong className="text-slate-200">systemd (.service) & cron</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Logs de Segurança:</span>
              <strong className="text-slate-200">/var/log/auth.log & auditd</strong>
            </div>
          </div>
        </div>

        {/* Windows Box */}
        <div className="bg-gradient-to-b from-slate-900/80 to-slate-950 border border-blue-900/50 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h3 className="text-lg font-bold text-blue-400">Windows (Código Fechado)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
              WinAPI / Híbrido
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Dominante nos ambientes corporativos, o ecossistema Windows exige domínio profundo de listas DACL/SACL no NTFS, tokens de processo, chaves de Registro e análise de logs no formato binário .evtx.
          </p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Modelo de Permissões:</span>
              <strong className="text-slate-200">NTFS DACL / SACL & MIC</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Gerenciador de Serviços:</span>
              <strong className="text-slate-200">SCM (services.exe) & Task Scheduler</strong>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Logs de Segurança:</span>
              <strong className="text-slate-200">Security.evtx (Event 4624, 4625)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Laboratórios em Destaque */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            Laboratórios Práticos da Especialização
          </h2>
          <button
            onClick={() => setActiveTab('labs')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition"
          >
            Ver todos ({PRACTICAL_LABS.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRACTICAL_LABS.map(lab => {
            const completedCount = lab.tasks.filter(t => completedTasks.has(t.id)).length;
            const isDone = completedCount === lab.tasks.length;

            return (
              <div
                key={lab.id}
                className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {lab.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lab.durationMinutes} min
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">
                    {lab.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {lab.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {completedCount}/{lab.tasks.length} tarefas
                  </span>

                  <button
                    onClick={() => {
                      onSelectLab(lab.id);
                      setActiveTab('labs');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isDone
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                        : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20'
                    }`}
                  >
                    {isDone ? 'Concluído' : 'Iniciar Lab'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
