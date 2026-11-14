/* POST /api/quiz/contact: optional "Want me to look at your business?" step.
   Attaches contact info to a response the same visitor just created (needs its one-time token). */
import { json, sameOrigin, readJson, rateLimit, sha256 } from '../../../lib/server.js';
import { validateContact } from '../../../assets/quiz-schema.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Bad origin' }, 403);
  const body = await readJson(request, 4096);
  if (!body) return json({ ok: false, error: 'Bad request' }, 400);
  if (typeof body.website === 'string' && body.website.trim() !== '') return json({ ok: true });

  if (!(await rateLimit(env, request, 'contact', 5, 3600))) {
    return json({ ok: false, error: 'Too many submissions. Please try again later.' }, 429);
  }
  if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/.test(body.id) || typeof body.token !== 'string' || !/^[0-9a-f]{48}$/.test(body.token)) {
    return json({ ok: false, error: 'Bad request' }, 400);
  }
  const v = validateContact(body);
  if (!v.ok) return json({ ok: false, error: v.error }, 400);

  const r = await env.DB.prepare(
    `UPDATE responses SET name = ?1, business_name = ?2, contact = ?3, contact_at = ?4
     WHERE id = ?5 AND token_hash = ?6 AND contact IS NULL`
  ).bind(v.contact.name, v.contact.business, v.contact.contact, new Date().toISOString(), body.id, await sha256(body.token)).run();

  if (!r.meta || r.meta.changes !== 1) return json({ ok: false, error: 'Not found' }, 404);
  return json({ ok: true });
}
