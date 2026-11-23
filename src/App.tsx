import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { LabRunnerView } from './components/LabRunnerView';
import { CommandComparator } from './components/CommandComparator';
import { DualTerminalPlayground } from './components/DualTerminalPlayground';
import { CertificateModal } from './components/CertificateModal';
import { PRACTICAL_LABS } from './data/labs';
import { Shield, ExternalLink, Terminal, Flame, BookOpen } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeLabId, setActiveLabId] = useState<string>(PRACTICAL_LABS[0].id);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Progresso do aluno com persistência local
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('winlinx_completed_tasks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [flagsFound, setFlagsFound] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('winlinx_flags');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('winlinx_completed_tasks', JSON.stringify(Array.from(completedTasks)));
    } catch (e) {
      console.error(e);
    }
  }, [completedTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('winlinx_flags', JSON.stringify(flagsFound));
    } catch (e) {
      console.error(e);
    }
  }, [flagsFound]);

  const handleTaskCompleted = (taskId: string, flag?: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    if (flag && !flagsFound.includes(flag)) {
      setFlagsFound(prev => [...prev, flag]);
      showNotification(`🚩 Flag Capturada: ${flag}`);
    } else {
      showNotification('✅ Tarefa do laboratório concluída com sucesso!');
    }
  };

  const handleCaptureFlag = (flag: string) => {
    if (!flagsFound.includes(flag)) {
      setFlagsFound(prev => [...prev, flag]);
      showNotification(`🚩 Flag Capturada no Playground: ${flag}`);
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleSelectLab = (labId: string) => {
    setActiveLabId(labId);
    setActiveTab('labs');
  };

  const totalTasksCount = PRACTICAL_LABS.reduce((acc, l) => acc + l.tasks.length, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/80 px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold text-cyan-300 flex items-center space-x-2 animate-in slide-in-from-bottom duration-300">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
          <span>{notification}</span>
        </div>
      )}

      {/* Barra de Navegação */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          if (tab === 'certificate') {
            setIsCertificateOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        completedTasksCount={completedTasks.size}
        totalTasksCount={totalTasksCount}
        flagsFoundCount={flagsFound.length}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            onSelectLab={handleSelectLab}
            completedTasks={completedTasks}
            flagsFound={flagsFound}
          />
        )}

        {activeTab === 'modules' && (
          <CurriculumView onSelectLab={handleSelectLab} />
        )}

        {activeTab === 'labs' && (
          <LabRunnerView
            activeLabId={activeLabId}
            onTaskCompleted={handleTaskCompleted}
            completedTasks={completedTasks}
          />
        )}

        {activeTab === 'comparator' && (
          <CommandComparator />
        )}

        {activeTab === 'dual-lab' && (
          <DualTerminalPlayground onCaptureFlag={handleCaptureFlag} />
        )}
      </main>

      {/* Modal de Certificado */}
      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        completedTasks={completedTasks}
        flagsFound={flagsFound}
      />

      {/* Rodapé Integrado */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-400">WinLinx OS Simulator</span>
            <span>• Ambiente Integrado à Trilha de Cibersegurança</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('modules')}
              className="hover:text-slate-300 transition"
            >
              Módulos Curriculares
            </button>
            <button
              onClick={() => setActiveTab('comparator')}
              className="hover:text-slate-300 transition"
            >
              Tabela Comparativa
            </button>
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition"
            >
              Emitir Evidências
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
