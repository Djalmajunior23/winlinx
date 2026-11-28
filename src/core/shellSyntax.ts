type Operator = '|' | '>' | '>>' | '2>';
type ShellSyntax = {
  stages: string[];
  redirect?: { target: string; append: boolean };
  discardErrors: boolean;
  error?: string;
};

export function parseShellSyntax(source: string, linux: boolean): ShellSyntax {
  const tokens: Array<{ operator: Operator; start: number; end: number }> = [];
  let quote = '';
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char !== '>' && char !== '|') continue;

    const before = source[index - 2] ?? '';
    const stderr = char === '>' && source[index - 1] === '2' && (!before || /\s/.test(before));
    const append = char === '>' && source[index + 1] === '>';
    const operator = stderr && !append ? '2>' : append ? '>>' : char;
    const start = operator === '2>' ? index - 1 : index;
    if (append) index++;
    tokens.push({ operator, start, end: index + 1 });
  }

  const syntax: ShellSyntax = { stages: [], discardErrors: false };
  const invalid = () => ({ ...syntax, error: 'Sintaxe de pipe ou redirecionamento inválida no simulador.' });
  if (quote) return { ...syntax, error: 'Aspas não fechadas.' };

  let start = 0;
  for (const [index, token] of tokens.entries()) {
    const segment = source.slice(start, token.start).trim();
    if (token.operator === '|') {
      if (!linux || syntax.redirect || !segment) return invalid();
      syntax.stages.push(segment);
      start = token.end;
      continue;
    }
    const next = tokens[index + 1];
    const target = source.slice(token.end, next?.start).trim();
    if (token.operator === '2>') {
      if (!linux || next || (target !== '/dev/null' && target !== '"/dev/null"' && target !== "'/dev/null'")) return invalid();
      syntax.discardErrors = true;
    } else {
      if (syntax.redirect || (next && next.operator !== '2>')) return invalid();
      const path = target.match(/^(?:("[^"]+")|('[^']+')|([^\s"']+))$/);
      if (!path) return invalid();
      syntax.redirect = { target: path[3] ?? target.slice(1, -1), append: token.operator === '>>' };
    }
    if (segment) syntax.stages.push(segment);
    else if (!syntax.redirect || token.operator !== '2>' || syntax.stages.length === 0) return invalid();
    start = next?.start ?? source.length;
  }

  const tail = source.slice(start).trim();
  if (tail) syntax.stages.push(tail);
  return syntax.stages.length && (tail || syntax.redirect || syntax.discardErrors) ? syntax : invalid();
}
