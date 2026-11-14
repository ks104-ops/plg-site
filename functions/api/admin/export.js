/* GET /api/admin/export: password-protected CSV of every Check-Up response. */
import { checkAdmin, ADMIN_HEADERS, csvCell } from '../../../lib/server.js';
import { label, parseList } from '../../../lib/admin-data.js';

export async function onRequestGet({ request, env }) {
  const denied = await checkAdmin(request, env);
  if (denied) return denied;

  const { results: rows } = await env.DB.prepare('SELECT * FROM responses ORDER BY created_at DESC').all();
  const head = ['submitted_utc', 'business_type', 'service_area', 'goal', 'customer_sources', 'google_business_profile', 'knows_seo', 'knows_gbp',
    'missed_calls', 'asks_for_reviews', 'replies_to_reviews', 'frustration', 'monthly_budget', 'top_3_opportunities', 'name', 'business_name', 'phone_or_email', 'contact_submitted_utc'];
  const lines = [head.join(',')];
  for (const r of rows) {
    lines.push([
      r.created_at, label('business', r.business), label('area', r.area), label('goal', r.goal),
      parseList(r.sources).map((s) => label('sources', s)).join('; '), label('gbp', r.gbp), label('seo', r.seo), label('gbpKnow', r.gbp_know),
      label('missed', r.missed), label('ask', r.ask), label('reply', r.reply), r.frustration, label('budget', r.budget),
      parseList(r.top3).map((k) => label('top', k)).join('; '), r.name, r.business_name, r.contact, r.contact_at,
    ].map(csvCell).join(','));
  }
  const day = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + lines.join('\r\n') + '\r\n', {
    headers: {
      ...ADMIN_HEADERS,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="plg-checkup-${day}.csv"`,
    },
  });
}
