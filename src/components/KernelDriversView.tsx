import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileCode, 
  Terminal, 
  ShieldCheck, 
  Lock, 
  Zap,
  Info
} from 'lucide-react';
import { OSType } from '../types/simulator';

interface DriverItem {
  name: string;
  type: string;
  sizeKb: number;
  signed: boolean;
  signer?: string;
  isVulnerable?: boolean;
  cve?: string;
  description: string;
  securityImpact: string;
}

export const KernelDriversView: React.FC = () => {
  const [activeOS, setActiveOS] = useState<OSType>('linux');
  const [selectedDriver, setSelectedDriver] = useState<DriverItem | null>(null);

  const linuxModules: DriverItem[] = [
    {
      name: 'ext4',
      type: 'Kernel FileSystem Module',
      sizeKb: 680,
      signed: true,
      signer: 'Canonical Linux Master CA',
      description: 'Módulo do sistema de arquivos ext4 padrão, responsável pelo gerenciamento de superblocks, inodes e journaling.',
      securityImpact: 'Módulo essencial do SO. Opera diretamente em Ring 0 gerenciando chamadas de I/O em disco.'
    },
    {
      name: 'nf_tables',
      type: 'Netfilter Subsystem Module',
      sizeKb: 240,
      signed: true,
      signer: 'Canonical Linux Master CA',
      description: 'Módulo de processamento de pacotes de rede e firewall do Kernel Linux (base do iptables e ufw).',
      securityImpact: 'Intercepta pacotes nos hooks do kernel antes do tráfego alcançar as aplicações de espaço de usuário.'
    },
    {
      name: 'overlay',
      type: 'Union Filesystem Module',
      sizeKb: 160,
      signed: true,
      signer: 'Canonical Linux Master CA',
      description: 'Módulo de união de sistemas de arquivos, extensivamente utilizado pela engine do Docker/containerd.',
      securityImpact: 'Falhas no tratamento de permissões de montagem podem permitir elevação de privilégios em containers.'
    },
    {
      name: 'rootkit_diamorphine',
      type: 'Rogue LKM (Rootkit de Kernel)',
      sizeKb: 48,
      signed: false,
      isVulnerable: true,
      cve: 'ATT&CK T1014',
      description: 'Módulo de kernel malicioso não assinado carregado via insmod. Realiza hooking da tabela sys_call_table.',
      securityImpact: 'ALTA GRAVIDADE: Altera o retorno de getdents64 e kill para ocultar processos e diretórios com prefixo secreto de comandos como ps e ls!'
    }
  ];

  const windowsDrivers: DriverItem[] = [
    {
      name: 'ntfs.sys',
      type: 'File System Driver',
      sizeKb: 2150,
      signed: true,
      signer: 'Microsoft Windows Production PCA 2011',
      description: 'Driver nativo do sistema de arquivos NTFS, gerenciador da Master File Table ($MFT) e das DACLs de segurança.',
      securityImpact: 'Driver crítico do núcleo do Windows NT. Opera em Ring 0 com privilégio absoluto.'
    },
    {
      name: 'fltmgr.sys',
      type: 'Filter Manager Driver',
      sizeKb: 450,
      signed: true,
      signer: 'Microsoft Windows Production PCA 2011',
      description: 'Gerenciador de filtros de I/O do sistema de arquivos, utilizado por antivírus e EDRs para monitorar escritas em disco.',
      securityImpact: 'Permite que ferramentas de defesa interceptem requisições de arquivos antes do commit no storage.'
    },
    {
      name: 'gdrv.sys',
      type: 'Vulnerable Third-Party Driver (BYOVD)',
      sizeKb: 32,
      signed: true,
      signer: 'GIGA-BYTE TECHNOLOGY CO., LTD.',
      isVulnerable: true,
      cve: 'CVE-2018-19320 (BYOVD)',
      description: 'Driver de hardware assinado com certificado válido da Gigabyte, mas que possui vulnerabilidade de leitura e escrita irrestrita em memória física do Kernel (Ring 0 Arbitrary Read/Write).',
      securityImpact: 'ALTO RISCO DE BYOVD: Malwares modernos (como BlackByte Ransomware) instalam este driver legítimo para desativar os callbacks do Windows Defender/EDR em Ring 0!'
    },
    {
      name: 'tcpip.sys',
      type: 'Network Transport Driver',
      sizeKb: 1840,
      signed: true,
      signer: 'Microsoft Windows Production PCA 2011',
      description: 'Driver da pilha de protocolos TCP/IP e Windows Filtering Platform (WFP).',
      securityImpact: 'Processa toda a camada de rede do sistema operacional e aplica regras de filtragem de pacotes do netsh.'
    }
  ];

  const currentList = activeOS === 'linux' ? linuxModules : windowsDrivers;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Drivers de Kernel & Mecânica BYOVD (Ring 0)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                  Linux LKMs vs Windows .SYS Drivers
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Inspecione os módulos que executam com privilégios de hardware absolutos em Ring 0. Compreenda técnicas modernas como <strong>BYOVD</strong> (Bring Your Own Vulnerable Driver) e Rootkits de Kernel.
              </p>
            </div>
          </div>

          {/* Seletor de SO */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => { setActiveOS('linux'); setSelectedDriver(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeOS === 'linux'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Linux (lsmod & LKMs)</span>
            </button>
            <button
              onClick={() => { setActiveOS('windows'); setSelectedDriver(null); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeOS === 'windows'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Windows (driverquery & BYOVD)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Drivers / Módulos */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Módulos de Kernel Carregados na Memória:</span>
            <span className="font-mono text-cyan-400">{currentList.length} ativos</span>
          </div>

          <div className="space-y-3">
            {currentList.map(item => (
              <div
                key={item.name}
                onClick={() => setSelectedDriver(item)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-md ${
                  selectedDriver?.name === item.name
                    ? 'bg-slate-800 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : item.isVulnerable
                      ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono font-bold text-sm text-slate-100">{item.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                      {item.type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {item.isVulnerable ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {item.cve || 'Vulnerável'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Assinado
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-500">{item.sizeKb} KB</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes & Vetores de Exploração do Driver */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
          {selectedDriver ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-mono">
                    {selectedDriver.name}
                  </h3>
                  <div className="text-slate-400 text-[11px]">{selectedDriver.type}</div>
                </div>
                {selectedDriver.isVulnerable ? (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold text-[11px]">
                    Alerta de Ameaça
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[11px]">
                    Homologado
                  </span>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-bold text-slate-300">Certificado Digital & Assinatura:</span>
                  <p className="text-slate-400 text-[11px]">
                    {selectedDriver.signer || 'Módulo sem assinatura digital verificável!'}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                  <span className="font-bold text-slate-300">Função Arquitetural:</span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {selectedDriver.description}
                  </p>
                </div>

                <div className={`p-3 rounded-xl border space-y-1 ${
                  selectedDriver.isVulnerable 
                    ? 'bg-rose-950/30 border-rose-900/50' 
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className={`font-bold flex items-center gap-1.5 ${
                    selectedDriver.isVulnerable ? 'text-rose-400' : 'text-cyan-400'
                  }`}>
                    {selectedDriver.isVulnerable ? <AlertTriangle className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
                    Impacto em Cibersegurança & Ring 0:
                  </span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {selectedDriver.securityImpact}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center space-y-3 text-slate-500">
              <Cpu className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p>Selecione um driver ou módulo da lista para visualizar a análise de integridade e riscos de exploração em Ring 0.</p>
            </div>
          )}

          {/* Dica do Terminal */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 mt-4 font-mono text-[11px]">
            <span className="text-cyan-400 font-bold block">Comandos de Auditoria no Terminal:</span>
            {activeOS === 'linux' ? (
              <div className="text-slate-300 space-y-1">
                <div>$ lsmod (lista módulos de kernel carregados)</div>
                <div>$ modinfo ext4 (exibe assinatura e parâmetros)</div>
              </div>
            ) : (
              <div className="text-slate-300 space-y-1">
                <div>PS C:\&gt; driverquery /v (lista drivers e estado da memória)</div>
                <div>PS C:\&gt; Get-Service | Where-Object Status -eq Running</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
