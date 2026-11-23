import React, { useState } from 'react';
import { CURRICULUM_MODULES } from '../data/modules';
import { CurriculumModule } from '../types/simulator';
import { BookOpen, Shield, Code, Lock, Cpu, Play, ChevronRight, CheckCircle2 } from 'lucide-react';

interface CurriculumViewProps {
  onSelectLab: (labId: string) => void;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({ onSelectLab }) => {
  const [selectedModule, setSelectedModule] = useState<CurriculumModule>(CURRICULUM_MODULES[0]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Menu Lateral de Módulos */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Trilha de Sistemas Operacionais
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Fundamentos de SO aplicados à cibersegurança ofensiva e defensiva.
          </p>

          <div className="space-y-2">
            {CURRICULUM_MODULES.map(mod => {
              const isSelected = selectedModule.id === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className={`w-full text-left p-3 rounded-lg border transition flex items-start justify-between ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <span className="text-xs font-semibold block text-slate-200">
                      {mod.title}
                    </span>
                    <span className="text-[11px] text-slate-400 block line-clamp-1">
                      {mod.subtitle}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo Detalhado do Módulo Selecionado */}
      <div className="lg:col-span-8 space-y-6">
        {/* Banner do Módulo */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-950 text-cyan-400 border border-cyan-800">
                Módulo Curricular
              </span>
              <span className="text-xs text-slate-400">• Formação Cibersegurança</span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              {selectedModule.title}
            </h1>
            <p className="text-sm text-slate-300">
              {selectedModule.subtitle}
            </p>

            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 text-xs text-cyan-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-cyan-200">Relevância em Cibersegurança: </strong>
                {selectedModule.cybersecRelevance}
              </div>
            </div>

            {selectedModule.labIds.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => onSelectLab(selectedModule.labIds[0])}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Ir para o Laboratório Prático deste Módulo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quadro Comparativo Aberto vs Fechado */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Análise Comparativa: Código Aberto (Linux) vs Código Fechado (Windows)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código Aberto */}
            <div className="bg-slate-950/80 border border-emerald-900/40 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-xs border-b border-emerald-900/40 pb-2">
                <Code className="w-4 h-4" />
                <span>Linux (Filosofia Código Aberto / FOSS)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                {selectedModule.isOpenSourceVsClosed.openSourceConcepts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {/* Código Fechado */}
            <div className="bg-slate-950/80 border border-blue-900/40 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-blue-400 font-semibold text-xs border-b border-blue-900/40 pb-2">
                <Lock className="w-4 h-4" />
                <span>Windows (Modelo Proprietário / Fechado)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                {selectedModule.isOpenSourceVsClosed.closedSourceConcepts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <strong className="text-slate-200">Conclusão Técnica: </strong>
            {selectedModule.isOpenSourceVsClosed.comparativeAnalysis}
          </div>
        </div>

        {/* Subtópicos & Perspectiva de Ataque / Defesa */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            Tópicos Especializados & Perspectiva Red/Blue Team
          </h3>

          {selectedModule.subtopics.map((sub, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-bold text-slate-200">{sub.title}</h4>
              <p className="text-xs text-slate-400">{sub.description}</p>

              {/* Sintaxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-950 p-2.5 rounded border border-emerald-950">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase block mb-1">Comando Linux</span>
                  <code className="text-xs text-emerald-300 font-mono">{sub.linuxSyntax}</code>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-blue-950">
                  <span className="text-[10px] text-blue-400 font-bold uppercase block mb-1">Comando Windows</span>
                  <code className="text-xs text-blue-300 font-mono">{sub.windowsSyntax}</code>
                </div>
              </div>

              {/* Visão Defensiva vs Ofensiva */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded bg-blue-950/20 border border-blue-900/30 text-xs">
                  <span className="text-blue-400 font-semibold block mb-1">🛡️ Visão Defensiva (Blue Team / Hardening):</span>
                  <p className="text-slate-300">{sub.defensePerspective}</p>
                </div>
                <div className="p-3 rounded bg-rose-950/20 border border-rose-900/30 text-xs">
                  <span className="text-rose-400 font-semibold block mb-1">🎯 Visão Ofensiva (Red Team / Pentest):</span>
                  <p className="text-slate-300">{sub.offensePerspective}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
