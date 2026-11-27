import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { CurriculumView } from './components/CurriculumView';
import { LabRunnerView } from './components/LabRunnerView';
import { CommandComparator } from './components/CommandComparator';
import { DualTerminalPlayground } from './components/DualTerminalPlayground';
import { SyscallTracerView } from './components/SyscallTracerView';
import { EDRTelemetryView } from './components/EDRTelemetryView';
import { ProcessArchitectureExplorer } from './components/ProcessArchitectureExplorer';
import { OSResourceAnatomyView } from './components/OSResourceAnatomyView';
import { VirtualMemoryInspector } from './components/VirtualMemoryInspector';
import { RegistryViewer } from './components/RegistryViewer';
import { HostFirewallSimulator } from './components/HostFirewallSimulator';
import { KernelArchitectureView } from './components/KernelArchitectureView';
import { ForensicLogsViewer } from './components/ForensicLogsViewer';
import { FileSystemPermissionsExplorer } from './components/FileSystemPermissionsExplorer';
import { SecurityAuditView } from './components/SecurityAuditView';
import { CertificateModal } from './components/CertificateModal';
import { IPCArchitectureView } from './components/IPCArchitectureView';
import { KernelDriversView } from './components/KernelDriversView';
import { ThreatInjectorView } from './components/ThreatInjectorView';
import { CustomLabBuilderView } from './components/CustomLabBuilderView';
import { MalwareSandboxView } from './components/MalwareSandboxView';
import { BinaryReverseEngineeringView } from './components/BinaryReverseEngineeringView';
import { NetworkTopologyPivotView } from './components/NetworkTopologyPivotView';
import { AdversaryEmulationView } from './components/AdversaryEmulationView';
import { SOARPlaybookView } from './components/SOARPlaybookView';
import { MemoryForensicsView } from './components/MemoryForensicsView';
import { YaraSigmaStudioView } from './components/YaraSigmaStudioView';
import { CloudContainerSecurityView } from './components/CloudContainerSecurityView';
import { EDREvasionSyscallsView } from './components/EDREvasionSyscallsView';
import { CredentialCrackingView } from './components/CredentialCrackingView';
import { ThreatIntelMISPView } from './components/ThreatIntelMISPView';
import { ICSOTSecurityView } from './components/ICSOTSecurityView';
import { EBPFKernelTracerView } from './components/eBPFKernelTracerView';
import { ETWThreatIntelView } from './components/ETWThreatIntelView';
import { ContainerRuntimeSecurityView } from './components/ContainerRuntimeSecurityView';
import { HoneypotDeceptionView } from './components/HoneypotDeceptionView';
import { PRACTICAL_LABS } from './data/labs';
import { SyscallTrace, EDRAlert, ForensicLogRecord, OperationalPosture, OSType } from './types/simulator';
import { LinuxSimulatorEngine } from './core/linuxEngine';
import { WindowsSimulatorEngine } from './core/windowsEngine';
import { createInitialLinuxFS, createInitialWindowsFS } from './core/defaultFileSystem';
import { WinLinxEventBridge } from './core/eventBridge';
import { Shield, ExternalLink, Terminal, Flame, BookOpen } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeLabId, setActiveLabId] = useState<string>(PRACTICAL_LABS[0].id);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  // Instâncias singleton de motor para processos de SO
  const [linuxEngine] = useState(() => new LinuxSimulatorEngine(createInitialLinuxFS()));
  const [windowsEngine] = useState(() => new WindowsSimulatorEngine(createInitialWindowsFS()));

  // Estados de telemetria sênior em tempo real
  const [syscalls, setSyscalls] = useState<SyscallTrace[]>([]);
  const [edrAlerts, setEdrAlerts] = useState<EDRAlert[]>([]);
  const [forensicLogs, setForensicLogs] = useState<ForensicLogRecord[]>([]);
  const [posture, setPosture] = useState<OperationalPosture>('blue-team');

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

  const handleRecordForensicLogs = (newLogs: ForensicLogRecord[]) => {
    setForensicLogs(prev => [...newLogs, ...prev]);
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

  const handleExecuteRemediation = (os: OSType, command: string) => {
    if (os === 'linux') {
      const res = linuxEngine.execute(command);
      if (res.syscalls) handleRecordSyscalls(res.syscalls);
      if (res.edrAlerts) handleRecordEDRAlerts(res.edrAlerts);
      if (res.forensicLogs) handleRecordForensicLogs(res.forensicLogs);
      if (res.stateChanges?.flagDiscovered) {
        handleCaptureFlag(res.stateChanges.flagDiscovered);
      }
      showNotification(`[Linux Remediação] Comando executado: ${command}`);
    } else {
      const res = windowsEngine.execute(command);
      if (res.syscalls) handleRecordSyscalls(res.syscalls);
      if (res.edrAlerts) handleRecordEDRAlerts(res.edrAlerts);
      if (res.forensicLogs) handleRecordForensicLogs(res.forensicLogs);
      if (res.stateChanges?.flagDiscovered) {
        handleCaptureFlag(res.stateChanges.flagDiscovered);
      }
      showNotification(`[Windows Remediação] Comando executado: ${command}`);
    }
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
        posture={posture}
        onTogglePosture={() => setPosture(p => p === 'blue-team' ? 'red-team' : 'blue-team')}
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

        {activeTab === 'kernel' && (
          <KernelArchitectureView />
        )}

        {activeTab === 'processes' && (
          <ProcessArchitectureExplorer
            linuxProcesses={linuxEngine.getProcesses()}
            windowsProcesses={windowsEngine.getProcesses()}
          />
        )}

        {activeTab === 'anatomy' && (
          <OSResourceAnatomyView />
        )}

        {activeTab === 'memory' && (
          <VirtualMemoryInspector />
        )}

        {activeTab === 'filesystem' && (
          <FileSystemPermissionsExplorer
            linuxRootFS={linuxEngine.getRootFS?.()}
            windowsRootFS={windowsEngine.getRootFS?.()}
          />
        )}

        {activeTab === 'security-audit' && (
          <SecurityAuditView
            flagsFound={flagsFound}
            completedTasks={completedTasks}
            onExecuteRemediation={handleExecuteRemediation}
          />
        )}

        {activeTab === 'registry' && (
          <RegistryViewer
            registryData={windowsEngine.getRegistrySnapshot()}
          />
        )}

        {activeTab === 'firewall' && (
          <HostFirewallSimulator
            linuxBlockedPorts={linuxEngine.getFirewallStatus().blockedPorts}
            windowsBlockedPorts={windowsEngine.getFirewallStatus().blockedPorts}
          />
        )}

        {activeTab === 'forensics' && (
          <ForensicLogsViewer
            logs={forensicLogs}
            onClearLogs={() => setForensicLogs([])}
          />
        )}

        {activeTab === 'ipc' && (
          <IPCArchitectureView />
        )}

        {activeTab === 'drivers' && (
          <KernelDriversView />
        )}

        {activeTab === 'sandbox' && (
          <MalwareSandboxView />
        )}

        {activeTab === 'reversing' && (
          <BinaryReverseEngineeringView />
        )}

        {activeTab === 'network-pivot' && (
          <NetworkTopologyPivotView />
        )}

        {activeTab === 'adversary' && (
          <AdversaryEmulationView />
        )}

        {activeTab === 'soar' && (
          <SOARPlaybookView />
        )}

        {activeTab === 'mem-forensics' && (
          <MemoryForensicsView />
        )}

        {activeTab === 'yara-sigma' && (
          <YaraSigmaStudioView />
        )}

        {activeTab === 'cloud-k8s' && (
          <CloudContainerSecurityView />
        )}

        {activeTab === 'edr-evasion' && (
          <EDREvasionSyscallsView />
        )}

        {activeTab === 'hashcat' && (
          <CredentialCrackingView />
        )}

        {activeTab === 'threat-intel' && (
          <ThreatIntelMISPView />
        )}

        {activeTab === 'ics-ot' && (
          <ICSOTSecurityView />
        )}

        {activeTab === 'ebpf-tracer' && (
          <EBPFKernelTracerView
            onCaptureFlag={handleCaptureFlag}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'etw-ti' && (
          <ETWThreatIntelView
            onCaptureFlag={handleCaptureFlag}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'container-runtime' && (
          <ContainerRuntimeSecurityView
            onCaptureFlag={handleCaptureFlag}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'deception' && (
          <HoneypotDeceptionView
            onCaptureFlag={handleCaptureFlag}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'threat-injector' && (
          <ThreatInjectorView onExecuteRemediation={handleExecuteRemediation} />
        )}

        {activeTab === 'lab-builder' && (
          <CustomLabBuilderView />
        )}

        {activeTab === 'labs' && (
          <LabRunnerView
            activeLabId={activeLabId}
            onTaskCompleted={handleTaskCompleted}
            completedTasks={completedTasks}
            onRecordSyscalls={handleRecordSyscalls}
            onRecordEDRAlerts={handleRecordEDRAlerts}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'dual-lab' && (
          <DualTerminalPlayground 
            onCaptureFlag={handleCaptureFlag}
            onRecordSyscalls={handleRecordSyscalls}
            onRecordEDRAlerts={handleRecordEDRAlerts}
            onRecordForensicLogs={handleRecordForensicLogs}
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
              onClick={() => setActiveTab('processes')}
              className="hover:text-slate-300 transition"
            >
              Processos do SO
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className="hover:text-slate-300 transition"
            >
              Memória (ASLR/DEP)
            </button>
            <button
              onClick={() => setActiveTab('registry')}
              className="hover:text-slate-300 transition"
            >
              Registro Windows
            </button>
            <button
              onClick={() => setActiveTab('firewall')}
              className="hover:text-slate-300 transition"
            >
              Firewall de Host
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
