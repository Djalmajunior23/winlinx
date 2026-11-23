import React from 'react';
import { SyscallTrace, OSType } from '../types/simulator';
import { Cpu, ShieldAlert, Layers, ArrowDown, Activity, Sparkles, Terminal } from 'lucide-react';

interface SyscallTracerViewProps {
  syscalls: SyscallTrace[];
  onClearSyscalls: () => void;
}

export const SyscallTracerView: React.FC<SyscallTracerViewProps> = ({
  syscalls,
  onClearSyscalls
}) => {
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Syscall Tracer & Inspetor de Camadas de Kernel (Ring 3 vs Ring 0)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visualize em tempo real como comandos do usuário no espaço de aplicação (Ring 3) cruzam a barreira do Kernel (Ring 0) via interrupções de software e chamadas de sistema (Syscalls).
            </p>
          </div>

          <button
            onClick={onClearSyscalls}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold self-start sm:self-auto transition"
          >
            Limpar Registros ({syscalls.length})
          </button>
        </div>
      </div>

      {/* Diagrama Esquemático de Protection Rings */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          Hierarquia de Privilégios da CPU (Arquitetura x86_64)
        </h3>

        <div className="space-y-3">
          {/* Ring 3 */}
          <div className="p-4 rounded-xl border border-cyan-800/60 bg-cyan-950/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 font-mono">
                RING 3 — User Mode (Espaço de Usuário Não Privilegiado)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                Sem Acesso Direto ao Hardware
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Onde executam seus comandos: <code>bash</code>, <code>powershell.exe</code>, <code>cat</code>, <code>icacls</code> e programas do usuário.
            </p>
            <p className="text-[11px] text-slate-400">
              Para ler um arquivo ou abrir um socket, o processo deve invocar a instrução <code>syscall</code> (Linux) ou <code>sysenter</code> (Windows), trocando o contexto para o Kernel.
            </p>
          </div>

          {/* Seta de Transição */}
          <div className="flex items-center justify-center text-slate-600">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              <span>Transição de Contexto: Syscall Dispatcher Table</span>
            </div>
          </div>

          {/* Ring 0 */}
          <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-300 font-mono">
                RING 0 — Kernel Mode (Espaço de Kernel com Controle Total)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono">
                Privilégio Máximo do Processador
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Onde executam o <strong>Kernel Monolítico do Linux</strong> (drivers, scheduler, netfilter) e o <strong>Windows Executive / Microkernel</strong> (ntoskrnl.exe, SRM, NTFS driver).
            </p>
            <p className="text-[11px] text-amber-300/90 font-medium">
              🛡️ Relevância em Cibersegurança: EDRs tradicionais colocam ganchos (User-mode API Hooking) na ntdll/libc. Malwares avançados realizam "Direct Syscalls" para falar direto com o Ring 0 e evadir detecção!
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Telemetria de Syscalls em Tempo Real */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Tráfego de Syscalls Capturadas ({syscalls.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Execute comandos no terminal para gerar novas capturas
          </span>
        </div>

        {syscalls.length === 0 ? (
          <div className="p-8 text-center border border-slate-800/80 rounded-xl bg-slate-950/40 text-slate-500 text-xs">
            Nenhuma syscall capturada ainda nesta sessão. Vá ao <strong>Dual-Shell Playground</strong> ou aos <strong>Labs</strong> e execute comandos (como <code>cat</code>, <code>ls</code>, <code>kill</code>, <code>icacls</code> ou <code>Get-Process</code>).
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {syscalls.slice(-15).reverse().map((sc) => {
              const isLinux = sc.os === 'linux';
              return (
                <div
                  key={sc.id}
                  className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        isLinux ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-blue-950 text-blue-400 border border-blue-800/60'
                      }`}>
                        {sc.os}
                      </span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {sc.syscall}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                        {sc.subsystem}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
                      <span>Retorno: <strong className="text-emerald-400">{sc.returnCode}</strong></span>
                      <span>•</span>
                      <span>{sc.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                    Parâmetros: <span className="text-amber-300">{sc.parameters || 'void'}</span>
                  </p>

                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Mecanismo Interno:</strong> {sc.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
