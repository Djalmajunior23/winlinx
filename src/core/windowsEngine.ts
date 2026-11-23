import { CommandResult, FileNode, OSProcess } from '../types/simulator';

export class WindowsSimulatorEngine {
  private currentDir: string = 'C:\\Users\\Aluno';
  private currentUser: string = 'ALUNO-PC\\Aluno';
  private rootFS: FileNode;
  private processes: OSProcess[] = [
    { pid: 4, name: 'System', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.8, memoryMb: 45.0, path: 'ntoskrnl.exe', status: 'running' },
    { pid: 512, name: 'smss.exe', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.0, memoryMb: 4.2, path: 'C:\\Windows\\System32\\smss.exe', status: 'running' },
    { pid: 688, name: 'csrss.exe', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.1, memoryMb: 6.8, path: 'C:\\Windows\\System32\\csrss.exe', status: 'running' },
    { pid: 740, name: 'wininit.exe', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.0, memoryMb: 5.1, path: 'C:\\Windows\\System32\\wininit.exe', status: 'running' },
    { pid: 812, name: 'services.exe', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.2, memoryMb: 12.0, path: 'C:\\Windows\\System32\\services.exe', status: 'running' },
    { pid: 840, name: 'lsass.exe', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.5, memoryMb: 28.5, path: 'C:\\Windows\\System32\\lsass.exe', status: 'running' },
    { pid: 980, name: 'svchost.exe', user: 'NT AUTHORITY\\SYSTEM', cpu: 0.3, memoryMb: 18.2, path: 'C:\\Windows\\System32\\svchost.exe', status: 'running' },
    { pid: 1450, name: 'explorer.exe', user: 'ALUNO-PC\\Aluno', cpu: 1.1, memoryMb: 65.4, path: 'C:\\Windows\\explorer.exe', status: 'running' },
    { pid: 2110, name: 'powershell.exe', user: 'ALUNO-PC\\Aluno', cpu: 0.4, memoryMb: 48.0, path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', status: 'running' },
    // Processo suspeito não assinado rodando a partir de AppData ou Temp
    {
      pid: 4992,
      name: 'updater_svc.exe',
      user: 'ALUNO-PC\\Aluno',
      cpu: 2.4,
      memoryMb: 32.1,
      path: 'C:\\Program Files\\Custom App\\service.exe',
      status: 'running',
      isSuspicious: true,
      description: 'Binário executado a partir de caminho sem aspas e gravável por Users comuns'
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

    // Suporte a elevação simulada "Run as Administrator"
    if (trimmed.toLowerCase().startsWith('start-process powershell -verb runas') || trimmed.toLowerCase() === 'elevate') {
      this.currentUser = 'NT AUTHORITY\\SYSTEM';
      return {
        output: 'PS C:\\Windows\\System32> Sessão elevada iniciada com privilégios de NT AUTHORITY\\SYSTEM / Administrator.',
        exitCode: 0
      };
    }

    return this.executeCommandInternal(trimmed);
  }

  private executeCommandInternal(cmdLine: string): CommandResult {
    const tokens = cmdLine.split(' ').filter(Boolean);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

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
          'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id ProcessName',
          '-------  ------    -----      -----     ------     -- -----------'
        ];
        for (const p of this.processes) {
          lines.push(
            `    ${Math.floor(p.memoryMb * 8).toString().padStart(3)}      14    ${Math.floor(p.memoryMb * 1024).toString().padStart(6)}     ${Math.floor(p.memoryMb * 1200).toString().padStart(6)}       ${p.cpu.toFixed(2)}   ${p.pid.toString().padStart(4)} ${p.name.replace('.exe', '')}`
          );
        }
        return { output: lines.join('\n'), exitCode: 0 };
      }

      case 'netstat': {
        return {
          output: `Conexões Ativas

  Proto  Endereço Local          Endereço Externo        Estado          PID
  TCP    0.0.0.0:135             0.0.0.0:0               LISTENING       812
  TCP    0.0.0.0:445             0.0.0.0:0               LISTENING       4
  TCP    0.0.0.0:3389            0.0.0.0:0               LISTENING       980
  TCP    0.0.0.0:8089            0.0.0.0:0               LISTENING       4992  <-- [Serviço Não Homologado]
  TCP    192.168.1.50:49210      198.51.100.22:443       ESTABLISHED     1450`,
          exitCode: 0
        };
      }

      case 'icacls': {
        const target = args[0] || this.currentDir;
        const normalized = this.normalizeWindowsPath(target);
        const node = this.getNodeByWindowsPath(normalized);

        if (!node) {
          return { output: `${target}: O sistema não pode encontrar o arquivo especificado.`, exitCode: 1 };
        }

        // Se checar C:\Program Files\Custom App
        if (normalized.includes('Custom App') || node.name === 'Custom App') {
          // Se o usuário passou comando de correção: ex: icacls "C:\Program Files\Custom App" /remove "BUILTIN\Users"
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

      case 'help':
      case 'get-help': {
        return {
          output: `Comandos suportados no Simulador Windows PowerShell (WinLinx):
- Navegação: pwd, Get-Location, cd, dir, ls, Get-ChildItem, cat, type, Get-Content
- Identidade: whoami, whoami /priv, whoami /all, elevate
- Processos & Rede: Get-Process, ps, netstat -ano
- Segurança & DACL: icacls <caminho>, icacls <caminho> /remove "BUILTIN\\Users"
- Serviços & Persistência: Get-Service, sc qc <serviço>, Get-ScheduledTask
- Logs: Get-EventLog -LogName Security
- Utilitários: cls, clear, echo`,
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
      // Case-insensitive lookup for Windows
      const childKeys: string[] = Object.keys(current.children);
      const matchedKey: string | undefined = childKeys.find(k => k.toLowerCase() === part.toLowerCase());
      if (!matchedKey) return null;
      current = current.children[matchedKey];
    }
    return current || null;
  }
}
