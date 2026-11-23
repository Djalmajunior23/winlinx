import React from 'react';
import { Award, Shield, CheckCircle2, Download, Printer, X, Flame, FileJson } from 'lucide-react';
import { PRACTICAL_LABS } from '../data/labs';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName?: string;
  completedTasks: Set<string>;
  flagsFound: string[];
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  studentName = 'Estudante de Cibersegurança',
  completedTasks,
  flagsFound
}) => {
  if (!isOpen) return null;

  const totalTasks = PRACTICAL_LABS.reduce((acc, l) => acc + l.tasks.length, 0);
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks.size / totalTasks) * 100) : 0;
  const issueDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleExportEvidenceJson = () => {
    const evidenceData = {
      specVersion: '1.0.0-winlinx',
      platform: 'WinLinx - OS Cybersecurity Lab',
      module: 'Sistemas Operacionais: Código Aberto e Fechado',
      studentName,
      issuedAt: new Date().toISOString(),
      completionRate: `${completionPercent}%`,
      totalTasks,
      completedTasksCount: completedTasks.size,
      completedTaskIds: Array.from(completedTasks),
      flags: flagsFound,
      mitreCoverage: [
        'T1548 - Abuse Elevation Control Mechanism',
        'T1057 - Process Discovery',
        'T1036 - Masquerading',
        'T1053 - Scheduled Task/Job',
        'T1574 - Hijack Execution Flow',
        'T1110 - Brute Force',
        'T1087 - Account Discovery'
      ]
    };

    const blob = new Blob([JSON.stringify(evidenceData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidencia_winlinx_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificado Visual */}
        <div className="border-2 border-cyan-500/40 rounded-xl p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-center space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-500/60 text-cyan-400 mb-1">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
              Certificado de Conclusão Prática
            </span>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">
              Especialização em Cibersegurança: Módulo de Sistemas Operacionais
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Certificação em Arquitetura, DACL/POSIX, Hunting & Hardening (WinLinx)
            </p>
          </div>

          <div className="py-2">
            <p className="text-xs text-slate-300">Certificamos que</p>
            <h3 className="text-lg font-bold text-cyan-300 underline underline-offset-4 decoration-cyan-500/50">
              {studentName}
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              concluiu os laboratórios práticos e simulações do ambiente WinLinx, dominando a análise comparativa entre sistemas operacionais de código aberto (Linux) e código fechado (Windows).
            </p>
          </div>

          {/* Dados e Métricas */}
          <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Progresso</span>
              <strong className="text-emerald-400 font-bold">{completionPercent}%</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Flags Capturadas</span>
              <strong className="text-amber-400 font-bold">{flagsFound.length}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono">Data de Emissão</span>
              <strong className="text-slate-300 font-medium">{issueDate}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2">
            <span>Validador: CiberLab / WinLinx Secure Kernel</span>
            <span>ID: WLX-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            onClick={handleExportEvidenceJson}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Exportar Evidências (JSON CiberLab)</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
