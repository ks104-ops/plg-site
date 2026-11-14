/* Turns stored codes back into readable labels for the summary page and CSV. */
import { QUESTIONS, OPPORTUNITIES } from '../assets/quiz-schema.js';

export const LABELS = {};
for (const q of QUESTIONS) {
  if (q.options) LABELS[q.id] = Object.fromEntries(q.options);
  if (q.rows) for (const r of q.rows) LABELS[r.id] = Object.fromEntries(r.options);
}
LABELS.top = Object.fromEntries(Object.entries(OPPORTUNITIES).map(([k, v]) => [k, v.title]));

export const label = (field, code) => (LABELS[field] && LABELS[field][code]) || code;
export const parseList = (s) => { try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; } };
