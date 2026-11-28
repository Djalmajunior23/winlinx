import React, { useState } from 'react';
import { ForensicLogRecord, OSType } from '../types/simulator';
import { 
  FileSearch, 
  ShieldAlert, 
  Terminal, 
  Clock, 
  Filter, 
  Download, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Server,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface ForensicLogsViewerProps {
  logs: ForensicLogRecord[];
  currentAttemptId?: string;
  onClearLogs?: () => void;
}

const DEFAULT_INITIAL_LOGS: ForensicLogRecord[] = [
  // Windows Event Logs
  {
    id: 'win-evt-1',
    timestamp: '19:42:10',
    os: 'windows',
    source: 'Security.evtx',
    eventId: 4624,
    severity: 'INFO',
    user: 'ALUNO-PC\\Aluno',
    computer: 'WINLINX-WIN-2026',
    processName: 'winlogon.exe',
    commandLine: 'C:\\Windows\\System32\\winlogon.exe',
    details: 'Uma conta foi autenticada com sucesso (Logon Type 2: Interactive). Identificador de Segurança: S-1-5-21-39281-1001.',
    mitreRef: 'T1078'
  },
  {
    id: 'win-evt-2',
    timestamp: '19:45:32',
    os: 'windows',
    source: 'Security.evtx',
    eventId: 4672,
    severity: 'WARNING',
    user: 'NT AUTHORITY\\SYSTEM',
    computer: 'WINLINX-WIN-2026',
    processName: 'lsass.exe',
    commandLine: 'C:\\Windows\\System32\\lsass.exe',
    details: 'Privilégios especiais atribuídos ao novo logon: SeSecurityPrivilege, SeBackupPrivilege, SeRestorePrivilege, SeDebugPrivilege, SeImpersonatePrivilege.',
    mitreRef: 'T1087.001'
  },
  {
    id: 'win-evt-3',
    timestamp: '19:48:15',
    os: 'windows',
    source: 'System.evtx',
    eventId: 7045,
    severity: 'WARNING',
    user: 'NT AUTHORITY\\SYSTEM',
    computer: 'WINLINX-WIN-2026',
    processName: 'services.exe',
    commandLine: 'services.exe',
    details: 'Um novo serviço foi instalado no sistema. Nome do Serviço: WinVulnerableUpdater. Nome do Arquivo de Imagem: C:\\Program Files\\Custom App\\service.exe. Tipo de Início: Inicialização Automática.',
    mitreRef: 'T1543.003'
  },
  {
    id: 'win-evt-4',
    timestamp: '19:50:04',
    os: 'windows',
    source: 'Security.evtx',
    eventId: 4688,
    severity: 'CRITICAL',
    user: 'ALUNO-PC\\Aluno',
    computer: 'WINLINX-WIN-2026',
    processName: 'powershell.exe',
    commandLine: 'powershell.exe -ExecutionPolicy Bypass -NoProfile -Command "Stop-Process -Id 4992"',
    details: 'Um novo processo foi criado. Process ID: 0x1338. Creator Process ID: 0x0FE4. Linha de Comando Completa: Stop-Process -Id 4992. Token Elevation: TokenElevationTypeDefault.',
    mitreRef: 'T1059.001'
  },

  // Linux Audit & Auth Logs
  {
    id: 'lnx-evt-1',
    timestamp: '19:41:00',
    os: 'linux',
    source: 'auth.log',
    facility: 'AUTH',
    severity: 'INFO',
    user: 'aluno',
    computer: 'WINLINX-LNX-01',
    processName: 'sshd',
    commandLine: '/usr/sbin/sshd -D',
    details: 'sshd[412]: Accepted publickey for aluno from 192.168.1.105 port 54220 ssh2: RSA SHA256:7uKl91P...',
    mitreRef: 'T1078.004'
  },
  {
    id: 'lnx-evt-2',
    timestamp: '19:44:22',
    os: 'linux',
    source: 'audit.log',
    facility: 'SYSCALL',
    severity: 'CRITICAL',
    user: 'root',
    computer: 'WINLINX-LNX-01',
    processName: 'find',
    commandLine: 'find / -perm -4000 2>/dev/null',
    details: 'type=SYSCALL arch=c000003e syscall=59 success=yes exit=0 a0=55dc2891 a1=55dc28a0 ppid=1042 pid=3190 auid=1000 uid=1000 gid=1000 euid=1000 comm="find" exe="/usr/bin/find" key="recon_suid"',
    mitreRef: 'T1548.001'
  },
  {
    id: 'lnx-evt-3',
    timestamp: '19:46:11',
    os: 'linux',
    source: 'auth.log',
    facility: 'AUTH',
    severity: 'WARNING',
    user: 'aluno',
    computer: 'WINLINX-LNX-01',
    processName: 'sudo',
    commandLine: 'sudo su -',
    details: 'sudo: aluno : TTY=pts/0 ; PWD=/home/aluno ; USER=root ; COMMAND=/bin/bash ; pam_unix(sudo:session): session opened for user root by aluno(uid=1000)',
    mitreRef: 'T1548.003'
  },
  {
    id: 'lnx-evt-4',
    timestamp: '19:49:50',
    os: 'linux',
    source: 'audit.log',
    facility: 'SYSCALL',
    severity: 'CRITICAL',
    user: 'aluno',
    computer: 'WINLINX-LNX-01',
    processName: 'kill',
    commandLine: 'kill -9 1337',
    details: 'type=SYSCALL arch=c000003e syscall=62 (kill) success=yes exit=0 a0=539 a1=9 ppid=1042 pid=3420 auid=1000 uid=1000 comm="kill" exe="/bin/kill" target_pid=1337 signal=SIGKILL key="terminate_malware"',
    mitreRef: 'T1562.001'
  }
];

export const ForensicLogsViewer: React.FC<ForensicLogsViewerProps> = ({ 
  logs,
  currentAttemptId,
  onClearLogs 
}) => {
  const [scope, setScope] = useState<'attempt' | 'generated' | 'examples'>(
    currentAttemptId ? 'attempt' : 'generated'
  );
  const scopedLogs = scope === 'examples' ? DEFAULT_INITIAL_LOGS
    : scope === 'attempt' ? logs.filter(log => log.attemptId === currentAttemptId)
    : logs;

  const [activeOS, setActiveOS] = useState<OSType>('windows');
  const [selectedLogId, setSelectedLogId] = useState<string>(
    activeOS === 'windows' ? 'win-evt-4' : 'lnx-evt-2'
  );
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterEventId, setFilterEventId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = scopedLogs.filter(log => {
    if (log.os !== activeOS) return false;
    if (filterSeverity !== 'ALL' && log.severity !== filterSeverity) return false;
    if (filterEventId !== 'ALL' && log.eventId?.toString() !== filterEventId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchProcess = log.processName?.toLowerCase().includes(q);
      const matchCmd = log.commandLine?.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchUser = log.user.toLowerCase().includes(q);
      if (!matchProcess && !matchCmd && !matchDetails && !matchUser) return false;
    }
    return true;
  });

  const selectedLog = filteredLogs.find(log => log.id === selectedLogId) ?? filteredLogs[0];

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scopedLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `winlinx_forensic_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Controles de SIEM */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 text-xs font-semibold mb-2">
              <FileSearch className="w-3.5 h-3.5" />
              <span>SIEM & Forensic Event Viewer</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Central Forense de Auditoria e Logs de SO
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Investigue eventos reais gerados pelos terminais: <span className="text-cyan-400 font-mono">Windows Event Viewer (.evtx)</span> com Event IDs 4688, 7045 e 4672 versus <span className="text-emerald-400 font-mono">Linux Auditd (/var/log/audit.log)</span> e Syslog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => {
                  setActiveOS('windows');
                  setSelectedLogId('win-evt-4');
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeOS === 'windows'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Windows Security.evtx</span>
              </button>
              <button
                onClick={() => {
                  setActiveOS('linux');
                  setSelectedLogId('lnx-evt-2');
                }}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeOS === 'linux'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Linux Auditd / Auth</span>
              </button>
            </div>

            <label className="text-xs text-slate-300">
              Origem dos registros
              <select value={scope} onChange={event => setScope(event.target.value as typeof scope)}
                className="ml-2 rounded border border-slate-700 bg-slate-950 p-1">
                {currentAttemptId && <option value="attempt">Tentativa atual</option>}
                <option value="generated">Todos os registros gerados</option>
                <option value="examples">Exemplos</option>
              </select>
            </label>
            <button
              onClick={handleExportJSON}
              disabled={scope === 'examples' || scopedLogs.length === 0}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar Dossiê (JSON)</span>
            </button>

            {onClearLogs && (
              <button
                onClick={onClearLogs}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800/60 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Filtros Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrar por processo, comando ou usuário..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Severidade:</span>
            <select
              value={filterSeverity}
              onChange={e => setFilterSeverity(e.target.value)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none text-xs flex-1 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">Todas as Severidades</option>
              <option value="CRITICAL" className="bg-slate-900 text-red-400">Crítica (Ataques/Exploits)</option>
              <option value="WARNING" className="bg-slate-900 text-amber-400">Alerta (Serviços/Tokens)</option>
              <option value="INFO" className="bg-slate-900 text-cyan-400">Informativa (Logon/Processos)</option>
            </select>
          </div>

          {activeOS === 'windows' ? (
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Event ID:</span>
              <select
                value={filterEventId}
                onChange={e => setFilterEventId(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none text-xs flex-1 cursor-pointer font-mono"
              >
                <option value="ALL" className="bg-slate-900 text-slate-200">Todos os Event IDs</option>
                <option value="4688" className="bg-slate-900 text-cyan-400">4688 - Criação de Processo</option>
                <option value="7045" className="bg-slate-900 text-amber-400">7045 - Novo Serviço Instalado</option>
                <option value="4670" className="bg-slate-900 text-cyan-400">4670 - Alteração de Permissões</option>
                <option value="4672" className="bg-slate-900 text-purple-400">4672 - Privilégios Especiais</option>
                <option value="4624" className="bg-slate-900 text-emerald-400">4624 - Logon com Sucesso</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Fonte:</span>
              <span className="text-emerald-400 font-mono font-bold">Linux /var/log/audit.log & auth.log</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid Principal: Lista de Eventos vs Painel do Inspetor Forense */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabela de Eventos (Esquerda) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[560px]">
          <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              Registros Coletados ({filteredLogs.length})
            </span>
            <span className="font-mono text-[11px] text-cyan-400">
              {activeOS === 'windows' ? 'Canal: Security & System' : 'Canal: Linux Auditd & PAM'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum evento corresponde aos filtros selecionados.
              </div>
            ) : (
              filteredLogs.map(log => {
                const isSelected = selectedLog?.id === log.id;
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    className={`w-full text-left p-3.5 transition-all flex items-start space-x-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-4 border-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="mt-0.5">
                      {log.severity === 'CRITICAL' ? (
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      ) : log.severity === 'WARNING' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs mb-1">
                        <div className="flex items-center space-x-2">
                          {log.eventId ? (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold text-[10px]">
                              ID {log.eventId}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px]">
                              {log.facility || 'SYSCALL'}
                            </span>
                          )}
                          <span className="font-bold text-slate-200 truncate">
                            {log.processName || log.source}
                          </span>
                        </div>
                        <span className="text-slate-500 text-[11px] flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{log.timestamp}</span>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate">
                        {log.commandLine || log.details}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>Usuário: {log.user}</span>
                        {log.mitreRef && (
                          <span className="text-red-400 font-bold">MITRE {log.mitreRef}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Inspetor de Evidência Forense Detalhada (Direita) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between h-[560px] overflow-y-auto">
          {selectedLog ? <>
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  selectedLog.severity === 'CRITICAL'
                    ? 'bg-red-950 border border-red-800 text-red-400'
                    : selectedLog.severity === 'WARNING'
                    ? 'bg-amber-950 border border-amber-800 text-amber-400'
                    : 'bg-cyan-950 border border-cyan-800 text-cyan-400'
                }`}>
                  Severidade: {selectedLog.severity}
                </span>
                <span className="text-slate-400 text-xs font-mono">{selectedLog.computer}</span>
              </div>

              <h2 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>{selectedLog.eventId ? `Windows Event ID ${selectedLog.eventId}` : `Linux Audit: ${selectedLog.facility}`}</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Fonte: {selectedLog.source}</p>
            </div>

            {/* Metadados Técnicos */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Processo Criador / Alvo</span>
                <span className="text-slate-200 font-bold">{selectedLog.processName || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">Identidade / Usuário</span>
                <span className="text-cyan-300 font-bold">{selectedLog.user}</span>
              </div>
            </div>

            {/* Linha de Comando Investigada */}
            <p className="text-xs text-slate-400">
              {selectedLog.attemptId ? `Tentativa ${selectedLog.attemptId} · ${selectedLog.labId}`
                : DEFAULT_INITIAL_LOGS.includes(selectedLog) ? 'Registro de exemplo' : 'Registro gerado no simulador'}
            </p>
            {selectedLog.commandExitCode !== undefined && (
              <p className="text-xs text-slate-400">Código de saída do comando · {selectedLog.commandExitCode}</p>
            )}
            {selectedLog.commandLine && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Linha de Comando Executada (Process CommandLine)</span>
                </span>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
                  {selectedLog.commandLine}
                </div>
              </div>
            )}

            {/* Conteúdo Bruto / Decodificado */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mensagem de Auditoria Forense</span>
              </span>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-all">
                {selectedLog.details}
              </div>
            </div>

            {/* Associação MITRE ATT&CK */}
            {selectedLog.mitreRef && (
              <div className="p-3 rounded-lg bg-red-950/30 border border-red-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 font-bold">Mapeamento MITRE ATT&CK:</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-900/60 border border-red-700 text-red-200 font-mono font-bold text-[10px]">
                  {selectedLog.mitreRef}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Hora do Evento: {selectedLog.timestamp}</span>
          </div>
          </> : <p className="text-xs text-slate-400">Nenhuma evidência corresponde aos filtros.</p>}
        </div>
      </div>
    </div>
  );
};
