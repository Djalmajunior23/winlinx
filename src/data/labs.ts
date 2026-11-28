import { LabDefinition } from '../types/simulator';

export const PRACTICAL_LABS: LabDefinition[] = [
  {
    id: 'lab-permissions-dacl',
    moduleSlug: 'mod-2-permissoes-acesso',
    title: 'Lab 01: Caça e Remediação de Permissões Críticas (SUID vs DACL)',
    difficulty: 'Iniciante',
    category: 'Permissões & Acesso',
    durationMinutes: 25,
    description: 'Investigue permissões anômalas no Linux e no Windows que possibilitam escalação local de privilégios. Execute o reconhecimento e realize a remediação como um analista de defesa.',
    realWorldScenario: 'Durante um pentest interno, o atacante explorou um binário com bit SUID esquecido em um servidor Linux e uma pasta de aplicativo com permissões abertas para o grupo Users em uma estação Windows. Sua missão é identificar e corrigir ambas as brechas.',
    mitreTechniques: [
      { id: 'T1548.001', name: 'Abuse Elevation Control Mechanism: Setuid and Setgid' },
      { id: 'T1548.002', name: 'Bypass User Account Control' }
    ],
    learningGoals: [
      'Executar comandos de busca por arquivos com bit SUID no Linux (find -perm -4000).',
      'Analisar listas de controle de acesso NTFS no Windows utilizando o comando icacls.',
      'Remediar as permissões inseguras restaurando o princípio do menor privilégio.'
    ],
    tasks: [
      {
        id: 'task-1-linux-suid-find',
        title: 'Tarefa 1: Identificar o binário SUID vulnerável no Linux',
        targetOS: 'linux',
        instructions: 'No terminal Linux, procure por binários configurados com bit SUID ativo em todo o sistema. Dica: use o comando find filtrando por permissão -4000.',
        objective: 'Localizar o utilitário administrativo find com bit SUID habilitado indevidamente.',
        hint: 'Digite: find / -perm -4000 2>/dev/null',
        validateWithEngineFlag: true,
        flagReward: 'FLAG{WINLINX_LINUX_SUID_DISCOVERED}'
      },
      {
        id: 'task-2-linux-suid-fix',
        title: 'Tarefa 2: Remediar a permissão do binário no Linux',
        targetOS: 'linux',
        instructions: 'Remova a permissão SUID do binário /bin/find para que ele não execute mais com os privilégios do usuário root.',
        objective: 'Remover o bit SUID com o comando chmod.',
        hint: 'Execute: chmod 755 /bin/find ou chmod -s /bin/find',
        validateWithEngineFlag: true,
        flagReward: 'FLAG{WINLINX_LINUX_SUID_FIXED_DEFENDER_2026}'
      },
      {
        id: 'task-3-win-icacls-audit',
        title: 'Tarefa 3: Auditar a DACL da pasta do aplicativo no Windows',
        targetOS: 'windows',
        instructions: 'Alterne para o terminal Windows e inspecione as permissões de acesso da pasta "C:\\Program Files\\Custom App" com o comando icacls.',
        objective: 'Descobrir se o grupo Users possui permissão de modificação indevida.',
        hint: 'Execute: icacls "C:\\Program Files\\Custom App"',
        validateWithEngineFlag: true,
        flagReward: 'FLAG{WINLINX_WINDOWS_WEAK_DACL_AUDITED}'
      },
      {
        id: 'task-4-win-icacls-fix',
        title: 'Tarefa 4: Remediar a permissão permissiva no Windows',
        targetOS: 'windows',
        instructions: 'Remova a permissão de modificação do grupo BUILTIN\\Users da pasta Custom App.',
        objective: 'Remover o privilégio excessivo usando o parâmetro /remove no icacls.',
        hint: 'Execute: icacls "C:\\Program Files\\Custom App" /remove "BUILTIN\\Users"',
        validateWithEngineFlag: true,
        flagReward: 'FLAG{WINLINX_WINDOWS_ICACLS_REMEDIATED_2026}'
      }
    ]
  },
  {
    id: 'lab-processes-memory',
    moduleSlug: 'mod-1-arquitetura',
    title: 'Lab 02: Triagem de Processos & Detecção de Malware Oculto',
    difficulty: 'Intermediário',
    category: 'Processos & Memória',
    durationMinutes: 30,
    description: 'Aprenda a inspecionar processos ativos, identificar processos anômalos rodando em segundo plano e correlacionar processos com conexões de rede suspeitas tanto no Linux quanto no Windows.',
    realWorldScenario: 'O sistema de alerta reportou tráfego de saída incomum na rede. Você precisa determinar se existe um processo malicioso ou backdoor ativo em execução.',
    mitreTechniques: [
      { id: 'T1057', name: 'Process Discovery' },
      { id: 'T1036', name: 'Masquerading' },
      { id: 'T1049', name: 'System Network Connections Discovery' }
    ],
    learningGoals: [
      'Utilizar ps aux e ss no Linux para correlacionar PIDs a sockets de rede abertos.',
      'Usar Get-Process e netstat -ano no Windows para identificar processos anômalos.',
      'Identificar técnicas de mascaramento de processos (kworker falso).'
    ],
    tasks: [
      {
        id: 'task-proc-linux-ps',
        title: 'Tarefa 1: Identificar processo anômalo no Linux',
        targetOS: 'linux',
        instructions: 'Liste todos os processos em execução e filtre por processos executando a partir do diretório /tmp.',
        objective: 'Localizar o processo kworker_rev rodando a partir de /tmp/.hidden.',
        hint: 'Execute: ps aux | grep /tmp',
        evidence: [{"label": "PID suspeito", "expected": "1337"}, {"label": "Nome do processo", "expected": "kworker_rev"}],
        validationCommand: 'ps aux | grep /tmp',
        expectedOutputSubstring: 'kworker_rev',
        flagReward: 'FLAG{WINLINX_LINUX_MALICIOUS_PROCESS_SPOTTED}'
      },
      {
        id: 'task-proc-linux-net',
        title: 'Tarefa 2: Verificar conexões de rede associadas ao processo',
        targetOS: 'linux',
        instructions: 'Verifique quais portas e conexões ativas estão associadas ao PID suspeito (1337).',
        objective: 'Usar ss ou netstat para identificar a porta 4444 e IP remoto.',
        hint: 'Execute: ss -tulpn ou netstat -tulpn',
        evidence: [{"label": "Porta TCP em escuta", "expected": "4444"}, {"label": "Processo associado", "expected": "kworker_rev"}],
        alternativeCommands: ['netstat -tulpn'],
        validationCommand: 'ss -tulpn',
        expectedOutputSubstring: 'kworker_rev',
        flagReward: 'FLAG{WINLINX_REVERSE_SHELL_ESTABLISHED_PORT4444}'
      },
      {
        id: 'task-proc-win-ps',
        title: 'Tarefa 3: Investigar conexões ativas no Windows',
        targetOS: 'windows',
        instructions: 'Execute o comando netstat no PowerShell para verificar portas em estado LISTENING e identifique uma porta não padrão.',
        objective: 'Localizar a porta 8089 vinculada ao PID 4992.',
        hint: 'Execute: netstat -ano',
        evidence: [{"label": "Porta TCP em escuta", "expected": "8089"}, {"label": "PID associado", "expected": "4992"}],
        validationCommand: 'netstat -ano',
        expectedOutputSubstring: '8089',
        flagReward: 'FLAG{WINLINX_WINDOWS_SUSPICIOUS_PORT_8089}'
      },
      {
        id: "task-proc-linux-contain",
        title: "Tarefa 4: Conter o tráfego no Linux",
        targetOS: "linux",
        instructions: "Verifique a porta antes da contenção, aplique o bloqueio de entrada e repita a sonda.",
        objective: "A porta 4444/TCP deve ficar filtrada.",
        hint: "Execute ufw deny 4444 e verifique o estado.",
        requires: ["task-proc-linux-ps", "task-proc-linux-net"],
        verify: { kind: 'tcp-filtered', port: 4444 }
      },
      {
        id: "task-proc-win-contain",
        title: "Tarefa 5: Conter o tráfego no Windows",
        targetOS: "windows",
        instructions: "Verifique a porta antes da contenção, aplique o bloqueio e repita a sonda.",
        objective: "A porta 8089/TCP deve ficar filtrada.",
        hint: "Execute netsh advfirewall firewall add rule name=\"Block 8089\" dir=in action=block protocol=TCP localport=8089 e verifique o estado.",
        requires: ["task-proc-win-ps"],
        verify: { kind: 'tcp-filtered', port: 8089 }
      }
    ]
  },
  {
    id: 'lab-persistence-services',
    moduleSlug: 'mod-3-servicos-persistencia',
    title: 'Lab 03: Caça a Persistências em Serviços e Agendadores',
    difficulty: 'Intermediário',
    category: 'Persistência & Serviços',
    durationMinutes: 25,
    description: 'Analise mecanismos de persistência no Linux via Cron e scripts de inicialização, e no Windows via Unquoted Service Paths e Tarefas Agendadas.',
    realWorldScenario: 'Após um ataque simulado de equipe vermelha, seu objetivo é descobrir como os atacantes garantiram a sobrevivência de seus artefatos após o reboot da máquina.',
    mitreTechniques: [
      { id: 'T1053.003', name: 'Scheduled Task/Job: Cron' },
      { id: 'T1574.009', name: 'Hijack Execution Flow: Path Interception by Unquoted Path' }
    ],
    learningGoals: [
      'Inspecionar tabelas de agendamento do cron (/etc/crontab e /etc/cron.*).',
      'Diagnosticar e compreender a vulnerabilidade de Unquoted Service Path no Windows.',
      'Identificar o serviço de alta prioridade configurado para subir com o sistema.'
    ],
    tasks: [
      {
        id: 'task-persist-cron',
        title: 'Tarefa 1: Inspecionar o arquivo de crontab do Linux',
        targetOS: 'linux',
        instructions: 'Exiba o conteúdo do arquivo /etc/crontab e identifique scripts agendados com privilégios de root.',
        objective: 'Identificar a chamada para o script /opt/scripts/backup.sh a cada 10 minutos.',
        hint: 'Execute: cat /etc/crontab',
        evidence: [{"label": "Caminho do script agendado", "expected": "/opt/scripts/backup.sh"}, {"label": "Conta que executa o script", "expected": "root"}],
        validationCommand: 'cat /etc/crontab',
        expectedOutputSubstring: '/opt/scripts/backup.sh',
        flagReward: 'FLAG{WINLINX_LINUX_CRON_PERSISTENCE_AUDITED}'
      },
      {
        id: 'task-persist-win-qc',
        title: 'Tarefa 2: Inspecionar a configuração do serviço Windows',
        targetOS: 'windows',
        instructions: 'Consulte a configuração do serviço WinVulnerableUpdater usando o utilitário sc qc.',
        objective: 'Evidenciar o caminho binário sem aspas "C:\\Program Files\\Custom App\\service.exe".',
        hint: 'Execute: sc qc WinVulnerableUpdater',
        evidence: [{"label": "Nome do serviço", "expected": "WinVulnerableUpdater"}, {"label": "Conta configurada", "expected": "LocalSystem"}],
        alternativeCommands: ['sc.exe qc WinVulnerableUpdater'],
        validationCommand: 'sc qc WinVulnerableUpdater',
        expectedOutputSubstring: 'C:\\Program Files\\Custom App\\service.exe',
        flagReward: 'FLAG{WINLINX_UNQUOTED_PATH_IDENTIFIED}'
      },
      {
        id: "task-persist-win-fix",
        title: "Tarefa 3: Corrigir o caminho do serviço",
        targetOS: "windows",
        instructions: "Proteja o caminho do executável com aspas, preservando o executável configurado. Consulte a configuração e confira se o processo do serviço segue em execução.",
        objective: "O caminho registrado precisa conter o executável original entre aspas.",
        hint: "Execute sc config WinVulnerableUpdater binPath= '\"C:\\Program Files\\Custom App\\service.exe\"' e confira com sc qc e sc query para o mesmo serviço.",
        requires: ["task-persist-win-qc"],
        verify: { kind: 'windows-service-path' }
      }
    ]
  },
  {
    id: 'lab-logs-investigation',
    moduleSlug: 'mod-4-auditoria-logs',
    title: 'Lab 04: Investigação Forense de Logs & Rastreamento de Logins',
    difficulty: 'Avançado',
    category: 'Auditoria & Logs',
    durationMinutes: 35,
    description: 'Investigue tentativas de força bruta e elevação de privilégios consultando auth.log no Linux e os eventos de segurança (Event IDs 4624, 4625 e 4672) no Windows.',
    realWorldScenario: 'A equipe de SOC reportou múltiplos alertas de autenticação suspeita durante a madrugada. Você deve extrair o endereço IP atacante e as contas visadas.',
    mitreTechniques: [
      { id: 'T1110', name: 'Brute Force' },
      { id: 'T1078', name: 'Valid Accounts' }
    ],
    learningGoals: [
      'Filtrar falhas de login no Linux (/var/log/auth.log) identificando IPs externos.',
      'Consultar logs de segurança no Windows (.evtx) interpretando Event IDs do Active Directory e estações.',
      'Identificar a conta comprometida e horários do incidente.'
    ],
    tasks: [
      {
        id: 'task-log-linux-auth',
        title: 'Tarefa 1: Analisar tentativas de força bruta no auth.log',
        targetOS: 'linux',
        instructions: 'Exiba o arquivo /var/log/auth.log e procure por entradas de senhas com falha (Failed password).',
        objective: 'Identificar o IP de ataque 203.0.113.55 tentando autenticar como root e admin.',
        hint: 'Execute: cat /var/log/auth.log | grep "Failed password"',
        evidence: [{"label": "IP de origem", "expected": "203.0.113.55"}, {"label": "Conta da primeira falha", "expected": "admin"}, {"label": "Horário da primeira falha (HH:MM:SS)", "expected": "10:20:44"}],
        alternativeCommands: ['cat /var/log/auth.log | grep "Failed password"'],
        validationCommand: 'cat /var/log/auth.log',
        expectedOutputSubstring: 'Failed password',
        flagReward: 'FLAG{WINLINX_SSH_BRUTE_FORCE_DETECTED_203.0.113.55}'
      },
      {
        id: 'task-log-win-security',
        title: 'Tarefa 2: Analisar eventos no Security.evtx do Windows',
        targetOS: 'windows',
        instructions: 'Consulte os logs de segurança do Windows para identificar falhas de logon (Event 4625) e atribuição de privilégios especiais (Event 4672).',
        objective: 'Identificar as falhas de autenticação vindas de 192.168.1.88.',
        hint: 'Execute: Get-EventLog -LogName Security',
        evidence: [{"label": "IP de origem", "expected": "192.168.1.88"}, {"label": "Conta alvo", "expected": "admin_ti"}, {"label": "ID do evento de falha", "expected": "4625"}, {"label": "Horário da primeira falha (HH:MM:SS)", "expected": "10:22:13"}],
        alternativeCommands: ['Get-EventLog -LogName Security'],
        validationCommand: 'Get-EventLog',
        expectedOutputSubstring: 'Event 4625',
        flagReward: 'FLAG{WINLINX_WINDOWS_SECURITY_LOGS_CORRELATED}'
      }
    ]
  },
  {
    id: 'lab-hardening-audit',
    moduleSlug: 'mod-5-hardening',
    title: 'Lab 05: Hardening de Estação de Trabalho & Baselines CIS',
    difficulty: 'Avançado',
    category: 'Hardening',
    durationMinutes: 30,
    description: 'Execute uma varredura de conformidade, identifique configurações em desacordo com as melhores práticas CIS Benchmarks e valide os privilégios atribuídos aos usuários.',
    realWorldScenario: 'Como parte da preparação para uma auditoria ISO 27001, você deve verificar a postura de segurança e privilégios das contas de usuário locais.',
    mitreTechniques: [
      { id: 'T1087.001', name: 'Account Discovery: Local Account' },
      { id: 'T1069.001', name: 'Permission Groups Discovery: Local Groups' }
    ],
    learningGoals: [
      'Inspecionar permissões especiais do usuário corrente no Windows com whoami /priv.',
      'Verificar regras de sudoers no Linux para detectar comandos com NOPASSWD.',
      'Compreender o impacto de privilégios SeDebugPrivilege e SeImpersonatePrivilege.'
    ],
    tasks: [
      {
        id: 'task-hard-win-whoami',
        title: 'Tarefa 1: Inspecionar privilégios de token no Windows',
        targetOS: 'windows',
        instructions: 'Execute o comando whoami com o parâmetro de privilégios para inspecionar os direitos atribuídos ao token atual.',
        objective: 'Verificar os privilégios habilitados no token.',
        hint: 'Execute: whoami /priv',
        evidence: [{"label": "Privilégio habilitado de travessia de diretório", "expected": "SeChangeNotifyPrivilege"}],
        validationCommand: 'whoami /priv',
        expectedOutputSubstring: 'SeChangeNotifyPrivilege',
        flagReward: 'FLAG{WINLINX_WINDOWS_TOKEN_PRIVILEGES_AUDITED}'
      },
      {
        id: 'task-hard-linux-sudoers',
        title: 'Tarefa 2: Auditar regras de elevação no sudoers do Linux',
        targetOS: 'linux',
        instructions: 'Exiba o conteúdo de /etc/sudoers para descobrir quais comandos o usuário aluno pode executar sem senha (NOPASSWD).',
        objective: 'Identificar a permissão de restart do nginx e apt-get sem senha.',
        hint: 'Execute: cat /etc/sudoers',
        evidence: [{"label": "Conta com regra NOPASSWD", "expected": "aluno"}, {"label": "Executável do gerenciador de pacotes autorizado", "expected": "/usr/bin/apt-get"}],
        validationCommand: 'cat /etc/sudoers',
        expectedOutputSubstring: 'NOPASSWD',
        flagReward: 'FLAG{WINLINX_LINUX_SUDOERS_MISCONFIG_AUDITED}'
      },
      {
        id: "task-hard-linux-policy",
        title: "Tarefa 3: Exigir senha para a regra sudoers",
        targetOS: "linux",
        instructions: "Altere a política simulada da conta aluno e verifique o resultado.",
        objective: "A regra sudoers deve voltar a exigir senha sem remover a lista de comandos autorizados.",
        hint: "No simulador, execute sudo visudo --require-password aluno e confira o arquivo /etc/sudoers.",
        requires: ["task-hard-linux-sudoers"],
        verify: { kind: 'linux-sudo-policy' }
      },
      {
        id: "task-hard-win-ppl",
        title: "Tarefa 4: Configurar a proteção LSA",
        targetOS: "windows",
        instructions: "Configure RunAsPPL no Registro virtual e verifique o valor configurado.",
        objective: "RunAsPPL deve estar configurado como 1 no Registro simulado.",
        hint: "Execute reg add \"HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa\" /v RunAsPPL /t REG_DWORD /d 1 /f.",
        requires: ["task-hard-win-whoami"],
        verify: { kind: 'registry-value', key: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa', name: 'RunAsPPL', valueType: 'REG_DWORD', value: 1 }
      }
    ]
  }
];
