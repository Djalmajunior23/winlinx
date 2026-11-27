import React, { useState } from 'react';
import { FileCode, Play } from 'lucide-react';
import { DEFAULT_SIGMA_RULE, DEFAULT_YARA_RULE, evaluateSigma, evaluateYara } from '../core/detectionStudio';

export const YaraSigmaStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'yara' | 'sigma'>('yara');
  const [yaraRule, setYaraRule] = useState(DEFAULT_YARA_RULE);
  const [sigmaRule, setSigmaRule] = useState(DEFAULT_SIGMA_RULE);
  const [result, setResult] = useState<ReturnType<typeof evaluateYara> | null>(null);
  const isYara = activeTab === 'yara';

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
                Teste regras editáveis contra amostras sintéticas de arquivos e eventos. O laboratório usa um subconjunto didático de YARA e Sigma.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveTab('yara'); setResult(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'yara' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              YARA Studio
            </button>
            <button
              onClick={() => { setActiveTab('sigma'); setResult(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'sigma' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Sigma Studio
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
            onClick={() => setResult(isYara ? evaluateYara(yaraRule) : evaluateSigma(sigmaRule))}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{activeTab === 'yara' ? 'Testar regra YARA' : 'Testar regra Sigma'}</span>
          </button>
        </div>

        <textarea
          aria-label={isYara ? 'Regra YARA' : 'Regra Sigma'}
          maxLength={8192}
          value={isYara ? yaraRule : sigmaRule}
          onChange={event => {
            setResult(null);
            if (isYara) setYaraRule(event.target.value);
            else setSigmaRule(event.target.value);
          }}
          rows={12}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500/50 resize-y"
        />

        <p className="text-xs text-slate-400">
          {isYara
            ? 'Use texto ASCII ou bytes hexadecimais com um identificador, any of them ou all of them.'
            : 'Use Image e CommandLine com igualdade, contains ou endswith. Todos os critérios da seleção precisam corresponder.'}
        </p>
        {result && (
          <div role="status" className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-2">
            {result.error ? <p className="text-amber-300">{result.error}</p> : (
              <>
                <p className="text-slate-200">{result.matches?.length ?? 0} de 3 amostras correspondem.</p>
                <ul className="space-y-1 text-slate-400">
                  {result.matches?.map(match => <li key={match}>{match}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
