import { openPublishedRevision, readProjects, writeProject, type LabProject } from '../core/labLibrary';
import { readCustomLabPackage } from '../core/customLabPackage';
import React, { useEffect, useState } from 'react';
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
import { OSType, LabDefinition, LabStateCriterion, LabTask } from '../types/simulator';

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

  const [additionalTasks, setAdditionalTasks] = useState<Partial<LabTask>[]>([]);
  const [packageError, setPackageError] = useState('');
  const [evidenceLabel, setEvidenceLabel] = useState('');
  const [evidenceValue, setEvidenceValue] = useState('');

  const [mode, setMode] = useState<'command' | 'tcp-filtered' | 'registry-value'>('command');
  const [port, setPort] = useState('4444');
  const [registryKey, setRegistryKey] = useState('HKLM\\SYSTEM\\CurrentControlSet\\Control\\Lsa');
  const [registryName, setRegistryName] = useState('RunAsPPL');
  const [registryValue, setRegistryValue] = useState('1');
  const [registryType, setRegistryType] = useState<'REG_DWORD' | 'REG_SZ'>('REG_DWORD');

  const currentTask = (): Partial<LabTask> => {
    const base = { title: taskTitle, targetOS, flagReward: flagReward.trim() || undefined };
    if (mode === 'command') {
      return {
        ...base, validationCommand: validationCmd,
        expectedOutputSubstring: expectedOutput.trim() || undefined,
        evidence: evidenceLabel.trim() || evidenceValue.trim()
          ? [{ label: evidenceLabel, expected: evidenceValue }]
          : undefined
      };
    }
    const verify: LabStateCriterion = mode === 'tcp-filtered'
      ? { kind: mode, port: Number(port) }
      : registryType === 'REG_DWORD'
        ? { kind: mode, key: registryKey, name: registryName, valueType: registryType, value: registryValue.trim() ? Number(registryValue) : NaN }
        : { kind: mode, key: registryKey, name: registryName, valueType: registryType, value: registryValue };
    return { ...base, verify };
  };

  const makePackage = (tasks: Partial<LabTask>[]) => JSON.stringify({
    version: 1,
    lab: { title: labTitle, description: labDescription, difficulty, tasks }
  }, null, 2);

  const [editingTasks, setEditingTasks] = useState<string[] | null>(null);
  const [taskError, setTaskError] = useState<{ index: number; message: string } | null>(null);
  const [projects, setProjects] = useState<LabProject[]>([]);
  const [projectId, setProjectId] = useState<string>();
  const [libraryMessage, setLibraryMessage] = useState('');
  const [libraryError, setLibraryError] = useState('');
  const [writingProject, setWritingProject] = useState(false);

  useEffect(() => {
    let active = true;
    readProjects().then(items => {
      if (active) setProjects(previous => [...items.filter(item => !previous.some(saved => saved.id === item.id)), ...previous]);
    }).catch(() => {
      if (active) setLibraryError('Não foi possível carregar a biblioteca local.');
    });
    return () => { active = false; };
  }, []);

  const loadEditor = (source: string, existingProjectId?: string) => {
    const { lab } = JSON.parse(source);
    setLabTitle(lab.title);
    setLabDescription(lab.description);
    setDifficulty(lab.difficulty);
    const taken = new Set(lab.tasks.map((task: LabTask) => task.id).filter(Boolean));
    setEditingTasks(lab.tasks.map((task: Partial<LabTask>, index: number) => {
      let id = task.id ?? `tarefa-${index + 1}`;
      while (!task.id && taken.has(id)) id += '-nova';
      taken.add(id);
      return JSON.stringify({ ...task, id }, null, 2);
    }));
    setProjectId(existingProjectId);
    setJsonExport(source);
    setPackageError('');
    setTaskError(null);
  };

  const handleImportForEditing = () => {
    try {
      readCustomLabPackage(jsonExport);
      loadEditor(jsonExport);
    } catch (error) {
      setPackageError((error as Error).message);
    }
  };

  const editedSource = () => {
    setTaskError(null);
    if (!editingTasks) return undefined;
    const tasks = [];
    for (const [index, source] of editingTasks.entries()) {
      try {
        const task = JSON.parse(source);
        if (!task || typeof task !== 'object' || Array.isArray(task)) throw new Error();
        tasks.push(task);
      } catch {
        setTaskError({ index, message: 'JSON da tarefa inválido.' });
        return undefined;
      }
    }
    return makePackage(tasks);
  };

  const formSource = () => {
    const draft = currentTask();
    const hasDraft = draft.title?.trim() || draft.validationCommand?.trim() || draft.verify ||
      draft.expectedOutputSubstring || draft.flagReward || draft.evidence;
    return makePackage(hasDraft ? [...additionalTasks, draft] : additionalTasks);
  };

  const storeInLibrary = async (publish: boolean) => {
    if (writingProject) return;
    setLibraryError('');
    setLibraryMessage('');
    const source = editingTasks ? editedSource() : formSource();
    if (!source) return;
    setWritingProject(true);
    try {
      const project = await writeProject(projectId, labTitle.trim() || 'Laboratório sem título', source, publish);
      setProjectId(project.id);
      setProjects(previous => [...previous.filter(item => item.id !== project.id), project]);
      setJsonExport(source);
      setLibraryMessage(publish ? `Versão ${project.revisions.at(-1)?.version} publicada no catálogo local.` : 'Rascunho salvo na biblioteca local.');
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : 'Não foi possível gravar na biblioteca local.');
    } finally {
      setWritingProject(false);
    }
  };

  const compileEdition = (preview: boolean) => {
    setPackageError('');
    const source = editedSource();
    if (!source) return;
    try {
      const lab = readCustomLabPackage(source);
      setJsonExport(source);
      if (preview) onLoadCustomLab?.(lab);
    } catch (error) {
      const message = (error as Error).message;
      const task = message.match(/tarefa (\d+)/i);
      if (task) setTaskError({ index: Number(task[1]) - 1, message });
      else setPackageError(message);
    }
  };

  const handleGenerateJSON = () => {
    const source = formSource();
    try {
      readCustomLabPackage(source);
      setPackageError('');
      setJsonExport(source);
    } catch (error) {
      setPackageError((error as Error).message);
    }
  };

  const handlePreview = () => {
    try {
      onLoadCustomLab?.(readCustomLabPackage(jsonExport));
      setPackageError('');
    } catch (error) {
      setPackageError((error as Error).message);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonExport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 text-xs">
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
        <h3 className="text-sm font-semibold text-slate-100">Biblioteca de laboratórios</h3>
        <div className="flex flex-wrap gap-4 text-purple-300">
          <button type="button" disabled={writingProject} onClick={() => void storeInLibrary(false)}>Salvar rascunho local</button>
          <button type="button" disabled={writingProject} onClick={() => void storeInLibrary(true)}>Publicar revisão local</button>
        </div>
        {libraryMessage && <p role="status" className="text-emerald-300">{libraryMessage}</p>}
        {libraryError && <p role="alert" className="text-amber-300">{libraryError}</p>}
        {projects.length > 0 && (
          <ul className="space-y-3">
            {projects.map(project => (
              <li key={project.id} className="space-y-2 border-t border-slate-800 pt-3">
                <p className="font-semibold text-slate-200">{project.title}{project.id === projectId && ' · Em edição'}</p>
                <button type="button" className="text-purple-300" disabled={writingProject} onClick={() => {
                  try {
                    loadEditor(project.draft, project.id);
                    setLibraryMessage('');
                    setLibraryError('');
                  } catch {
                    setLibraryError('Não foi possível abrir o rascunho salvo.');
                  }
                }}>Reabrir rascunho</button>
                {project.revisions.length > 0 && (
                  <ul className="flex flex-wrap gap-3 text-cyan-300">
                    {[...project.revisions].reverse().map(revision => (
                      <li key={revision.version}>
                        <button type="button" onClick={() => {
                          try { onLoadCustomLab?.(openPublishedRevision(project.id, revision)); } catch {
                            setLibraryError('Não foi possível abrir a revisão publicada.');
                          }
                        }}>Executar versão {revision.version}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
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
              Crie desafios práticos personalizados para suas aulas e treinamentos. Defina tarefas, comandos e evidências. Importe ou teste o pacote JSON em uma sessão isolada do WinLinx.
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
                  disabled={mode === 'registry-value'}
                  onChange={e => setTargetOS(e.target.value as LabTask['targetOS'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="linux">Linux (Bash)</option>
                  <option value="windows">Windows (PowerShell)</option>
                  <option value="both" disabled={mode !== 'command'}>Ambos (Comparativo)</option>
                </select>
              </div>
            </div>

            {editingTasks === null ? <>
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

              <label className="block text-slate-300">
                Tipo de avaliação
                <select className="block w-full rounded border border-slate-800 bg-slate-950 p-2" value={mode} onChange={event => {
                  const next = event.target.value as typeof mode;
                  setMode(next);
                  if (next === 'registry-value') setTargetOS('windows');
                  if (next === 'tcp-filtered' && targetOS === 'both') setTargetOS('linux');
                }}>
                  <option value="command">Comando e evidência</option>
                  <option value="tcp-filtered">Porta TCP filtrada</option>
                  <option value="registry-value">Valor do Registro Windows</option>
                </select>
              </label>
              {mode === 'tcp-filtered' && (
                <label className="block text-slate-300">Porta TCP
                  <input type="number" min="1" max="65535" className="block rounded border border-slate-800 bg-slate-950 p-2" value={port} onChange={event => setPort(event.target.value)} />
                </label>
              )}
              {mode === 'registry-value' && (
                <div className="grid gap-2 sm:grid-cols-2 text-slate-300">
                  <label>Chave do Registro
                    <input className="block w-full rounded border border-slate-800 bg-slate-950 p-2" value={registryKey} onChange={event => setRegistryKey(event.target.value)} />
                  </label>
                  <label>Nome do valor
                    <input className="block w-full rounded border border-slate-800 bg-slate-950 p-2" value={registryName} onChange={event => setRegistryName(event.target.value)} />
                  </label>
                  <label>Tipo do valor
                    <select className="block w-full rounded border border-slate-800 bg-slate-950 p-2" value={registryType} onChange={event => setRegistryType(event.target.value as typeof registryType)}>
                      <option>REG_DWORD</option><option>REG_SZ</option>
                    </select>
                  </label>
                  <label>Valor esperado
                    <input className="block w-full rounded border border-slate-800 bg-slate-950 p-2" value={registryValue} onChange={event => setRegistryValue(event.target.value)} />
                  </label>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {mode === 'command' && <div>
                  <label className="text-slate-400 font-medium block mb-1">Comando exato de validação</label>
                  <input
                    type="text"
                    value={validationCmd}
                    onChange={e => setValidationCmd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 font-mono text-cyan-300 focus:outline-none focus:border-purple-500"
                  />
                </div>}

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

            {mode === 'command' && <div className="grid gap-2 sm:grid-cols-2 text-xs">
              <label>Trecho esperado na saída (opcional)
                <input className="w-full bg-slate-950 border border-slate-800 rounded p-2" value={expectedOutput} onChange={event => setExpectedOutput(event.target.value)} />
              </label>
              <label>Campo de evidência (opcional)
                <input className="w-full bg-slate-950 border border-slate-800 rounded p-2" value={evidenceLabel} onChange={event => setEvidenceLabel(event.target.value)} />
              </label>
              <label>Resposta esperada
                <input className="w-full bg-slate-950 border border-slate-800 rounded p-2" value={evidenceValue} onChange={event => setEvidenceValue(event.target.value)} />
              </label>
            </div>}
            {additionalTasks.map((task, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span>{index + 1}. {task.title}</span>
                <button type="button" onClick={() => setAdditionalTasks(tasks => tasks.filter((_, i) => index !== i))}>Remover</button>
              </div>
            ))}
            <button type="button" className="text-xs text-purple-300" disabled={additionalTasks.length >= 19}
              onClick={() => {
                setAdditionalTasks(tasks => [...tasks, currentTask()]);
                setTaskTitle('');
                setValidationCmd('');
                setExpectedOutput('');
                setFlagReward('');
                setEvidenceLabel('');
                setEvidenceValue('');
                setMode('command');
              }}>Adicionar tarefa e editar a próxima</button>
            <button
              onClick={handleGenerateJSON}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-purple-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compilar e Exportar Pacote de Laboratório</span>
            </button>
            </> : (
              <section className="space-y-4">
                <h4 className="font-semibold text-slate-200">Editar tarefas importadas</h4>
                <p className="text-slate-400">Use os IDs das tarefas anteriores em <code>requires</code> para definir pré-requisitos.</p>
                {editingTasks.map((source, index) => (
                  <div key={index} className="space-y-2 rounded border border-slate-800 p-3">
                    <label className="block" htmlFor={`builder-task-${index}`}>Tarefa ${index + 1}</label>
                    <textarea id={`builder-task-${index}`} rows={8} value={source}
                      aria-invalid={taskError?.index === index}
                      aria-describedby={taskError?.index === index ? `builder-error-${index}` : undefined}
                      className="w-full bg-slate-950 p-2 font-mono text-slate-200"
                      onChange={event => {
                        const value = event.target.value;
                        setEditingTasks(previous => previous?.map((task, i) => i === index ? value : task) ?? null);
                        setTaskError(null);
                      }} />
                    {taskError?.index === index && <p id={`builder-error-${index}`} role="alert" className="text-amber-300">{taskError.message}</p>}
                    <div className="flex gap-4 text-purple-300">
                      {([-1, 1] as const).map(direction => (
                        <button key={direction} type="button" disabled={!editingTasks[index + direction]}
                          onClick={() => {
                            const reordered = [...editingTasks];
                            [reordered[index], reordered[index + direction]] = [reordered[index + direction], reordered[index]];
                            setEditingTasks(reordered);
                            setTaskError(null);
                          }}>
                          {direction < 0 ? 'Subir' : 'Descer'} tarefa {index + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap gap-4 text-purple-300">
                  <button type="button" onClick={() => compileEdition(false)}>Exportar revisão</button>
                  <button type="button" onClick={() => compileEdition(true)}>Testar revisão</button>
                  <button type="button" onClick={() => setEditingTasks(null)}>Voltar ao editor de novas tarefas</button>
                </div>
              </section>
            )}

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

          <label className="block text-xs text-slate-300" htmlFor="lab-package">Pacote JSON versão 1</label>
          <textarea id="lab-package" value={jsonExport} maxLength={65_536}
            onChange={event => setJsonExport(event.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs h-80"
            placeholder="Gere um pacote ou cole um JSON para importar." />
          <button type="button" onClick={handleImportForEditing} className="mr-4 text-sm text-purple-300">Importar para editar</button>
          <button type="button" onClick={handlePreview} className="text-sm text-purple-300">Importar e abrir prévia</button>
          {packageError && <p role="alert" className="text-xs text-amber-300">{packageError}</p>}
        </div>
      </div>
    </div>
  );
};
