import type { LabDefinition, LabTask } from '../types/simulator';

export function readCustomLabPackage(source: string): LabDefinition {
  if (source.length > 65_536) throw new Error('Pacote acima de 64 KiB.');
  let data;
  try { data = JSON.parse(source); } catch { throw new Error('JSON inválido.'); }
  const lab = data?.lab;
  const validText = (value: unknown, max: number): value is string =>
    typeof value === 'string' && value.trim().length > 0 && value.length <= max;

  if (data?.version !== 1 || !validText(lab?.title, 150) || !validText(lab?.description, 2000)
    || !['Iniciante', 'Intermediário', 'Avançado'].includes(lab.difficulty)
    || !Array.isArray(lab.tasks) || lab.tasks.length === 0 || lab.tasks.length > 20) {
    throw new Error('Use um pacote versão 1 com título, descrição, nível e 1 a 20 tarefas.');
  }

  const id = 'lab-custom-' + (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const tasks: LabTask[] = lab.tasks.map((task: Partial<LabTask> | null, index: number) => {
    if (!task || !validText(task.title, 150) || !validText(task.validationCommand, 300)
      || !['linux', 'windows', 'both'].includes(task.targetOS ?? '')
      || (task.expectedOutputSubstring !== undefined && !validText(task.expectedOutputSubstring, 300))
      || (task.flagReward !== undefined && !validText(task.flagReward, 150))) {
      throw new Error(`Tarefa ${index + 1} inválida. Confira o título, o comando, o sistema operacional e os critérios.`);
    }

    const evidence = task.evidence;
    if (evidence !== undefined && (!Array.isArray(evidence) || evidence.length === 0 || evidence.length > 8
      || evidence.some(field => !validText(field?.label, 100) || !validText(field?.expected, 256)))) {
      throw new Error(`Critérios de evidência inválidos na tarefa ${index + 1}.`);
    }
    if (evidence && new Set(evidence.map(field => field.label)).size !== evidence.length) {
      throw new Error(`Rótulos de evidência duplicados na tarefa ${index + 1}.`);
    }

    return {
      id: `${id}-${index + 1}`, title: task.title, targetOS: task.targetOS!,
      instructions: validText(task.instructions, 1000) ? task.instructions : task.title,
      objective: validText(task.objective, 500) ? task.objective : task.title,
      hint: validText(task.hint, 500) ? task.hint : task.validationCommand,
      validationCommand: task.validationCommand,
      expectedOutputSubstring: task.expectedOutputSubstring,
      flagReward: task.flagReward,
      evidence: evidence?.map(({ label, expected }) => ({ label, expected }))
    };
  });

  return {
    id, title: lab.title, description: lab.description, realWorldScenario: lab.description,
    difficulty: lab.difficulty, moduleSlug: 'custom-labs', category: 'Hardening',
    durationMinutes: 30, mitreTechniques: [], learningGoals: tasks.map(task => task.objective),
    tasks
  };
}
