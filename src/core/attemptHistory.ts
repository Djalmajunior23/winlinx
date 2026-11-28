import type { AttemptReport } from './labSession';

export interface SavedAttempt {
  attemptId: string;
  title: string;
  finishedAt: string;
  report: AttemptReport;
}

const STORE = 'attempts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('winlinx-attempt-history', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'attemptId' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('O histórico está bloqueado por outra aba.'));
  });
}

export async function saveAttempt(entry: SavedAttempt) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
      const store = transaction.objectStore(STORE);
      const existing = store.getKey(entry.attemptId);
      existing.onsuccess = () => {
        if (existing.result === undefined) store.add(entry);
      };
    });
  } finally {
    database.close();
  }
}

export async function readAttemptHistory(): Promise<SavedAttempt[]> {
  const database = await openDatabase();
  try {
    const entries = await new Promise<SavedAttempt[]>((resolve, reject) => {
      const request = database.transaction(STORE).objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return entries.sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
  } finally {
    database.close();
  }
}
