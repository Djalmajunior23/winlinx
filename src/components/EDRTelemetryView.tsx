import React from 'react';
import { EDRAlert } from '../types/simulator';
import { ShieldAlert, AlertTriangle, CheckCircle, Flame, Target, Terminal, RotateCcw } from 'lucide-react';

interface EDRTelemetryViewProps {
  alerts: EDRAlert[];
  onClearAlerts: () => void;
}

export const EDRTelemetryView: React.FC<EDRTelemetryViewProps> = ({
  alerts,
  onClearAlerts
}) => {
  const getSeverityBadge = (severity: EDRAlert['severity']) => {
    switch (severity) {
      case 'CRÍTICA':
        return 'bg-rose-950 text-rose-300 border-rose-800 font-bold';
      case 'ALTA':
        return 'bg-amber-950 text-amber-300 border-amber-800 font-bold';
      case 'MÉDIA':
        return 'bg-yellow-950 text-yellow-300 border-yellow-800';
      case 'BAIXA':
        return 'bg-blue-950 text-blue-300 border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Console de EDR & Telemetria SOC em Tempo Real
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visão defensiva (Blue Team) simulando a detecção heurística de agentes de endpoint (Sysmon / Wazuh / Auditd) sobre os comandos operados nos sistemas operacionais.
            </p>
          </div>

          <button
            onClick={onClearAlerts}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold self-start sm:self-auto transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetar Alertas ({alerts.length})</span>
          </button>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <span className="text-[10px] text-slate-500 uppercase font-mono block">Total de Alertas</span>
          <span className="text-2xl font-black text-slate-100">{alerts.length}</span>
        </div>
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40">
          <span className="text-[10px] text-rose-400 uppercase font-mono block">Críticos</span>
          <span className="text-2xl font-black text-rose-300">
            {alerts.filter(a => a.severity === 'CRÍTICA').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
          <span className="text-[10px] text-amber-400 uppercase font-mono block">Altos</span>
          <span className="text-2xl font-black text-amber-300">
            {alerts.filter(a => a.severity === 'ALTA').length}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40">
          <span className="text-[10px] text-blue-400 uppercase font-mono block">Médios / Baixos</span>
          <span className="text-2xl font-black text-blue-300">
            {alerts.filter(a => a.severity === 'MÉDIA' || a.severity === 'BAIXA').length}
          </span>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-10 text-center border border-slate-800/80 rounded-xl bg-slate-950/40 text-slate-500 text-xs space-y-2">
            <CheckCircle className="w-8 h-8 text-emerald-500/60 mx-auto" />
            <p className="font-semibold text-slate-400">Nenhuma anomalia ou atividade suspeita detectada no momento.</p>
            <p className="text-[11px] text-slate-500">
              Dispare comandos de reconhecimento de SO no terminal (ex: <code>find / -perm -4000</code>, <code>whoami /priv</code>, <code>sc qc WinVulnerableUpdater</code>) para verificar a telemetria defensiva.
            </p>
          </div>
        ) : (
          alerts.slice(-12).reverse().map(alert => (
            <div
              key={alert.id}
              className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 rounded-xl p-5 space-y-3 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                    alert.os === 'linux' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-blue-950 text-blue-400 border border-blue-800'
                  }`}>
                    {alert.os}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100">
                    {alert.ruleName}
                  </h3>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/40">
                    {alert.mitreId} - {alert.mitreTechnique}
                  </span>
                  <span className="text-slate-500 text-[11px]">{alert.timestamp}</span>
                </div>
              </div>

              {/* Comando que disparou o alerta */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Comando Disparador:</span>
                <code className="text-cyan-300">{alert.triggeredCommand}</code>
              </div>

              {/* Parecer do Analista e Remediação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <strong className="text-slate-300 block mb-1">Diagnóstico do SOC:</strong>
                  <p className="text-slate-400 leading-relaxed">{alert.analystSummary}</p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                  <strong className="text-emerald-400 block mb-1">🛡️ Recomendação de Hardening:</strong>
                  <p className="text-slate-300 leading-relaxed">{alert.remediationAdvice}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
