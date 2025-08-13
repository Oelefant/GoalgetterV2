import fsExtra from 'fs-extra';
import { v4 as uuid } from 'uuid';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Moment } from './types.js';

const { ensureFile, readJSON, writeJSON } = fsExtra;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../data/moments.json');

export async function loadMoments(): Promise<Moment[]> {
  await ensureFile(DATA_FILE);
  try {
    const data = (await readJSON(DATA_FILE)) as Moment[] | undefined;
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export async function saveMoments(moments: Moment[]): Promise<void> {
  await ensureFile(DATA_FILE);
  await writeJSON(DATA_FILE, moments, { spaces: 2 });
}

export async function upsertMoment(partial: Omit<Moment, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }): Promise<Moment> {
  const moments = await loadMoments();
  const now = new Date().toISOString();
  let moment: Moment;

  if (partial.id) {
    const idx = moments.findIndex((m) => m.id === partial.id);
    if (idx >= 0) {
      const existing = moments[idx]!;
      moment = {
        ...existing,
        ...partial,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now,
      } as Moment;
      moments[idx] = moment;
    } else {
      moment = { ...(partial as any), id: partial.id, createdAt: now, updatedAt: now } as Moment;
      moments.push(moment);
    }
  } else {
    moment = { ...(partial as any), id: uuid(), createdAt: now, updatedAt: now } as Moment;
    moments.push(moment);
  }

  await saveMoments(moments.sort((a, b) => a.age - b.age));
  return moment;
}

export async function getPreviousMoment(age: number): Promise<Moment | null> {
  const moments = await loadMoments();
  const candidates = moments.filter((m) => m.age < age).sort((a, b) => b.age - a.age);
  return candidates[0] ?? null;
}

export async function getMomentById(id: string): Promise<Moment | null> {
  const moments = await loadMoments();
  return moments.find((m) => m.id === id) ?? null;
}