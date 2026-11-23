import React, { useState, useRef, useEffect } from 'react';
import { OSType } from '../types/simulator';
import { Terminal as TerminalIcon, Copy, Trash2, HelpCircle, Check, Sparkles } from 'lucide-react';

interface TerminalLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'system' | 'flag';
  text: string;
}

interface TerminalProps {
  osType: OSType;
  currentDir: string;
  currentUser: string;
  onExecuteCommand: (cmd: string) => { output: string; error?: string; exitCode: number; flag?: string };
  title?: string;
  suggestedCommands?: string[];
}

export const Terminal: React.FC<TerminalProps> = ({
  osType,
  currentDir,
  currentUser,
  onExecuteCommand,
  title,
  suggestedCommands = []
}) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [copied, setCopied] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'welcome',
      type: 'system',
      text: osType === 'linux'
        ? `[WinLinx OS-Kernel Simulator] Linux 6.8.0-45-generic x86_64 (GNU/Linux)\n* Documentação: Digite 'help' para comandos suportados.\n* Objetivo: Investigue permissões, processos e telemetria.`
        : `Windows PowerShell\nCopyright (C) Microsoft Corporation. Todos os direitos reservados.\n\nExperimente a nova plataforma cruzada PowerShell (https://aka.ms/pscore6)\nDigite 'help' ou 'Get-Help' para lista de comandos.`
    }
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const getPromptPrefix = () => {
    if (osType === 'linux') {
      const isRoot = currentUser === 'root';
      const symbol = isRoot ? '#' : '$';
      const userColor = isRoot ? 'text-red-400' : 'text-emerald-400';
      return (
        <span className="font-mono text-xs select-none mr-2">
          <span className={userColor}>{currentUser}@winlinx</span>
          <span className="text-slate-400">:</span>
          <span className="text-blue-400">{currentDir}</span>
          <span className="text-slate-200">{symbol}</span>
        </span>
      );
    } else {
      return (
        <span className="font-mono text-xs select-none mr-2">
          <span className="text-cyan-400">PS </span>
          <span className="text-slate-300">{currentDir}</span>
          <span className="text-cyan-400">&gt;</span>
        </span>
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const cmd = inputVal.trim();
      if (!cmd) return;

      // Adiciona ao histórico de comandos
      setHistory(prev => [cmd, ...prev]);
      setHistoryIdx(-1);

      // Limpar tela especial
      if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
        setLines([]);
        setInputVal('');
        return;
      }

      // Adiciona a linha do prompt executado
      const newPromptLine: TerminalLine = {
        id: Math.random().toString(),
        type: 'prompt',
        text: osType === 'linux' 
          ? `${currentUser}@winlinx:${currentDir}$ ${cmd}`
          : `PS ${currentDir}> ${cmd}`
      };

      const result = onExecuteCommand(cmd);

      const resultLines: TerminalLine[] = [newPromptLine];

      if (result.output) {
        resultLines.push({
          id: Math.random().toString(),
          type: result.exitCode === 0 ? 'output' : 'error',
          text: result.output
        });
      }

      if (result.flag) {
        resultLines.push({
          id: Math.random().toString(),
          type: 'flag',
          text: `🚩 [FLAG CAPTURADA!] ${result.flag}`
        });
      }

      setLines(prev => [...prev, ...resultLines]);
      setInputVal('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx + 1 < history.length) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    }
  };

  const handleCopyLogs = () => {
    const text = lines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setLines([]);
  };

  const runSuggested = (cmd: string) => {
    setInputVal(cmd);
    inputRef.current?.focus();
  };

  const isLinux = osType === 'linux';

  return (
    <div className="flex flex-col h-full rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl font-mono text-sm">
      {/* Barra de Título do Terminal */}
      <div className={`px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between ${
        isLinux ? 'bg-slate-900/90' : 'bg-slate-900/90'
      }`}>
        <div className="flex items-center space-x-2">
          {/* Bolinhas estilo janela OS */}
          <div className="flex items-center space-x-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/50" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 border border-yellow-600/50" />
            <span className="w-3 h-3 rounded-full bg-green-500/80 border border-green-600/50" />
          </div>

          <TerminalIcon className={`w-4 h-4 ${isLinux ? 'text-emerald-400' : 'text-blue-400'}`} />
          <span className="text-xs font-semibold text-slate-200">
            {title || (isLinux ? 'Linux Bash Terminal (Código Aberto)' : 'Windows PowerShell (Código Fechado)')}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-medium uppercase tracking-wider ${
            isLinux ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60' : 'bg-blue-950 text-blue-400 border border-blue-800/60'
          }`}>
            {isLinux ? 'POSIX / Bash' : 'WinAPI / PowerShell'}
          </span>
        </div>

        {/* Ações do Terminal */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleCopyLogs}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Copiar Histórico"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClear}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Limpar Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Comandos Sugeridos para Facilidade do Aluno */}
      {suggestedCommands.length > 0 && (
        <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <div className="flex items-center space-x-1 text-slate-400 shrink-0">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Sugestões:</span>
          </div>
          <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
            {suggestedCommands.map((cmd, i) => (
              <button
                key={i}
                onClick={() => runSuggested(cmd)}
                className="px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 border border-slate-700/60 shrink-0 transition"
              >
                <code>{cmd}</code>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Janela de Saída e Histórico de Linhas */}
      <div 
        className="flex-1 p-4 overflow-y-auto space-y-1 bg-black/60 font-mono text-xs leading-relaxed select-text min-h-[280px]"
        onClick={() => inputRef.current?.focus()}
      >
        {lines.map(line => {
          if (line.type === 'system') {
            return (
              <div key={line.id} className="text-slate-500 whitespace-pre-wrap py-1 border-b border-slate-800/40 mb-2">
                {line.text}
              </div>
            );
          }
          if (line.type === 'prompt') {
            return (
              <div key={line.id} className="text-cyan-400 font-semibold pt-1">
                {line.text}
              </div>
            );
          }
          if (line.type === 'error') {
            return (
              <div key={line.id} className="text-rose-400 whitespace-pre-wrap">
                {line.text}
              </div>
            );
          }
          if (line.type === 'flag') {
            return (
              <div key={line.id} className="p-2 my-1 rounded bg-amber-950/60 border border-amber-500/50 text-amber-300 font-bold tracking-wide animate-pulse">
                {line.text}
              </div>
            );
          }
          return (
            <div key={line.id} className="text-slate-300 whitespace-pre-wrap">
              {line.text}
            </div>
          );
        })}

        {/* Linha de Entrada Ativa */}
        <div className="flex items-center pt-1">
          {getPromptPrefix()}
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-slate-100 outline-none border-none font-mono text-xs focus:ring-0 p-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Rodapé do Terminal */}
      <div className="px-3 py-1 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between items-center">
        <span>Use <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">↑</kbd> <kbd className="px-1 py-0.5 bg-slate-800 rounded text-slate-400">↓</kbd> para histórico</span>
        <span>Sessão: <strong className="text-slate-400">{currentUser}</strong></span>
      </div>
    </div>
  );
};
