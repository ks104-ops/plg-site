/* Shared helpers for the Check-Up API (Cloudflare Pages Functions). */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS },
  });
}

/* Reject cross-site posts: browsers always send Origin on POST. */
export function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; } catch { return false; }
}

export async function readJson(request, maxBytes = 8192) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.startsWith('application/json')) return null;
  const text = await request.text();
  if (text.length > maxBytes) return null;
  try { return JSON.parse(text); } catch { return null; }
}

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256(text) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

/* Keyed hash of the client IP so raw IPs are never stored. */
async function clientKey(env, request) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = await crypto.subtle.importKey('raw', enc.encode('plg-rl:' + (env.ADMIN_PASSWORD || 'unset')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(ip))).slice(0, 32);
}

/* Fixed-window rate limit backed by D1. Returns true if the request is allowed. */
export async function rateLimit(env, request, bucket, limit, windowSec) {
  const key = await clientKey(env, request);
  const now = Math.floor(Date.now() / 1000);
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM hits WHERE bucket = ?1 AND key = ?2 AND ts > ?3')
    .bind(bucket, key, now - windowSec).first();
  if (row && row.n >= limit) return false;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO hits (bucket, key, ts) VALUES (?1, ?2, ?3)').bind(bucket, key, now),
    env.DB.prepare('DELETE FROM hits WHERE ts < ?1').bind(now - 86400),
  ]);
  return true;
}

export function randomToken(bytes = 24) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return hex(a);
}

/* HTTP Basic auth against the ADMIN_PASSWORD secret. Any username works. */
export async function checkAdmin(request, env) {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 12) {
    return new Response('Admin access is not set up yet. Set the ADMIN_PASSWORD secret (12+ characters).', { status: 503, headers: SECURITY_HEADERS });
  }
  const challenge = new Response('Password required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="PLG Check-Up", charset="UTF-8"', ...SECURITY_HEADERS },
  });
  const auth = request.headers.get('Authorization') || '';
  if (!auth.startsWith('Basic ')) return challenge;
  let pass = '';
  try {
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(auth.slice(6)), (c) => c.charCodeAt(0)));
    pass = decoded.slice(decoded.indexOf(':') + 1);
  } catch { return challenge; }
  // Constant-time compare of fixed-length digests.
  const [a, b] = await Promise.all([sha256(pass), sha256(env.ADMIN_PASSWORD)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  if (diff !== 0) {
    if (!(await rateLimit(env, request, 'admin-fail', 10, 3600))) {
      return new Response('Too many attempts. Try again later.', { status: 429, headers: SECURITY_HEADERS });
    }
    return challenge;
  }
  return null; // authorized
}

export const ADMIN_HEADERS = {
  ...SECURITY_HEADERS,
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

export const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* CSV cell, with protection against spreadsheet formula injection. */
export function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && !/^\+[\d\s().-]+$/.test(s)) s = "'" + s; // keep +1 phone numbers readable
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
