import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { LabRunnerView } from './components/LabRunnerView';
import { CommandComparator } from './components/CommandComparator';
import { DualTerminalPlayground } from './components/DualTerminalPlayground';
import { SyscallTracerView } from './components/SyscallTracerView';
import { EDRTelemetryView } from './components/EDRTelemetryView';
import { CertificateModal } from './components/CertificateModal';
import { PRACTICAL_LABS } from './data/labs';
import { SyscallTrace, EDRAlert } from './types/simulator';
import { WinLinxEventBridge } from './core/eventBridge';
import { Shield, ExternalLink, Terminal, Flame, BookOpen } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeLabId, setActiveLabId] = useState<string>(PRACTICAL_LABS[0].id);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Estados de telemetria sênior em tempo real
  const [syscalls, setSyscalls] = useState<SyscallTrace[]>([]);
  const [edrAlerts, setEdrAlerts] = useState<EDRAlert[]>([]);

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
    // Inicializa o Event Bridge de integração com CiberLab/CiberSim
    const bridge = WinLinxEventBridge.getInstance();
    bridge.notifyReady();
  }, []);

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

  const handleRecordSyscalls = (newTraces: SyscallTrace[]) => {
    setSyscalls(prev => [...prev, ...newTraces]);
  };

  const handleRecordEDRAlerts = (newAlerts: EDRAlert[]) => {
    setEdrAlerts(prev => [...prev, ...newAlerts]);
    if (newAlerts.length > 0) {
      const critical = newAlerts.find(a => a.severity === 'CRÍTICA' || a.severity === 'ALTA');
      if (critical) {
        showNotification(`🚨 [EDR SOC ALERT] ${critical.ruleName} (${critical.mitreId})`);
      }
    }
  };

  const handleTaskCompleted = (taskId: string, flag?: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    const bridge = WinLinxEventBridge.getInstance();
    bridge.notifyTaskCompleted(taskId, 'os-lab', flag);

    if (flag && !flagsFound.includes(flag)) {
      setFlagsFound(prev => [...prev, flag]);
      bridge.notifyFlagCaptured(flag);
      showNotification(`🚩 Flag Capturada: ${flag}`);
    } else {
      showNotification('✅ Tarefa do laboratório concluída com sucesso!');
    }
  };

  const handleCaptureFlag = (flag: string) => {
    if (!flagsFound.includes(flag)) {
      setFlagsFound(prev => [...prev, flag]);
      WinLinxEventBridge.getInstance().notifyFlagCaptured(flag);
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
        activeAlertsCount={edrAlerts.length}
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
            onRecordSyscalls={handleRecordSyscalls}
            onRecordEDRAlerts={handleRecordEDRAlerts}
          />
        )}

        {activeTab === 'dual-lab' && (
          <DualTerminalPlayground 
            onCaptureFlag={handleCaptureFlag}
            onRecordSyscalls={handleRecordSyscalls}
            onRecordEDRAlerts={handleRecordEDRAlerts}
          />
        )}

        {activeTab === 'comparator' && (
          <CommandComparator />
        )}

        {activeTab === 'syscalls' && (
          <SyscallTracerView
            syscalls={syscalls}
            onClearSyscalls={() => setSyscalls([])}
          />
        )}

        {activeTab === 'edr' && (
          <EDRTelemetryView
            alerts={edrAlerts}
            onClearAlerts={() => setEdrAlerts([])}
          />
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
            <span className="font-semibold text-slate-400">WinLinx OS Cybersecurity Simulator</span>
            <span>• Microfrontend Ready for CiberLab Ecosystem</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('modules')}
              className="hover:text-slate-300 transition"
            >
              Módulos Curriculares
            </button>
            <button
              onClick={() => setActiveTab('syscalls')}
              className="hover:text-slate-300 transition"
            >
              Syscalls (Ring 0)
            </button>
            <button
              onClick={() => setActiveTab('edr')}
              className="hover:text-slate-300 transition"
            >
              EDR Telemetria
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
