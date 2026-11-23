import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  Key, 
  FileText, 
  ShieldCheck, 
  ShieldAlert, 
  Terminal, 
  Sparkles,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface RegistryViewerProps {
  registryData: Record<string, Record<string, { type: string; value: string | number }>>;
  onActivatePPL?: () => void;
}

export const RegistryViewer: React.FC<RegistryViewerProps> = ({
  registryData,
  onActivatePPL
}) => {
  const [selectedKey, setSelectedKey] = useState<string>('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const keys = Object.keys(registryData);
  const currentValues = registryData[selectedKey] || {};

  const isLsaPPLActive = registryData['HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa']?.['RunAsPPL']?.value === 1;

  const handleCopyCmd = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                Windows Registry Explorer (regedit & Hive Simulator)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              O banco de dados central e relacional de configurações e persistência do Windows. Compare com a filosofia de arquivos de configuração planos (/etc) do Linux.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2.5 py-1 rounded-lg font-mono font-semibold border ${
              isLsaPPLActive 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {isLsaPPLActive ? '🛡️ RunAsPPL: Habilitado (LSASS Protegido)' : '⚠️ RunAsPPL: Desabilitado (Vulnerável a Dump)'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Árvore de Chaves + Tabela de Valores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Árvore de Chaves (Hives) */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Folder className="w-4 h-4 text-cyan-400" />
            <span>Chaves Críticas de Sistema (HKEY_LOCAL_MACHINE)</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            {keys.map(k => {
              const isSelected = selectedKey === k;
              return (
                <button
                  key={k}
                  onClick={() => setSelectedKey(k)}
                  className={`w-full text-left p-2.5 rounded-lg border transition flex items-center space-x-2 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/60 text-blue-200'
                      : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {isSelected ? (
                    <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span className="truncate">{k}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <strong className="text-slate-200 block">Comando CLI Equivalente:</strong>
            <code className="text-blue-300 block bg-slate-900 p-1.5 rounded border border-slate-800 font-mono">
              reg query "{selectedKey}"
            </code>
          </div>
        </div>

        {/* Tabela de Valores da Chave Selecionada */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Chave Selecionada:</span>
              <h3 className="text-sm font-bold text-slate-100 font-mono truncate max-w-md">
                {selectedKey}
              </h3>
            </div>

            <button
              onClick={() => handleCopyCmd(`reg query "${selectedKey}"`)}
              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 hover:text-cyan-400 transition"
            >
              {copiedKey ? 'Copiado!' : 'Copiar Sintaxe'}
            </button>
          </div>

          {/* Tabela de Valores */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2 font-semibold">Nome</th>
                  <th className="pb-2 font-semibold">Tipo</th>
                  <th className="pb-2 font-semibold">Dados / Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Object.entries(currentValues).map(([name, entry]) => (
                  <tr key={name} className="hover:bg-slate-900/40">
                    <td className="py-2.5 font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{name}</span>
                    </td>
                    <td className="py-2.5 text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {entry.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-amber-300 break-all">
                      {entry.type === 'REG_DWORD' ? `0x${Number(entry.value).toString(16)} (${entry.value})` : String(entry.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Hardening Específico da Chave LSA */}
          {selectedKey.includes('Control\\Lsa') && (
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/40 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Hardening do LSASS contra Roubo de Credenciais (Mimikatz)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ao configurar a chave <code>RunAsPPL=1</code> (Protected Process Light), o Windows bloqueia ferramentas não assinadas de abrirem o processo <code>lsass.exe</code> com privilégio <code>PROCESS_VM_READ</code>.
              </p>
              <div className="pt-1">
                <span className="text-[10px] text-slate-500 uppercase block font-mono">Execute no Terminal Windows:</span>
                <code className="text-cyan-300 font-mono block bg-slate-950 p-2 rounded border border-slate-800 text-[11px] mt-1">
                  reg add "HKLM\SYSTEM\CurrentControlSet\Control\Lsa" /v RunAsPPL /t REG_DWORD /d 1 /f
                </code>
              </div>
            </div>
          )}

          {/* Hardening de Persistência Run Keys */}
          {selectedKey.includes('CurrentVersion\\Run') && (
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-amber-400 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Vetor de Persistência Clássica (MITRE ATT&CK T1547.001)</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Qualquer programa registrado nesta chave é executado automaticamente no logon do usuário. Sempre audite executáveis desconhecidos ou residentes em pastas temporárias.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
