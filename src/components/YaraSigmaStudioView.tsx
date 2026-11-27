import React, { useState } from 'react';
import { 
  FileCode, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Search, 
  Layers, 
  Code2, 
  ShieldCheck,
  Flame
} from 'lucide-react';

export const YaraSigmaStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'yara' | 'sigma'>('yara');
  const [yaraRule, setYaraRule] = useState<string>(`rule Detect_CobaltStrike_Beacon_Injected {
    meta:
        author = "WinLinx Threat Hunting Team"
        description = "Detecta shellcode de injeção em memória com strings de beaconing"
        severity = "CRITICAL"
        mitre_technique = "T1055.012"
    strings:
        $magic = { 4D 5A 90 00 }          // Header MZ PE
        $c2_beacon = "%s as %s\\%s: %d"  // Formato interno de Beacon
        $hollowing = "VirtualAllocEx" ascii wide
    condition:
        $magic at 0 and ($c2_beacon or $hollowing)
}`);

  const [sigmaRule, setSigmaRule] = useState<string>(`title: Detecção de Exclusão de Cópias de Sombra (VSS)
id: 5a8e3290-7164-4e3a-9e12-c24719bb8100
status: experimental
description: Identifica execução de vssadmin para inibir recuperação de desastres (Ransomware T1490)
logsource:
    category: process_creation
    product: windows
detection:
    selection:
        Image|endswith: '\\vssadmin.exe'
        CommandLine|contains:
            - 'delete'
            - 'shadows'
    condition: selection
level: critical
tags:
    - attack.impact
    - attack.t1490`);

  const [scanResult, setScanResult] = useState<string | null>(null);

  const testYaraRule = () => {
    setScanResult('MATCH POSITIVO: Regra identificou 2 arquivos maliciosos no VFS e 1 região RWX de memória em powershell.exe!\nFLAG{WINLINX_YARA_SIGMA_RULE_HUNTER_2026}');
  };

  const testSigmaRule = () => {
    setScanResult('CONVERSÃO BEM-SUCEDIDA:\n-> SPLUNK: index=windows EventCode=4688 Image="*\\\\vssadmin.exe" CommandLine="*delete*" CommandLine="*shadows*"\n-> ELASTIC: process.name: "vssadmin.exe" AND process.command_line: (*delete* AND *shadows*)\nFLAG{WINLINX_YARA_SIGMA_RULE_HUNTER_2026}');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">YARA & SIGMA Rule Studio</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-amber-950 text-amber-300 border border-amber-800">
                  THREAT HUNTING & DETECTION ENGINEERING
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Criação, validação e compilação de assinaturas YARA para arquivos e regras agnósticas SIGMA para SIEMs (Splunk, Elastic).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveTab('yara'); setScanResult(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'yara' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              YARA Studio
            </button>
            <button
              onClick={() => { setActiveTab('sigma'); setScanResult(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'sigma' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              SIGMA Converter
            </button>
          </div>
        </div>
      </div>

      {/* Editor & Validador */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-mono font-bold text-slate-200">
            {activeTab === 'yara' ? 'Editor de Regra YARA (.yar)' : 'Editor de Regra SIGMA (.yaml)'}
          </span>
          <button
            onClick={activeTab === 'yara' ? testYaraRule : testSigmaRule}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{activeTab === 'yara' ? 'Executar Scan YARA no VFS' : 'Converter Regra SIGMA'}</span>
          </button>
        </div>

        <textarea
          value={activeTab === 'yara' ? yaraRule : sigmaRule}
          onChange={e => activeTab === 'yara' ? setYaraRule(e.target.value) : setSigmaRule(e.target.value)}
          rows={12}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500/50 resize-y"
        />

        {scanResult && (
          <div className="p-4 bg-amber-950/30 border border-amber-900/60 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resultado da Execução do Mecanismo de Detecção:</span>
            </div>
            <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800">
              {scanResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
