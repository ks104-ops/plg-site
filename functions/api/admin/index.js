/* GET /api/admin: password-protected summary of Check-Up responses. */
import { checkAdmin, ADMIN_HEADERS, escapeHtml as e } from '../../../lib/server.js';
import { LABELS, label, parseList } from '../../../lib/admin-data.js';

const SECTIONS = [
  ['goal', '#1 goal right now'],
  ['business', 'Type of business'],
  ['area', 'Service area'],
  ['sources', 'Where customers find them'],
  ['gbp', 'Google Business Profile'],
  ['seo', 'Knows SEO'],
  ['gbpKnow', 'Knows Google Business Profile'],
  ['missed', 'Missed calls'],
  ['ask', 'Asks for reviews'],
  ['reply', 'Replies to reviews'],
  ['budget', 'Monthly marketing budget'],
  ['top', 'Top-3 opportunities shown'],
];
const COL = { gbpKnow: 'gbp_know' };

export async function onRequestGet({ request, env }) {
  const denied = await checkAdmin(request, env);
  if (denied) return denied;

  const { results: rows } = await env.DB.prepare('SELECT * FROM responses ORDER BY created_at DESC LIMIT 5000').all();
  const total = rows.length;
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const last30 = rows.filter((r) => r.created_at >= since).length;
  const leads = rows.filter((r) => r.contact);

  const count = (field) => {
    const m = new Map();
    for (const r of rows) {
      const vals = field === 'sources' ? parseList(r.sources) : field === 'top' ? parseList(r.top3) : [r[COL[field] || field]];
      for (const v of vals) m.set(v, (m.get(v) || 0) + 1);
    }
    const order = Object.keys(LABELS[field] || {});
    return [...m.entries()].sort((a, b) => b[1] - a[1] || order.indexOf(a[0]) - order.indexOf(b[0]));
  };

  const bars = (field) => count(field).map(([k, n]) => {
    const pct = total ? Math.round((n / total) * 100) : 0;
    return `<tr><th scope="row">${e(label(field === 'top' ? 'top' : field, k))}</th><td><div class="bar"><span style="width:${pct}%"></span></div></td><td class="n">${n} <small>(${pct}%)</small></td></tr>`;
  }).join('') || '<tr><td colspan="3" class="muted">No answers yet.</td></tr>';

  const fmt = (iso) => (iso ? e(iso.slice(0, 16).replace('T', ' ')) + ' UTC' : '');
  const leadRows = leads.slice(0, 200).map((r) => `<tr><td>${fmt(r.contact_at)}</td><td>${e(r.name)}</td><td>${e(r.business_name)}</td><td>${e(r.contact)}</td><td>${e(label('business', r.business))}</td><td>${e(label('goal', r.goal))}</td><td>${e(r.frustration)}</td></tr>`).join('');
  const notes = rows.filter((r) => r.frustration).slice(0, 50).map((r) => `<li><q>${e(r.frustration)}</q> <small>${e(label('business', r.business))}, ${fmt(r.created_at)}</small></li>`).join('');

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Check-Up responses</title>
<style>
body{margin:0;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#0b1526;background:#f5f7fa}
main{max-width:1000px;margin:0 auto;padding:24px 16px 64px}h1{color:#013365;margin:0 0 4px}h2{color:#013365;margin:36px 0 10px;font-size:19px}
.kpis{display:flex;flex-wrap:wrap;gap:12px;margin:18px 0}.kpi{background:#fff;border-radius:14px;padding:14px 18px;min-width:150px}.kpi b{display:block;font-size:28px;color:#013365}
.btn{display:inline-block;background:#013365;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}.card{background:#fff;border-radius:14px;padding:6px 16px 12px;overflow-x:auto}
table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid #e3e8ef;vertical-align:top}th[scope=row]{font-weight:500;width:45%}
.bar{background:#e3e8ef;border-radius:4px;height:10px;min-width:60px}.bar span{display:block;height:100%;background:#00777c;border-radius:4px}.n{white-space:nowrap}
.muted,small{color:#5b6675}ul{padding-left:18px}li{margin:6px 0}
</style></head><body><main>
<h1>Marketing Check-Up responses</h1>
<p class="muted">Private. Only people with the admin password can see this page.</p>
<div class="kpis"><div class="kpi"><b>${total}</b>total responses</div><div class="kpi"><b>${last30}</b>in the last 30 days</div><div class="kpi"><b>${leads.length}</b>asked for a follow-up</div></div>
<p><a class="btn" href="/api/admin/export">Download all responses (CSV)</a></p>
<h2>People who asked you to look at their business</h2>
<div class="card"><table><thead><tr><th>When</th><th>Name</th><th>Business</th><th>Phone / email</th><th>Type</th><th>Goal</th><th>Frustration</th></tr></thead><tbody>${leadRows || '<tr><td colspan="7" class="muted">None yet.</td></tr>'}</tbody></table></div>
<h2>What owners told us</h2>
<div class="grid">${SECTIONS.map(([f, t]) => `<section class="card"><h3>${e(t)}</h3><table><tbody>${bars(f)}</tbody></table></section>`).join('')}</div>
<h2>Biggest frustrations, in their words</h2>
<div class="card">${notes ? `<ul>${notes}</ul>` : '<p class="muted">None yet.</p>'}</div>
</main></body></html>`;

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', ...ADMIN_HEADERS } });
}
