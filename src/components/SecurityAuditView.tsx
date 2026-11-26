import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Flame,
  Bug,
  Lock,
  ArrowRight
} from 'lucide-react';
import { OSType, SecurityFinding } from '../types/simulator';

interface SecurityAuditViewProps {
  onExecuteRemediation?: (os: OSType, command: string) => void;
  completedTasks?: Set<string>;
  flagsFound?: string[];
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  onExecuteRemediation,
  flagsFound = []
}) => {
  const [activeOSFilter, setActiveOSFilter] = useState<'all' | 'linux' | 'windows'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Verificação dinâmica de vulnerabilidades com base nas flags encontradas
  const isLinuxSuidFixed = flagsFound.includes('FLAG{WINLINX_LINUX_SUID_FIXED_DEFENDER_2026}');
  const isLinuxCapFixed = flagsFound.includes('FLAG{WINLINX_LINUX_CAPABILITIES_HARDENED_2026}');
  const isLinuxMalwareKilled = flagsFound.includes('FLAG{WINLINX_LINUX_MALICIOUS_PROCESS_KILLED_1337}');
  const isLinuxFirewallBlocked = flagsFound.includes('FLAG{WINLINX_LINUX_FIREWALL_NETFILTER_BLOCKED_4444_2026}');
  
  const isWinDaclRemediated = flagsFound.includes('FLAG{WINLINX_WINDOWS_ICACLS_REMEDIATED_2026}');
  const isWinLsassHardened = flagsFound.includes('FLAG{WINLINX_WINDOWS_LSA_RUNASPPL_ACTIVATED_2026}');
  const isWinFirewallBlocked = flagsFound.includes('FLAG{WINLINX_WINDOWS_FIREWALL_RULE_APPLIED_8089_2026}');
  const isWinMalwareStopped = flagsFound.includes('FLAG{WINLINX_WINDOWS_MALICIOUS_PROCESS_TERMINATED_4992}');

  const findings: SecurityFinding[] = [
    {
      id: 'VULN-LNX-001',
      os: 'linux',
      title: 'Binário com Bit SUID Vulnerável (find com 4755)',
      category: 'Permissions',
      severity: 'CRITICAL',
      cvss: 9.8,
      mitreTechnique: 'Abuse Elevation Control Mechanism: Setuid and Setgid',
      mitreId: 'T1548.001',
      targetResource: '/bin/find',
      description: 'O binário /bin/find possui o bit SUID (SetUID) ativo e pertence ao root. Usuários sem privilégios podem usar o parâmetro -exec para executar comandos como root.',
      exploitationVector: 'find . -exec /bin/sh -p \\; -quit (Escape GTFOBins imediato para shell root)',
      remediationCommand: 'chmod 755 /bin/find',
      isRemediated: isLinuxSuidFixed
    },
    {
      id: 'VULN-LNX-002',
      os: 'linux',
      title: 'Linux Capability Perigosa (cap_setuid+ep no Interpretador Python)',
      category: 'Permissions',
      severity: 'HIGH',
      cvss: 8.8,
      mitreTechnique: 'Abuse Elevation Control Mechanism: Capabilities',
      mitreId: 'T1548.001',
      targetResource: '/usr/bin/python3.11',
      description: 'A capability cap_setuid+ep permite a qualquer usuário instruir o processo a alterar seu UID efetivo para 0 (root) através da chamada os.setuid(0).',
      exploitationVector: 'python3 -c "import os; os.setuid(0); os.system(\'/bin/bash\')"',
      remediationCommand: 'setcap -r /usr/bin/python3.11',
      isRemediated: isLinuxCapFixed
    },
    {
      id: 'VULN-LNX-003',
      os: 'linux',
      title: 'Processo Anômalo com Masquerading em Execução (/tmp/.hidden)',
      category: 'Kernel',
      severity: 'CRITICAL',
      cvss: 9.3,
      mitreTechnique: 'Masquerading: Match Legitimate Name or Location',
      mitreId: 'T1036',
      targetResource: 'PID 1337 (kworker_rev)',
      description: 'Processo simulando uma thread legítima do kernel [kworker], porém executando em modo usuário a partir do diretório /tmp com conexão de rede ativa na porta 4444.',
      exploitationVector: 'Reverse Shell persistente operando sob disfarce de thread de kernel.',
      remediationCommand: 'kill -9 1337',
      isRemediated: isLinuxMalwareKilled
    },
    {
      id: 'VULN-LNX-004',
      os: 'linux',
      title: 'Porta de Backdoor C2 Sem Bloqueio no Netfilter (Porta 4444)',
      category: 'Network',
      severity: 'HIGH',
      cvss: 8.5,
      mitreTechnique: 'System Network Connections Discovery',
      mitreId: 'T1049',
      targetResource: 'TCP 0.0.0.0:4444',
      description: 'Firewall de host não possui regras descartando pacotes TCP SYN na porta de comando e controle 4444.',
      exploitationVector: 'Comunicação direta com servidor externo C2 (Command & Control).',
      remediationCommand: 'ufw deny 4444',
      isRemediated: isLinuxFirewallBlocked
    },
    {
      id: 'VULN-WIN-001',
      os: 'windows',
      title: 'Caminho de Serviço Sem Aspas (Unquoted Service Path)',
      category: 'Service',
      severity: 'HIGH',
      cvss: 8.2,
      mitreTechnique: 'Hijack Execution Flow: Unquoted Service Path',
      mitreId: 'T1574.009',
      targetResource: 'HKLM\\SYSTEM\\CurrentControlSet\\Services\\WinVulnerableUpdater',
      description: 'O caminho do serviço "C:\\Program Files\\Custom App\\service.exe" não contém aspas envolventes. O Windows tenta executar sequencialmente C:\\Program.exe antes do executável real.',
      exploitationVector: 'Depósito de C:\\Program.exe malicioso para obter execução de código no contexto de NT AUTHORITY\\SYSTEM.',
      remediationCommand: 'sc config WinVulnerableUpdater binPath= "\\"C:\\Program Files\\Custom App\\service.exe\\""',
      isRemediated: isWinDaclRemediated
    },
    {
      id: 'VULN-WIN-002',
      os: 'windows',
      title: 'Permissão DACL Insegura (BUILTIN\\Users com Modify em Arquivos de Sistema)',
      category: 'Permissions',
      severity: 'CRITICAL',
      cvss: 9.0,
      mitreTechnique: 'Access Token Manipulation / DACL Abuse',
      mitreId: 'T1548.002',
      targetResource: 'C:\\Program Files\\Custom App',
      description: 'A lista de controle de acesso discricionário (DACL) concede direitos de Modificação (M) e Escrita (W) para o grupo não privilegiado BUILTIN\\Users.',
      exploitationVector: 'Substituição direta do arquivo service.exe por payload compilado.',
      remediationCommand: 'icacls "C:\\Program Files\\Custom App" /remove "BUILTIN\\Users"',
      isRemediated: isWinDaclRemediated
    },
    {
      id: 'VULN-WIN-003',
      os: 'windows',
      title: 'LSASS Memory Protection Desativada (Falta de RunAsPPL)',
      category: 'Credentials',
      severity: 'CRITICAL',
      cvss: 9.6,
      mitreTechnique: 'OS Credential Dumping: LSASS Memory',
      mitreId: 'T1003.001',
      targetResource: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\\RunAsPPL',
      description: 'O processo lsass.exe não está configurado como Protected Process Light (PPL). Qualquer usuário elevado pode abrir handles PROCESS_VM_READ e extrair credenciais em texto claro com Mimikatz.',
      exploitationVector: 'Dumping de senhas e tickets Kerberos da memória do processo lsass.exe.',
      remediationCommand: 'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa" /v RunAsPPL /t REG_DWORD /d 1 /f',
      isRemediated: isWinLsassHardened
    },
    {
      id: 'VULN-WIN-004',
      os: 'windows',
      title: 'Porta de C2 Sem Regra de Bloqueio no Windows Defender Firewall (8089)',
      category: 'Network',
      severity: 'HIGH',
      cvss: 7.9,
      mitreTechnique: 'System Network Connections',
      mitreId: 'T1049',
      targetResource: 'TCP 0.0.0.0:8089',
      description: 'A porta TCP 8089 encontra-se aberta escutando conexões sem regras ativas na Windows Filtering Platform (WFP).',
      exploitationVector: 'Exfiltração de telemetria e recepção de comandos remotos.',
      remediationCommand: 'netsh advfirewall firewall add rule name="Block 8089" dir=in action=block protocol=TCP localport=8089',
      isRemediated: isWinFirewallBlocked
    }
  ];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleTriggerScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  const filteredFindings = findings.filter(f => {
    if (activeOSFilter !== 'all' && f.os !== activeOSFilter) return false;
    if (selectedSeverity !== 'all' && f.severity !== selectedSeverity) return false;
    return true;
  });

  const remediatedCount = findings.filter(f => f.isRemediated).length;
  const totalFindings = findings.length;
  const securityScore = Math.round((remediatedCount / totalFindings) * 100);

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-rose-500/20 via-amber-500/20 to-cyan-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Scanner & Auditoria de Vulnerabilidades de SO
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 font-mono">
                  CVE & MITRE ATT&CK
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Diagnóstico de falhas estruturais nos simuladores Linux e Windows. Identifique permissões DACL/POSIX abusivas, vetores de escalação de privilégios e aplique hardening em tempo real.
              </p>
            </div>
          </div>

          {/* Placar de Segurança & Scan */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xs text-slate-400">Índice de Hardening</div>
              <div className={`text-2xl font-black font-mono ${
                securityScore >= 75 ? 'text-emerald-400' : securityScore >= 40 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {securityScore}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {remediatedCount} de {totalFindings} mitigadas
              </div>
            </div>

            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition flex items-center space-x-2 shadow-lg shadow-cyan-600/20 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Escaneando...' : 'Reescanear SO'}</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Sistema:</span>
            <button
              onClick={() => setActiveOSFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                activeOSFilter === 'all' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({findings.length})
            </button>
            <button
              onClick={() => setActiveOSFilter('linux')}
              className={`px-3 py-1 rounded-lg transition ${
                activeOSFilter === 'linux' ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Linux ({findings.filter(f => f.os === 'linux').length})
            </button>
            <button
              onClick={() => setActiveOSFilter('windows')}
              className={`px-3 py-1 rounded-lg transition ${
                activeOSFilter === 'windows' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Windows ({findings.filter(f => f.os === 'windows').length})
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Severidade:</span>
            {(['all', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg uppercase font-mono text-[11px] transition ${
                  selectedSeverity === sev
                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Vulnerabilidades */}
      <div className="grid grid-cols-1 gap-4">
        {filteredFindings.map(finding => {
          const isRemediated = finding.isRemediated;

          return (
            <div
              key={finding.id}
              className={`border rounded-2xl p-5 transition-all shadow-lg ${
                isRemediated 
                  ? 'bg-slate-950/60 border-emerald-900/40 opacity-75' 
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      finding.os === 'linux' 
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' 
                        : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {finding.os}
                    </span>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      finding.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      finding.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}>
                      {finding.severity} (CVSS {finding.cvss})
                    </span>

                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {finding.mitreId}
                    </span>

                    {isRemediated ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Remediada
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Vulnerável
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    {finding.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                    {finding.description}
                  </p>

                  <div className="text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-rose-400 font-bold block text-[11px]">
                      Vetor Ofensivo:
                    </span>
                    <code className="text-slate-300 font-mono text-[11px] block">
                      {finding.exploitationVector}
                    </code>
                  </div>
                </div>

                {/* Caixa de Remediação */}
                <div className="w-full md:w-80 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 shrink-0">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Terminal className="w-3.5 h-3.5" /> Remediação Sugerida
                    </span>
                    <button
                      onClick={() => handleCopy(finding.id, finding.remediationCommand)}
                      className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 font-mono transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === finding.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <pre className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-emerald-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap select-all">
                    {finding.remediationCommand}
                  </pre>

                  {onExecuteRemediation && !isRemediated && (
                    <button
                      onClick={() => onExecuteRemediation(finding.os, finding.remediationCommand)}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition flex items-center justify-center space-x-1.5"
                    >
                      <span>Aplicar no Terminal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
