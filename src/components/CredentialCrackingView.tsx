import React, { useState } from 'react';
import { 
  Key, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Flame, 
  Cpu, 
  Layers,
  Lock,
  Unlock
} from 'lucide-react';

interface HashSample {
  id: string;
  name: string;
  type: 'Linux SHA-512 ($6$)' | 'Windows NTLM' | 'Kerberoasting ($krb5tgs$)';
  hashString: string;
  crackedPassword: string;
  entropyBits: number;
}

const HASH_SAMPLES: HashSample[] = [
  {
    id: 'hash-linux-shadow',
    name: 'Hash /etc/shadow (aluno)',
    type: 'Linux SHA-512 ($6$)',
    hashString: '$6$salt123$qR8e1W9tZ3x0...hashedvalue',
    crackedPassword: 'Aluno@2026!',
    entropyBits: 68
  },
  {
    id: 'hash-win-ntlm',
    name: 'Hash NTLM SAM (Administrator)',
    type: 'Windows NTLM',
    hashString: 'aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0',
    crackedPassword: 'Password123',
    entropyBits: 42
  },
  {
    id: 'hash-kerb-tgs',
    name: 'Ticket TGS SPN MSSQLSvc',
    type: 'Kerberoasting ($krb5tgs$)',
    hashString: '$krb5tgs$23$*svc_mssql$CORP.LOCAL*$MSSQLSvc/corp-dc-01*...',
    crackedPassword: 'SqlServicePassword!#',
    entropyBits: 74
  }
];

export const CredentialCrackingView: React.FC = () => {
  const [selectedHash, setSelectedHash] = useState<HashSample>(HASH_SAMPLES[1]);
  const [attackMode, setAttackMode] = useState<'wordlist' | 'bruteforce'>('wordlist');
  const [cracking, setCracking] = useState<boolean>(false);
  const [cracked, setCracked] = useState<boolean>(false);
  const [hashRate, setHashRate] = useState<string>('0 H/s');
  const [logs, setLogs] = useState<string[]>([
    '[Hashcat Simulator] GPU OpenCL inicializada: NVIDIA RTX 4090 (24GB VRAM).',
    '[Wordlist] rockyou.txt carregada (14.344.392 senhas).'
  ]);

  const startCracking = () => {
    setCracking(true);
    setCracked(false);
    setHashRate('42.8 GH/s');

    setLogs(l => [
      ...l,
      `[START] Iniciando ataque ${attackMode.toUpperCase()} contra hash: ${selectedHash.name}`,
      `[HASHCAT] Modo -m ${selectedHash.type.includes('NTLM') ? '1000' : selectedHash.type.includes('SHA-512') ? '1800' : '13100'}`
    ]);

    setTimeout(() => {
      setCracking(false);
      setCracked(true);
      setHashRate('0 H/s');
      setLogs(l => [
        ...l,
        `[STATUS: CRACKED] Senha decifrada com sucesso!`,
        `[CREDS] ${selectedHash.name} -> '${selectedHash.crackedPassword}'`,
        `FLAG{WINLINX_HASHCAT_CREDENTIAL_CRACKED_2026}`
      ]);
    }, 1200);
  };

  const resetCracking = () => {
    setCracking(false);
    setCracked(false);
    setHashRate('0 H/s');
    setLogs([
      '[Hashcat Simulator] GPU OpenCL inicializada: NVIDIA RTX 4090 (24GB VRAM).',
      '[Wordlist] rockyou.txt carregada (14.344.392 senhas).'
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Criptoanálise & Quebra de Credenciais (Hashcat Lite)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-950 text-amber-300 border border-amber-800">
                  HASHCAT & JOHN THE RIPPER SIMULATOR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quebra acelerada de hashes de Linux (/etc/shadow), Windows NTLM e Kerberos TGS (Kerberoasting).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {HASH_SAMPLES.map(h => (
              <button
                key={h.id}
                onClick={() => { setSelectedHash(h); resetCracking(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedHash.id === h.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {h.type.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Painel do Ataque */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-slate-200">{selectedHash.name}</span>
            <span className="text-[11px] text-amber-400 font-mono ml-2">Tipo: {selectedHash.type}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono text-cyan-400 mr-2">Velocidade: {hashRate}</span>
            {!cracking ? (
              <button
                onClick={startCracking}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Iniciar Quebra (Hashcat)</span>
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-amber-950 text-amber-300 rounded-lg text-xs font-mono animate-pulse">
                Quebrando...
              </span>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block">Hash Alvo:</span>
          <div className="p-2.5 bg-slate-950 font-mono text-xs text-amber-300 rounded border border-slate-800 break-all select-all">
            {selectedHash.hashString}
          </div>
        </div>

        {cracked && (
          <div className="p-4 bg-emerald-950/30 border border-emerald-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-3">
              <Unlock className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-bold text-emerald-300">Hash Decifrado com Sucesso!</div>
                <div className="text-xs font-mono text-slate-200">
                  Senha em texto claro: <strong className="text-amber-400 text-sm select-all">{selectedHash.crackedPassword}</strong>
                </div>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-emerald-900 border border-emerald-700 text-emerald-200 text-xs font-mono font-bold rounded">
              FLAG&#123;WINLINX_HASHCAT_CREDENTIAL_CRACKED_2026&#125;
            </div>
          </div>
        )}
      </div>

      {/* Terminal de Logs do Hashcat */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Terminal do Hashcat</span>
        </div>
        <div className="space-y-1 font-mono text-xs text-slate-300">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-amber-400">&gt;</span>
              <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 p-1 rounded' : log.includes('CRACKED') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
