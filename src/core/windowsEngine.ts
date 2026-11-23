import { CommandResult, FileNode, OSProcess, SyscallTrace, EDRAlert } from '../types/simulator';

export class WindowsSimulatorEngine {
  private currentDir: string = 'C:\\Users\\Aluno';
  private currentUser: string = 'ALUNO-PC\\Aluno';
  private rootFS: FileNode;
  private envVars: Record<string, string> = {
    COMPUTERNAME: 'WINLINX-PC',
    USERNAME: 'Aluno',
    USERPROFILE: 'C:\\Users\\Aluno',
    SYSTEMROOT: 'C:\\Windows',
    PSModulePath: 'C:\\Program Files\\WindowsPowerShell\\Modules;C:\\Windows\\system32\\WindowsPowerShell\\v1.0\\Modules'
  };

  private processes: OSProcess[] = [
    { 
      pid: 0, 
      ppid: 0, 
      name: 'System Idle Process', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 91.2, 
      memoryMb: 0.0, 
      path: 'ntoskrnl.exe', 
      expectedPath: 'ntoskrnl.exe',
      status: 'running',
      isProtectedProcess: true,
      integrityLevel: 'System',
      description: 'Processo especial do kernel que contabiliza ciclos ociosos de cada núcleo de CPU.',
      cybersecRole: 'Não pode ser terminado ou modificado por nenhum software em user mode.'
    },
    { 
      pid: 4, 
      ppid: 0, 
      name: 'System', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.8, 
      memoryMb: 45.0, 
      path: 'ntoskrnl.exe', 
      expectedPath: 'ntoskrnl.exe',
      status: 'running', 
      isProtectedProcess: true,
      integrityLevel: 'System',
      networkPort: 445,
      description: 'Processo do Kernel NT em Ring 0. Abriga threads de drivers de dispositivo, subsistema de memória e SMB (porta 445).',
      cybersecRole: 'Alvo de vulnerabilidades em drivers (BYOVD - Bring Your Own Vulnerable Driver) e ataques de rede SMB (EternalBlue / Relay).'
    },
    { 
      pid: 320, 
      ppid: 4, 
      name: 'smss.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.0, 
      memoryMb: 4.2, 
      path: 'C:\\Windows\\System32\\smss.exe', 
      expectedPath: 'C:\\Windows\\System32\\smss.exe',
      status: 'running',
      isProtectedProcess: true,
      integrityLevel: 'System',
      description: 'Session Manager Subsystem (SMSS) - Primeiro processo de modo usuário (Ring 3) iniciado pelo kernel. Cria as sessões 0 (serviços) e 1 (usuário).',
      cybersecRole: 'Processo altamente protegido; se for finalizado intencionalmente, o Windows gera um Blue Screen of Death (BSOD CRITICAL_PROCESS_DIED).'
    },
    { 
      pid: 450, 
      ppid: 320, 
      name: 'csrss.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.1, 
      memoryMb: 6.8, 
      path: 'C:\\Windows\\System32\\csrss.exe', 
      expectedPath: 'C:\\Windows\\System32\\csrss.exe',
      status: 'running',
      isProtectedProcess: true,
      integrityLevel: 'System',
      description: 'Client/Server Runtime Subsystem (CSRSS) - Gerencia janelas de console Win32, criação/encerramento de threads e a GUI básica.',
      cybersecRole: 'Frequentemente alvo de técnicas de masquerading; deve sempre rodar a partir de System32 e com usuário SYSTEM.'
    },
    { 
      pid: 580, 
      ppid: 320, 
      name: 'wininit.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.0, 
      memoryMb: 5.1, 
      path: 'C:\\Windows\\System32\\wininit.exe', 
      expectedPath: 'C:\\Windows\\System32\\wininit.exe',
      status: 'running',
      isProtectedProcess: true,
      integrityLevel: 'System',
      description: 'Windows Initialization Process - Inicializa o subsistema de segurança LSASS e o Service Control Manager na Sessão 0.',
      cybersecRole: 'Cria os processos centrais da segurança do Windows (services.exe e lsass.exe).'
    },
    { 
      pid: 650, 
      ppid: 580, 
      name: 'services.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.2, 
      memoryMb: 12.0, 
      path: 'C:\\Windows\\System32\\services.exe', 
      expectedPath: 'C:\\Windows\\System32\\services.exe',
      status: 'running', 
      isProtectedProcess: true,
      integrityLevel: 'System',
      networkPort: 135,
      description: 'Service Control Manager (SCM) - Gerencia o início, parada e configuração de todos os serviços de background do Windows.',
      cybersecRole: 'Alvo principal para persistência de malwares que tentam registrar serviços maliciosos rodando como LocalSystem (T1543.003).'
    },
    { 
      pid: 720, 
      ppid: 580, 
      name: 'lsass.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.5, 
      memoryMb: 28.5, 
      path: 'C:\\Windows\\System32\\lsass.exe', 
      expectedPath: 'C:\\Windows\\System32\\lsass.exe',
      status: 'running',
      isProtectedProcess: true,
      integrityLevel: 'System',
      description: 'Local Security Authority Subsystem Service - Subsistema responsável por autenticação, tokens de acesso, Kerberos e NTLM.',
      cybersecRole: 'ALVO NÚMERO 1 EM CIBERSEGURANÇA: Ferramentas como Mimikatz tentam fazer dump de memória do LSASS para extrair hashes NTLM e tickets Kerberos (MITRE ATT&CK T1003.001). Protegido via PPL (Protected Process Light) e Credential Guard.',
      mitreRef: 'T1003.001'
    },
    { 
      pid: 890, 
      ppid: 650, 
      name: 'svchost.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.3, 
      memoryMb: 18.2, 
      path: 'C:\\Windows\\System32\\svchost.exe', 
      expectedPath: 'C:\\Windows\\System32\\svchost.exe',
      status: 'running', 
      integrityLevel: 'System',
      networkPort: 3389,
      description: 'Generic Host Process for Windows Services - Executa serviços compilados em formato DLL compartilhada.',
      cybersecRole: 'Atacantes frequentemente injetam código (DLL Injection / Process Hollowing - T1055) dentro de svchost legítimos para mascarar tráfego malicioso.'
    },
    { 
      pid: 920, 
      ppid: 320, 
      name: 'winlogon.exe', 
      user: 'NT AUTHORITY\\SYSTEM', 
      cpu: 0.1, 
      memoryMb: 8.4, 
      path: 'C:\\Windows\\System32\\winlogon.exe', 
      expectedPath: 'C:\\Windows\\System32\\winlogon.exe',
      status: 'running',
      isProtectedProcess: true,
      integrityLevel: 'System',
      description: 'Windows Logon Process - Lida com a sequência de atenção segura (SAS / Ctrl+Alt+Del) e carrega o perfil do usuário.',
      cybersecRole: 'Garante que telas falsas de captura de senha não possam interceptar a combinação de teclas de hardware.'
    },
    { 
      pid: 1450, 
      ppid: 920, 
      name: 'explorer.exe', 
      user: 'ALUNO-PC\\Aluno', 
      cpu: 1.1, 
      memoryMb: 65.4, 
      path: 'C:\\Windows\\explorer.exe', 
      expectedPath: 'C:\\Windows\\explorer.exe',
      status: 'running',
      integrityLevel: 'Medium',
      description: 'Windows Explorer Shell - Interface gráfica de usuário, área de trabalho e barra de tarefas do Aluno.',
      cybersecRole: 'Processo pai de quase todas as aplicações iniciadas pelo usuário. Opera com nível de integridade Médio (Medium Integrity).'
    },
    { 
      pid: 2110, 
      ppid: 1450, 
      name: 'powershell.exe', 
      user: 'ALUNO-PC\\Aluno', 
      cpu: 0.4, 
      memoryMb: 48.0, 
      path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', 
      expectedPath: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
      status: 'running',
      integrityLevel: 'Medium',
      description: 'Sessão interativa do PowerShell executada pelo usuário aluno.',
      cybersecRole: 'Interpretador de scripts e cmdlets (MITRE ATT&CK T1059.001).'
    },
    {
      pid: 4992,
      ppid: 1450,
      name: 'updater_svc.exe',
      user: 'ALUNO-PC\\Aluno',
      cpu: 2.4,
      memoryMb: 32.1,
      path: 'C:\\Program Files\\Custom App\\service.exe',
      expectedPath: 'C:\\Program Files\\Custom App\\service.exe',
      status: 'running',
      isSuspicious: true,
      integrityLevel: 'Medium',
      description: 'Binário executado a partir de caminho sem aspas e gravável por Users comuns.',
      cybersecRole: 'Unquoted Service Path (T1574.009) e serviço não homologado em porta 8089.',
      mitreRef: 'T1574.009',
      networkPort: 8089
    }
  ];

  constructor(initialFS: FileNode) {
    this.rootFS = JSON.parse(JSON.stringify(initialFS));
  }

  public getCurrentDir(): string {
    return this.currentDir;
  }

  public getCurrentUser(): string {
    return this.currentUser;
  }

  public getProcesses(): OSProcess[] {
    return [...this.processes];
  }

  public getAutoCompleteOptions(prefix: string): string[] {
    const tokens = this.parseArgs(prefix);
    const lastToken = tokens[tokens.length - 1] || '';

    if (tokens.length <= 1) {
      const commands = [
        'Get-Process', 'ps', 'pstree', 'tasklist', 'Get-Service', 'Get-ChildItem', 'dir', 'ls',
        'Get-Content', 'type', 'cat', 'Get-Location', 'pwd', 'Set-Location', 'cd',
        'whoami', 'icacls', 'netstat', 'sc', 'sc.exe', 'Get-EventLog',
        'Get-ScheduledTask', 'Stop-Process', 'taskkill', 'New-Item', 'Remove-Item', 'cls', 'clear', 'help'
      ];
      return commands.filter(c => c.toLowerCase().startsWith(lastToken.toLowerCase()));
    }

    const currentNode = this.getNodeByWindowsPath(this.currentDir);
    if (!currentNode || !currentNode.children) return [];

    return Object.keys(currentNode.children)
      .filter(name => name.toLowerCase().startsWith(lastToken.toLowerCase()))
      .map(name => {
        const full = [...tokens.slice(0, -1), name].join(' ');
        return full;
      });
  }

  public execute(cmdLine: string): CommandResult {
    const trimmed = cmdLine.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0, syscalls: [], edrAlerts: [] };
    }

    const syscalls: SyscallTrace[] = [];
    const edrAlerts: EDRAlert[] = [];

    this.inspectEDR(trimmed, edrAlerts);

    if (trimmed.includes('>')) {
      const isAppend = trimmed.includes('>>');
      const parts = trimmed.split(isAppend ? '>>' : '>');
      const commandPart = parts[0].trim();
      const targetFilePath = parts[1].trim().replace(/['"]/g, '');

      const cmdExec = this.executeCommandInternal(commandPart, syscalls);
      const writeResult = this.writeFileInternal(targetFilePath, cmdExec.output, isAppend, syscalls);

      return {
        output: writeResult.error || '',
        exitCode: writeResult.error ? 1 : 0,
        syscalls,
        edrAlerts,
        stateChanges: {
          filesModified: [targetFilePath]
        }
      };
    }

    if (trimmed.toLowerCase().startsWith('start-process powershell -verb runas') || trimmed.toLowerCase() === 'elevate') {
      this.currentUser = 'NT AUTHORITY\\SYSTEM';
      syscalls.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'windows',
        syscall: 'NtDuplicateToken / SeImpersonatePrivilege',
        subsystem: 'Security',
        parameters: 'TokenElevationTypeFull',
        returnCode: 0,
        ringLevel: 'Ring 0 (Kernel Mode)',
        explanation: 'O subsistema de segurança LSASS e o Kernel do Windows alocam um token primário com Integrity Level SYSTEM.'
      });

      return {
        output: 'PS C:\\Windows\\System32> Sessão elevada iniciada com privilégios de NT AUTHORITY\\SYSTEM / Administrator.',
        exitCode: 0,
        syscalls,
        edrAlerts
      };
    }

    const res = this.executeCommandInternal(trimmed, syscalls);
    return { ...res, syscalls, edrAlerts };
  }

  private inspectEDR(cmdLine: string, edrAlerts: EDRAlert[]) {
    const lower = cmdLine.toLowerCase();

    if (lower.includes('whoami /priv')) {
      edrAlerts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'windows',
        ruleName: 'Enumeração de Privilégios de Token Local (whoami /priv)',
        severity: 'MÉDIA',
        mitreId: 'T1087.001',
        mitreTechnique: 'Account Discovery: Local Account Privilege Discovery',
        triggeredCommand: cmdLine,
        analystSummary: 'Comando inspecionou se privilégios de alta criticidade como SeDebugPrivilege ou SeImpersonatePrivilege estão concedidos.',
        remediationAdvice: 'Garantir que usuários padrão não façam parte do grupo Local Administrators.'
      });
    }

    if (lower.includes('sc qc winvulnerableupdater') || (lower.includes('sc qc') && lower.includes('service.exe'))) {
      edrAlerts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'windows',
        ruleName: 'Inspeção de Serviço com Potencial Unquoted Service Path',
        severity: 'ALTA',
        mitreId: 'T1574.009',
        mitreTechnique: 'Hijack Execution Flow: Path Interception by Unquoted Path',
        triggeredCommand: cmdLine,
        analystSummary: 'Comando consultou a configuração de um serviço com caminho de executável sem aspas e contendo espaços.',
        remediationAdvice: 'Envolver caminhos binários de serviços entre aspas duplas no Registro (ImagePath).'
      });
    }

    if (lower.includes('get-eventlog') || lower.includes('security.evtx')) {
      edrAlerts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'windows',
        ruleName: 'Consulta Direta a Eventos de Auditoria e Logon (Event ID 4624/4625)',
        severity: 'BAIXA',
        mitreId: 'T1078',
        mitreTechnique: 'Valid Accounts & Log Inspection',
        triggeredCommand: cmdLine,
        analystSummary: 'Analista de segurança ou atacante consultando canais de auditoria de autenticação.',
        remediationAdvice: 'Centralizar eventos do Security.evtx em um SIEM para evitar adulteração local.'
      });
    }
  }

  private parseArgs(cmdLine: string): string[] {
    const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(cmdLine)) !== null) {
      matches.push(match[1] ?? match[2] ?? match[0]);
    }
    return matches;
  }

  private executeCommandInternal(cmdLine: string, syscalls: SyscallTrace[]): CommandResult {
    const tokens = this.parseArgs(cmdLine);
    if (tokens.length === 0) return { output: '', exitCode: 0 };
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    syscalls.push({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      os: 'windows',
      syscall: `NtCreateUserProcess("${cmd}")`,
      subsystem: 'Process',
      parameters: args.join(' '),
      returnCode: 0,
      ringLevel: 'Ring 0 (Kernel Mode)',
      explanation: 'O Executive do Windows cria o objeto EPROCESS e aloca a PEB (Process Environment Block).'
    });

    switch (cmd) {
      case 'cls':
      case 'clear':
        return { output: '\x1b[2J\x1b[0;0H', exitCode: 0 };

      case 'pwd':
      case 'get-location':
        return {
          output: `Path\n----\n${this.currentDir}`,
          exitCode: 0
        };

      case 'tasklist':
      case 'pstree': {
        const lines = [
          'Nome da Imagem                 PID  PPID Sessão         Uso de Memória',
          '========================= ======== ===== ============ ===============',
          'System Idle Process              0     0 Services                 8 K',
          'System                           4     0 Services             46.080 K',
          'smss.exe                       320     4 Services              4.300 K [PPL Protected]',
          'csrss.exe                      450   320 Services              6.963 K [PPL Protected]',
          'wininit.exe                    580   320 Services              5.222 K [PPL Protected]',
          'services.exe                   650   580 Services             12.288 K',
          'lsass.exe                      720   580 Services             29.184 K [PPL Protected - LSA]',
          'svchost.exe                    890   650 Services             18.636 K',
          'winlogon.exe                   920   320 Console               8.601 K [PPL Protected]',
          'explorer.exe                  1450   920 Console              66.969 K',
          'powershell.exe                2110  1450 Console              49.152 K',
          'updater_svc.exe               4992  1450 Console              32.870 K [SUSPEITO]*'
        ];
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'whoami': {
        if (args.includes('/priv')) {
          return {
            output: `INFORMAÇÕES DE PRIVILÉGIOS
--------------------------
Nome do Privilégio                Descrição                                 Estado
================================= ========================================= ========
SeChangeNotifyPrivilege           Ignorar verificação de passagem           Habilitado
${this.currentUser.includes('SYSTEM') ? 'SeDebugPrivilege                 Depurar programas                         Habilitado\nSeImpersonatePrivilege           Representar um cliente após autenticação   Habilitado\nSeBackupPrivilege                Fazer backup de arquivos e diretórios      Habilitado' : 'SeShutdownPrivilege               Desligar o sistema                        Desabilitado'}`,
            exitCode: 0
          };
        }
        if (args.includes('/all') || args.includes('-all')) {
          return {
            output: `INFORMAÇÕES DO USUÁRIO
----------------------
Nome do usuário: ${this.currentUser}
SID: S-1-5-21-392819283-2918293-1001

INFORMAÇÕES DE GRUPO
--------------------
Nome do grupo                                          Tipo             SID
====================================================== ================ ============
Everyone                                               Well-known group S-1-1-0
BUILTIN\\Users                                          Alias            S-1-5-32-545
NT AUTHORITY\\INTERACTIVE                              Well-known group S-1-5-4
${this.currentUser.includes('SYSTEM') ? 'BUILTIN\\Administrators                                Alias            S-1-5-32-544' : ''}`,
            exitCode: 0
          };
        }
        return { output: this.currentUser, exitCode: 0 };
      }

      case 'stop-process':
      case 'taskkill': {
        let pid = 0;
        const idFlagIdx = args.findIndex(a => a.toLowerCase() === '-id' || a.toLowerCase() === '/pid');
        if (idFlagIdx !== -1 && args[idFlagIdx + 1]) {
          pid = parseInt(args[idFlagIdx + 1], 10);
        } else {
          const numToken = args.find(a => !isNaN(parseInt(a, 10)) && parseInt(a, 10) > 0);
          if (numToken) {
            pid = parseInt(numToken, 10);
          }
        }

        if (!pid) {
          return { output: 'Stop-Process : informe o PID do processo. Exemplo: Stop-Process -Id 4992', exitCode: 1 };
        }

        const procIdx = this.processes.findIndex(p => p.pid === pid);
        if (procIdx === -1) {
          return { output: `Stop-Process : Não é possível localizar um processo com o identificador de processo ${pid}.`, exitCode: 1 };
        }

        const proc = this.processes[procIdx];
        if (proc.isProtectedProcess && !this.currentUser.includes('SYSTEM')) {
          return { output: `Stop-Process : Acesso negado. O processo '${proc.name}' é protegido pelo sistema (PPL Protected Process).`, exitCode: 1 };
        }

        this.processes.splice(procIdx, 1);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'windows',
          syscall: `NtTerminateProcess(Handle, 0)`,
          subsystem: 'Process',
          parameters: `PID=${pid}`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Kernel do Windows cancela todas as threads do processo e fecha os Handles de memória aberta.'
        });

        if (proc.pid === 4992 || proc.name === 'updater_svc.exe') {
          return {
            output: `[DEFESA] Processo suspeito ${proc.name} (PID ${pid}) terminado com sucesso! Porta 8089 fechada.`,
            exitCode: 0,
            stateChanges: {
              processKilled: pid,
              flagDiscovered: 'FLAG{WINLINX_WINDOWS_MALICIOUS_PROCESS_TERMINATED_2026}'
            }
          };
        }

        return { output: `Processo ${proc.name} (PID ${pid}) finalizado.`, exitCode: 0 };
      }

      case 'cd':
      case 'set-location': {
        const target = args[0] || 'C:\\Users\\Aluno';
        const normalized = this.normalizeWindowsPath(target);
        const node = this.getNodeByWindowsPath(normalized);
        if (!node) {
          return { output: `Set-Location : Não é possível localizar o caminho '${target}' porque ele não existe.`, exitCode: 1 };
        }
        if (node.type !== 'dir') {
          return { output: `Set-Location : O caminho '${target}' não é um diretório.`, exitCode: 1 };
        }
        if (node.isProtected && !this.currentUser.includes('SYSTEM')) {
          return { output: `Acesso negado ao diretório '${target}'. Privilégios insuficientes.`, exitCode: 1 };
        }
        this.currentDir = normalized;
        return { output: '', exitCode: 0 };
      }

      case 'dir':
      case 'ls':
      case 'get-childitem': {
        const target = args.find(a => !a.startsWith('-') && !a.startsWith('/')) || this.currentDir;
        const normalized = this.normalizeWindowsPath(target);
        const node = this.getNodeByWindowsPath(normalized);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'windows',
          syscall: `NtQueryDirectoryFile(Handle, FileBothDirectoryInformation)`,
          subsystem: 'FileSystem',
          parameters: `Path="${normalized}"`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O driver do sistema de arquivos NTFS (ntfs.sys) retorna as entradas da Master File Table (MFT).'
        });

        if (!node) {
          return { output: `Get-ChildItem : Não foi possível encontrar o caminho '${target}'.`, exitCode: 1 };
        }

        if (node.type === 'file') {
          return {
            output: `    Directory: ${normalized}\n\nMode                LastWriteTime         Length Name\n----                -------------         ------ ----\n-a----       22/11/2026     10:00        ${node.size || 1024} ${node.name}`,
            exitCode: 0
          };
        }

        const entries = Object.values(node.children || {});
        const lines = [
          `    Directory: ${normalized}`,
          '',
          'Mode                LastWriteTime         Length Name',
          '----                -------------         ------ ----'
        ];

        for (const item of entries) {
          const mode = item.type === 'dir' ? 'd-----' : '-a----';
          const size = item.type === 'dir' ? '' : (item.size || 1024).toString().padStart(6);
          lines.push(`${mode}       22/11/2026     10:00        ${size.padEnd(8)} ${item.name}`);
        }

        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'type':
      case 'cat':
      case 'get-content': {
        if (!args[0]) {
          return { output: 'Get-Content : Forneça o nome do arquivo.', exitCode: 1 };
        }
        const normalized = this.normalizeWindowsPath(args[0]);
        const node = this.getNodeByWindowsPath(normalized);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'windows',
          syscall: `NtOpenFile(Handle, FILE_READ_DATA, DACL_CHECK)`,
          subsystem: 'FileSystem',
          parameters: `Path="${normalized}"`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Security Reference Monitor (SRM) do kernel valida a DACL do arquivo com o token de segurança da thread.'
        });

        if (!node) {
          return { output: `Get-Content : Não é possível localizar o arquivo '${args[0]}'.`, exitCode: 1 };
        }
        if (node.type === 'dir') {
          return { output: `Get-Content : '${args[0]}' é um diretório e não um arquivo de texto.`, exitCode: 1 };
        }
        return { output: node.content || `[Arquivo binário: ${node.name}]`, exitCode: 0 };
      }

      case 'ps':
      case 'get-process': {
        const lines = [
          'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id   PPID ProcessName',
          '-------  ------    -----      -----     ------     --   ---- -----------'
        ];
        for (const p of this.processes) {
          lines.push(
            `    ${Math.floor(p.memoryMb * 8).toString().padStart(3)}      14    ${Math.floor(p.memoryMb * 1024).toString().padStart(6)}     ${Math.floor(p.memoryMb * 1200).toString().padStart(6)}       ${p.cpu.toFixed(2)}   ${p.pid.toString().padStart(4)}   ${p.ppid.toString().padStart(4)} ${p.name.replace('.exe', '')}`
          );
        }
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'netstat': {
        const hasSuspicious = this.processes.some(p => p.pid === 4992);
        const lines = [
          'Conexões Ativas',
          '',
          '  Proto  Endereço Local          Endereço Externo        Estado          PID',
          '  TCP    0.0.0.0:135             0.0.0.0:0               LISTENING       650',
          '  TCP    0.0.0.0:445             0.0.0.0:0               LISTENING       4',
          '  TCP    0.0.0.0:3389            0.0.0.0:0               LISTENING       890'
        ];
        if (hasSuspicious) {
          lines.push('  TCP    0.0.0.0:8089            0.0.0.0:0               LISTENING       4992  <-- [Serviço Não Homologado]');
        }
        lines.push('  TCP    192.168.1.50:49210      198.51.100.22:443       ESTABLISHED     1450');
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'icacls': {
        const target = args[0] || this.currentDir;
        const normalized = this.normalizeWindowsPath(target);
        const node = this.getNodeByWindowsPath(normalized);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'windows',
          syscall: `NtQuerySecurityObject(Handle, DACL_SECURITY_INFORMATION)`,
          subsystem: 'Security',
          parameters: `Path="${normalized}"`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Kernel lê a estrutura de dados SECURITY_DESCRIPTOR armazenada nos atributos NTFS do arquivo.'
        });

        if (!node) {
          return { output: `${target}: O sistema não pode encontrar o arquivo especificado.`, exitCode: 1 };
        }

        if (normalized.includes('Custom App') || node.name === 'Custom App') {
          if (cmdLine.includes('/remove') || cmdLine.includes('/grant:r')) {
            node.permissions = 'NTFS: BUILTIN\\Administrators:(F), NT AUTHORITY\\SYSTEM:(F), BUILTIN\\Users:(RX)';
            return {
              output: `processado o arquivo: ${normalized}\n1 arquivos processados com êxito; 0 arquivos com falha de processamento.\n[DEFESA] Permissão indevida de Modificação removida de BUILTIN\\Users!`,
              exitCode: 0,
              stateChanges: {
                flagDiscovered: 'FLAG{WINLINX_WINDOWS_ICACLS_REMEDIATED_2026}'
              }
            };
          }

          return {
            output: `${normalized} BUILTIN\\Users:(M,W,R)   <-- [VULNERABILIDADE: Usuários sem privilégio têm permissão de gravação/modificação!]
                       BUILTIN\\Administrators:(I)(F)
                       NT AUTHORITY\\SYSTEM:(I)(F)`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_WINDOWS_WEAK_DACL_AUDITED}'
            }
          };
        }

        return {
          output: `${normalized} NT AUTHORITY\\SYSTEM:(F)
                       BUILTIN\\Administrators:(F)
                       ALUNO-PC\\Aluno:(R,W)`,
          exitCode: 0
        };
      }

      case 'get-service': {
        return {
          output: `Status   Name               DisplayName
------   ----               -----------
Running  EventLog           Windows Event Log
Running  LanmanServer       Server
Running  LanmanWorkstation  Workstation
Running  PlugPlay           Plug and Play
Running  WinVulnerableUp... Custom App Updater Service  <-- [Alvo de Investigação]
Stopped  wuauserv           Windows Update`,
          exitCode: 0
        };
      }

      case 'sc.exe':
      case 'sc': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'qc') {
          const svcName = args[1] || 'WinVulnerableUpdater';
          return {
            output: `[SC] QueryServiceConfig SUCESSO

NOME_DO_SERVIÇO: ${svcName}
        TIPO               : 10  WIN32_OWN_PROCESS
        TIPO_INICIALIZAÇÃO : 2   AUTO_START
        CONTROLE_ERRO      : 1   NORMAL
        NOME_CAMINHO_BINÁR : C:\\Program Files\\Custom App\\service.exe  <-- [Unquoted Service Path!]
        GRUPO_ORDEM_CARREG :
        MARCA              : 0
        NOME_DE_EXIBIÇÃO   : Custom App Updater Service
        DEPENDÊNCIAS       :
        NOME_INÍCIO_SERVIÇO: LocalSystem`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_UNQUOTED_PATH_IDENTIFIED}'
            }
          };
        }
        return { output: 'Sintaxe: sc qc <NomeDoServiço>', exitCode: 0 };
      }

      case 'get-eventlog': {
        const log = this.getNodeByWindowsPath('C:\\Windows\\Logs\\Security.evtx');
        return {
          output: log?.content || 'Nenhum log encontrado.',
          exitCode: 0
        };
      }

      case 'get-scheduledtask': {
        return {
          output: `TaskPath               TaskName                 State
--------               --------                 -----
\\                      MicrosoftEdgeUpdateTask  Ready
\\Microsoft\\Windows\\...  Defrag                   Ready
\\Custom\\               DailyTelemetrySync       Ready  (Executa: C:\\Program Files\\Custom App\\service.exe -sync)`,
          exitCode: 0
        };
      }

      case 'echo':
      case 'write-output': {
        return { output: args.join(' ').replace(/^['"]|['"]$/g, ''), exitCode: 0 };
      }

      case 'help':
      case 'get-help': {
        return {
          output: `Comandos suportados no Simulador Windows PowerShell (WinLinx Enterprise):
- Processos & Árvore: Get-Process, ps, pstree, tasklist, Stop-Process -Id <PID>, taskkill, netstat -ano
- VFS & Arquivos: pwd, Get-Location, cd, dir, ls, Get-ChildItem, cat, type, Get-Content, echo [> | >>]
- Identidade & Token: whoami, whoami /priv, whoami /all, elevate
- Segurança & DACL: icacls <caminho>, icacls <caminho> /remove "BUILTIN\\Users"
- Serviços & Persistência: Get-Service, sc qc <serviço>, Get-ScheduledTask
- Auditoria: Get-EventLog -LogName Security`,
          exitCode: 0
        };
      }

      default:
        return {
          output: `${cmd} : O termo '${cmd}' não é reconhecido como nome de cmdlet, função, arquivo de script ou programa operável. Digite 'help' para ajuda.`,
          exitCode: 1
        };
    }
  }

  private writeFileInternal(pathStr: string, content: string, isAppend: boolean, syscalls: SyscallTrace[]): { error?: string } {
    const normalized = this.normalizeWindowsPath(pathStr);
    const parts = normalized.split('\\');
    const fileName = parts.pop();
    const parentPath = parts.join('\\');
    const parent = this.getNodeByWindowsPath(parentPath);

    if (!parent || parent.type !== 'dir') {
      return { error: `Set-Content : Não foi possível localizar o diretório '${parentPath}'.` };
    }

    if (!parent.children) parent.children = {};

    if (fileName) {
      if (parent.children[fileName]) {
        const existing = parent.children[fileName];
        existing.content = isAppend ? (existing.content + '\r\n' + content) : content;
        existing.size = (existing.content || '').length;
      } else {
        parent.children[fileName] = {
          name: fileName,
          type: 'file',
          permissions: 'NTFS: BUILTIN\\Users:(RW), Administrators:(F)',
          owner: this.currentUser,
          content,
          size: content.length
        };
      }

      syscalls.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'windows',
        syscall: `NtWriteFile(Handle, Buffer, Length)`,
        subsystem: 'FileSystem',
        parameters: `Bytes=${content.length}`,
        returnCode: 0,
        ringLevel: 'Ring 0 (Kernel Mode)',
        explanation: 'O Kernel grava os dados na cache do sistema e delega ao driver ntfs.sys a atualização dos clusters de disco.'
      });
    }

    return {};
  }

  private normalizeWindowsPath(pathStr: string): string {
    let p = pathStr.replace(/\//g, '\\');
    if (p.startsWith('C:\\') || p.startsWith('c:\\')) {
      return p;
    }
    if (p === '..') {
      const parts = this.currentDir.split('\\');
      if (parts.length > 1) {
        parts.pop();
        return parts.join('\\');
      }
      return 'C:';
    }
    if (p === '.') return this.currentDir;

    return `${this.currentDir}\\${p}`.replace(/\\\\+/g, '\\');
  }

  private getNodeByWindowsPath(pathStr: string): FileNode | null {
    const clean = pathStr.replace(/^[cC]:\\?/, '');
    if (!clean) return this.rootFS;

    const parts = clean.split('\\').filter(Boolean);
    let current: FileNode | undefined = this.rootFS;

    for (const part of parts) {
      if (!current || !current.children) return null;
      const childKeys: string[] = Object.keys(current.children);
      const matchedKey: string | undefined = childKeys.find(k => k.toLowerCase() === part.toLowerCase());
      if (!matchedKey) return null;
      current = current.children[matchedKey];
    }
    return current || null;
  }
}
