import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { CATEGORY_KEYS, DEFAULT_QUESTION_TEMPLATES } from './config/categories.js';
import { upsertMoment, getPreviousMoment, loadMoments } from './dataStore.js';
import { diffMoments, deriveGoalSuggestions } from './logic/diff.js';
import { generateFollowUps } from './logic/followups.js';
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const CategoryNotesSchema = z.record(z.string(), z.object({ notes: z.string().default('') }));
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
app.post('/api/moments', async (req, res) => {
    const parsed = SaveMomentSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    }
    const { id, age, title, categories } = parsed.data;
    // Ensure all categories exist with notes
    const fullCategories = Object.fromEntries(CATEGORY_KEYS.map((key) => [key, { notes: categories?.[key]?.notes ?? '' }]));
    const moment = await upsertMoment({ id, age, title, categories: fullCategories });
    const previous = await getPreviousMoment(moment.age);
    const followUps = generateFollowUps(previous, moment);
    let suggestions = [];
    if (previous) {
        const diff = diffMoments(previous, moment);
        suggestions = deriveGoalSuggestions(diff);
    }
    res.json({ moment, followUps, suggestions });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map