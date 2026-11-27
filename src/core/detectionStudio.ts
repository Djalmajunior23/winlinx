const encoder = new TextEncoder();
const artifacts = [
  { name: 'relatorio-normal.txt', bytes: encoder.encode('Exportação de relatório concluída') },
  { name: 'anexo-sintetico.bin', bytes: Uint8Array.of(0x4d, 0x5a, ...encoder.encode('WINLINX_DEMO_MARKER')) },
  { name: 'anotacao.txt', bytes: encoder.encode('WINLINX_DEMO_MARKER') }
];

const events = [
  { id: 'DEMO-001', Image: 'C:\\Windows\\System32\\wevtutil.exe', CommandLine: 'wevtutil cl Application' },
  { id: 'DEMO-002', Image: 'C:\\Windows\\System32\\wevtutil.exe', CommandLine: 'wevtutil el' },
  { id: 'DEMO-003', Image: 'C:\\Windows\\System32\\notepad.exe', CommandLine: 'notepad relatorio.txt' }
];

export const DEFAULT_YARA_RULE = `rule Anexo_Sintetico {
    strings:
        $header = { 4D 5A }
        $marker = "WINLINX_DEMO_MARKER"
    condition:
        all of them
}`;

export const DEFAULT_SIGMA_RULE = `title: Limpeza do log de aplicação
detection:
  selection:
    Image|endswith: '\\wevtutil.exe'
    CommandLine|contains: 'cl Application'
  condition: selection`;

type DetectionResult = { matches: string[]; error?: never } | { matches?: never; error: string };

function includesBytes(bytes: Uint8Array, pattern: Uint8Array) {
  return bytes.some((_, index) => pattern.every((byte, offset) => bytes[index + offset] === byte));
}

export function evaluateYara(source: string): DetectionResult {
  const rule = source.trim().match(/^rule\s+[A-Za-z_]\w*\s*\{\s*strings:\s*([\s\S]+?)\s*condition:\s*(all of them|any of them|\$[A-Za-z_]\w*)\s*\}$/);
  if (!rule || source.length > 8192) return { error: 'Use uma regra com strings: e condition: conforme o exemplo.' };

  const patterns = new Map<string, Uint8Array>();
  for (const line of rule[1].trim().split(/\r?\n/).filter(line => line.trim())) {
    const entry = line.trim().match(/^(\$[A-Za-z_]\w*)\s*=\s*(?:"([\x20-\x21\x23-\x5b\x5d-\x7e]+)"|\{\s*([\da-f]{2}(?:\s+[\da-f]{2})*)\s*\})$/i);
    if (!entry || patterns.has(entry[1])) return { error: `Padrão inválido ou duplicado: ${line.trim()}` };
    const bytes = entry[3]
      ? Uint8Array.from(entry[3].split(/\s+/), token => Number.parseInt(token, 16))
      : encoder.encode(entry[2]);
    patterns.set(entry[1], bytes);
  }

  const condition = rule[2];
  if (!patterns.size || (condition.startsWith('$') && !patterns.has(condition))) {
    return { error: 'Declare os padrões usados na condição.' };
  }
  const selectedPatterns = condition.startsWith('$') ? [patterns.get(condition)!] : [...patterns.values()];
  const matches = artifacts.filter(({ bytes }) => condition === 'all of them'
    ? selectedPatterns.every(pattern => includesBytes(bytes, pattern))
    : selectedPatterns.some(pattern => includesBytes(bytes, pattern))
  );
  return { matches: matches.map(artifact => artifact.name) };
}

export function evaluateSigma(source: string): DetectionResult {
  const rule = source.trim().match(/^title:[ \t]+[^\r\n]+\r?\ndetection:\r?\n {2}selection:\r?\n([\s\S]+?)\r?\n {2}condition:[ \t]+selection$/);
  if (!rule || source.length > 8192) return { error: 'Use title, detection.selection e condition: selection conforme o exemplo.' };

  const predicates: Array<(event: (typeof events)[number]) => boolean> = [];
  const keys = new Set<string>();
  for (const line of rule[1].split(/\r?\n/)) {
    const entry = line.match(/^ {4}(Image|CommandLine)(?:\|(contains|endswith))?:[ \t]+'([^'\r\n]+)'[ \t]*$/);
    if (!entry) return { error: `Seleção não suportada: ${line.trim()}` };
    const [, key, operator, literal] = entry;
    const field = key === 'Image' ? 'Image' : 'CommandLine';
    const signature = `${field}|${operator ?? 'equals'}`;
    if (keys.has(signature)) return { error: `Seleção duplicada: ${signature}` };
    keys.add(signature);
    const expected = literal.toLowerCase();
    predicates.push(event => {
      const actual = event[field].toLowerCase();
      if (operator === 'contains') return actual.includes(expected);
      if (operator === 'endswith') return actual.endsWith(expected);
      return actual === expected;
    });
  }

  return { matches: events.filter(event => predicates.every(predicate => predicate(event)))
    .map(event => `${event.id} · ${event.CommandLine}`) };
}
