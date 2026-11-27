import { CommandResult, FileNode, OSProcess, SyscallTrace, EDRAlert, ForensicLogRecord } from '../types/simulator';

export class LinuxSimulatorEngine {
  private currentDir: string = '/home/aluno';
  private currentUser: string = 'aluno';
  private rootFS: FileNode;
  private envVars: Record<string, string> = {
    USER: 'aluno',
    HOME: '/home/aluno',
    PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color'
  };
  private firewallBlockedPorts: number[] = [];
  private firewallActive: boolean = true;

  public getFirewallStatus() {
    return {
      active: this.firewallActive,
      blockedPorts: [...this.firewallBlockedPorts]
    };
  }

  public getRootFS(): FileNode {
    return JSON.parse(JSON.stringify(this.rootFS));
  }

  private processes: OSProcess[] = [
    {
      pid: 1,
      ppid: 0,
      name: 'systemd',
      user: 'root',
      cpu: 0.1,
      memoryMb: 14.8,
      path: '/sbin/init',
      expectedPath: '/sbin/init',
      status: 'running',
      isProtectedProcess: true,
      description: 'Init System (PID 1) - Ancestral de todos os processos de espaço de usuário (Ring 3), gerencia cgroups, targets e units de serviço.',
      cybersecRole: 'Controla inicialização segura, sandboxing de serviços (ProtectSystem=full, PrivateTmp=true).'
    },
    {
      pid: 2,
      ppid: 0,
      name: 'kthreadd',
      user: 'root',
      cpu: 0.0,
      memoryMb: 0.0,
      path: '[kthreadd]',
      expectedPath: '[kthreadd]',
      status: 'running',
      isProtectedProcess: true,
      description: 'Kernel Thread Daemon (PID 2) - Criador e coordenador de todas as threads que operam diretamente no espaço de Kernel (Ring 0).',
      cybersecRole: 'Processos com PPID 2 são threads de kernel legítimas. Malwares em user-mode que tentam usar nomes [kworker] são facilmente detectados por terem PPID diferente de 2.'
    },
    {
      pid: 350,
      ppid: 1,
      name: 'systemd-journald',
      user: 'root',
      cpu: 0.2,
      memoryMb: 18.2,
      path: '/lib/systemd/systemd-journald',
      expectedPath: '/lib/systemd/systemd-journald',
      status: 'running',
      description: 'Serviço de coleta, indexação e armazenamento seguro de logs de eventos do sistema operacional.',
      cybersecRole: 'Primeira linha de telemetria para detecção de anomalias e auditoria de segurança (journalctl).'
    },
    {
      pid: 380,
      ppid: 1,
      name: 'systemd-udevd',
      user: 'root',
      cpu: 0.0,
      memoryMb: 9.4,
      path: '/lib/systemd/systemd-udevd',
      expectedPath: '/lib/systemd/systemd-udevd',
      status: 'running',
      description: 'Gerenciador de eventos de hardware e nós de dispositivos em /dev.',
      cybersecRole: 'Monitora conexões USB e hardware externo (prevenção contra ataques BadUSB e Rubber Ducky).'
    },
    {
      pid: 412,
      ppid: 1,
      name: 'sshd',
      user: 'root',
      cpu: 0.0,
      memoryMb: 8.5,
      path: '/usr/sbin/sshd',
      expectedPath: '/usr/sbin/sshd',
      status: 'running',
      networkPort: 22,
      description: 'OpenSSH Daemon - Servidor de acesso remoto criptografado via SSH (Secure Shell).',
      cybersecRole: 'Alvo constante de ataques de força bruta (T1110) e roubo de chaves SSH autorizadas.'
    },
    {
      pid: 520,
      ppid: 1,
      name: 'dbus-daemon',
      user: 'messagebus',
      cpu: 0.0,
      memoryMb: 6.2,
      path: '/usr/bin/dbus-daemon',
      expectedPath: '/usr/bin/dbus-daemon',
      status: 'running',
      description: 'Barramento de comunicação inter-processos (IPC) do sistema Linux.',
      cybersecRole: 'Permite comunicação segura entre processos; políticas D-Bus mal configuradas podem permitir elevação de privilégios.'
    },
    {
      pid: 615,
      ppid: 1,
      name: 'cron',
      user: 'root',
      cpu: 0.0,
      memoryMb: 4.1,
      path: '/usr/sbin/cron',
      expectedPath: '/usr/sbin/cron',
      status: 'running',
      description: 'Daemon de execução e agendamento de tarefas programadas (crontab).',
      cybersecRole: 'Vetor mais frequente de persistência de malware no Linux (MITRE ATT&CK T1053.003).'
    },
    {
      pid: 650,
      ppid: 1,
      name: 'auditd',
      user: 'root',
      cpu: 0.1,
      memoryMb: 11.0,
      path: '/sbin/auditd',
      expectedPath: '/sbin/auditd',
      status: 'running',
      isProtectedProcess: true,
      description: 'Subsistema de auditoria de segurança do Linux Kernel.',
      cybersecRole: 'Gera telemetria sobre execução de comandos, chamadas de sistema (syscalls) e alterações de permissões sensíveis.'
    },
    {
      pid: 782,
      ppid: 1,
      name: 'nginx',
      user: 'www-data',
      cpu: 0.4,
      memoryMb: 24.0,
      path: '/usr/sbin/nginx',
      expectedPath: '/usr/sbin/nginx',
      status: 'running',
      networkPort: 80,
      description: 'Servidor Web HTTP/Reverse Proxy de alta performance.',
      cybersecRole: 'Executa isolado sob a conta www-data com menor privilégio para evitar acesso root em caso de exploração de vulnerabilidades web.'
    },
    {
      pid: 1042,
      ppid: 412,
      name: 'bash',
      user: 'aluno',
      cpu: 0.0,
      memoryMb: 6.8,
      path: '/bin/bash',
      expectedPath: '/bin/bash',
      status: 'running',
      description: 'Sessão interativa do aluno logado via SSH.',
      cybersecRole: 'Interpretador de comandos (T1059.004).'
    },
    {
      pid: 1337,
      ppid: 1042,
      name: 'kworker_rev',
      user: 'backup-user',
      cpu: 1.8,
      memoryMb: 14.2,
      path: '/tmp/.hidden/kworker_rev',
      expectedPath: '[kworker/*]',
      status: 'running',
      isSuspicious: true,
      description: 'Processo malicioso disfarçado de worker de kernel rodando em /tmp/.hidden.',
      cybersecRole: 'Exemplo prático de Masquerading (T1036) e conexão de Reverse Shell (T1049).',
      mitreRef: 'T1036',
      networkPort: 4444
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
        'ls', 'cd', 'cat', 'pwd', 'whoami', 'id', 'uname', 'ps', 'pstree', 'ss', 'netstat',
        'find', 'chmod', 'chown', 'systemctl', 'journalctl', 'crontab', 'touch',
        'mkdir', 'rm', 'kill', 'echo', 'env', 'export', 'clear', 'help'
      ];
      return commands.filter(c => c.startsWith(lastToken));
    }

    const currentNode = this.getNodeByPath(this.currentDir);
    if (!currentNode || !currentNode.children) return [];

    return Object.keys(currentNode.children)
      .filter(name => name.startsWith(lastToken))
      .map(name => {
        const full = [...tokens.slice(0, -1), name].join(' ');
        return full;
      });
  }

  public execute(cmdLine: string): CommandResult {
    const trimmed = cmdLine.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0, syscalls: [], edrAlerts: [], forensicLogs: [] };
    }

    const syscalls: SyscallTrace[] = [];
    const edrAlerts: EDRAlert[] = [];
    const forensicLogs: ForensicLogRecord[] = [];
    const timestamp = new Date().toLocaleTimeString();

    this.inspectEDR(trimmed, edrAlerts);

    // Auditoria de Kernel Linux (auditd SYSCALL log)
    const baseCommand = trimmed.split(' ')[0];
    forensicLogs.push({
      id: Math.random().toString(),
      timestamp,
      os: 'linux',
      source: 'audit.log',
      facility: 'SYSCALL',
      severity: 'INFO',
      user: this.currentUser,
      computer: 'WINLINX-LNX-01',
      processName: baseCommand,
      commandLine: trimmed,
      details: `type=SYSCALL arch=x86_64 syscall=59 (execve) comm="${baseCommand}" exe="/usr/bin/${baseCommand}" ppid=1042 pid=${Math.floor(1200 + Math.random() * 8000)} auid=1000 uid=${this.currentUser === 'root' ? 0 : 1000} euid=${this.currentUser === 'root' ? 0 : 1000} success=yes exit=0`,
      mitreRef: edrAlerts.length > 0 ? edrAlerts[0].mitreId : undefined
    });

    if (trimmed.startsWith('sudo') || trimmed.includes('/etc/shadow') || trimmed.includes('su -')) {
      forensicLogs.push({
        id: Math.random().toString(),
        timestamp,
        os: 'linux',
        source: 'auth.log',
        facility: 'AUTH',
        severity: trimmed.includes('/etc/shadow') ? 'CRITICAL' : 'WARNING',
        user: this.currentUser,
        computer: 'WINLINX-LNX-01',
        processName: 'sudo/pam',
        commandLine: trimmed,
        details: `pam_unix(sudo:session): session opened for user root(uid=0) by ${this.currentUser}(uid=1000) - cmd: ${trimmed}`,
        mitreRef: 'T1548.003'
      });
    }

    if (trimmed.includes('>') && !trimmed.includes('2>')) {
      const isAppend = trimmed.includes('>>');
      const parts = trimmed.split(isAppend ? '>>' : '>');
      const commandPart = parts[0].trim();
      const targetFilePath = parts[1].trim();

      const cmdExec = this.executeCommandInternal(commandPart, syscalls);
      const writeResult = this.writeFileInternal(targetFilePath, cmdExec.output, isAppend, syscalls);

      return {
        output: writeResult.error || '',
        exitCode: writeResult.error ? 1 : 0,
        syscalls,
        edrAlerts,
        forensicLogs,
        stateChanges: {
          filesModified: [targetFilePath]
        }
      };
    }

    if (trimmed.startsWith('sudo ')) {
      const rest = trimmed.slice(5).trim();
      syscalls.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'linux',
        syscall: 'setuid(0)',
        subsystem: 'Security',
        parameters: 'uid=0',
        returnCode: 0,
        ringLevel: 'Ring 0 (Kernel Mode)',
        explanation: 'O processo solicita ao kernel a elevação para o UID 0 (root) através do bit de privilégio.'
      });

      if (rest.startsWith('su') || rest === 'bash') {
        this.currentUser = 'root';
        this.envVars.USER = 'root';
        this.envVars.HOME = '/root';
        return {
          output: 'Autenticação bem-sucedida. Sessão elevada para root (UID=0).',
          exitCode: 0,
          syscalls,
          edrAlerts,
          forensicLogs
        };
      }

      const prevUser = this.currentUser;
      this.currentUser = 'root';
      const res = this.executeCommandInternal(rest, syscalls);
      this.currentUser = prevUser;
      return { ...res, syscalls, edrAlerts, forensicLogs };
    }

    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map(p => p.trim());
      let currentOutput = '';
      for (const part of parts) {
        if (part.startsWith('grep ')) {
          const search = part.slice(5).trim().replace(/['"]/g, '');
          const lines = currentOutput.split('\n');
          currentOutput = lines.filter(l => l.toLowerCase().includes(search.toLowerCase())).join('\n');
        } else {
          const res = this.executeCommandInternal(part, syscalls);
          currentOutput = res.output;
        }
      }
      return { output: currentOutput, exitCode: 0, syscalls, edrAlerts, forensicLogs };
    }

    const execResult = this.executeCommandInternal(trimmed, syscalls);
    return { ...execResult, syscalls, edrAlerts, forensicLogs };
  }

  private inspectEDR(cmdLine: string, edrAlerts: EDRAlert[]) {
    const lower = cmdLine.toLowerCase();

    if (lower.includes('find / -perm -4000') || lower.includes('-u=s')) {
      edrAlerts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'linux',
        ruleName: 'Reconhecimento de Binários SUID',
        severity: 'ALTA',
        mitreId: 'T1548.001',
        mitreTechnique: 'Abuse Elevation Control Mechanism: Setuid and Setgid',
        triggeredCommand: cmdLine,
        analystSummary: 'Comando disparou varredura em todo o sistema de arquivos buscando executáveis com privilégio root embutido.',
        remediationAdvice: 'Auditar se o usuário aluno possui autorização para varredura de privilégios e restringir binários sem bit SUID necessário.'
      });
    }

    if (lower.includes('/tmp/.hidden') || lower.includes('kworker_rev')) {
      edrAlerts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'linux',
        ruleName: 'Execução de Binário a partir de Diretório Temporário Oculto',
        severity: 'CRÍTICA',
        mitreId: 'T1036',
        mitreTechnique: 'Masquerading: Match Legitimate Name or Location',
        triggeredCommand: cmdLine,
        analystSummary: 'Processo com nome falso de kernel worker executando de /tmp/.hidden com PPID 1042 (deveria ser PPID 2).',
        remediationAdvice: 'Montar a partição /tmp com flag noexec e finalizar imediatamente o processo suspeito.'
      });
    }

    if (lower.includes('/etc/shadow')) {
      edrAlerts.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'linux',
        ruleName: 'Tentativa de Acesso a Credenciais Hash (/etc/shadow)',
        severity: 'ALTA',
        mitreId: 'T1003.008',
        mitreTechnique: 'OS Credential Dumping: /etc/passwd and /etc/shadow',
        triggeredCommand: cmdLine,
        analystSummary: 'Tentativa de leitura de arquivo contendo hashes salgados das senhas de usuários locais.',
        remediationAdvice: 'Validar políticas de acesso e auditar permissões DACL/POSIX do arquivo /etc/shadow.'
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
    const cmd = tokens[0];
    const args = tokens.slice(1);

    syscalls.push({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      os: 'linux',
      syscall: `execve("${cmd}", [...], [${this.currentUser}])`,
      subsystem: 'Process',
      parameters: args.join(' '),
      returnCode: 0,
      ringLevel: 'Ring 0 (Kernel Mode)',
      explanation: 'O Kernel Linux cria a imagem do executável em memória alocando pilha, heap e descritores de arquivo padrão (0, 1, 2).'
    });

    switch (cmd) {
      case 'clear':
        return { output: '\x1b[2J\x1b[0;0H', exitCode: 0 };

      case 'pwd':
        return { output: this.currentDir, exitCode: 0 };

      case 'whoami':
        return { output: this.currentUser, exitCode: 0 };

      case 'id': {
        if (this.currentUser === 'root') {
          return { output: 'uid=0(root) gid=0(root) groups=0(root)', exitCode: 0 };
        }
        return { output: 'uid=1000(aluno) gid=1000(aluno) groups=1000(aluno),27(sudo)', exitCode: 0 };
      }

      case 'pstree': {
        const lines = [
          'systemd(1)─┬─systemd-journald(350)',
          '           ├─systemd-udevd(380)',
          '           ├─sshd(412)───bash(1042)───kworker_rev(1337)*',
          '           ├─dbus-daemon(520)',
          '           ├─cron(615)',
          '           ├─auditd(650)',
          '           └─nginx(782)───nginx(783)',
          'kthreadd(2)───[kworker/0:0-events]'
        ];
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'env': {
        const out = Object.entries(this.envVars).map(([k, v]) => `${k}=${v}`).join('\n');
        return { output: out, exitCode: 0 };
      }

      case 'export': {
        if (!args[0]) return { output: Object.entries(this.envVars).map(([k, v]) => `declare -x ${k}="${v}"`).join('\n'), exitCode: 0 };
        const eqIdx = args[0].indexOf('=');
        if (eqIdx !== -1) {
          const k = args[0].substring(0, eqIdx);
          const v = args[0].substring(eqIdx + 1).replace(/['"]/g, '');
          this.envVars[k] = v;
          return { output: '', exitCode: 0 };
        }
        return { output: '', exitCode: 0 };
      }

      case 'uname': {
        if (args.includes('-a')) {
          return {
            output: 'Linux winlinx-lab 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux (Open Source Kernel)',
            exitCode: 0
          };
        }
        return { output: 'Linux', exitCode: 0 };
      }

      case 'touch': {
        const target = args[0];
        if (!target) return { output: 'touch: informe o nome do arquivo', exitCode: 1 };
        const res = this.writeFileInternal(target, '', false, syscalls);
        return { output: res.error || '', exitCode: res.error ? 1 : 0 };
      }

      case 'mkdir': {
        const target = args.find(a => !a.startsWith('-'));
        if (!target) return { output: 'mkdir: informe o nome do diretório', exitCode: 1 };
        const resolved = this.resolvePath(target);
        const parts = resolved.split('/').filter(Boolean);
        const dirName = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNodeByPath(parentPath);

        if (!parent || parent.type !== 'dir') {
          return { output: `mkdir: não é possível criar o diretório '${target}': Diretório pai inexistente`, exitCode: 1 };
        }
        if (!parent.children) parent.children = {};
        if (dirName) {
          parent.children[dirName] = {
            name: dirName,
            type: 'dir',
            permissions: 'drwxr-xr-x',
            owner: this.currentUser,
            group: this.currentUser,
            children: {}
          };
        }
        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `mkdir("${resolved}", 0755)`,
          subsystem: 'FileSystem',
          parameters: 'mode=0755',
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O VFS (Virtual File System) do Linux aloca um novo inode com metadados de permissão e proprietário.'
        });
        return { output: '', exitCode: 0 };
      }

      case 'rm': {
        const target = args.find(a => !a.startsWith('-'));
        if (!target) return { output: 'rm: informe o arquivo a remover', exitCode: 1 };
        const resolved = this.resolvePath(target);
        const parts = resolved.split('/').filter(Boolean);
        const itemName = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNodeByPath(parentPath);

        if (!parent || !parent.children || !itemName || !parent.children[itemName]) {
          return { output: `rm: não foi possível remover '${target}': Arquivo ou diretório não encontrado`, exitCode: 1 };
        }
        delete parent.children[itemName];
        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `unlinkat(AT_FDCWD, "${target}", 0)`,
          subsystem: 'FileSystem',
          parameters: itemName,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O kernel decrementa o contador de links do inode; quando o contador atinge zero, os blocos de dados são liberados.'
        });
        return { output: '', exitCode: 0 };
      }

      case 'readelf': {
        const target = args.find(a => !a.startsWith('-')) || 'binary.elf';
        return {
          output: `ELF Header:
  Magic:   7f 45 4c 46 02 01 01 00 00 00 00 00 00 00 00 00
  Class:                             ELF64
  Data:                              2's complement, little endian
  Version:                           1 (current)
  OS/ABI:                            UNIX - System V
  Type:                              EXEC (Executable file)
  Machine:                           Advanced Micro Devices X86-64
  Entry point address:               0x401020
  Number of section headers:         31

Section Headers:
  [Nr] Name              Type             Address           Offset
  [ 1] .text             PROGBITS         0000000000401000  00001000 (R-X)
  [ 2] .rodata           PROGBITS         0000000000406000  00006000 (R)
  [ 3] .got.plt          PROGBITS         0000000000408000  00008000 (RW)
  [ 4] .bss              NOBITS           0000000000408300  00008300 (RW)

FLAG{WINLINX_LINUX_READELF_ELF_HEADER_AUDITED_2026}`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: 'FLAG{WINLINX_LINUX_READELF_ELF_HEADER_AUDITED_2026}'
          }
        };
      }

      case 'vol':
      case 'volatility': {
        const plugin = args.find(a => a.startsWith('linux.')) || 'linux.check_syscall';
        return {
          output: `Volatility 3 Framework 2.5.0
Progress: 100.00% Paging system analysis complete

Plugin: ${plugin}
SyscallNumber  Name           ExpectedAddress     ActualAddress       Status
0              sys_read       0xffffffff81240a20  0xffffffff81240a20  CLEAN
78             sys_getdents64 0xffffffff81260110  0xffffffffc0850240  HOOKED [diamorphine.ko]
62             sys_kill       0xffffffff81112450  0xffffffffc0850380  HOOKED [diamorphine.ko]

[MEM_FORENSICS] Ganchos em sys_call_table detectados em memória física!
FLAG{WINLINX_LINUX_VOLATILITY_SYSCALL_HOOK_DETECTED_2026}`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: 'FLAG{WINLINX_LINUX_VOLATILITY_SYSCALL_HOOK_DETECTED_2026}'
          }
        };
      }

      case 'yara': {
        return {
          output: `yara 4.3.2 (Compiled rule scanner)
Scanning VFS and Memory segments...
[MATCH] Detect_CobaltStrike_Beacon_Injected /proc/1337/mem (Tags: T1055.012)
[MATCH] Detect_CobaltStrike_Beacon_Injected /tmp/.hidden/kworker_rev (Tags: T1055.012)

2 correspondências positivas de ameaça confirmadas pelo motor YARA!
FLAG{WINLINX_LINUX_YARA_MEMORY_SCAN_MATCH_2026}`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: 'FLAG{WINLINX_LINUX_YARA_MEMORY_SCAN_MATCH_2026}'
          }
        };
      }

      case 'docker': {
        if (args.includes('run') && (cmdLine.includes('docker.sock') || cmdLine.includes('chroot /host_fs') || cmdLine.includes('--privileged'))) {
          return {
            output: `[DOCKER ENGINE ALERT] Container iniciado com privilégios de host ou montagem de docker.sock!
Spawning root shell em /host_fs...
uid=0(root) gid=0(root) groups=0(root)
Container escape efetuado com sucesso!
FLAG{WINLINX_LINUX_DOCKER_CONTAINER_ESCAPE_2026}`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_LINUX_DOCKER_CONTAINER_ESCAPE_2026}'
            }
          };
        }
        return {
          output: `CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS     NAMES
a1b2c3d4e5f6   nginx:alpine   "/docker-entrypoint.…"   2 hours ago     Up 2 hours     80/tcp    web_prod`,
          exitCode: 0
        };
      }

      case 'klist': {
        return {
          output: `Ticket cache: FILE:/tmp/krb5cc_1000
Default principal: aluno@CORP.LOCAL

Valid starting       Expires              Service principal
11/26/2026 20:00:10  11/27/2026 06:00:10  krbtgt/CORP.LOCAL@CORP.LOCAL
        renew until 12/03/2026 20:00:10

[Kerberos TGT Ativo no Linux PAM/SSSD]
FLAG{WINLINX_LINUX_KERBEROS_KLIST_INSPECTED_2026}`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: 'FLAG{WINLINX_LINUX_KERBEROS_KLIST_INSPECTED_2026}'
          }
        };
      }

      case 'mkfifo': {
        const target = args[0];
        if (!target) return { output: 'mkfifo: informe o nome do arquivo fifo. Ex: mkfifo /tmp/pipe_ipc', exitCode: 1 };
        const resolved = this.resolvePath(target);
        const parts = resolved.split('/').filter(Boolean);
        const fifoName = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = this.getNodeByPath(parentPath);
        if (!parent || parent.type !== 'dir') {
          return { output: `mkfifo: não é possível criar '${target}': Diretório inexistente`, exitCode: 1 };
        }
        if (!parent.children) parent.children = {};
        if (fifoName) {
          parent.children[fifoName] = {
            name: fifoName,
            type: 'file',
            permissions: 'prwxr-xr-x',
            owner: this.currentUser,
            group: this.currentUser,
            size: 0,
            inode: 154820
          };
        }
        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `mknodat(AT_FDCWD, "${resolved}", S_IFIFO|0666, 0)`,
          subsystem: 'FileSystem',
          parameters: 'type=FIFO (Named Pipe)',
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Kernel Linux cria um nó especial de FIFO (pipe nomeado) no sistema de arquivos.'
        });
        return {
          output: `prwxr-xr-x 1 ${this.currentUser} ${this.currentUser} 0 Nov 22 ${fifoName}`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: 'FLAG{WINLINX_LINUX_MKFIFO_PIPE_CREATED_2026}'
          }
        };
      }

      case 'lsmod': {
        const lines = [
          'Module                  Size  Used by',
          'rootkit_diamorphine    49152  0 [UNVERIFIED]',
          'overlay               151552  2',
          'nf_tables             245760  4',
          'ext4                  688128  1',
          'crc32c_generic         16384  0'
        ];
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'rmmod': {
        const modName = args[0];
        if (modName === 'rootkit_diamorphine') {
          return {
            output: `rmmod: módulo '${modName}' descarregado do kernel com sucesso. Ganchos de sys_call_table restaurados!`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_LINUX_LKM_ROOTKIT_NEUTRALIZED_2026}'
            }
          };
        }
        return { output: `rmmod: módulo '${modName}' descarregado`, exitCode: 0 };
      }

      case 'restore-files': {
        return {
          output: `[RESTORE AGENT] 14 arquivos criptografados foram recuperados com sucesso usando a chave mestra forense!`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: 'FLAG{WINLINX_LINUX_RANSOMWARE_RECOVERED_2026}'
          }
        };
      }

      case 'ipcs': {
        return {
          output: `------ Shared Memory Segments --------
key        shmid      owner      perms      bytes      nattch     status      
0x00000000 65536      aluno      600        4194304    2          dest`,
          exitCode: 0
        };
      }

      case 'bash':
      case 'sh': {
        const scriptTarget = args.find(a => !a.startsWith('-'));
        if (scriptTarget) {
          const resolved = this.resolvePath(scriptTarget);
          const node = this.getNodeByPath(resolved);
          if (node && node.type === 'file' && node.content) {
            const scriptLines = node.content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
            let finalOutput = `[Bash Script Runner: ${scriptTarget}]\n`;
            for (const line of scriptLines) {
              const res = this.execute(line);
              if (res.output) finalOutput += res.output + '\n';
            }
            return {
              output: finalOutput.trim(),
              exitCode: 0,
              stateChanges: {
                flagDiscovered: 'FLAG{WINLINX_LINUX_BASH_SCRIPT_EXECUTED_2026}'
              }
            };
          }
          return { output: `bash: ${scriptTarget}: Arquivo ou diretório não encontrado`, exitCode: 1 };
        }
        return { output: 'Bash shell session ativa.', exitCode: 0 };
      }

      case 'kill': {
        const isForce = args.includes('-9');
        const pidStr = args.find(a => a !== '-9');
        const pid = parseInt(pidStr || '', 10);
        if (isNaN(pid)) {
          return { output: 'kill: informe o PID do processo. Ex: kill -9 1337', exitCode: 1 };
        }

        const procIdx = this.processes.findIndex(p => p.pid === pid);
        if (procIdx === -1) {
          return { output: `bash: kill: (${pid}) - Processo não encontrado`, exitCode: 1 };
        }

        const proc = this.processes[procIdx];
        if (proc.isProtectedProcess && this.currentUser !== 'root') {
          return { output: `bash: kill: (${pid}) - Permissão negada. Processo de sistema protegido.`, exitCode: 1 };
        }

        this.processes.splice(procIdx, 1);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `kill(${pid}, ${isForce ? 'SIGKILL' : 'SIGTERM'})`,
          subsystem: 'Process',
          parameters: `pid=${pid}, signal=${isForce ? 9 : 15}`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Kernel envia sinal para a tabela de tarefas (task_struct) encerrando o espaço de endereçamento do processo imediatamente.'
        });

        if (proc.pid === 1337 || proc.name === 'kworker_rev') {
          return {
            output: `[SUCESSO] Processo malicioso ${proc.name} (PID ${pid}) terminado com sucesso! Conexão C2 encerrada.`,
            exitCode: 0,
            stateChanges: {
              processKilled: pid,
              flagDiscovered: 'FLAG{WINLINX_LINUX_MALICIOUS_PROCESS_KILLED_2026}'
            }
          };
        }

        return { output: `Processo ${proc.name} (PID ${pid}) terminado.`, exitCode: 0 };
      }

      case 'cd': {
        const target = args[0] || '/home/aluno';
        const resolved = this.resolvePath(target);
        const node = this.getNodeByPath(resolved);
        if (!node) {
          return { output: `bash: cd: ${target}: Diretório ou arquivo não encontrado`, exitCode: 1 };
        }
        if (node.type !== 'dir') {
          return { output: `bash: cd: ${target}: Não é um diretório`, exitCode: 1 };
        }
        if (node.isProtected && this.currentUser !== 'root') {
          return { output: `bash: cd: ${target}: Permissão negada`, exitCode: 1 };
        }
        this.currentDir = resolved;
        return { output: '', exitCode: 0 };
      }

      case 'ls': {
        const showAll = args.includes('-la') || args.includes('-al') || (args.includes('-l') && args.includes('-a'));
        const showLong = showAll || args.includes('-l');
        const showInode = args.includes('-i') || args.includes('-li') || args.includes('-il');
        const targetPath = args.find(a => !a.startsWith('-')) || this.currentDir;
        const resolved = this.resolvePath(targetPath);
        const node = this.getNodeByPath(resolved);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `getdents64(fd, dirp, count)`,
          subsystem: 'FileSystem',
          parameters: `path="${resolved}"`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'Chamada de sistema que lê entradas do diretório físico a partir do inode.'
        });

        if (!node) {
          return { output: `ls: não foi possível acessar '${targetPath}': Arquivo ou diretório não encontrado`, exitCode: 2 };
        }

        if (node.type === 'file') {
          const inodePrefix = showInode ? `${node.inode || 131450} ` : '';
          return {
            output: showLong ? `${inodePrefix}${node.permissions || '-rw-r--r--'} 1 ${node.owner || 'root'} ${node.group || 'root'} ${node.size || 1024} Nov 22 ${node.name}` : `${inodePrefix}${node.name}`,
            exitCode: 0
          };
        }

        const entries = Object.values(node.children || {});
        if (showLong) {
          const lines = [
            `total ${entries.length * 4}`,
            `${showInode ? '102401 ' : ''}drwxr-xr-x 2 ${node.owner || 'root'} ${node.group || 'root'} 4096 Nov 22 .`,
            `${showInode ? '102400 ' : ''}drwxr-xr-x 2 root root 4096 Nov 22 ..`
          ];
          for (const item of entries) {
            const inodePrefix = showInode ? `${(item.inode || 140000 + Math.floor(item.name.length * 123)).toString().padEnd(7)} ` : '';
            lines.push(
              `${inodePrefix}${item.permissions || (item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--')} 1 ${item.owner || 'aluno'} ${item.group || 'aluno'} ${(item.size || (item.type === 'dir' ? 4096 : 256)).toString().padStart(6)} Nov 22 ${item.name}`
            );
          }
          return { output: lines.join('\n'), exitCode: 0 };
        }

        if (showInode) {
          return { output: entries.map(e => `${e.inode || 140000 + e.name.length * 123} ${e.name}`).join('  '), exitCode: 0 };
        }

        return { output: entries.map(e => e.name).join('  '), exitCode: 0 };
      }

      case 'stat': {
        if (!args[0]) {
          return { output: 'stat: informe o operando. Exemplo: stat /bin/find', exitCode: 1 };
        }
        const targetPath = args.find(a => !a.startsWith('-')) || args[0];
        const resolved = this.resolvePath(targetPath);
        const node = this.getNodeByPath(resolved);
        if (!node) {
          return { output: `stat: não foi possível obter estado de '${targetPath}': Arquivo ou diretório não encontrado`, exitCode: 1 };
        }

        const inodeNum = node.inode || (node.name === 'find' ? 131452 : 142055);
        const octalPerm = node.permissions?.includes('s') ? '4755' : '0755';
        const isDir = node.type === 'dir';

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `newfstatat(AT_FDCWD, "${resolved}", &statbuf, 0)`,
          subsystem: 'FileSystem',
          parameters: `inode=${inodeNum}`,
          returnCode: 0,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Kernel lê a estrutura stat diretamente da tabela de Inodes do sistema de arquivos ext4.'
        });

        return {
          output: `  File: ${resolved}
  Size: ${(node.size || 4096).toString().padEnd(12)} Blocks: 8          IO Block: 4096   ${isDir ? 'diretório' : 'arquivo comum'}
Device: 802h/2050d  Inode: ${inodeNum}      Links: 1
Access: (${octalPerm}/${node.permissions || (isDir ? 'drwxr-xr-x' : '-rw-r--r--')})  Uid: ( 1000/   ${node.owner || 'aluno'})   Gid: ( 1000/   ${node.group || 'aluno'})
Access: 2026-11-26 10:20:15.000000000 -0300
Modify: 2026-11-26 10:20:15.000000000 -0300
Change: 2026-11-26 10:20:15.000000000 -0300
 Birth: 2026-11-26 10:20:15.000000000 -0300`,
          exitCode: 0,
          stateChanges: {
            flagDiscovered: node.name === 'find' ? 'FLAG{WINLINX_LINUX_STAT_INODE_AUDITED_2026}' : undefined
          }
        };
      }

      case 'umask': {
        if (!args[0]) {
          return { output: '0022', exitCode: 0 };
        }
        return { output: `umask definida para ${args[0]}`, exitCode: 0 };
      }

      case 'cat': {
        if (!args[0]) {
          return { output: 'cat: informe o nome do arquivo', exitCode: 1 };
        }
        const resolved = this.resolvePath(args[0]);

        if (resolved === '/proc/meminfo') {
          return {
            output: `MemTotal:        4018320 kB
MemFree:         1842010 kB
MemAvailable:    2890124 kB
Buffers:          142100 kB
Cached:          1120400 kB
SwapTotal:       2097148 kB
SwapFree:        2097148 kB`,
            exitCode: 0
          };
        }

        if (resolved === '/proc/cpuinfo') {
          return {
            output: `processor       : 0
vendor_id       : GenuineIntel
model name      : Intel(R) Core(TM) i7-12700K CPU @ 3.60GHz
cpu MHz         : 3600.000
cache size      : 25600 KB
flags           : fpu vme de pse tsc msr pae mce cx8 apic sep mtrr pge mca cmov pat pse36 clflush mmx fxsr sse sse2 ss ht tm pbe syscall nx pdpe1gb rdtscp lm constant_tsc rep_good nopl xtopology nonstop_tsc cpuid tsc_known_freq pni pclmulqdq dtes64 monitor ds_cpl vmx smx est tm2 ssse3 sdbg fma cx16 xtpr pdcm pcid sse4_1 sse4_2 x2apic movbe popcnt tsc_deadline_timer aes xsave avx f16c rdrand hypervisor lahf_lm abm 3dnowprefetch cpuid_fault epb invpcid_single pti ssbd ibrs ibpb stibp fsgsbase tsc_adjust bmi1 avx2 smep bmi2 erms invpcid rdseed adx smap clflushopt clwb sha_ni xsaveopt xsavec xgetbv1 xsaves arat umip md_clear flush_l1d arch_capabilities`,
            exitCode: 0
          };
        }

        const node = this.getNodeByPath(resolved);

        syscalls.push({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          os: 'linux',
          syscall: `openat(AT_FDCWD, "${resolved}", O_RDONLY)`,
          subsystem: 'FileSystem',
          parameters: `flags=O_RDONLY`,
          returnCode: 3,
          ringLevel: 'Ring 0 (Kernel Mode)',
          explanation: 'O Kernel valida as permissões DAC (Discretionary Access Control) do processo para o arquivo e retorna o descritor de arquivo (fd=3).'
        });

        if (!node) {
          return { output: `cat: ${args[0]}: Arquivo ou diretório não encontrado`, exitCode: 1 };
        }
        if (node.type === 'dir') {
          return { output: `cat: ${args[0]}: É um diretório`, exitCode: 1 };
        }
        if (node.name === 'shadow' && this.currentUser !== 'root') {
          return { output: `cat: /etc/shadow: Permissão negada (somente root/shadow)`, exitCode: 1 };
        }
        return { output: node.content || `[Conteúdo binário ou vazio: ${node.name}]`, exitCode: 0 };
      }

      case 'ps': {
        const lines = [
          'USER       PID  PPID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'
        ];
        for (const p of this.processes) {
          lines.push(
            `${p.user.padEnd(8)} ${p.pid.toString().padStart(5)} ${p.ppid.toString().padStart(5)}  ${p.cpu.toFixed(1)}  ${(p.memoryMb / 10).toFixed(1)}  15024  ${(p.memoryMb * 100).toFixed(0)} pts/0    ${p.status === 'running' ? 'S+' : 'I'}   10:00   0:0${Math.floor(p.cpu * 2)} ${p.path}`
          );
        }
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'ss':
      case 'netstat': {
        const hasMalicious = this.processes.some(p => p.pid === 1337) && !this.firewallBlockedPorts.includes(4444);
        const lines = [
          'Netid State      Recv-Q Send-Q   Local Address:Port    Peer Address:Port Process',
          'tcp   LISTEN     0      128            0.0.0.0:22           0.0.0.0:*     users:(("sshd",pid=412,fd=3))',
          'tcp   LISTEN     0      511            0.0.0.0:80           0.0.0.0:*     users:(("nginx",pid=782,fd=6))'
        ];
        if (hasMalicious) {
          lines.push('tcp   ESTAB      0      0       192.168.1.15:4444     203.0.113.80:55210 users:(("kworker_rev",pid=1337,fd=4))');
        }
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'ufw': {
        const sub = args[0]?.toLowerCase();
        if (sub === 'status') {
          return {
            output: `Status: ${this.firewallActive ? 'active' : 'inactive'}

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
${this.firewallBlockedPorts.map(p => `${p}/tcp                     DENY        Anywhere`).join('\n')}`,
            exitCode: 0
          };
        }
        if (sub === 'deny' || sub === 'reject') {
          const port = parseInt(args[1], 10);
          if (isNaN(port)) return { output: 'ufw: informe a porta a ser bloqueada. Ex: ufw deny 4444', exitCode: 1 };
          if (!this.firewallBlockedPorts.includes(port)) {
            this.firewallBlockedPorts.push(port);
          }
          syscalls.push({
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            os: 'linux',
            syscall: `setsockopt(fd, SOL_NETFILTER, SO_SET_REPLACE)`,
            subsystem: 'Network',
            parameters: `Netfilter rule: DROP TCP port ${port}`,
            returnCode: 0,
            ringLevel: 'Ring 0 (Kernel Mode)',
            explanation: 'O subsistema Netfilter do Kernel Linux insere regra de DROP na tabela filter chain INPUT.'
          });

          return {
            output: `Regra adicionada\nRegra adicionada (v6)\n[DEFESA] Porta ${port} bloqueada no Netfilter/UFW! Tráfego de entrada e saída descartado.`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: port === 4444 ? 'FLAG{WINLINX_LINUX_FIREWALL_NETFILTER_BLOCKED_4444}' : undefined
            }
          };
        }
        return { output: 'Uso: ufw status | ufw deny <porta> | ufw allow <porta>', exitCode: 0 };
      }

      case 'iptables': {
        if (cmdLine.includes('-A') && (cmdLine.includes('DROP') || cmdLine.includes('REJECT'))) {
          const matchPort = cmdLine.match(/--dport\s+(\d+)/);
          const port = matchPort ? parseInt(matchPort[1], 10) : 4444;
          if (!this.firewallBlockedPorts.includes(port)) {
            this.firewallBlockedPorts.push(port);
          }
          return {
            output: `[iptables] Regra inserida na chain INPUT: DROP porta ${port}. Conexão mitigada no nível do Kernel!`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: port === 4444 ? 'FLAG{WINLINX_LINUX_FIREWALL_NETFILTER_BLOCKED_4444}' : undefined
            }
          };
        }
        return {
          output: `Chain INPUT (policy ACCEPT 142 packets, 11KB)
target     prot opt source               destination
ACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:22
ACCEPT     tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:80
${this.firewallBlockedPorts.map(p => `DROP       tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:${p}`).join('\n')}`,
          exitCode: 0
        };
      }

      case 'find': {
        if (cmdLine.includes('-perm -4000') || cmdLine.includes('-u=s')) {
          return {
            output: `/usr/bin/su\n/usr/bin/passwd\n/usr/bin/newgrp\n/usr/bin/gpasswd\n/bin/ping\n/bin/find  <-- [ALERTA: SUID ativado indevidamente!]`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_LINUX_SUID_DISCOVERED}'
            }
          };
        }
        return { output: `/home/aluno/notas_aula.txt\n/home/aluno/.bashrc`, exitCode: 0 };
      }

      case 'crontab': {
        if (args.includes('-l')) {
          if (this.currentUser === 'root') {
            return {
              output: `# Crontab do usuário root\n*/10 * * * * /opt/scripts/backup.sh\n@reboot /usr/local/bin/integrity-check.sh`,
              exitCode: 0
            };
          }
          return { output: `no crontab for ${this.currentUser}`, exitCode: 0 };
        }
        return { output: 'crontab: use crontab -l para listar tarefas agendadas', exitCode: 0 };
      }

      case 'systemctl': {
        const sub = args[0];
        if (sub === 'status') {
          const svc = args[1] || 'nginx';
          if (svc === 'nginx') {
            return {
              output: `● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Fri 2026-11-22 09:00:10 -03; 1h 15min ago
   Main PID: 782 (nginx)
      Tasks: 2 (limit: 4915)
     Memory: 24.0M
        CPU: 125ms
     CGroup: /system.slice/nginx.service
             ├─782 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
             └─783 nginx: worker process`,
              exitCode: 0
            };
          }
          return { output: `Unit ${svc}.service could not be found.`, exitCode: 3 };
        }
        return { output: 'Use: systemctl status <servico>', exitCode: 0 };
      }

      case 'chmod': {
        const perms = args[0];
        const target = args[1];
        if (!perms || !target) {
          return { output: 'chmod: sintaxe incorreta. Exemplo: chmod 755 arquivo ou chmod -s arquivo', exitCode: 1 };
        }
        const node = this.getNodeByPath(this.resolvePath(target));
        if (!node) {
          return { output: `chmod: arquivo '${target}' não encontrado`, exitCode: 1 };
        }
        if ((target.includes('find') || node.name === 'find') && (perms.includes('-s') || perms === '755' || perms === '0755')) {
          node.permissions = '-rwxr-xr-x';
          return {
            output: `[SUCESSO] Permissão SUID removida do binário '${node.name}'. Vulnerabilidade de elevação corrigida!`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_LINUX_SUID_FIXED_DEFENDER_2026}'
            }
          };
        }
        node.permissions = perms;
        return { output: `Permissões de ${node.name} alteradas para ${perms}.`, exitCode: 0 };
      }

      case 'echo': {
        const text = args.join(' ').replace(/^['"]|['"]$/g, '');
        return { output: text, exitCode: 0 };
      }

      case 'explain': {
        const topic = (args[0] || '').toLowerCase();
        if (!topic) {
          return {
            output: `[WinLinx Kernel Copilot] Uso: explain <conceito | syscall | processo>
Exemplos:
  explain ptrace
  explain lsass
  explain aslr
  explain dep
  explain fork
  explain capabilities
  explain suid
  explain ufw`,
            exitCode: 0
          };
        }

        const explanations: Record<string, string> = {
          ptrace: `[Kernel Deep-Dive: ptrace(2)]
• Definição: Syscall que permite a um processo pai controlar/inspecionar a execução de outro processo (base do GDB, strace e ltrace).
• Ring Level: Ring 0 (Kernel Mode).
• Risco Ofensivo: Permite injeção de código em processos em execução (Process Injection / Shellcode Injection).
• Defesa & Mitigação: Yama LSM (cat /proc/sys/kernel/yama/ptrace_scope). Nível 1 restringe ptrace apenas para processos descendentes.`,

          lsass: `[Kernel Deep-Dive: lsass.exe (Local Security Authority)]
• Definição: Processo do Windows responsável por gerenciar a política de segurança, autenticação e credenciais em memória (NTLM/Kerberos).
• Alvo de Ataque: Dumping de senhas com Mimikatz (T1003.001) através da API OpenProcess com PROCESS_VM_READ.
• Defesa no Linux vs Windows: No Linux, senhas residem em /etc/shadow com hashes salgados. No Windows, ative RunAsPPL para isolar o processo em Protected Process Light.`,

          aslr: `[Segurança de Memória: ASLR (Address Space Layout Randomization)]
• Definição: O Kernel randomiza a cada execução os endereços de base da Pilha (Stack), Heap, Bibliotecas Compartilhadas (.so / DLLs) e Executável.
• Risco Ofensivo: Sem ASLR, invasores usam endereços fixos para pular diretamente para shellcodes injetados ou funções libc (ret2libc).
• No Linux: Configurado via /proc/sys/kernel/randomize_va_space (0=desativado, 2=randomização total).`,

          dep: `[Segurança de Memória: DEP / NX Bit (Data Execution Prevention)]
• Definição: Recurso de Hardware/CPU (bit No-Execute nas entradas da tabela de páginas MMU) gerido pelo Kernel que proíbe execução de instruções em regiões de dados (Stack e Heap - W^X: Write XOR Execute).
• Violação: Quando um ponteiro de instrução (RIP/EIP) aponta para a pilha, o processador gera uma exceção de Falha de Página (Segmentation Fault SIGSEGV ou EXCEPTION_ACCESS_VIOLATION 0xC0000005).`,

          fork: `[Ciclo de Vida de Processos: fork() vs execve()]
• Linux (Monolítico): fork() clona o processo chamador via Copy-On-Write (COW), criando um novo PID compartilhando páginas de memória até a primeira escrita. Em seguida, execve() substitui a imagem pelo novo binário ELF.
• Windows NT (Híbrido): Não há fork() nativo. O Windows utiliza a chamada CreateProcess(), que cria o processo e sua thread primária de forma estruturada e atômica.`,

          capabilities: `[Linux Privileges: Linux Capabilities]
• Definição: Divisão do poder do superusuário 'root' (UID 0) em unidades discretas de privilégio (ex: CAP_NET_BIND_SERVICE, CAP_SETUID, CAP_SYS_ADMIN).
• Vetor Ofensivo: Binários com cap_setuid+ep permitem a qualquer usuário alterar seu UID para 0 sem a necessidade do bit SUID tradicional!
• Comandos: getcap -r / (auditar) e setcap -r <arquivo> (remover).`,

          suid: `[Controle de Acesso: SUID (Set User ID - Bit 4000)]
• Definição: Permissão especial que faz o executável rodar com os privilégios do proprietário do arquivo (geralmente root) em vez do usuário que o disparou.
• Vetor de Ataque (GTFOBins): Se utilitários como find, vim, cp ou bash tiverem o bit SUID ativo, usuários não privilegiados podem escapar para um shell root instantaneamente.`,

          ufw: `[Defesa de Rede: Netfilter & UFW (Uncomplicated Firewall)]
• Definição: O Netfilter opera nos hooks do Kernel Linux inspecionando pacotes na camada IP (PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING).
• UFW: Interface simplificada de user-mode que escreve regras nas tabelas do Netfilter para descartar tráfego malicioso (ex: conexões C2 na porta 4444).`,

          posix: `[Modelo de Permissões: POSIX Standard (UGO & Octal)]
• Definição: Padrão que divide permissões em três esferas: User (u), Group (g) e Others (o), com pesos binários Read=4, Write=2 e Execute=1.
• Bits Especiais: SUID (4000), SGID (2000) e Sticky Bit (1000).
• Comparação: Diferente das complexas DACLs do Windows NTFS com herança e SIDs, o POSIX é direto, determinístico e implementado no Inode.`,

          inode: `[Sistema de Arquivos: Inode (Index Node)]
• Definição: Estrutura de dados fundamental no ext4/Unix que armazena todos os metadados de um arquivo (permissões, dono UID/GID, tamanho, timestamps, ponteiros para blocos de dados) exceto o próprio nome do arquivo.
• Comando de Inspeção: stat <arquivo> ou ls -i.`,

          ext4: `[Arquitetura de Storage: ext4 (Fourth Extended Filesystem)]
• Definição: Sistema de arquivos padrão do Linux. Estrutura dividida em:
  1) Superblock (metadados globais da partição)
  2) Inode Table (metadados dos arquivos)
  3) Data Blocks (conteúdo real)
  4) Journaling (prevenção de corrupção contra falhas de energia).`,

          umask: `[Máscara de Criação: umask (User File-Creation Mask)]
• Definição: Filtro de 4 dígitos octais que determina as permissões padrão que NÃO serão concedidas quando novos arquivos ou pastas forem criados.
• Exemplo: umask 0022 faz com que novos arquivos nasçam com permissão 644 (666 - 022) e pastas com 755 (777 - 022).`
        };

        const explanation = explanations[topic] || `[Conceito de SO: ${topic}]
Recurso essencial para a arquitetura de sistemas operacionais e segurança da informação.
Digite 'explain' sem parâmetros para ver os tópicos de Kernel disponíveis.`;

        return { output: explanation, exitCode: 0 };
      }

      case 'hint': {
        const hintText = `💡 [Dica do Mentor Kernel WinLinx]
• Para explorar processos maliciosos: use 'ps aux' ou 'pstree' e observe executáveis em locais atípicos (/tmp/.hidden).
• Para derrubar processos maliciosos e conexões suspeitas: 'kill -9 <PID>' e 'ufw deny <PORTA>'.
• Para inspecionar permissões de alto privilégio: 'find / -perm -4000 2>/dev/null' ou 'getcap -r / 2>/dev/null'.
• Para entender qualquer conceito: execute 'explain <conceito>'.`;
        return { output: hintText, exitCode: 0 };
      }

      case 'man': {
        const targetCmd = (args[0] || '').toLowerCase();
        if (!targetCmd) {
          return { output: 'Qual página de manual você deseja? Exemplo: man ps, man kill, man ufw, man chmod', exitCode: 1 };
        }
        return {
          output: `MANUAL DO SISTEMA OPERACIONAL (WinLinx POSIX Reference)

NOME
       ${targetCmd} - comando essencial de gerenciamento de recursos e segurança do Linux

SINOPSE
       ${targetCmd} [OPÇÕES] [ARGUMENTOS]

NÍVEL DE PRIVILÉGIO
       Espaço de Usuário (Ring 3) acionando chamadas de sistema no Kernel (Ring 0)

RELEVÂNCIA EM CIBERSEGURANÇA
       Comando crítico para monitoramento de integridade, telemetria defensiva ou auditoria forense.
       Auditado pelo subsistema auditd sob o evento execve.`,
          exitCode: 0
        };
      }

      case 'getcap': {
        if (args.includes('-r') || args[0] === '/') {
          return {
            output: `/usr/bin/python3.11 = cap_setuid+ep\n/usr/bin/ping = cap_net_raw+ep`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_LINUX_CAPABILITIES_DISCOVERED_2026}'
            }
          };
        }
        const target = args[0] || '';
        if (target.includes('python')) {
          return { output: `${target} = cap_setuid+ep`, exitCode: 0 };
        }
        return { output: `${target}: nenhuma capability especial configurada`, exitCode: 0 };
      }

      case 'setcap': {
        if (args.includes('-r')) {
          const target = args.find(a => !a.startsWith('-')) || '';
          return {
            output: `[SUCESSO] Capabilities removidas de '${target}'. Risco de elevação de privilégio eliminado!`,
            exitCode: 0,
            stateChanges: {
              flagDiscovered: 'FLAG{WINLINX_LINUX_CAPABILITIES_HARDENED_2026}'
            }
          };
        }
        return { output: `Capabilities aplicadas: ${args.join(' ')}`, exitCode: 0 };
      }

      case 'help': {
        return {
          output: `Comandos suportados no Simulador Linux (WinLinx Enterprise):
- Processos & Árvore: ps, ps aux, pstree, kill -9 <PID>, ss -tulpn, netstat
- Sistema & Hardware: cat /proc/meminfo, cat /proc/cpuinfo, uname -a, env, export
- Arquivos & VFS: pwd, cd, ls, cat, touch, mkdir, rm, echo [> | >>]
- Permissões & Contas: chmod, chown, id, whoami, sudo su, cat /etc/passwd
- Serviços & Automação: systemctl status <svc>, crontab -l
- Segurança & Recon: find / -perm -4000`,
          exitCode: 0
        };
      }

      default:
        return { output: `bash: comando não encontrado: ${cmd}. Digite 'help' para a lista de comandos.`, exitCode: 127 };
    }
  }

  private writeFileInternal(pathStr: string, content: string, isAppend: boolean, syscalls: SyscallTrace[]): { error?: string } {
    const resolved = this.resolvePath(pathStr);
    const parts = resolved.split('/').filter(Boolean);
    const fileName = parts.pop();
    const parentPath = '/' + parts.join('/');
    const parent = this.getNodeByPath(parentPath);

    if (!parent || parent.type !== 'dir') {
      return { error: `bash: ${pathStr}: Diretório não encontrado` };
    }

    if (!parent.children) parent.children = {};

    if (fileName) {
      if (parent.children[fileName]) {
        const existing = parent.children[fileName];
        existing.content = isAppend ? (existing.content + '\n' + content) : content;
        existing.size = (existing.content || '').length;
      } else {
        parent.children[fileName] = {
          name: fileName,
          type: 'file',
          permissions: '-rw-r--r--',
          owner: this.currentUser,
          group: this.currentUser,
          content,
          size: content.length
        };
      }

      syscalls.push({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        os: 'linux',
        syscall: `write(fd, buffer, count)`,
        subsystem: 'FileSystem',
        parameters: `bytes=${content.length}`,
        returnCode: content.length,
        ringLevel: 'Ring 0 (Kernel Mode)',
        explanation: 'O Kernel Linux grava os bytes no cache de páginas de disco e sinaliza o sistema de arquivos para commit.'
      });
    }

    return {};
  }

  private resolvePath(pathStr: string): string {
    if (pathStr === '/') return '/';
    if (pathStr.startsWith('/')) {
      return pathStr.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    }
    if (pathStr === '~') return '/home/aluno';
    if (pathStr === '..') {
      const parts = this.currentDir.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    if (pathStr === '.') return this.currentDir;

    const base = this.currentDir === '/' ? '' : this.currentDir;
    return `${base}/${pathStr}`.replace(/\/+/g, '/');
  }

  private getNodeByPath(pathStr: string): FileNode | null {
    if (pathStr === '/') return this.rootFS;
    const parts = pathStr.split('/').filter(Boolean);
    let current: FileNode | undefined = this.rootFS;

    for (const part of parts) {
      if (!current || !current.children) return null;
      current = current.children[part];
    }
    return current || null;
  }
}
