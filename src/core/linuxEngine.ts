import { CommandResult, FileNode, OSProcess } from '../types/simulator';

export class LinuxSimulatorEngine {
  private currentDir: string = '/home/aluno';
  private currentUser: string = 'aluno';
  private rootFS: FileNode;
  private processes: OSProcess[] = [
    { pid: 1, name: 'systemd', user: 'root', cpu: 0.1, memoryMb: 12.4, path: '/sbin/init', status: 'running' },
    { pid: 280, name: 'systemd-journald', user: 'root', cpu: 0.2, memoryMb: 18.2, path: '/lib/systemd/systemd-journald', status: 'running' },
    { pid: 412, name: 'sshd', user: 'root', cpu: 0.0, memoryMb: 8.5, path: '/usr/sbin/sshd', status: 'running' },
    { pid: 615, name: 'cron', user: 'root', cpu: 0.0, memoryMb: 4.1, path: '/usr/sbin/cron', status: 'running' },
    { pid: 782, name: 'nginx', user: 'www-data', cpu: 0.4, memoryMb: 24.0, path: '/usr/sbin/nginx', status: 'running' },
    { pid: 1042, name: 'bash', user: 'aluno', cpu: 0.0, memoryMb: 6.8, path: '/bin/bash', status: 'running' },
    // Processo malicioso / suspeito em segundo plano para o aluno investigar!
    { 
      pid: 1337, 
      name: 'kworker_rev', 
      user: 'backup-user', 
      cpu: 1.8, 
      memoryMb: 14.2, 
      path: '/tmp/.hidden/kworker_rev', 
      status: 'running',
      isSuspicious: true,
      description: 'Reverse shell disfarçado como kworker do kernel'
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

  public execute(cmdLine: string): CommandResult {
    const trimmed = cmdLine.trim();
    if (!trimmed) {
      return { output: '', exitCode: 0 };
    }

    // Suporte a sudo
    if (trimmed.startsWith('sudo ')) {
      const rest = trimmed.slice(5).trim();
      if (rest.startsWith('su') || rest === 'bash') {
        this.currentUser = 'root';
        return { output: 'Autenticação bem-sucedida. Sessão elevada para root (UID=0).', exitCode: 0 };
      }
      // Executa como root temporariamente
      const prevUser = this.currentUser;
      this.currentUser = 'root';
      const res = this.executeCommandInternal(rest);
      this.currentUser = prevUser;
      return res;
    }

    // Suporte a pipes básicos (ex: ps aux | grep root)
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map(p => p.trim());
      let currentOutput = '';
      for (const part of parts) {
        if (part.startsWith('grep ')) {
          const search = part.slice(5).trim().replace(/['"]/g, '');
          const lines = currentOutput.split('\n');
          currentOutput = lines.filter(l => l.toLowerCase().includes(search.toLowerCase())).join('\n');
        } else {
          const res = this.executeCommandInternal(part);
          currentOutput = res.output;
        }
      }
      return { output: currentOutput, exitCode: 0 };
    }

    return this.executeCommandInternal(trimmed);
  }

  private executeCommandInternal(cmdLine: string): CommandResult {
    const tokens = cmdLine.split(' ').filter(Boolean);
    const cmd = tokens[0];
    const args = tokens.slice(1);

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

      case 'uname': {
        if (args.includes('-a')) {
          return { 
            output: 'Linux winlinx-lab 6.8.0-45-generic #45-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux (Open Source Kernel)', 
            exitCode: 0 
          };
        }
        return { output: 'Linux', exitCode: 0 };
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
        const node = this.getNodeByPath(resolved);
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
        const isAux = args.includes('aux') || args.includes('-ef');
        const lines = [
          'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND'
        ];
        for (const p of this.processes) {
          lines.push(
            `${p.user.padEnd(8)} ${p.pid.toString().padStart(5)}  ${p.cpu.toFixed(1)}  ${(p.memoryMb / 10).toFixed(1)}  15024  ${(p.memoryMb * 100).toFixed(0)} pts/0    ${p.status === 'running' ? 'S+' : 'I'}   10:00   0:0${Math.floor(p.cpu * 2)} ${p.path}`
          );
        }
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'ss':
      case 'netstat': {
        return {
          output: `Netid State      Recv-Q Send-Q   Local Address:Port    Peer Address:Port Process
tcp   LISTEN     0      128            0.0.0.0:22           0.0.0.0:*     users:(("sshd",pid=412,fd=3))
tcp   LISTEN     0      511            0.0.0.0:80           0.0.0.0:*     users:(("nginx",pid=782,fd=6))
tcp   ESTAB      0      0       192.168.1.15:4444     203.0.113.80:55210 users:(("kworker_rev",pid=1337,fd=4))`,
          exitCode: 0
        };
      }

      case 'find': {
        // Exemplo: find / -perm -4000 2>/dev/null (busca SUID)
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
        // Se removeu o SUID do find
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

      case 'help': {
        return {
          output: `Comandos suportados no Simulador Linux (WinLinx):
- Navegação: pwd, cd, ls, ls -la, cat, find
- Identidade: whoami, id, sudo su, uname -a
- Processos: ps aux, ps -ef, ss -tulpn, netstat -tulpn
- Segurança & Permissões: chmod, chown, cat /etc/passwd, cat /etc/shadow
- Serviços & Automação: systemctl status <svc>, crontab -l
- Utilitários: clear, echo, grep`,
          exitCode: 0
        };
      }

      default:
        return { output: `bash: comando não encontrado: ${cmd}. Digite 'help' para a lista de comandos.`, exitCode: 127 };
    }
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
