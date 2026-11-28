import { createLabSession, type LabSession } from './core/labSession';
import type { LabDefinition } from './types/simulator';
import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PRACTICAL_LABS } from './data/labs';
import { SyscallTrace, EDRAlert, ForensicLogRecord, OperationalPosture, OSType } from './types/simulator';
import { WinLinxEventBridge } from './core/eventBridge';
import { Shield, ExternalLink, Terminal, Flame, BookOpen } from 'lucide-react';

const CurriculumView = lazy(() => import('./components/CurriculumView').then(module => ({ default: module.CurriculumView })));
const LabRunnerView = lazy(() => import('./components/LabRunnerView').then(module => ({ default: module.LabRunnerView })));
const CommandComparator = lazy(() => import('./components/CommandComparator').then(module => ({ default: module.CommandComparator })));
const DualTerminalPlayground = lazy(() => import('./components/DualTerminalPlayground').then(module => ({ default: module.DualTerminalPlayground })));
const SyscallTracerView = lazy(() => import('./components/SyscallTracerView').then(module => ({ default: module.SyscallTracerView })));
const EDRTelemetryView = lazy(() => import('./components/EDRTelemetryView').then(module => ({ default: module.EDRTelemetryView })));
const ProcessArchitectureExplorer = lazy(() => import('./components/ProcessArchitectureExplorer').then(module => ({ default: module.ProcessArchitectureExplorer })));
const OSResourceAnatomyView = lazy(() => import('./components/OSResourceAnatomyView').then(module => ({ default: module.OSResourceAnatomyView })));
const VirtualMemoryInspector = lazy(() => import('./components/VirtualMemoryInspector').then(module => ({ default: module.VirtualMemoryInspector })));
const RegistryViewer = lazy(() => import('./components/RegistryViewer').then(module => ({ default: module.RegistryViewer })));
const HostFirewallSimulator = lazy(() => import('./components/HostFirewallSimulator').then(module => ({ default: module.HostFirewallSimulator })));
const KernelArchitectureView = lazy(() => import('./components/KernelArchitectureView').then(module => ({ default: module.KernelArchitectureView })));
const ForensicLogsViewer = lazy(() => import('./components/ForensicLogsViewer').then(module => ({ default: module.ForensicLogsViewer })));
const FileSystemPermissionsExplorer = lazy(() => import('./components/FileSystemPermissionsExplorer').then(module => ({ default: module.FileSystemPermissionsExplorer })));
const SecurityAuditView = lazy(() => import('./components/SecurityAuditView').then(module => ({ default: module.SecurityAuditView })));
const CertificateModal = lazy(() => import('./components/CertificateModal').then(module => ({ default: module.CertificateModal })));
const IPCArchitectureView = lazy(() => import('./components/IPCArchitectureView').then(module => ({ default: module.IPCArchitectureView })));
const KernelDriversView = lazy(() => import('./components/KernelDriversView').then(module => ({ default: module.KernelDriversView })));
const ThreatInjectorView = lazy(() => import('./components/ThreatInjectorView').then(module => ({ default: module.ThreatInjectorView })));
const CustomLabBuilderView = lazy(() => import('./components/CustomLabBuilderView').then(module => ({ default: module.CustomLabBuilderView })));
const MalwareSandboxView = lazy(() => import('./components/MalwareSandboxView').then(module => ({ default: module.MalwareSandboxView })));
const BinaryReverseEngineeringView = lazy(() => import('./components/BinaryReverseEngineeringView').then(module => ({ default: module.BinaryReverseEngineeringView })));
const NetworkTopologyPivotView = lazy(() => import('./components/NetworkTopologyPivotView').then(module => ({ default: module.NetworkTopologyPivotView })));
const AdversaryEmulationView = lazy(() => import('./components/AdversaryEmulationView').then(module => ({ default: module.AdversaryEmulationView })));
const SOARPlaybookView = lazy(() => import('./components/SOARPlaybookView').then(module => ({ default: module.SOARPlaybookView })));
const MemoryForensicsView = lazy(() => import('./components/MemoryForensicsView').then(module => ({ default: module.MemoryForensicsView })));
const YaraSigmaStudioView = lazy(() => import('./components/YaraSigmaStudioView').then(module => ({ default: module.YaraSigmaStudioView })));
const CloudContainerSecurityView = lazy(() => import('./components/CloudContainerSecurityView').then(module => ({ default: module.CloudContainerSecurityView })));
const EDREvasionSyscallsView = lazy(() => import('./components/EDREvasionSyscallsView').then(module => ({ default: module.EDREvasionSyscallsView })));
const CredentialCrackingView = lazy(() => import('./components/CredentialCrackingView').then(module => ({ default: module.CredentialCrackingView })));
const ThreatIntelMISPView = lazy(() => import('./components/ThreatIntelMISPView').then(module => ({ default: module.ThreatIntelMISPView })));
const ICSOTSecurityView = lazy(() => import('./components/ICSOTSecurityView').then(module => ({ default: module.ICSOTSecurityView })));
const EBPFKernelTracerView = lazy(() => import('./components/eBPFKernelTracerView').then(module => ({ default: module.EBPFKernelTracerView })));
const ETWThreatIntelView = lazy(() => import('./components/ETWThreatIntelView').then(module => ({ default: module.ETWThreatIntelView })));
const ContainerRuntimeSecurityView = lazy(() => import('./components/ContainerRuntimeSecurityView').then(module => ({ default: module.ContainerRuntimeSecurityView })));
const HoneypotDeceptionView = lazy(() => import('./components/HoneypotDeceptionView').then(module => ({ default: module.HoneypotDeceptionView })));
const HypervisorVBSView = lazy(() => import('./components/HypervisorVBSView').then(module => ({ default: module.HypervisorVBSView })));
const ZeroTrustKernelGuardView = lazy(() => import('./components/ZeroTrustKernelGuardView').then(module => ({ default: module.ZeroTrustKernelGuardView })));

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeLabId, setActiveLabId] = useState<string>(PRACTICAL_LABS[0].id);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const [sessions, setSessions] = useState<Record<string, LabSession>>(() => ({
    [PRACTICAL_LABS[0].id]: createLabSession()
  }));
  const [customLabs, setCustomLabs] = useState<LabDefinition[]>([]);
  const activeSession = sessions[activeLabId] ?? sessions[PRACTICAL_LABS[0].id];
  const activeScenario = [...PRACTICAL_LABS, ...customLabs].find(lab => lab.id === activeLabId);
  const { linux: linuxEngine, windows: windowsEngine } = activeSession;

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
    setSessions(previous => previous[labId] ? previous : { ...previous, [labId]: createLabSession() });
    setActiveLabId(labId);
    setActiveTab('labs');
  };

  const handleSessionLogs = (logs: ForensicLogRecord[]) => {
    const tagged = logs.map(log => ({ ...log, labId: activeLabId, attemptId: activeSession.id }));
    activeSession.logs.push(...tagged);
    handleRecordForensicLogs(tagged);
  };

  const handleExecuteRemediation = (os: OSType, command: string) => {
    const engine = os === 'linux' ? linuxEngine : windowsEngine;
    const result = engine.execute(command);
    if (result.syscalls) handleRecordSyscalls(result.syscalls);
    if (result.edrAlerts) handleRecordEDRAlerts(result.edrAlerts);
    if (result.forensicLogs) handleSessionLogs(result.forensicLogs.map(log => ({ ...log, commandExitCode: result.exitCode })));
    if (result.exitCode !== 0) {
      showNotification(result.error || result.output || 'A remediação falhou no simulador.');
      return;
    }
    if (result.stateChanges?.flagDiscovered) handleCaptureFlag(result.stateChanges.flagDiscovered);
    showNotification(`Comando executado no cenário: ${command}`);
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
      <Suspense fallback={<p role="status" className="flex-1 p-8 text-sm text-slate-400">Carregando módulo…</p>}>
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
            scenarioTitle={activeScenario?.title}
            isLinuxCapFixed={!linuxEngine.hasPythonSetuidCapability()}
            isLinuxMalwareKilled={!linuxEngine.getProcesses().some(process => process.pid === 1337 && process.status !== 'stopped')}
            isWinLsassHardened={windowsEngine.isLsaPplConfigured()}
            isUpdaterPathFixed={windowsEngine.hasQuotedUpdaterPath()}
            linuxFirewallBlocked={linuxEngine.getFirewallStatus().blockedPorts.includes(4444)}
            windowsFirewallBlocked={windowsEngine.getFirewallStatus().blockedPorts.includes(8089)}
            linuxSuidVulnerable={linuxEngine.hasFindSetuid()}
            windowsDaclVulnerable={windowsEngine.hasCustomAppWritableDacl()}
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
            hosts={{
              linux: { firewall: linuxEngine.getFirewallStatus(), processes: linuxEngine.getProcesses() },
              windows: { firewall: windowsEngine.getFirewallStatus(), processes: windowsEngine.getProcesses() }
            }}
            onBlockPort={(os, port) => handleExecuteRemediation(os, os === 'linux'
              ? `ufw deny ${port}`
              : `netsh advfirewall firewall add rule name="Block ${port}" dir=in action=block protocol=TCP localport=${port}`
            )}
            onProbe={record => handleSessionLogs([record])}
          />
        )}

        {activeTab === 'forensics' && (
          <ForensicLogsViewer
            currentAttemptId={activeSession.id}
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

        {activeTab === 'hypervisor-vbs' && (
          <HypervisorVBSView
            onCaptureFlag={handleCaptureFlag}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'zero-trust-kernel' && (
          <ZeroTrustKernelGuardView
            onCaptureFlag={handleCaptureFlag}
            onRecordForensicLogs={handleRecordForensicLogs}
          />
        )}

        {activeTab === 'threat-injector' && (
          <ThreatInjectorView onExecuteRemediation={handleExecuteRemediation} />
        )}

        {activeTab === 'lab-builder' && (
          <CustomLabBuilderView onLoadCustomLab={lab => {
            setCustomLabs(previous => [...previous.filter(item => item.id !== lab.id), lab]);
            handleSelectLab(lab.id);
          }} />
        )}

        {activeTab === 'labs' && (
          <LabRunnerView
            key={activeLabId}
            activeLabId={activeLabId}
            labs={[...PRACTICAL_LABS, ...customLabs]}
            session={activeSession}
            onOpenTool={setActiveTab}
            onSelectLab={handleSelectLab}
            onResetSession={() => setSessions(previous => ({ ...previous, [activeLabId]: createLabSession() }))}
            onTaskCompleted={(id, flag) => {
              if (PRACTICAL_LABS.some(lab => lab.id === activeLabId) && !completedTasks.has(id)) {
                handleTaskCompleted(id, flag);
              }
            }}
            onLabFinished={(id, duration) => WinLinxEventBridge.getInstance().notifyLabFinished(id, duration)}
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
      </Suspense>

      {isCertificateOpen && (
        <Suspense fallback={null}>
          <CertificateModal
            isOpen={isCertificateOpen}
            onClose={() => setIsCertificateOpen(false)}
            completedTasks={completedTasks}
            flagsFound={flagsFound}
          />
        </Suspense>
      )}

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
