import React, { useState } from 'react';
import { 
  Layers, 
  Cpu, 
  Lock, 
  RefreshCw, 
  ArrowRight, 
  ShieldCheck, 
  FileCode, 
  Activity,
  CheckCircle2
} from 'lucide-react';

export const OSResourceAnatomyView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lifecycle' | 'creation' | 'memory' | 'ipc'>('lifecycle');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          Anatomia de Recursos e Mecanismos Fundamentais do SO
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Compreenda os pilares da ciência da computação por trás de Sistemas Operacionais: ciclo de vida de tarefas, escalonador, memória virtual e mitigação de vulnerabilidades.
        </p>

        {/* Abas dos Recursos */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('lifecycle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'lifecycle' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Ciclo de Vida do Processo
          </button>
          <button
            onClick={() => setActiveTab('creation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'creation' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Criação: fork/execve vs CreateProcess
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'memory' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Memória Virtual & Mitigações (ASLR / DEP)
          </button>
          <button
            onClick={() => setActiveTab('ipc')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'ipc' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}
          >
            Comunicação Inter-Processos (IPC)
          </button>
        </div>
      </div>

      {/* Conteúdo da Aba */}
      {activeTab === 'lifecycle' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              A Máquina de Estados de um Processo (Process State Machine)
            </h3>
            <p className="text-xs text-slate-400">
              O agendador de tarefas (Scheduler) do kernel gerencia a transição de estado de cada thread para garantir multitarefa preemptiva justa e segura.
            </p>
          </div>

          {/* Diagrama de Estados */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold block mb-2">
                1. New / Criado
              </span>
              <p className="text-xs font-bold text-slate-200">Novo Processo</p>
              <p className="text-[11px] text-slate-400">Alocação de PID e descritor de tarefa no kernel.</p>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 space-y-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold block mb-2">
                2. Ready / Pronto
              </span>
              <p className="text-xs font-bold text-cyan-200">Fila de Prontos</p>
              <p className="text-[11px] text-slate-400">Aguardando a CPU conceder uma fatia de tempo (Quantum).</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold block mb-2">
                3. Running / Executando
              </span>
              <p className="text-xs font-bold text-emerald-200">Em Execução</p>
              <p className="text-[11px] text-slate-400">Instruções sendo processadas fisicamente pelo núcleo da CPU.</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold block mb-2">
                4. Waiting / Bloqueado
              </span>
              <p className="text-xs font-bold text-amber-200">Aguardando I/O</p>
              <p className="text-[11px] text-slate-400">Esperando leitura de disco, pacote de rede ou lock de mutex.</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-1">
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 font-bold block mb-2">
                5. Terminated / Finalizado
              </span>
              <p className="text-xs font-bold text-rose-200">Encerrado</p>
              <p className="text-[11px] text-slate-400">Espaço de memória liberado; status de saída reportado ao pai.</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-2">
            <strong className="text-slate-200">O que é a Troca de Contexto (Context Switching)?</strong>
            <p className="text-slate-400 leading-relaxed">
              Quando o temporizador de hardware da placa-mãe dispara uma interrupção (Timer Interrupt), a CPU suspende o processo em execução, salva o conteúdo de seus registradores (RIP, RSP, RAX, etc.) na estrutura de controle do processo (PCB) e restaura o estado do próximo processo da fila. Esse mecanismo garante que nenhum malware ou script infinito possa congelar o computador por completo.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'creation' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            Mecanismo de Criação de Processos: Código Aberto (Linux) vs Código Fechado (Windows)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Linux Fork / Execve */}
            <div className="bg-slate-950 p-5 rounded-xl border border-emerald-900/50 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <span>Linux: fork() + execve() com Copy-On-Write</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                No modelo POSIX/Linux, um novo processo nasce como um clone quase idêntico de seu pai:
              </p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside font-mono">
                <li><code>fork()</code> clona a tabela de páginas do pai sem duplicar a memória física imediatamente (Copy-on-Write).</li>
                <li>O filho herda os descritores de arquivos abertos (stdin, stdout, stderr, sockets).</li>
                <li><code>execve(caminho, args, env)</code> descarta a imagem de memória antiga e carrega o novo binário ELF no espaço virtual.</li>
              </ol>
              <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300">
                💡 Relevância em Cibersegurança: Se um binário pai rodando como root abre conexões e faz fork() sem fechar descritores, o processo filho pode herdar sockets sensíveis (File Descriptor Leakage).
              </div>
            </div>

            {/* Windows CreateProcess */}
            <div className="bg-slate-950 p-5 rounded-xl border border-blue-900/50 space-y-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <span>Windows: CreateProcess() & NtCreateUserProcess()</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                No Windows, não existe o conceito de clonagem fork(). Um processo é criado do zero com parâmetros explícitos:
              </p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside font-mono">
                <li><code>CreateProcessW()</code> valida o binário PE (Portable Executable) em disco.</li>
                <li>O Kernel aloca o objeto <code>EPROCESS</code> e a estrutura <code>PEB</code> (Process Environment Block).</li>
                <li>O Access Token de segurança é herdado ou especificado explicitamente com o nível de integridade.</li>
                <li>O executável é mapeado na memória e a thread inicial é iniciada.</li>
              </ol>
              <div className="p-2.5 rounded bg-blue-950/20 border border-blue-800/40 text-[11px] text-blue-300">
                💡 Relevância em Cibersegurança: Permite que atacantes criem processos em estado suspenso (CREATE_SUSPENDED) para realizar injeção de código (Process Hollowing - MITRE T1055.012).
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'memory' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Memória Virtual e Tecnologias de Mitigação Contra Exploração de Código
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 font-mono block">
                1. ASLR (Address Space Layout Randomization)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                O SO randomiza a posição na memória da pilha (Stack), do heap e das bibliotecas carregadas (DLLs / .so) a cada execução do programa.
              </p>
              <p className="text-[11px] text-slate-500">
                Bloqueia atacantes de prever endereços fixos de memória para desvio de fluxo de execução (ROP Chains).
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 font-mono block">
                2. DEP / NX (Data Execution Prevention)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                O bit No-Execute (NX) da CPU marca páginas de memória de dados como estritamente não executáveis (Write XOR Execute).
              </p>
              <p className="text-[11px] text-slate-500">
                Impede que um buffer overflow injete instruções de shellcode na pilha e force o processador a executá-las.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 font-mono block">
                3. Stack Canaries / GS Cookie
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Um valor inteiro pseudo-aleatório é posicionado na pilha imediatamente antes do endereço de retorno da função.
              </p>
              <p className="text-[11px] text-slate-500">
                Se o canário for sobrescrito por um overflow, o SO encerra o processo instantaneamente antes que o salto malicioso ocorra.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ipc' && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Mecanismos de Comunicação Inter-Processos (IPC)
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="font-mono text-cyan-400 font-bold shrink-0">Pipes & Pipes Nomeados:</span>
              <p className="text-slate-300">
                Canal unidirecional ou bidirecional entre processos. No Linux utilizado pelo shell com <code>|</code>; no Windows os <strong>Named Pipes</strong> (<code>\\.\pipe\nome</code>) são fundamentais para serviços corporativos e alvos comuns de movimentação lateral (SMB Pipes como <code>spoolss</code> e <code>samr</code>).
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="font-mono text-emerald-400 font-bold shrink-0">Sockets (UNIX / TCP):</span>
              <p className="text-slate-300">
                Comunicação bidirecional local ou remota através da stack de rede. Permite isolamento seguro entre serviços conteinerizados e servidores HTTP.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
              <span className="font-mono text-purple-400 font-bold shrink-0">Memória Compartilhada (Shared Memory):</span>
              <p className="text-slate-300">
                O mecanismo de maior performance, onde múltiplos processos mapeiam a mesma região de memória física. Exige sincronização estrita com Mutexes e Semáforos para evitar <em>Race Conditions</em> (TOC/TOU).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
