import { FileNode } from '../types/simulator';

export function createInitialLinuxFS(): FileNode {
  return {
    name: '/',
    type: 'dir',
    permissions: 'drwxr-xr-x',
    owner: 'root',
    group: 'root',
    children: {
      'bin': {
        name: 'bin',
        type: 'dir',
        permissions: 'drwxr-xr-x',
        owner: 'root',
        group: 'root',
        children: {
          'bash': { name: 'bash', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 123456 },
          'ls': { name: 'ls', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 142000 },
          'cat': { name: 'cat', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 43200 },
          'find': { 
            name: 'find', 
            type: 'file', 
            permissions: '-rwsr-xr-x', // SUID propositalmente vulnerável para o Lab de Permissões!
            owner: 'root', 
            group: 'root', 
            size: 210000,
            inode: 131452
          },
          'su': { name: 'su', type: 'file', permissions: '-rwsr-xr-x', owner: 'root', group: 'root', size: 67800 },
          'ping': { name: 'ping', type: 'file', permissions: '-rwxr-xr-x', owner: 'root', group: 'root', size: 75000 }
        }
      },
      'etc': {
        name: 'etc',
        type: 'dir',
        permissions: 'drwxr-xr-x',
        owner: 'root',
        group: 'root',
        children: {
          'passwd': {
            name: 'passwd',
            type: 'file',
            permissions: '-rw-r--r--',
            owner: 'root',
            group: 'root',
            size: 1420,
            content: `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
aluno:x:1000:1000:Aluno WinLinx:/home/aluno:/bin/bash
backup-user:x:1001:1001:Service Backup:/home/backup-user:/bin/bash
secops:x:1002:1002:Security Analyst:/home/secops:/bin/bash`
          },
          'shadow': {
            name: 'shadow',
            type: 'file',
            permissions: '-rw-r-----',
            owner: 'root',
            group: 'shadow',
            size: 980,
            content: `root:$6$rounds=5000$saltsalt$vH6rQ8Z2w...:19420:0:99999:7:::
aluno:$6$salt123$xZ9kL1...:19420:0:99999:7:::
backup-user:$6$oldhash$qwerty...:19420:0:99999:7:::`
          },
          'sudoers': {
            name: 'sudoers',
            type: 'file',
            permissions: '-r--r-----',
            owner: 'root',
            group: 'root',
            size: 850,
            content: `root ALL=(ALL:ALL) ALL
%sudo ALL=(ALL:ALL) ALL
aluno ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /bin/systemctl restart nginx`
          },
          'crontab': {
            name: 'crontab',
            type: 'file',
            permissions: '-rw-r--r--',
            owner: 'root',
            group: 'root',
            size: 512,
            content: `# /etc/crontab: system-wide crontab
17 * * * * root cd / && run-parts --report /etc/cron.hourly
25 6 * * * root test -x /usr/sbin/anacron || ( cd / && run-parts --report /etc/cron.daily )
*/10 * * * * root /opt/scripts/backup.sh`
          }
        }
      },
      'home': {
        name: 'home',
        type: 'dir',
        permissions: 'drwxr-xr-x',
        owner: 'root',
        group: 'root',
        children: {
          'aluno': {
            name: 'aluno',
            type: 'dir',
            permissions: 'drwx------',
            owner: 'aluno',
            group: 'aluno',
            children: {
              'notas_aula.txt': {
                name: 'notas_aula.txt',
                type: 'file',
                permissions: '-rw-r--r--',
                owner: 'aluno',
                group: 'aluno',
                size: 340,
                content: `Anotações do Módulo de SO:
- No Linux, tudo é arquivo (ou socket, dispositivo, etc).
- Permissões são UGO (User, Group, Others).
- O bit SUID permite executar um arquivo com as permissões do proprietário.
- Alerta: SUID mal configurado em binários como 'find' ou 'bash' leva a Root direto!`
              },
              '.bashrc': {
                name: '.bashrc',
                type: 'file',
                permissions: '-rw-r--r--',
                owner: 'aluno',
                group: 'aluno',
                size: 120,
                content: `export PATH=$PATH:/usr/local/bin\nalias ll='ls -la'`
              }
            }
          }
        }
      },
      'opt': {
        name: 'opt',
        type: 'dir',
        permissions: 'drwxr-xr-x',
        owner: 'root',
        group: 'root',
        children: {
          'scripts': {
            name: 'scripts',
            type: 'dir',
            permissions: 'drwxrwxrwx', // Aberto para escrita! (Falha de segurança em script de cron)
            owner: 'root',
            group: 'root',
            children: {
              'backup.sh': {
                name: 'backup.sh',
                type: 'file',
                permissions: '-rwxrwxrwx',
                owner: 'root',
                group: 'root',
                size: 240,
                content: `#!/bin/bash\n# Script de backup executado pelo Cron a cada 10 min\ntar -czf /tmp/backup.tar.gz /home/aluno/notas_aula.txt\necho "[OK] Backup executado com sucesso." >> /var/log/backup.log`
              }
            }
          }
        }
      },
      'var': {
        name: 'var',
        type: 'dir',
        permissions: 'drwxr-xr-x',
        owner: 'root',
        group: 'root',
        children: {
          'log': {
            name: 'log',
            type: 'dir',
            permissions: 'drwxr-xr-x',
            owner: 'root',
            group: 'root',
            children: {
              'auth.log': {
                name: 'auth.log',
                type: 'file',
                permissions: '-rw-r-----',
                owner: 'root',
                group: 'adm',
                size: 3800,
                content: `Nov 22 10:14:02 srv-linux sshd[412]: Accepted publickey for aluno from 192.168.1.10 port 52311 ssh2
Nov 22 10:15:11 srv-linux sudo: aluno : TTY=pts/0 ; PWD=/home/aluno ; USER=root ; COMMAND=/bin/systemctl restart nginx
Nov 22 10:20:44 srv-linux sshd[899]: Failed password for invalid user admin from 203.0.113.55 port 44102 ssh2
Nov 22 10:20:46 srv-linux sshd[901]: Failed password for invalid user admin from 203.0.113.55 port 44104 ssh2
Nov 22 10:20:48 srv-linux sshd[903]: Failed password for root from 203.0.113.55 port 44106 ssh2
Nov 22 10:21:00 srv-linux sshd[905]: Failed password for root from 203.0.113.55 port 44108 ssh2
Nov 22 10:30:15 srv-linux CRON[1204]: (root) CMD (/opt/scripts/backup.sh)`
              },
              'syslog': {
                name: 'syslog',
                type: 'file',
                permissions: '-rw-r-----',
                owner: 'root',
                group: 'adm',
                size: 2100,
                content: `Nov 22 09:00:00 srv-linux systemd[1]: Started Network Time Synchronization.
Nov 22 09:00:02 srv-linux kernel: [    0.000000] Linux version 6.8.0-45-generic (buildd@lcy02-amd64-077)
Nov 22 10:15:00 srv-linux nginx[782]: 127.0.0.1 - - [22/Nov/2026:10:15:00 -0300] "GET / HTTP/1.1" 200 612`
              }
            }
          }
        }
      },
      'tmp': {
        name: 'tmp',
        type: 'dir',
        permissions: 'drwxrwxrwt',
        owner: 'root',
        group: 'root',
        children: {
          'session_token.tmp': {
            name: 'session_token.tmp',
            type: 'file',
            permissions: '-rw-rw-rw-',
            owner: 'aluno',
            group: 'aluno',
            size: 48,
            content: `FLAG{WINLINX_LINUX_TMP_DISCOVERY_2026}`
          }
        }
      }
    }
  };
}

export function createInitialWindowsFS(): FileNode {
  return {
    name: 'C:',
    type: 'dir',
    permissions: 'NTFS: BUILTIN\\Administrators:(F), NT AUTHORITY\\SYSTEM:(F)',
    owner: 'NT AUTHORITY\\SYSTEM',
    children: {
      'Windows': {
        name: 'Windows',
        type: 'dir',
        permissions: 'NTFS: BUILTIN\\Administrators:(F), NT AUTHORITY\\SYSTEM:(F), BUILTIN\\Users:(RX)',
        owner: 'NT AUTHORITY\\SYSTEM',
        children: {
          'System32': {
            name: 'System32',
            type: 'dir',
            permissions: 'NTFS: BUILTIN\\Administrators:(F), BUILTIN\\Users:(RX)',
            owner: 'NT AUTHORITY\\SYSTEM',
            children: {
              'cmd.exe': { name: 'cmd.exe', type: 'file', permissions: 'RX (Execute)', size: 320000 },
              'powershell.exe': { name: 'powershell.exe', type: 'file', permissions: 'RX (Execute)', size: 450000 },
              'whoami.exe': { name: 'whoami.exe', type: 'file', permissions: 'RX (Execute)', size: 68000 },
              'netstat.exe': { name: 'netstat.exe', type: 'file', permissions: 'RX (Execute)', size: 54000 },
              'sc.exe': { name: 'sc.exe', type: 'file', permissions: 'RX (Execute)', size: 61000 },
              'reg.exe': { name: 'reg.exe', type: 'file', permissions: 'RX (Execute)', size: 72000 }
            }
          },
          'Logs': {
            name: 'Logs',
            type: 'dir',
            permissions: 'NTFS: Administrators:(F), Users:(R)',
            owner: 'NT AUTHORITY\\SYSTEM',
            children: {
              'Security.evtx': {
                name: 'Security.evtx',
                type: 'file',
                permissions: 'Administrators:(F), SYSTEM:(F)',
                size: 1540000,
                content: `[Event 4624] - Logon bem-sucedido para ALUNO-PC\\Aluno (LogonType: 2 - Interativo)
[Event 4672] - Privilégios especiais atribuídos a ALUNO-PC\\Administrator (SeDebugPrivilege, SeBackupPrivilege)
[Event 4625] [10:22:13] - Falha de logon para conta 'admin_ti' (Motivo: Conta ou senha desconhecida, Origem: 192.168.1.88)
[Event 4625] [10:22:24] - Falha de logon para conta 'admin_ti' (Motivo: Conta ou senha desconhecida, Origem: 192.168.1.88)
[Event 7045] - Novo serviço instalado no sistema: 'WinVulnerableUpdater' (Caminho: C:\\Program Files\\Custom App\\service.exe)`
              }
            }
          }
        }
      },
      'Program Files': {
        name: 'Program Files',
        type: 'dir',
        permissions: 'NTFS: Administrators:(F), Users:(RX)',
        children: {
          'Custom App': {
            name: 'Custom App',
            type: 'dir',
            // Vulnerabilidade clássica do Windows: Unquoted Service Path com permissão de escrita para Users!
            permissions: 'NTFS: BUILTIN\\Users:(M,W,R) - MODIFICAÇÃO PERMITIDA',
            owner: 'BUILTIN\\Administrators',
            children: {
              'service.exe': {
                name: 'service.exe',
                type: 'file',
                permissions: 'NTFS: BUILTIN\\Users:(RX), Administrators:(F)',
                size: 89000
              },
              'config.ini': {
                name: 'config.ini',
                type: 'file',
                permissions: 'NTFS: BUILTIN\\Users:(RW)',
                size: 420,
                content: `[ServiceSettings]\nPort=8089\nLogging=Verbose\nTarget=InternalManagement`
              }
            }
          }
        }
      },
      'Users': {
        name: 'Users',
        type: 'dir',
        permissions: 'NTFS: Administrators:(F), SYSTEM:(F)',
        children: {
          'Aluno': {
            name: 'Aluno',
            type: 'dir',
            permissions: 'NTFS: ALUNO-PC\\Aluno:(F), SYSTEM:(F)',
            owner: 'ALUNO-PC\\Aluno',
            children: {
              'Desktop': {
                name: 'Desktop',
                type: 'dir',
                permissions: 'NTFS: Aluno:(F)',
                children: {
                  'instrucoes_seguranca.txt': {
                    name: 'instrucoes_seguranca.txt',
                    type: 'file',
                    size: 410,
                    content: `Laboratório Windows Security (WinLinx):
- No Windows, permissões são gerenciadas via ACLs (Access Control Lists) e DACLs.
- O comando 'icacls' permite inspecionar permissões detalhadas.
- Verifique serviços rodando com a conta LocalSystem e caminhos sem aspas (Unquoted Service Path).
- O log Security.evtx armazena eventos críticos como 4624 (Logon OK) e 4625 (Logon Falho).`
                  }
                }
              },
              'Documents': {
                name: 'Documents',
                type: 'dir',
                permissions: 'NTFS: Aluno:(F)',
                children: {
                  'flag_secreta.txt': {
                    name: 'flag_secreta.txt',
                    type: 'file',
                    size: 52,
                    content: `FLAG{WINLINX_WINDOWS_DACLS_DEFENDER_2026}`
                  }
                }
              },
              'Downloads': {
                name: 'Downloads',
                type: 'dir',
                permissions: 'NTFS: Aluno:(F)',
                children: {
                  'invoice.pdf': {
                    name: 'invoice.pdf',
                    type: 'file',
                    size: 45210,
                    content: '%PDF-1.7 - Fatura de Servicos Corporativos WinLinx 2026',
                    alternateStreams: {
                      'Zone.Identifier': '[ZoneTransfer]\r\nZoneId=3\r\nHostUrl=http://evil-c2.net/payload.exe',
                      'hidden_payload.ps1': 'powershell -enc aW52b2tlLWV2aWw= # FLAG{WINLINX_NTFS_ADS_STREAM_DISCOVERED_2026}'
                    }
                  }
                }
              }
            }
          },
          'Administrator': {
            name: 'Administrator',
            type: 'dir',
            permissions: 'NTFS: BUILTIN\\Administrators:(F), SYSTEM:(F)',
            owner: 'ALUNO-PC\\Administrator',
            isProtected: true,
            children: {
              'NTUSER.DAT': { name: 'NTUSER.DAT', type: 'file', size: 1048576 }
            }
          }
        }
      }
    }
  };
}
