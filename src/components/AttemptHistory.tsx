import { useEffect, useState } from 'react';
import { readAttemptHistory, type SavedAttempt } from '../core/attemptHistory';
import { downloadAttemptReport } from '../core/labSession';

export function AttemptHistory() {
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SavedAttempt[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    readAttemptHistory().then(results => {
      if (active) setEntries(results);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  const matches = entries?.filter(entry =>
    `${entry.title} ${entry.attemptId}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  );
  return (
    <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs">
      <h3 className="font-semibold text-slate-100">Histórico de tentativas concluídas</h3>
      <label className="block text-slate-300">Buscar por laboratório ou tentativa
        <input type="search" value={query} onChange={event => setQuery(event.target.value)}
          className="block rounded border border-slate-700 bg-slate-950 p-2" />
      </label>
      {error ? <p role="alert">O histórico não pôde ser carregado neste navegador.</p>
        : entries === null ? <p role="status">Carregando histórico…</p>
        : !matches?.length ? <p>Nenhuma tentativa encontrada.</p>
        : <ul className="space-y-2">{matches.map(entry => (
          <li key={entry.attemptId} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2">
            <div>
              <p>{entry.title}</p>
              <p className="text-slate-400">{new Date(entry.finishedAt).toLocaleString('pt-BR')} · {entry.report.completedTasks.length} tarefas</p>
            </div>
            <button type="button" className="text-cyan-300" onClick={() => downloadAttemptReport(entry.report)}>Exportar dossiê arquivado</button>
            <details className="w-full text-slate-300">
              <summary className="cursor-pointer text-cyan-300">Consultar dossiê arquivado</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-slate-950 p-2">
                {JSON.stringify(entry.report, null, 2)}
              </pre>
            </details>
          </li>
        ))}</ul>}
    </section>
  );
}
