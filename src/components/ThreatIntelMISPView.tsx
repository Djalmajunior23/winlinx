import React, { useState } from 'react';
import { 
  Globe, 
  Terminal, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  Activity, 
  Search,
  Filter,
  FileCode
} from 'lucide-react';

interface ThreatIndicator {
  id: string;
  type: 'IP C2' | 'SHA-256' | 'Domain DGA';
  value: string;
  threatActor: string;
  confidence: 'ALTA (95%)' | 'MÉDIA (75%)';
  campaign: string;
  tags: string[];
}

const THREAT_INDICATORS: ThreatIndicator[] = [
  {
    id: 'ioc-1',
    type: 'IP C2',
    value: '203.0.113.80',
    threatActor: 'APT29 (Cozy Bear)',
    confidence: 'ALTA (95%)',
    campaign: 'Operação Sunburst',
    tags: ['C2 Beacon', 'HTTPS Tunnel', 'Port 4444']
  },
  {
    id: 'ioc-2',
    type: 'SHA-256',
    value: 'ed01ebfbc9eb5bbea545af4d01bf5f1071661840480439c6e5babe8e080e41aa',
    threatActor: 'Lazarus Group',
    confidence: 'ALTA (95%)',
    campaign: 'WannaCry Global Outbreak',
    tags: ['Ransomware', 'SMB Worm', 'EternalBlue']
  },
  {
    id: 'ioc-3',
    type: 'Domain DGA',
    value: 'iuqerfsodp9ifjaposdfjhgosurijfaewrwergwea.com',
    threatActor: 'Killswitch Monitor',
    confidence: 'ALTA (95%)',
    campaign: 'WannaCry Anti-Sandbox Domain',
    tags: ['Sinkhole', 'DGA', 'Evasion']
  }
];

export const ThreatIntelMISPView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [exported, setExported] = useState<boolean>(false);

  const filtered = THREAT_INDICATORS.filter(i => 
    i.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.threatActor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Inteligência de Ameaças (CTI / MISP Feed)</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  OPENCTI / MISP TAXII 2.1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Indicadores de comprometimento (IOCs), correlação de atores de ameaça estado-nação e exportação de pacotes STIX.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExported(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 fill-white" />
              <span>Exportar Pacote STIX 2.1</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Indicadores */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Buscar IOC ou Ator..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total de IOCs Ativos: {filtered.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800 pb-2">
                <th className="py-2 px-3">Tipo</th>
                <th className="py-2 px-3">Valor do IOC</th>
                <th className="py-2 px-3">Ator da Ameaça</th>
                <th className="py-2 px-3">Campanha</th>
                <th className="py-2 px-3">Confiança</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {filtered.map(ioc => (
                <tr key={ioc.id} className="hover:bg-slate-900/40">
                  <td className="py-2 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-bold">
                      {ioc.type}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-bold text-slate-200 select-all">{ioc.value}</td>
                  <td className="py-2 px-3 text-rose-400">{ioc.threatActor}</td>
                  <td className="py-2 px-3 text-slate-400">{ioc.campaign}</td>
                  <td className="py-2 px-3 text-emerald-400">{ioc.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exported && (
          <div className="p-3 bg-cyan-950/30 border border-cyan-900/60 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-2 text-xs text-cyan-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dossiê CTI STIX/TAXII 2.1 compilado e correlacionado com a telemetria do laboratório!</span>
            </div>
            <div className="px-2.5 py-1 bg-cyan-900 border border-cyan-700 text-cyan-200 text-xs font-mono font-bold rounded">
              FLAG&#123;WINLINX_CTI_MISP_STIX_CORRELATED_2026&#125;
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
