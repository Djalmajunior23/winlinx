import React, { useState } from 'react';
import { 
  Crosshair, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  FileCheck, 
  ArrowRight,
  Terminal,
  Clock
} from 'lucide-react';

interface CampaignPhase {
  id: string;
  name: string;
  mitreTactic: string;
  mitreTechnique: string;
  description: string;
  threatActorAction: string;
  defenseAction: string;
  mitigated: boolean;
}

interface APTCampaign {
  id: string;
  name: string;
  actor: string;
  origin: string;
  targetOS: 'windows' | 'linux' | 'multi';
  summary: string;
  phases: CampaignPhase[];
}

const APT_CAMPAIGNS: APTCampaign[] = [
  {
    id: 'apt-cozy-bear',
    name: 'Operação Sunburst / Supply Chain',
    actor: 'APT29 (Cozy Bear / Nobelium)',
    origin: 'Estado-Nação',
    targetOS: 'multi',
    summary: 'Campanha de ciberespionagem sofisticada com injeção de backdoor em binários legítimos e movimentação furtiva via tokens SAML e APIs nativas.',
    phases: [
      {
        id: 'phase-1',
        name: 'Acesso Inicial',
        mitreTactic: 'Initial Access',
        mitreTechnique: 'T1195.002 (Supply Chain Compromise)',
        description: 'Trojanização de biblioteca DLL assinada digitalmente.',
        threatActorAction: 'Injeção de código ofuscado na compilação do software corporativo.',
        defenseAction: 'Validar hashes de integridade SHA-256 e assinatura Authenticode em pipeline CI/CD.',
        mitigated: false
      },
      {
        id: 'phase-2',
        name: 'Persistência & Evasão',
        mitreTactic: 'Defense Evasion',
        mitreTechnique: 'T1027 (Obfuscated/Encrypted Files)',
        description: 'Sleep dinâmico de 14 dias para evitar detecção em sandboxes automatizadas.',
        threatActorAction: 'Chamadas a GetSystemTime e hash checking de nomes de processos de antivírus.',
        defenseAction: 'Aceleração de timers em sandbox forense e inspeção de entropia de seções.',
        mitigated: false
      },
      {
        id: 'phase-3',
        name: 'Movimentação Lateral',
        mitreTactic: 'Lateral Movement',
        mitreTechnique: 'T1550.002 (Pass the Hash / Kerberos Golden Ticket)',
        description: 'Forjamento de tickets de autenticação no Active Directory.',
        threatActorAction: 'Exportação do hash da conta krbtgt e geração de TGT irrestrito.',
        defenseAction: 'Redefinição cíclica da senha da conta krbtgt e monitoramento de Event ID 4769.',
        mitigated: false
      },
      {
        id: 'phase-4',
        name: 'Exfiltração de Dados',
        mitreTactic: 'Exfiltration',
        mitreTechnique: 'T1041 (Exfiltration Over C2 Channel)',
        description: 'Exfiltração de e-mails confidenciais disfarçados em tráfego HTTPS legítimo.',
        threatActorAction: 'Codificação Base64 disfarçada em requisições GET para CDNs públicas.',
        defenseAction: 'Inspeção profunda de pacotes (DPI / TLS Decryption) e bloqueio de domínios recém-registrados.',
        mitigated: false
      }
    ]
  },
  {
    id: 'apt-lockbit',
    name: 'Ransomware-as-a-Service (RaaS)',
    actor: 'LockBit 3.0 (Black)',
    origin: 'Cibercrime Organizado',
    targetOS: 'windows',
    summary: 'Ransomware de alta velocidade com encerramento forçado de serviços de segurança e criptografia multithread.',
    phases: [
      {
        id: 'phase-1',
        name: 'Acesso Inicial',
        mitreTactic: 'Initial Access',
        mitreTechnique: 'T1133 (External Remote Services)',
        description: 'Acesso via VPN desatualizada com credencial comprometida.',
        threatActorAction: 'Logon com credenciais compradas em fóruns clandestinos.',
        defenseAction: 'Obrigatoriedade de MFA resistente a phishing (FIDO2) em todos os acessos VPN.',
        mitigated: false
      },
      {
        id: 'phase-2',
        name: 'Inibição de Recuperação',
        mitreTactic: 'Impact',
        mitreTechnique: 'T1490 (Inhibit System Recovery)',
        description: 'Destruição de cópias de sombra e logs de eventos do sistema.',
        threatActorAction: 'Execução de vssadmin.exe delete shadows /all /quiet e wevtutil.exe cl Security.',
        defenseAction: 'Habilitar proteção contra exclusão de VSS e alertar em tempo real Event ID 1102 (Log Cleared).',
        mitigated: false
      },
      {
        id: 'phase-3',
        name: 'Criptografia Total',
        mitreTactic: 'Impact',
        mitreTechnique: 'T1486 (Data Encrypted for Impact)',
        description: 'Criptografia rápida de arquivos locais e compartilhamentos de rede com renomeação para .lockbit.',
        threatActorAction: 'Uso de criptografia híbrida ChaCha20 + ECC com threads paralelas.',
        defenseAction: 'Isolamento de host automatizado via EDR e bloqueio de escrita anormal de arquivos.',
        mitigated: false
      }
    ]
  }
];

export const AdversaryEmulationView: React.FC = () => {
  const [selectedCampaign, setSelectedCampaign] = useState<APTCampaign>(APT_CAMPAIGNS[0]);
  const [phases, setPhases] = useState<CampaignPhase[]>(APT_CAMPAIGNS[0].phases);
  const [defenseLog, setDefenseLog] = useState<string[]>([
    'SOC WinLinx pronto para emulação de ameaças. Escolha uma campanha APT.'
  ]);

  const handleMitigatePhase = (phaseId: string) => {
    setPhases(prev => prev.map(p => {
      if (p.id === phaseId) {
        setDefenseLog(l => [
          ...l,
          `[DEFESA ATIVA] Fase '${p.name}' mitigada com sucesso! ${p.defenseAction}`
        ]);
        return { ...p, mitigated: true };
      }
      return p;
    }));
  };

  const allMitigated = phases.every(p => p.mitigated);

  const resetCampaign = (camp: APTCampaign) => {
    setSelectedCampaign(camp);
    setPhases(camp.phases.map(p => ({ ...p, mitigated: false })));
    setDefenseLog([
      `Campanha iniciada: ${camp.name} (${camp.actor}). Avalie cada tática do MITRE ATT&CK.`
    ]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <Crosshair className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">Emulação de Adversários & Campanhas APT</h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-rose-950 text-rose-300 border border-rose-800">
                  CALDERA / ATOMIC RED TEAM ARCHITECTURE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulação de campanhas completas de ameaças avançadas persistentes mapeadas passo a passo na matriz MITRE ATT&CK.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {APT_CAMPAIGNS.map(camp => (
              <button
                key={camp.id}
                onClick={() => resetCampaign(camp)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCampaign.id === camp.id
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {camp.actor.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visão da Campanha e Etapas da Kill Chain */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Fases da Kill Chain ({selectedCampaign.name})</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            Mitigadas: {phases.filter(p => p.mitigated).length} / {phases.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map((phase, idx) => (
            <div
              key={phase.id}
              className={`p-5 rounded-2xl border transition-all ${
                phase.mitigated
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-slate-900/80 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-200">
                  {idx + 1}. {phase.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                  {phase.mitreTechnique}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-400 text-[11px]">{phase.description}</p>
                <div className="p-2 rounded bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-300">
                  <strong>Ataque:</strong> {phase.threatActorAction}
                </div>
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                  <strong>Contramedida:</strong> {phase.defenseAction}
                </div>

                <div className="pt-2 flex justify-end">
                  {!phase.mitigated ? (
                    <button
                      onClick={() => handleMitigatePhase(phase.id)}
                      className="px-3 py-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                    >
                      Aplicar Mitigação
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mitigada</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {allMitigated && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-600 rounded-2xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <div>
                <div className="text-sm font-bold text-emerald-300">Campanha APT Neutralizada com Sucesso!</div>
                <div className="text-xs text-slate-400">Todas as fases foram mitigadas com controles de segurança em profundidade.</div>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-900 text-emerald-200 font-mono text-xs font-bold rounded-lg border border-emerald-700">
              FLAG&#123;WINLINX_APT_ADVERSARY_EMULATION_NEUTRALIZED_2026&#125;
            </div>
          </div>
        )}
      </div>

      {/* Terminal de Defesa em Tempo Real */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-2xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800 mb-3">
          <Terminal className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-mono font-bold text-slate-200">Log de Operações do SOC / EDR</span>
        </div>
        <div className="space-y-1 font-mono text-xs text-slate-300">
          {defenseLog.map((log, idx) => (
            <div key={idx} className="flex items-start space-x-2">
              <span className="text-rose-400">&gt;</span>
              <span className={log.includes('DEFESA ATIVA') ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
