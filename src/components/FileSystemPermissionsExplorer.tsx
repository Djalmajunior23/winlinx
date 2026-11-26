import React, { useState } from 'react';
import { 
  FolderTree, 
  HardDrive, 
  Shield, 
  Lock, 
  Unlock, 
  FileText, 
  Eye, 
  Layers, 
  HelpCircle,
  FileCode,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { FileNode } from '../types/simulator';

interface FileSystemPermissionsExplorerProps {
  linuxRootFS?: FileNode;
  windowsRootFS?: FileNode;
}

export const FileSystemPermissionsExplorer: React.FC<FileSystemPermissionsExplorerProps> = () => {
  const [activeOS, setActiveOS] = useState<'linux' | 'windows'>('linux');
  const [activeSubTab, setActiveSubTab] = useState<'architecture' | 'permissions' | 'ads'>('permissions');

  // Estado para a Calculadora Interativa de Permissões POSIX
  const [calcOwner, setCalcOwner] = useState({ r: true, w: true, x: true }); // 7
  const [calcGroup, setCalcGroup] = useState({ r: true, w: false, x: true }); // 5
  const [calcOthers, setCalcOthers] = useState({ r: true, w: false, x: true }); // 5
  const [calcSpecial, setCalcSpecial] = useState({ suid: false, sgid: false, sticky: false });

  // Cálculo octal
  const ownerVal = (calcOwner.r ? 4 : 0) + (calcOwner.w ? 2 : 0) + (calcOwner.x ? 1 : 0);
  const groupVal = (calcGroup.r ? 4 : 0) + (calcGroup.w ? 2 : 0) + (calcGroup.x ? 1 : 0);
  const othersVal = (calcOthers.r ? 4 : 0) + (calcOthers.w ? 2 : 0) + (calcOthers.x ? 1 : 0);
  const specialVal = (calcSpecial.suid ? 4 : 0) + (calcSpecial.sgid ? 2 : 0) + (calcSpecial.sticky ? 1 : 0);

  const octalString = `${specialVal > 0 ? specialVal : ''}${ownerVal}${groupVal}${othersVal}`;

  // Formatação simbólica (ex: -rwxr-xr-x ou -rwsr-xr-t)
  const formatSymbolic = () => {
    let s = '-';
    s += calcOwner.r ? 'r' : '-';
    s += calcOwner.w ? 'w' : '-';
    if (calcSpecial.suid) {
      s += calcOwner.x ? 's' : 'S';
    } else {
      s += calcOwner.x ? 'x' : '-';
    }

    s += calcGroup.r ? 'r' : '-';
    s += calcGroup.w ? 'w' : '-';
    if (calcSpecial.sgid) {
      s += calcGroup.x ? 's' : 'S';
    } else {
      s += calcGroup.x ? 'x' : '-';
    }

    s += calcOthers.r ? 'r' : '-';
    s += calcOthers.w ? 'w' : '-';
    if (calcSpecial.sticky) {
      s += calcOthers.x ? 't' : 'T';
    } else {
      s += calcOthers.x ? 'x' : '-';
    }

    return s;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl text-amber-400">
              <FolderTree className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Sistemas de Arquivos & Modelos de Permissões
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  ext4 / POSIX vs NTFS / DACL
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Explore a arquitetura interna de armazenamento, estruturas de Inodes vs $MFT, permissões octais e Alternate Data Streams (ADS).
              </p>
            </div>
          </div>

          {/* Seletor de SO */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveOS('linux')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeOS === 'linux'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Linux (ext4 / VFS / POSIX)</span>
            </button>
            <button
              onClick={() => setActiveOS('windows')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeOS === 'windows'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Windows (NTFS / MFT / DACL)</span>
            </button>
          </div>
        </div>

        {/* Sub-abas */}
        <div className="flex border-b border-slate-800 mt-6 -mb-2 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveSubTab('permissions')}
            className={`pb-3 border-b-2 transition ${
              activeSubTab === 'permissions'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Modelo de Permissões ({activeOS === 'linux' ? 'POSIX & Octal' : 'NTFS DACL & SIDs'})
          </button>
          <button
            onClick={() => setActiveSubTab('architecture')}
            className={`pb-3 border-b-2 transition ${
              activeSubTab === 'architecture'
                ? 'border-amber-400 text-amber-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Estrutura de Disco ({activeOS === 'linux' ? 'Superblock & Inodes' : 'MFT & Registros NTFS'})
          </button>
          {activeOS === 'windows' && (
            <button
              onClick={() => setActiveSubTab('ads')}
              className={`pb-3 border-b-2 transition ${
                activeSubTab === 'ads'
                  ? 'border-cyan-400 text-cyan-300 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Alternate Data Streams (ADS - $DATA)
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo da Aba */}
      {activeOS === 'linux' && activeSubTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calculadora Interativa POSIX */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Calculadora Interativa de Permissões POSIX (chmod)
              </h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-amber-400 font-bold">
                  {octalString}
                </span>
                <span className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 font-bold">
                  {formatSymbolic()}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              No modelo POSIX, permissões são divididas em três esferas: <strong>Owner (Proprietário)</strong>, <strong>Group (Grupo)</strong> e <strong>Others (Outros)</strong>, com os pesos binários <strong>Read (4)</strong>, <strong>Write (2)</strong> e <strong>Execute (1)</strong>.
            </p>

            {/* Matriz de Seleção */}
            <div className="grid grid-cols-3 gap-4 text-xs">
              {/* Owner */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="font-bold text-amber-400 flex items-center justify-between">
                  <span>Proprietário (User - u)</span>
                  <span className="text-slate-500 font-mono">{ownerVal}</span>
                </div>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcOwner.r}
                    onChange={(e) => setCalcOwner(prev => ({ ...prev, r: e.target.checked }))}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Read (r) [4]</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcOwner.w}
                    onChange={(e) => setCalcOwner(prev => ({ ...prev, w: e.target.checked }))}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Write (w) [2]</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcOwner.x}
                    onChange={(e) => setCalcOwner(prev => ({ ...prev, x: e.target.checked }))}
                    className="rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Execute (x) [1]</span>
                </label>
              </div>

              {/* Group */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="font-bold text-cyan-400 flex items-center justify-between">
                  <span>Grupo (Group - g)</span>
                  <span className="text-slate-500 font-mono">{groupVal}</span>
                </div>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcGroup.r}
                    onChange={(e) => setCalcGroup(prev => ({ ...prev, r: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Read (r) [4]</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcGroup.w}
                    onChange={(e) => setCalcGroup(prev => ({ ...prev, w: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Write (w) [2]</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcGroup.x}
                    onChange={(e) => setCalcGroup(prev => ({ ...prev, x: e.target.checked }))}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Execute (x) [1]</span>
                </label>
              </div>

              {/* Others */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="font-bold text-rose-400 flex items-center justify-between">
                  <span>Outros (Others - o)</span>
                  <span className="text-slate-500 font-mono">{othersVal}</span>
                </div>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcOthers.r}
                    onChange={(e) => setCalcOthers(prev => ({ ...prev, r: e.target.checked }))}
                    className="rounded border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span>Read (r) [4]</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcOthers.w}
                    onChange={(e) => setCalcOthers(prev => ({ ...prev, w: e.target.checked }))}
                    className="rounded border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span>Write (w) [2]</span>
                </label>
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcOthers.x}
                    onChange={(e) => setCalcOthers(prev => ({ ...prev, x: e.target.checked }))}
                    className="rounded border-slate-700 text-rose-500 focus:ring-0"
                  />
                  <span>Execute (x) [1]</span>
                </label>
              </div>
            </div>

            {/* Bits Especiais (SUID, SGID, Sticky Bit) */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="text-xs font-bold text-purple-400 flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Bits Especiais de Segurança (Pesos: SUID=4, SGID=2, Sticky=1)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <label className="flex items-start space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcSpecial.suid}
                    onChange={(e) => setCalcSpecial(prev => ({ ...prev, suid: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-purple-300">SUID (4000)</span>
                    <p className="text-[10px] text-slate-500">Executa com o UID do proprietário (ex: root).</p>
                  </div>
                </label>

                <label className="flex items-start space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcSpecial.sgid}
                    onChange={(e) => setCalcSpecial(prev => ({ ...prev, sgid: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-purple-300">SGID (2000)</span>
                    <p className="text-[10px] text-slate-500">Herda o GID do diretório ou grupo dono.</p>
                  </div>
                </label>

                <label className="flex items-start space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={calcSpecial.sticky}
                    onChange={(e) => setCalcSpecial(prev => ({ ...prev, sticky: e.target.checked }))}
                    className="mt-0.5 rounded border-slate-700 text-purple-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-purple-300">Sticky Bit (1000)</span>
                    <p className="text-[10px] text-slate-500">Apenas o proprietário pode deletar (ex: /tmp).</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Comando Gerado */}
            <div className="bg-slate-950 border border-cyan-500/30 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Comando para aplicar:</span>
              <span className="text-cyan-300 font-bold">chmod {octalString} &lt;arquivo&gt;</span>
            </div>
          </div>

          {/* Comparativo Didático POSIX */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-400" />
              Tabela de Referência POSIX & Riscos de Cibersegurança
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-emerald-400">
                  <span>chmod 755 (-rwxr-xr-x)</span>
                  <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Padrão Seguro</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Proprietário tem controle total (rwx); grupo e outros apenas leem e executam. Padrão para binários em <code>/bin</code> e <code>/usr/bin</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-rose-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-rose-400">
                  <span>chmod 777 (-rwxrwxrwx)</span>
                  <span className="text-[10px] text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">Alto Risco</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Qualquer usuário local pode modificar, sobrescrever ou deletar o arquivo. Permite injeção de código malicioso se aplicado a scripts ou binários.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-purple-900/40 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-purple-400">
                  <span>chmod 4755 (-rwsr-xr-x)</span>
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">SUID / PrivEsc</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Se o proprietário for <code>root</code> e o binário possuir recursos de execução de comandos (ex: <code>find</code>, <code>vim</code>, <code>cp</code>), o usuário eleva privilégios para root (GTFOBins).
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center justify-between font-mono font-bold text-amber-400">
                  <span>chmod 1777 (drwxrwxrwt)</span>
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Sticky Bit</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Utilizado em diretórios compartilhados como <code>/tmp</code>. Impede que um usuário mal-intencionado apague ou renomeie arquivos pertencentes a outros usuários.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Windows NTFS Permissions */}
      {activeOS === 'windows' && activeSubTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Modelo de Controle de Acesso NTFS (DACL, SIDs & ACEs)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O Windows utiliza um modelo muito mais granular que o POSIX. Cada arquivo ou pasta possui um <strong>Descritor de Segurança (Security Descriptor)</strong> composto por:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <UserSIDIcon /> SIDs (Security Identifiers)
                </span>
                <p className="text-[11px] text-slate-400">
                  Identificador alfanumérico único atribuído a cada entidade de segurança.
                </p>
                <div className="font-mono text-[10px] text-slate-500 space-y-0.5">
                  <div>SYSTEM: S-1-5-18</div>
                  <div>Administrators: S-1-5-32-544</div>
                  <div>Users: S-1-5-32-545</div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> DACL (Discretionary ACL)
                </span>
                <p className="text-[11px] text-slate-400">
                  Lista ordenada de ACEs (Access Control Entries) que especificam permissões de <strong>Allow</strong> ou <strong>Deny</strong>.
                </p>
                <div className="font-mono text-[10px] text-slate-500">
                  Regra de Ouro: Deny tem precedência sobre Allow!
                </div>
              </div>
            </div>

            {/* Permissões icacls */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-300">Sintaxe de Permissões do icacls</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-emerald-400">
                  <span className="font-bold">(F)</span> Full Control
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-cyan-400">
                  <span className="font-bold">(M)</span> Modify (RWXD)
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-blue-400">
                  <span className="font-bold">(RX)</span> Read & Execute
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-amber-400">
                  <span className="font-bold">(W)</span> Write
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300">
                  <span className="font-bold">(R)</span> Read
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800 text-rose-400">
                  <span className="font-bold">(D)</span> Delete
                </div>
              </div>
            </div>

            {/* Exemplo de Vulnerabilidade no Lab */}
            <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1 text-xs">
              <div className="font-bold text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Cenário Vulnerável do Lab 01 (Windows)
              </div>
              <p className="text-slate-400 text-[11px]">
                Em <code>C:\Program Files\Custom App</code>, a DACL concede <code>BUILTIN\Users:(M,W,R)</code>. Um atacante sem privilégios pode substituir o binário de serviço <code>service.exe</code> por um executável malicioso e aguardar o reboot para rodar como SYSTEM.
              </p>
            </div>
          </div>

          {/* Herança & SACL */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Herança de Permissões & SACL (Auditoria)
            </h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="font-bold text-indigo-400">Herança (Permission Inheritance)</span>
                <p className="text-[11px] text-slate-400">
                  Por padrão no NTFS, arquivos novos herdam as ACEs da pasta pai. A flag <code>(OI)(CI)</code> indica que a regra se propaga para objetos e containers filhos.
                </p>
                <div className="font-mono text-[10px] text-slate-500 bg-slate-900 p-1.5 rounded">
                  icacls "pasta" /inheritance:d (bloqueia herança)
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="font-bold text-teal-400">SACL (System Access Control List)</span>
                <p className="text-[11px] text-slate-400">
                  Diferente da DACL (que controla permissão), a SACL comanda a <strong>Auditoria de Segurança</strong> do Kernel Windows, gerando Event IDs 4663 e 4656 quando arquivos protegidos são lidos ou alterados.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <span className="font-bold text-amber-400">Comandos Úteis de Auditoria</span>
                <ul className="font-mono text-[10px] text-slate-400 space-y-1">
                  <li>• icacls "C:\caminho" (Ver DACL)</li>
                  <li>• icacls "C:\caminho" /grant "Users:(RX)"</li>
                  <li>• icacls "C:\caminho" /remove "Users"</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo de Estrutura de Disco */}
      {activeSubTab === 'architecture' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Linux ext4 / VFS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200">Estrutura Física & Lógica do ext4 (Linux)</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-amber-400 font-mono">1. Superblock</div>
                <p className="text-slate-400 text-[11px]">
                  Contém metadados globais da partição: contagem total de Inodes, blocos livres, tamanho de bloco (4096 bytes) e estado de montagem. Cópias de backup do superblock são distribuídas pelo disco para recuperação via <code>fsck</code>.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-emerald-400 font-mono">2. Inode Table (Tabela de Inodes)</div>
                <p className="text-slate-400 text-[11px]">
                  Cada arquivo é indexado por um número único de Inode. O Inode guarda: tipo de arquivo, permissões POSIX, dono (UID/GID), tamanho, contagem de hard links, timestamps (atime, mtime, ctime) e ponteiros para os blocos de dados.
                </p>
                <div className="p-1.5 bg-slate-900 rounded font-mono text-[10px] text-cyan-300">
                  stat /bin/find (inspeciona o Inode)
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-cyan-400 font-mono">3. Data Blocks (Blocos de Dados)</div>
                <p className="text-slate-400 text-[11px]">
                  Onde o conteúdo real dos arquivos reside. O nome do arquivo <strong>não</strong> fica no Inode, e sim nos blocos de dados do diretório pai (mapeando "nome" ➔ "Inode").
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-purple-400 font-mono">4. Hard Link vs Soft Link (Symlink)</div>
                <p className="text-slate-400 text-[11px]">
                  <strong>Hard Link:</strong> Outro nome que aponta para o mesmo número de Inode (compartilha os mesmos dados).<br />
                  <strong>Symlink:</strong> Arquivo especial que contém apenas uma string com o caminho para outro arquivo.
                </p>
              </div>
            </div>
          </div>

          {/* Windows NTFS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">Estrutura Física & Lógica do NTFS (Windows)</h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-cyan-400 font-mono">1. Master File Table ($MFT)</div>
                <p className="text-slate-400 text-[11px]">
                  O coração do NTFS. No NTFS, <em>tudo</em> é um arquivo, inclusive a própria tabela $MFT (registro 0). Cada entrada tem 1024 bytes e armazena os atributos do arquivo.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-amber-400 font-mono">2. Atributos Fundamentais do Registro $MFT</div>
                <ul className="text-[11px] text-slate-400 space-y-1">
                  <li>• <code>$STANDARD_INFORMATION</code>: Timestamps (Created, Modified, MFT Change, Access) e atributos DOS (Read-only, Hidden).</li>
                  <li>• <code>$FILE_NAME</code>: Nome do arquivo (suporta nomes longos e nomes curtos 8.3).</li>
                  <li>• <code>$SECURITY_DESCRIPTOR</code>: DACL, SACL e SIDs do dono.</li>
                  <li>• <code>$DATA</code>: Dados do arquivo (se for pequeno, é residente no próprio registro!).</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-emerald-400 font-mono">3. Journaling ($LogFile)</div>
                <p className="text-slate-400 text-[11px]">
                  O NTFS garante consistência contra falhas elétricas gravando todas as alterações pendentes de metadados em um log circular antes de gravá-las no disco.
                </p>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <div className="font-bold text-indigo-400 font-mono">4. Informações do Volume (fsutil)</div>
                <p className="text-slate-400 text-[11px]">
                  Com o comando <code>fsutil fsinfo ntfsinfo C:</code>, o analista descobre o ponto de início do $MFT, tamanho do setor físico e alinhamento de clusters.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Alternate Data Streams (ADS) */}
      {activeOS === 'windows' && activeSubTab === 'ads' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                NTFS Alternate Data Streams (ADS) - Mecânica & Abusos de Malware
              </h3>
              <p className="text-slate-400 mt-1">
                O NTFS permite que um mesmo arquivo contenha múltiplos fluxos de dados <code>$DATA</code> independentes anexados ao mesmo registro na $MFT.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg font-mono text-[11px]">
              Sintaxe: arquivo.ext:fluxo:$DATA
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="font-bold text-emerald-400">1. Uso Legítimo: Zone.Identifier (MOTW)</span>
              <p className="text-slate-400 text-[11px]">
                Quando você baixa um executável da internet no Windows, o navegador cria automaticamente um stream oculto chamado <code>arquivo.exe:Zone.Identifier</code> contendo <code>ZoneId=3</code> (Internet). Isso aciona a caixa de aviso do SmartScreen!
              </p>
              <div className="bg-slate-900 p-2 rounded font-mono text-[10px] text-slate-300">
                Get-Content arquivo.exe -Stream Zone.Identifier
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-rose-900/40 rounded-xl space-y-2">
              <span className="font-bold text-rose-400">2. Uso Malicioso: Ocultação de Payloads (T1564.004)</span>
              <p className="text-slate-400 text-[11px]">
                Invasores injetam scripts maliciosos em arquivos inocentes (ex: <code>documento.pdf:malware.ps1</code>). No Windows Explorer, o tamanho do PDF permanece inalterado e o arquivo oculto não aparece no <code>dir</code> convencional!
              </p>
              <div className="bg-slate-900 p-2 rounded font-mono text-[10px] text-cyan-300">
                dir /r (revela streams ocultos)
              </div>
            </div>
          </div>

          {/* Demonstração Interativa */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" /> Experimente no Terminal Windows do WinLinx:
            </span>
            <div className="space-y-1.5 font-mono text-[11px] text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
              <div className="text-slate-500"># 1. Veja o arquivo com Alternate Data Stream:</div>
              <div>PS C:\Users\Aluno&gt; dir /r</div>
              <div className="text-slate-500 pt-1"># 2. Inspecione o conteúdo do stream oculto:</div>
              <div>PS C:\Users\Aluno&gt; Get-Content Downloads\invoice.pdf -Stream hidden_payload.ps1</div>
              <div className="text-slate-500 pt-1"># 3. Inspecione o metadado de proveniência de download:</div>
              <div>PS C:\Users\Aluno&gt; Get-Content Downloads\invoice.pdf -Stream Zone.Identifier</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserSIDIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
