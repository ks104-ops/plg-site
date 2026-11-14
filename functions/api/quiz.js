/* POST /api/quiz: store one set of Check-Up answers. Contact info is never required here. */
import { json, sameOrigin, readJson, rateLimit, randomToken, sha256 } from '../../lib/server.js';
import { validateAnswers, topOpportunities } from '../../assets/quiz-schema.js';

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false, error: 'Bad origin' }, 403);
  const body = await readJson(request);
  if (!body) return json({ ok: false, error: 'Bad request' }, 400);

  // Spam traps: a hidden "website" field people never see, and a too-fast finish.
  // Bots get a normal-looking reply so they don't learn anything; nothing is stored.
  if ((typeof body.website === 'string' && body.website.trim() !== '') || !(Number(body.ms) >= 4000)) {
    return json({ ok: true });
  }

  if (!(await rateLimit(env, request, 'quiz', 8, 3600))) {
    return json({ ok: false, error: 'Too many submissions. Please try again later.' }, 429);
  }

  const v = validateAnswers(body.answers);
  if (!v.ok) return json({ ok: false, error: v.error }, 400);
  const a = v.answers;
  const top3 = topOpportunities(a);
  const id = crypto.randomUUID();
  const token = randomToken();

  await env.DB.prepare(
    `INSERT INTO responses (id, created_at, business, area, goal, sources, gbp, seo, gbp_know, missed, ask, reply, frustration, budget, top3, token_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`
  ).bind(
    id, new Date().toISOString(), a.business, a.area, a.goal, JSON.stringify(a.sources), a.gbp, a.seo, a.gbpKnow,
    a.missed, a.ask, a.reply, a.frustration, a.budget, JSON.stringify(top3), await sha256(token)
  ).run();

  return json({ ok: true, id, token, top3 });
}
