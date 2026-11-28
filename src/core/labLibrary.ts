import { readCustomLabPackage } from './customLabPackage';
import type { LabDefinition } from '../types/simulator';

export interface PublishedLabRevision {
  version: number;
  source: string;
  publishedAt: string;
}

export interface LabProject {
  id: string;
  title: string;
  draft: string;
  revisions: PublishedLabRevision[];
}

const PROJECTS = 'projects';

function openLibrary(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('winlinx-lab-library', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(PROJECTS, { keyPath: 'id' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function readProjects(): Promise<LabProject[]> {
  const database = await openLibrary();
  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(PROJECTS).objectStore(PROJECTS).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

export async function writeProject(
  projectId: string | undefined, title: string, source: string, publish: boolean
): Promise<LabProject> {
  if (publish) readCustomLabPackage(source);
  if (source.length > 65_536) throw new Error('Pacote acima de 64 KiB.');
  const id = projectId ?? (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
  const database = await openLibrary();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(PROJECTS, 'readwrite');
      const store = transaction.objectStore(PROJECTS);
      const request = store.get(id);
      let updated: LabProject;
      request.onsuccess = () => {
        const existing: LabProject | undefined = request.result;
        const revisions = existing?.revisions ?? [];
        updated = {
          id, title, draft: source,
          revisions: publish
            ? [...revisions, { version: (revisions.at(-1)?.version ?? 0) + 1, source, publishedAt: new Date().toISOString() }]
            : revisions
        };
        store.put(updated);
      };
      transaction.oncomplete = () => resolve(updated);
      transaction.onabort = () => reject(transaction.error ?? new Error('A gravação foi interrompida.'));
    });
  } finally {
    database.close();
  }
}

export function openPublishedRevision(projectId: string, revision: PublishedLabRevision): LabDefinition {
  const lab = readCustomLabPackage(revision.source, `lab-custom-${projectId}-v${revision.version}`);
  return {
    ...lab,
    publication: { projectId, version: revision.version, publishedAt: revision.publishedAt }
  };
}
