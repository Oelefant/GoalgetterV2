import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import path from 'node:path';
import fsExtra from 'fs-extra';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { CATEGORY_KEYS, DEFAULT_QUESTION_TEMPLATES } from './config/categories.js';
import type { SaveMomentRequestBody, SaveMomentResponse, CategoryKey, Moment, ImageAsset } from './types.js';
import { upsertMoment, getPreviousMoment, loadMoments, getMomentById } from './dataStore.js';
import { diffMoments, deriveGoalSuggestions } from './logic/diff.js';
import { generateFollowUps } from './logic/followups.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Static uploads dir
const __dirnameResolved = path.dirname(new URL(import.meta.url).pathname);
const UPLOADS_DIR = path.resolve(__dirnameResolved, '../uploads');
await fsExtra.ensureDir(UPLOADS_DIR);
app.use('/uploads', express.static(UPLOADS_DIR));

// Multer storage per moment/category
const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const { momentId, categoryKey } = req.params as { momentId: string; categoryKey: CategoryKey };
      const dest = path.join(UPLOADS_DIR, momentId, categoryKey);
      await fsExtra.ensureDir(dest);
      cb(null, dest);
    } catch (err) {
      cb(err as any, UPLOADS_DIR);
    }
  },
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]+/g, '_')}`;
    cb(null, safe);
  },
});
const upload = multer({ storage });

const CategoryNotesSchema = z.record(
  z.string(),
  z.object({ notes: z.string().default('') })
);

const SaveMomentSchema = z.object({
  id: z.string().optional(),
  age: z.number().int().min(0).max(120),
  title: z.string().optional(),
  categories: CategoryNotesSchema.default({}),
});

app.get('/api/categories', (_req, res) => {
  res.json({ categories: CATEGORY_KEYS, templates: DEFAULT_QUESTION_TEMPLATES });
});

app.get('/api/moments', async (_req, res) => {
  const moments = await loadMoments();
  res.json({ moments });
});

app.get('/api/moments/:id', async (req, res) => {
  const moment = await getMomentById(req.params.id);
  if (!moment) return res.status(404).json({ error: 'Not found' });
  res.json({ moment });
});

app.post('/api/moments', async (req, res) => {
  const parsed = SaveMomentSchema.safeParse(req.body as SaveMomentRequestBody);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { id, age, title, categories } = parsed.data;

  // Ensure all categories exist with notes and preserve existing images on update
  let existing: Moment | null = null;
  if (id) existing = await getMomentById(id);

  const fullCategories = Object.fromEntries(
    CATEGORY_KEYS.map((key) => [
      key,
      {
        notes: (categories as any)?.[key]?.notes ?? (existing?.categories[key]?.notes ?? ''),
        images: existing?.categories[key]?.images ?? [],
      },
    ])
  ) as Moment['categories'];

  const moment = await upsertMoment({ id, age, title, categories: fullCategories } as Moment);
  const previous = await getPreviousMoment(moment.age);

  const followUps = generateFollowUps(previous, moment);
  let suggestions: SaveMomentResponse['suggestions'] = [];

  if (previous) {
    const diff = diffMoments(previous, moment);
    suggestions = deriveGoalSuggestions(diff);
  }

  res.json({ moment, followUps, suggestions } satisfies SaveMomentResponse);
});

// Upload image to a category of a moment
app.post('/api/moments/:momentId/categories/:categoryKey/images', upload.single('image'), async (req, res) => {
  try {
    const { momentId, categoryKey } = req.params as { momentId: string; categoryKey: CategoryKey };
    const caption = (req.body?.caption as string | undefined) ?? undefined;
    const moment = await getMomentById(momentId);
    if (!moment) return res.status(404).json({ error: 'Moment not found' });
    if (!CATEGORY_KEYS.includes(categoryKey)) return res.status(400).json({ error: 'Invalid categoryKey' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const relUrl = `/uploads/${momentId}/${categoryKey}/${req.file.filename}`;
    const imageAsset: ImageAsset = {
      id: uuid(),
      url: relUrl,
      filename: req.file.filename,
      caption,
      createdAt: new Date().toISOString(),
    };

    const cat = moment.categories[categoryKey] ?? { notes: '', images: [] };
    cat.images = [...(cat.images ?? []), imageAsset];
    moment.categories[categoryKey] = cat;
    // Persist
    await upsertMoment(moment);

    res.json({ image: imageAsset, momentId, categoryKey });
  } catch (err: any) {
    res.status(500).json({ error: 'Upload failed', details: err?.message });
  }
});

// Delete an image
app.delete('/api/moments/:momentId/categories/:categoryKey/images/:imageId', async (req, res) => {
  try {
    const { momentId, categoryKey, imageId } = req.params as { momentId: string; categoryKey: CategoryKey; imageId: string };
    const moment = await getMomentById(momentId);
    if (!moment) return res.status(404).json({ error: 'Moment not found' });
    if (!CATEGORY_KEYS.includes(categoryKey)) return res.status(400).json({ error: 'Invalid categoryKey' });
    const before = moment.categories[categoryKey]?.images ?? [];
    const remaining = before.filter((img) => img.id !== imageId);
    if (remaining.length === before.length) return res.status(404).json({ error: 'Image not found' });

    // Try remove file from disk if it exists under uploads
    const removed = before.find((i) => i.id === imageId);
    if (removed) {
      const abs = path.join(UPLOADS_DIR, momentId, categoryKey, removed.filename);
      await fsExtra.remove(abs).catch(() => undefined);
    }

    moment.categories[categoryKey] = {
      ...(moment.categories[categoryKey] ?? { notes: '' }),
      images: remaining,
    };
    await upsertMoment(moment);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Delete failed', details: err?.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});