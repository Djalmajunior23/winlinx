import type { LabDefinition, LabStateCriterion, LabTask } from '../types/simulator';

const validText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max;

function readStateCriterion(value: unknown, targetOS: LabTask['targetOS'], index: number): LabStateCriterion {
  if (value && typeof value === 'object' && 'kind' in value) {
    if (value.kind === 'tcp-filtered' && targetOS !== 'both' && 'port' in value &&
      typeof value.port === 'number' && Number.isInteger(value.port) && value.port >= 1 && value.port <= 65535) {
      return { kind: value.kind, port: value.port };
    }
    if (value.kind === 'registry-value' && targetOS === 'windows' &&
      'key' in value && 'name' in value && 'valueType' in value && 'value' in value &&
      validText(value.key, 300) && /^HK(?:LM|CU)\\.+/i.test(value.key) && validText(value.name, 150)) {
      const { key, name, valueType } = value;
      if (valueType === 'REG_DWORD' && typeof value.value === 'number' && Number.isInteger(value.value)
        && value.value >= 0 && value.value <= 0xffffffff) {
        return { kind: value.kind, key, name, valueType, value: value.value };
      }
      if ((valueType === 'REG_SZ' || valueType === 'REG_EXPAND_SZ') && typeof value.value === 'string' && value.value.length <= 1000) {
        return { kind: value.kind, key, name, valueType, value: value.value };
      }
    }
    if ((value.kind === 'windows-service-path' && targetOS === 'windows') ||
        (value.kind === 'linux-sudo-policy' && targetOS === 'linux')) {
      return { kind: value.kind };
    }
  }
  throw new Error(`Critério de estado inválido na tarefa ${index + 1}. Confira o sistema e os parâmetros.`);
}

export function readCustomLabPackage(source: string): LabDefinition {
  if (source.length > 65_536) throw new Error('Pacote acima de 64 KiB.');
  let data;
  try { data = JSON.parse(source); } catch { throw new Error('JSON inválido.'); }
  const lab = data?.lab;

  if (data?.version !== 1 || !validText(lab?.title, 150) || !validText(lab?.description, 2000)
    || !['Iniciante', 'Intermediário', 'Avançado'].includes(lab.difficulty)
    || !Array.isArray(lab.tasks) || lab.tasks.length === 0 || lab.tasks.length > 20) {
    throw new Error('Use um pacote versão 1 com título, descrição, nível e 1 a 20 tarefas.');
  }

  const id = 'lab-custom-' + (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const tasks: LabTask[] = lab.tasks.map((task: Partial<LabTask> | null, index: number) => {
    if (!task || !validText(task.title, 150) || (task.verify === undefined && !validText(task.validationCommand, 300))
      || !['linux', 'windows', 'both'].includes(task.targetOS ?? '')
      || (task.expectedOutputSubstring !== undefined && !validText(task.expectedOutputSubstring, 300))
      || (task.flagReward !== undefined && !validText(task.flagReward, 150))) {
      throw new Error(`Tarefa ${index + 1} inválida. Confira o título, o comando, o sistema operacional e os critérios.`);
    }

    const verify = task.verify === undefined ? undefined : readStateCriterion(task.verify, task.targetOS!, index);
    if (verify && (task.evidence !== undefined || task.validationCommand !== undefined || task.expectedOutputSubstring !== undefined)) {
      throw new Error(`Escolha um critério de estado ou de observação para a tarefa ${index + 1}.`);
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
      hint: validText(task.hint, 500) ? task.hint : task.validationCommand ?? task.title,
      verify,
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
