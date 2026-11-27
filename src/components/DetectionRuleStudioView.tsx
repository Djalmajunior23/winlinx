import React, { useState } from 'react';
import { 
  FileCode, 
  Play, 
  CheckCircle2, 
  ShieldAlert, 
  Copy, 
  Terminal, 
  Filter, 
  Layers,
  ArrowRight,
  Code
} from 'lucide-react';

interface DetectionRule {
  id: string;
  name: string;
  type: 'YARA' | 'SIGMA';
  targetThreat: string;
  content: string;
  compiledQuerySplunk?: string;
  compiledPowerShell?: string;
  testSampleMatch: boolean;
}

const RULES_CATALOG: DetectionRule[] = [
  {
    id: 'rule-yara-wannacry',
    name: 'rule_wannacry_killswitch.yar',
    type: 'YARA',
    targetThreat: 'Ransomware WannaCrypt Killswitch',
    content: `rule WannaCry_Killswitch_Indicator {
    meta:
        description = "Detecta string do domínio de killswitch e padrão de cabeçalho do WannaCry"
        author = "WinLinx SOC"
        date = "2026-11-26"
    strings:
        $domain = "www.iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.com" ascii wide nocase
        $vss = "vssadmin.exe Delete Shadows /All /Quiet" ascii wide nocase
        $magic = { 4D 5A 90 00 }
    condition:
        $magic at 0 and ($domain or $vss)
}`,
    testSampleMatch: true
  },
  {
    id: 'rule-sigma-lsass',
    name: 'proc_access_win_lsass_dump.yml',
    type: 'SIGMA',
    targetThreat: 'Mimikatz / LSASS Memory Access (T1003.001)',
    content: `title: Acesso Suspeito ao Processo LSASS
status: experimental
description: Detecta solicitações de abertura de processo para o LSASS com permissões PROCESS_VM_READ
references:
    - https://attack.mitre.org/techniques/T1003/001/
logsource:
    category: process_access
    product: windows
detection:
    selection:
        TargetImage|endswith: '\\lsass.exe'
        GrantedAccess|contains:
            - '0x1010'   # PROCESS_VM_READ | PROCESS_QUERY_INFORMATION
            - '0x1438'
    filter:
        SourceImage|endswith:
            - '\\svchost.exe'
            - '\\csrss.exe'
    condition: selection and not filter`,
    compiledQuerySplunk: 'index=windows EventCode=10 TargetImage="*\\\\lsass.exe" GrantedAccess="*0x1010*" NOT (SourceImage="*\\\\svchost.exe" OR SourceImage="*\\\\csrss.exe")',
    compiledPowerShell: 'Get-WinEvent -FilterHashtable @{LogName="Microsoft-Windows-Sysmon/Operational"; Id=10} | Where-Object { $_.Properties[4].Value -like "*lsass.exe" }',
    testSampleMatch: true
  }
];

export const DetectionRuleStudioView: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<DetectionRule>(RULES_CATALOG[0]);
  const [ruleCode, setRuleCode] = useState<string>(RULES_CATALOG[0].content);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  const handleSelectRule = (rule: DetectionRule) => {
    setSelectedRule(rule);
    setRuleCode(rule.content);
    setScanResult(null);
  };

  const handleRunTest = () => {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setScanning(false);
      setScanResult(`[YARA/SIGMA SCANNER MATCH] 1 arquivo infectado detectado com correspondência de 100%!
Regra '${selectedRule.name}' validada com sucesso contra artefato malicioso.
FLAG{WINLINX_DETECTION_RULES_YARA_SIGMA_TESTED_2026}`);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-teal-400">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Detection Engineering Studio (YARA & SIGMA)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-teal-950 text-teal-300 border border-teal-800">
                  THREAT HUNTING WORKSHOP
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Criação e validação de regras YARA para artefatos binários e regras SIGMA convertidas para Splunk e PowerShell.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleRunTest}
              disabled={scanning}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-teal-600/20 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{scanning ? 'Compilando & Testando...' : 'Compilar & Testar Regra'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Regras */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Filter className="w-4 h-4 text-teal-400" />
              <span>Catálogo de Regras</span>
            </h3>

            <div className="space-y-2">
              {RULES_CATALOG.map(rule => {
                const isSelected = rule.id === selectedRule.id;
                return (
                  <div
                    key={rule.id}
                    onClick={() => handleSelectRule(rule)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-950/40 border-teal-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-200 font-mono">{rule.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-teal-950 text-teal-300 border border-teal-800">
                        {rule.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{rule.targetThreat}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tradução SIGMA (Splunk / PowerShell) */}
          {selectedRule.type === 'SIGMA' && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span>Tradução SIGMA ➔ SIEM Query</span>
              </h4>

              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold">Splunk SPL:</span>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[10px] text-cyan-300 break-all select-all">
                  {selectedRule.compiledQuerySplunk}
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] text-slate-400 font-semibold">PowerShell Get-WinEvent:</span>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[10px] text-amber-300 break-all select-all">
                  {selectedRule.compiledPowerShell}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Editor da Regra & Resultado de Scan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-[480px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
              <div className="flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-mono font-bold text-slate-200">Editor de Regras: {selectedRule.name}</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Sintaxe {selectedRule.type} v1.4</span>
            </div>

            <textarea
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value)}
              className="flex-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-200 resize-none focus:outline-none focus:border-teal-500/60 leading-relaxed"
              spellCheck={false}
            />

            {scanResult && (
              <div className="mt-3 p-3 bg-teal-950/30 border border-teal-800 rounded-xl flex items-center justify-between animate-in fade-in">
                <div className="flex items-center space-x-2 text-xs text-teal-300">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <pre className="font-mono text-xs whitespace-pre-wrap">{scanResult}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
