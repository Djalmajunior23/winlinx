import { CommandResult, FileNode, OSProcess, SyscallTrace, EDRAlert } from '../types/simulator';

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
      return { output: '', exitCode: 0, syscalls: [], edrAlerts: [] };
    }

    const syscalls: SyscallTrace[] = [];
    const edrAlerts: EDRAlert[] = [];

    this.inspectEDR(trimmed, edrAlerts);

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
          edrAlerts
        };
      }

      const prevUser = this.currentUser;
      this.currentUser = 'root';
      const res = this.executeCommandInternal(rest, syscalls);
      this.currentUser = prevUser;
      return { ...res, syscalls, edrAlerts };
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
      return { output: currentOutput, exitCode: 0, syscalls, edrAlerts };
    }

    const execResult = this.executeCommandInternal(trimmed, syscalls);
    return { ...execResult, syscalls, edrAlerts };
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
          return { 
            output: showLong ? `${node.permissions || '-rw-r--r--'} 1 ${node.owner || 'root'} ${node.group || 'root'} ${node.size || 1024} Nov 22 ${node.name}` : node.name, 
            exitCode: 0 
          };
        }

        const entries = Object.values(node.children || {});
        if (showLong) {
          const lines = [
            `total ${entries.length * 4}`,
            `drwxr-xr-x 2 ${node.owner || 'root'} ${node.group || 'root'} 4096 Nov 22 .`,
            `drwxr-xr-x 2 root root 4096 Nov 22 ..`
          ];
          for (const item of entries) {
            lines.push(
              `${item.permissions || (item.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--')} 1 ${item.owner || 'aluno'} ${item.group || 'aluno'} ${(item.size || (item.type === 'dir' ? 4096 : 256)).toString().padStart(6)} Nov 22 ${item.name}`
            );
          }
          return { output: lines.join('\n'), exitCode: 0 };
        }

        return { output: entries.map(e => e.name).join('  '), exitCode: 0 };
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
        const hasMalicious = this.processes.some(p => p.pid === 1337);
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
