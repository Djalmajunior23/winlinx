import React, { useState } from 'react';
import { Terminal } from './Terminal';
import { LinuxSimulatorEngine } from '../core/linuxEngine';
import { WindowsSimulatorEngine } from '../core/windowsEngine';
import { createInitialLinuxFS, createInitialWindowsFS } from '../core/defaultFileSystem';
import { SyscallTrace, EDRAlert } from '../types/simulator';
import { ArrowLeftRight, Sparkles, RefreshCw, Terminal as TerminalIcon } from 'lucide-react';

interface DualTerminalPlaygroundProps {
  onCaptureFlag?: (flag: string) => void;
  onRecordSyscalls?: (traces: SyscallTrace[]) => void;
  onRecordEDRAlerts?: (alerts: EDRAlert[]) => void;
}

export const DualTerminalPlayground: React.FC<DualTerminalPlaygroundProps> = ({ 
  onCaptureFlag,
  onRecordSyscalls,
  onRecordEDRAlerts
}) => {
  const [linuxEngine] = useState(() => new LinuxSimulatorEngine(createInitialLinuxFS()));
  const [windowsEngine] = useState(() => new WindowsSimulatorEngine(createInitialWindowsFS()));

  const [linuxState, setLinuxState] = useState({
    cwd: linuxEngine.getCurrentDir(),
    user: linuxEngine.getCurrentUser()
  });

  const [winState, setWinState] = useState({
    cwd: windowsEngine.getCurrentDir(),
    user: windowsEngine.getCurrentUser()
  });

  const [viewMode, setViewMode] = useState<'split' | 'linux' | 'windows'>('split');

  const handleExecuteLinux = (cmd: string) => {
    const res = linuxEngine.execute(cmd);
    setLinuxState({
      cwd: linuxEngine.getCurrentDir(),
      user: linuxEngine.getCurrentUser()
    });

    if (res.syscalls && onRecordSyscalls) {
      onRecordSyscalls(res.syscalls);
    }
    if (res.edrAlerts && onRecordEDRAlerts) {
      onRecordEDRAlerts(res.edrAlerts);
    }
    if (res.stateChanges?.flagDiscovered && onCaptureFlag) {
      onCaptureFlag(res.stateChanges.flagDiscovered);
    }

    return {
      output: res.output,
      error: res.error,
      exitCode: res.exitCode,
      flag: res.stateChanges?.flagDiscovered
    };
  };

  const handleExecuteWindows = (cmd: string) => {
    const res = windowsEngine.execute(cmd);
    setWinState({
      cwd: windowsEngine.getCurrentDir(),
      user: windowsEngine.getCurrentUser()
    });

    if (res.syscalls && onRecordSyscalls) {
      onRecordSyscalls(res.syscalls);
    }
    if (res.edrAlerts && onRecordEDRAlerts) {
      onRecordEDRAlerts(res.edrAlerts);
    }
    if (res.stateChanges?.flagDiscovered && onCaptureFlag) {
      onCaptureFlag(res.stateChanges.flagDiscovered);
    }

    return {
      output: res.output,
      error: res.error,
      exitCode: res.exitCode,
      flag: res.stateChanges?.flagDiscovered
    };
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho do Playground */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
              Dual-Shell Playground: Código Aberto vs Código Fechado
            </h2>
            <span className="px-2 py-0.5 rounded text-xs bg-emerald-950 text-emerald-400 border border-emerald-800">
              Live Sandbox & VFS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare o comportamento do Linux Bash e do Windows PowerShell lado a lado com redirecionamento de I/O, controle de processos e telemetria de Kernel.
          </p>
        </div>

        {/* Alternador de Visualização */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-end md:self-auto">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'split' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lado a Lado (Split)
          </button>
          <button
            onClick={() => setViewMode('linux')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'linux' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apenas Linux
          </button>
          <button
            onClick={() => setViewMode('windows')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              viewMode === 'windows' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Apenas Windows
          </button>
        </div>
      </div>

      {/* Grid de Terminais */}
      <div className={`grid gap-4 ${
        viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
      }`}>
        {/* Terminal Linux */}
        {(viewMode === 'split' || viewMode === 'linux') && (
          <div className="h-[480px]">
            <Terminal
              osType="linux"
              currentDir={linuxState.cwd}
              currentUser={linuxState.user}
              onExecuteCommand={handleExecuteLinux}
              onAutoComplete={(prefix) => linuxEngine.getAutoCompleteOptions(prefix)}
              title="Linux Terminal (GNU/Linux Coreutils & VFS)"
              suggestedCommands={[
                'uname -a',
                'whoami',
                'id',
                'ps aux',
                'kill -9 1337',
                'ss -tulpn',
                'find / -perm -4000',
                'echo "teste" > /tmp/arquivo.txt'
              ]}
            />
          </div>
        )}

        {/* Terminal Windows */}
        {(viewMode === 'split' || viewMode === 'windows') && (
          <div className="h-[480px]">
            <Terminal
              osType="windows"
              currentDir={winState.cwd}
              currentUser={winState.user}
              onExecuteCommand={handleExecuteWindows}
              onAutoComplete={(prefix) => windowsEngine.getAutoCompleteOptions(prefix)}
              title="Windows PowerShell 5.1 / 7 (NT Native API)"
              suggestedCommands={[
                'whoami',
                'whoami /priv',
                'Get-Process',
                'Stop-Process -Id 4992',
                'netstat -ano',
                'icacls "C:\\Program Files\\Custom App"',
                'sc qc WinVulnerableUpdater',
                'Get-EventLog -LogName Security'
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};
