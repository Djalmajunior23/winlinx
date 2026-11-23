import React, { useState } from 'react';
import { OSProcess, OSType } from '../types/simulator';
import { 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  Layers, 
  Network, 
  Terminal, 
  Search, 
  Activity, 
  Lock, 
  AlertTriangle,
  FolderGit2,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface ProcessArchitectureExplorerProps {
  linuxProcesses: OSProcess[];
  windowsProcesses: OSProcess[];
}

export const ProcessArchitectureExplorer: React.FC<ProcessArchitectureExplorerProps> = ({
  linuxProcesses,
  windowsProcesses
}) => {
  const [selectedOS, setSelectedOS] = useState<OSType>('linux');
  const [filterType, setFilterType] = useState<'all' | 'protected' | 'network' | 'suspicious'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPid, setSelectedPid] = useState<number>(1);

  const activeProcesses = selectedOS === 'linux' ? linuxProcesses : windowsProcesses;

  const filteredProcesses = activeProcesses.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pid.toString().includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'protected') return p.isProtectedProcess;
    if (filterType === 'network') return p.networkPort !== undefined;
    if (filterType === 'suspicious') return p.isSuspicious;

    return true;
  });

  const selectedProcess = activeProcesses.find(p => p.pid === selectedPid) || activeProcesses[0];

  const isMasqueraded = selectedProcess && selectedProcess.path !== selectedProcess.expectedPath;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Explorador de Processos & Arquitetura de Sistemas Operacionais
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inspecione os processos legítimos, processos protegidos (PPL / Kernel), hierarquia pai-filho (PPID) e vetores de cibersegurança do Linux e Windows.
            </p>
          </div>

          {/* Seletor de SO */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => {
                setSelectedOS('linux');
                setSelectedPid(1);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
                selectedOS === 'linux'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Linux Core Processes</span>
            </button>

            <button
              onClick={() => {
                setSelectedOS('windows');
                setSelectedPid(4);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 ${
                selectedOS === 'windows'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Windows Subsystems</span>
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar processo pelo nome, PID ou função de segurança..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterType === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Todos ({activeProcesses.length})
            </button>
            <button
              onClick={() => setFilterType('protected')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterType === 'protected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Protegidos / PPL
            </button>
            <button
              onClick={() => setFilterType('network')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterType === 'network' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Portas de Rede
            </button>
            <button
              onClick={() => setFilterType('suspicious')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                filterType === 'suspicious' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              Anômalos / Alvo
            </button>
          </div>
        </div>
      </div>

      {/* Grid Principal: Lista/Árvore + Painel de Detalhes do Processo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna da Tabela de Processos */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Processos Ativos ({filteredProcesses.length})</span>
            <span>Clique para inspecionar</span>
          </div>

          <div className="overflow-x-auto divide-y divide-slate-800/60 max-h-[540px] overflow-y-auto">
            {filteredProcesses.map(proc => {
              const isSelected = selectedProcess?.pid === proc.pid;
              const hasAnomaly = proc.isSuspicious || (proc.path !== proc.expectedPath);

              return (
                <div
                  key={proc.pid}
                  onClick={() => setSelectedPid(proc.pid)}
                  className={`p-3 cursor-pointer transition flex items-center justify-between gap-3 text-xs font-mono ${
                    isSelected 
                      ? 'bg-cyan-950/40 border-l-4 border-cyan-400' 
                      : 'hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 text-slate-500">
                      PID <span className="text-slate-300 font-bold">{proc.pid}</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`font-semibold ${
                          hasAnomaly ? 'text-rose-400 font-bold' : proc.isProtectedProcess ? 'text-emerald-400' : 'text-slate-200'
                        }`}>
                          {proc.name}
                        </span>

                        {proc.isProtectedProcess && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                            PROTEGIDO
                          </span>
                        )}

                        {hasAnomaly && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/80 animate-pulse">
                            ANOMALIA
                          </span>
                        )}

                        {proc.networkPort && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                            Porta {proc.networkPort}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-500 block truncate max-w-xs sm:max-w-md">
                        {proc.path} (PPID: {proc.ppid} • User: {proc.user})
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <span>{proc.memoryMb.toFixed(1)} MB</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna de Detalhes de Segurança do Processo */}
        <div className="lg:col-span-5 space-y-4">
          {selectedProcess ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 sticky top-20">
              {/* Header do Processo */}
              <div className="border-b border-slate-800/80 pb-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    PID {selectedProcess.pid} (PPID {selectedProcess.ppid})
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    selectedProcess.isProtectedProcess
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {selectedProcess.integrityLevel || (selectedProcess.user === 'root' ? 'Root Ring 0' : 'User Ring 3')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  {selectedProcess.name}
                  {selectedProcess.isProtectedProcess && (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  )}
                </h3>

                <p className="text-xs text-slate-400">
                  Usuário Proprietário: <strong className="text-slate-300">{selectedProcess.user}</strong>
                </p>
              </div>

              {/* Descrição Funcional no SO */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Papel no Sistema Operacional:
                </span>
                <p className="text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {selectedProcess.description}
                </p>
              </div>

              {/* Análise de Caminho & Masquerading */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Verificação de Integridade de Caminho:
                </span>

                <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Caminho em Execução:</span>
                    <span className={isMasqueraded ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                      {selectedProcess.path}
                    </span>
                  </div>

                  <div className="pt-1 border-t border-slate-800/60">
                    <span className="text-slate-500 block">Caminho Homologado pelo SO:</span>
                    <span className="text-emerald-400">
                      {selectedProcess.expectedPath}
                    </span>
                  </div>
                </div>

                {isMasqueraded && (
                  <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <strong>Alerta de Masquerading (MITRE ATT&CK T1036):</strong>
                      <p className="mt-0.5 text-[11px] text-rose-200">
                        O processo está rodando a partir de um diretório não padrão. Em sistemas de produção, isso indica fortemente binário malicioso ou injeção!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Importância em Cibersegurança & MITRE ATT&CK */}
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/50 text-xs space-y-1.5">
                <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Relevância em Cibersegurança:</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedProcess.cybersecRole}
                </p>

                {selectedProcess.mitreRef && (
                  <div className="pt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono">
                      MITRE ATT&CK: {selectedProcess.mitreRef}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
              Selecione um processo para ver a análise arquitetural.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
