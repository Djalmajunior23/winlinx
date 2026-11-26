import React, { useState } from 'react';
import { 
  FolderGit2, 
  Plus, 
  Download, 
  Upload, 
  Play, 
  CheckCircle2, 
  Terminal, 
  FileCode, 
  Award,
  Sparkles,
  HelpCircle,
  Copy
} from 'lucide-react';
import { OSType, LabDefinition, LabTask } from '../types/simulator';

interface CustomLabBuilderViewProps {
  onLoadCustomLab?: (lab: LabDefinition) => void;
}

export const CustomLabBuilderView: React.FC<CustomLabBuilderViewProps> = ({
  onLoadCustomLab
}) => {
  const [labTitle, setLabTitle] = useState('Análise Forense e Hardening de Servidor Web');
  const [labDescription, setLabDescription] = useState('Investigar persistência maliciosa em scripts de inicialização e aplicar regras de firewall de host.');
  const [difficulty, setDifficulty] = useState<'Iniciante' | 'Intermediário' | 'Avançado'>('Intermediário');
  const [targetOS, setTargetOS] = useState<OSType | 'both'>('linux');
  
  const [taskTitle, setTaskTitle] = useState('Identificar e encerrar processo rogue');
  const [validationCmd, setValidationCmd] = useState('kill -9 1337');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [flagReward, setFlagReward] = useState('FLAG{LAB_PERSONALIZADO_PROFESSOR_2026}');

  const [jsonExport, setJsonExport] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleGenerateJSON = () => {
    const customLab: LabDefinition = {
      id: `lab-custom-${Date.now()}`,
      moduleSlug: 'custom-labs',
      title: labTitle,
      difficulty,
      category: 'Hardening',
      durationMinutes: 30,
      description: labDescription,
      realWorldScenario: labDescription,
      mitreTechniques: [{ id: 'T1057', name: 'Process Discovery' }],
      learningGoals: ['Identificação de anomalias', 'Remediação em linha de comando'],
      tasks: [
        {
          id: `task-custom-1`,
          title: taskTitle,
          instructions: `Execute o comando de remediação para concluir o objetivo.`,
          targetOS,
          objective: taskTitle,
          hint: `Utilize o comando correspondente para neutralizar o alvo.`,
          validationCommand: validationCmd,
          expectedOutputSubstring: expectedOutput,
          flagReward
        }
      ]
    };

    const str = JSON.stringify(customLab, null, 2);
    setJsonExport(str);

    if (onLoadCustomLab) {
      onLoadCustomLab(customLab);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl text-purple-400">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              Modo do Instrutor & Construtor de Laboratórios CTF
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                Custom Lab Builder
              </span>
            </h2>
            <p className="text-slate-400 mt-1 max-w-2xl">
              Crie desafios práticos personalizados para suas aulas e treinamentos. Defina tarefas, comandos esperados e flags de recompensa, exportando tudo em pacotes portáveis JSON compatíveis com o <strong>CiberLab Academy</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* Formulário do Construtor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-purple-400" />
            Configuração do Desafio Prático
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-slate-400 font-medium block mb-1">Título do Laboratório:</label>
              <input
                type="text"
                value={labTitle}
                onChange={e => setLabTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-slate-400 font-medium block mb-1">Cenário / Descrição do Ataque:</label>
              <textarea
                rows={3}
                value={labDescription}
                onChange={e => setLabDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Dificuldade:</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Sistema Operacional Alvo:</label>
                <select
                  value={targetOS}
                  onChange={e => setTargetOS(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="linux">Linux (Bash)</option>
                  <option value="windows">Windows (PowerShell)</option>
                  <option value="both">Ambos (Comparativo)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <h4 className="font-bold text-slate-200">Tarefa Avaliativa:</h4>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Objetivo da Tarefa:</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Comando de Validação (ou prefixo):</label>
                  <input
                    type="text"
                    value={validationCmd}
                    onChange={e => setValidationCmd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-cyan-300 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">Flag de Recompensa:</label>
                  <input
                    type="text"
                    value={flagReward}
                    onChange={e => setFlagReward(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-amber-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateJSON}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compilar e Exportar Pacote de Laboratório</span>
            </button>
          </div>
        </div>

        {/* Saída JSON & Portabilidade */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-purple-400" />
              Pacote de Laboratório (.winlinx-lab.json)
            </h3>
            {jsonExport && (
              <button
                onClick={handleCopyJSON}
                className="text-slate-400 hover:text-purple-300 flex items-center gap-1 font-mono transition text-[11px]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            )}
          </div>

          <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 h-96 overflow-y-auto whitespace-pre-wrap">
            {jsonExport || '// Clique em "Compilar e Exportar Pacote de Laboratório" para gerar o schema JSON portátil.'}
          </pre>
        </div>
      </div>
    </div>
  );
};
