import React, { useState } from 'react';
import { ArrowLeftRight, Search, Copy, Check, Terminal, ExternalLink } from 'lucide-react';

interface ComparisonItem {
  category: string;
  concept: string;
  linuxCmd: string;
  windowsCmd: string;
  explanation: string;
  cybersecNote: string;
}

export const CommandComparator: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const comparisons: ComparisonItem[] = [
    {
      category: 'Permissões & Acesso',
      concept: 'Verificar permissões detalhadas de arquivos/pastas',
      linuxCmd: 'ls -la <caminho>',
      windowsCmd: 'icacls <caminho>',
      explanation: 'No Linux mostra UGO (User, Group, Others) com bits rwx e SUID; no Windows exibe a lista DACL com direitos de controle, herança e usuários.',
      cybersecNote: 'Essencial para detectar se um arquivo confidencial possui leitura para "Others" no Linux ou "Everyone" no Windows.'
    },
    {
      category: 'Permissões & Acesso',
      concept: 'Localizar binários com execução em privilégio elevado',
      linuxCmd: 'find / -perm -4000 -type f 2>/dev/null',
      windowsCmd: 'Get-Acl "C:\\*" | Where-Object {$_.AccessToString -like "*Users*FullControl*"}',
      explanation: 'No Linux busca o bit SUID ativo; no Windows procura arquivos ou diretórios executáveis onde o grupo Users possui controle de gravação/modificação.',
      cybersecNote: 'Técnica primária de reconhecimento em pós-exploração (MITRE ATT&CK T1548).'
    },
    {
      category: 'Processos & Memória',
      concept: 'Listar todos os processos com consumo de recursos e usuário dono',
      linuxCmd: 'ps aux',
      windowsCmd: 'Get-Process | Format-Table Id, ProcessName, Path, CPU',
      explanation: 'O Linux lê o pseudo-filesystem /proc; o Windows consulta o subsistema de processos do kernel (EPROCESS structures via NtQuerySystemInformation).',
      cybersecNote: 'Permite identificar malware rodando a partir de pastas temporárias (/tmp ou %TEMP%).'
    },
    {
      category: 'Rede & Conexões',
      concept: 'Exibir portas abertas em escuta (LISTEN) e PIDs associados',
      linuxCmd: 'ss -tulpn  (ou netstat -tulpn)',
      windowsCmd: 'netstat -ano | findstr LISTENING  (ou Get-NetTCPConnection -State Listen)',
      explanation: 'ss utiliza a interface netlink do kernel Linux; netstat / Get-NetTCPConnection consulta a stack TCP/IP do Windows.',
      cybersecNote: 'Crucial para identificar backdoors, bind shells e serviços vulneráveis expostos para a rede externa.'
    },
    {
      category: 'Usuários & Privilégios',
      concept: 'Inspecionar privilégios detalhados do usuário atual',
      linuxCmd: 'id  &&  sudo -l',
      windowsCmd: 'whoami /priv  &&  whoami /groups',
      explanation: 'No Linux o comando id exibe UIDs/GIDs e o sudo -l lista regras de elevação; no Windows o whoami lista privileges como SeDebugPrivilege e SeImpersonatePrivilege.',
      cybersecNote: 'SeImpersonatePrivilege permite ataques da família RottenPotato / JuicyPotato no Windows; NOPASSWD no sudoers permite Root no Linux.'
    },
    {
      category: 'Serviços & Persistência',
      concept: 'Inspecionar status e configuração de serviços do sistema',
      linuxCmd: 'systemctl status <servico>',
      windowsCmd: 'Get-Service <servico>  (ou sc qc <servico>)',
      explanation: 'O systemd gerencia units (.service) declarativas; o Service Control Manager (services.exe) gerencia serviços registrados no Registro do Windows.',
      cybersecNote: 'sc qc revela se o caminho do binário não possui aspas ("Unquoted Service Path"), vulnerabilidade clássica de elevação.'
    },
    {
      category: 'Serviços & Persistência',
      concept: 'Listar tarefas e comandos agendados para execução periódica',
      linuxCmd: 'crontab -l  &&  cat /etc/crontab',
      windowsCmd: 'Get-ScheduledTask  (ou schtasks /query /fo LIST)',
      explanation: 'O daemon cron roda jobs definidos em tabelas de texto; o Task Scheduler do Windows gerencia tarefas XML complexas.',
      cybersecNote: 'Mecanismo favorito de persistência tanto em Linux quanto em Windows para reiniciar malwares após reboots.'
    },
    {
      category: 'Logs & Auditoria',
      concept: 'Investigar tentativas de autenticação e falhas de logon',
      linuxCmd: 'cat /var/log/auth.log | grep "Failed password"',
      windowsCmd: 'Get-EventLog -LogName Security -InstanceId 4625',
      explanation: 'O Linux registra em auth.log ou via journalctl; o Windows utiliza canais do Event Viewer (.evtx), onde Event ID 4625 representa Logon Failure.',
      cybersecNote: 'Detecção primária de ataques de força bruta, password spraying e invasão de contas.'
    }
  ];

  const categories = ['Todas', 'Permissões & Acesso', 'Processos & Memória', 'Rede & Conexões', 'Usuários & Privilégios', 'Serviços & Persistência', 'Logs & Auditoria'];

  const filtered = comparisons.filter(item => {
    const matchesCat = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesSearch = 
      item.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.linuxCmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.windowsCmd.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-cyan-400" />
          Comparador Lado a Lado: Linux (Código Aberto) vs Windows (Código Fechado)
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Guia de equivalência técnica imediata entre utilitários de linha de comando, estruturas de sistema operacional e relevância para Cibersegurança.
        </p>

        {/* Barra de Filtros e Busca */}
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar conceito, comando ou termo de cibersegurança..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Comparações */}
      <div className="space-y-4">
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-900/40 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition space-y-4"
          >
            {/* Categoria e Conceito */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                  {item.category}
                </span>
                <h3 className="text-base font-semibold text-slate-100 mt-1">
                  {item.concept}
                </h3>
              </div>
            </div>

            {/* Comandos Lado a Lado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Linux */}
              <div className="bg-slate-950 rounded-lg border border-emerald-900/40 p-3 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Linux (Bash / POSIX)
                  </span>
                  <button
                    onClick={() => handleCopy(item.linuxCmd)}
                    className="p-1 rounded text-slate-500 hover:text-emerald-400 transition"
                    title="Copiar comando"
                  >
                    {copiedText === item.linuxCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <code className="text-xs text-emerald-300 font-mono block break-all bg-emerald-950/20 p-2 rounded border border-emerald-800/30">
                  {item.linuxCmd}
                </code>
              </div>

              {/* Windows */}
              <div className="bg-slate-950 rounded-lg border border-blue-900/40 p-3 relative group">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Windows (PowerShell / WinAPI)
                  </span>
                  <button
                    onClick={() => handleCopy(item.windowsCmd)}
                    className="p-1 rounded text-slate-500 hover:text-blue-400 transition"
                    title="Copiar comando"
                  >
                    {copiedText === item.windowsCmd ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <code className="text-xs text-blue-300 font-mono block break-all bg-blue-950/20 p-2 rounded border border-blue-800/30">
                  {item.windowsCmd}
                </code>
              </div>
            </div>

            {/* Explicação & Foco em Cibersegurança */}
            <div className="text-xs space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <p className="text-slate-300">
                <strong className="text-slate-200">Como funciona:</strong> {item.explanation}
              </p>
              <p className="text-amber-300/90 font-medium">
                <strong className="text-amber-400">🚨 Ponto Crítico de Segurança:</strong> {item.cybersecNote}
              </p>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-slate-900/20 rounded-xl border border-slate-800">
            Nenhum comando ou conceito encontrado com esse filtro.
          </div>
        )}
      </div>
    </div>
  );
};
