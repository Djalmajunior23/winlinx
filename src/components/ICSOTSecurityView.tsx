import React, { useState } from 'react';
import { 
  Radio, 
  Terminal, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw,
  Cpu,
  Activity,
  HardDrive
} from 'lucide-react';

export const ICSOTSecurityView: React.FC = () => {
  const [coilStatus, setCoilStatus] = useState<boolean>(true); // Bomba d'água ligada
  const [tankPressure, setTankPressure] = useState<number>(3.2); // Bar
  const [attackTriggered, setAttackTriggered] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    '[Modbus TCP Gateway] Escutando na porta 502 (Unit ID: 1, PLC Siemens S7-1200).',
    '[TELEMETRIA OT] Pressão nominal de operação: 3.2 Bar. Bobina 0x0001 = ON.'
  ]);

  const triggerModbusAttack = () => {
    setAttackTriggered(true);
    setCoilStatus(false);
    setTankPressure(14.8); // Sobrepressão crítica

    setLogs(l => [
      ...l,
      `[INJEÇÃO MODBUS TCP] Enviando pacote 'Force Single Coil' (Função 05) para endereço 0x0001 com valor 0x0000.`,
      `[EXPLOIT] Bobina de resfriamento forçada para OFF sem autenticação no protocolo Modbus!`,
      `[ALARME SCADA] PRESSÃO DO VASO SUBIU PARA 14.8 BAR! Risco iminente de explosão física da turbina.`,
      `FLAG{WINLINX_ICS_SCADA_MODBUS_EXPLOITED_2026}`
    ]);
  };

  const resetPLC = () => {
    setAttackTriggered(false);
    setCoilStatus(true);
    setTankPressure(3.2);
    setLogs([
      '[Modbus TCP Gateway] Escutando na porta 502 (Unit ID: 1, PLC Siemens S7-1200).',
      '[TELEMETRIA OT] Pressão nominal de operação: 3.2 Bar. Bobina 0x0001 = ON.'
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-900 border border-orange-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl text-orange-400">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Sistemas Industriais & OT (SCADA / Modbus TCP)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-orange-950 text-orange-300 border border-orange-800">
                  ICS / OT CYBER RANGE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulação de PLC industrial, exploração de falta de autenticação no protocolo Modbus TCP e análise de firmware binwalk.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!attackTriggered ? (
              <button
                onClick={triggerModbusAttack}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Injetar Pacote Modbus (Função 05)</span>
              </button>
            ) : (
              <button
                onClick={resetPLC}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition cursor-pointer"
                title="Resetar PLC"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Painel do PLC e Sensores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-5 rounded-2xl border transition-all ${
          attackTriggered ? 'bg-rose-950/30 border-rose-600' : 'bg-slate-950 border-slate-800'
        }`}>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Painel de Telemetria HMI</span>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-slate-400">Pressão do Tanque</div>
              <div className={`text-2xl font-extrabold font-mono ${tankPressure > 10 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {tankPressure.toFixed(1)} Bar
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Status da Válvula</div>
              <div className={`text-sm font-bold font-mono ${coilStatus ? 'text-emerald-400' : 'text-rose-400'}`}>
                {coilStatus ? 'ABERTA (ON)' : 'BLOQUEADA (OFF)'}
              </div>
            </div>
          </div>
        </div>

        {/* Console Modbus */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
            <Terminal className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-mono font-bold text-slate-200">Terminal de Tráfego Modbus</span>
          </div>
          <div className="space-y-1 font-mono text-xs text-slate-300">
            {logs.map((log, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="text-orange-400">&gt;</span>
                <span className={log.includes('FLAG') ? 'text-amber-400 font-bold bg-amber-950/40 p-1 rounded' : log.includes('ALARME') ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
