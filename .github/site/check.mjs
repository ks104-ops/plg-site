#!/usr/bin/env node
// Checks every page of putnamleads.com before it goes live. No dependencies.
//   node .github/site/check.mjs
// Exits 1 if anything a visitor, Google or an AI tool would trip over is found.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://putnamleads.com';
const errors = [];
const warns = [];
const fail = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warns.push(`${f}: ${m}`);

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.') || n === 'node_modules') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}

const decode = (s) => s.replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pathFor = (file) => {
  const r = relative(ROOT, file).replace(/\\/g, '/');
  if (r === 'index.html') return '/';
  if (r.endsWith('/index.html')) return '/' + r.slice(0, -'index.html'.length);
  return '/' + r;
};

const BANNED = ['free 90', '90 days.', 'founding pilot', 'pilot spot', 'no contracts during', 'unlock', 'game-changer', 'leverage', 'elevate', 'supercharge', 'cutting-edge', 'seamless', 'synergy', 'next-level', 'revolutionize', "don't miss out", 'thrilled to', 'take it to the next level', 'empower', 'transform your business', '10x', 'secret sauce', 'happy holidays', 'double your leads', 'guaranteed results', '#1 on google'];
// "#1 on Google" is allowed only inside a sentence that says we won't promise it.
const ALLOWED_CONTEXT = [/nobody can promise #1 on google/i];

const files = walk(ROOT);
const pages = new Map(files.map((f) => [pathFor(f), f]));
const idsByPath = new Map();
for (const [p, f] of pages) {
  const html = readFileSync(f, 'utf8');
  idsByPath.set(p, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
}

const sitemap = existsSync(join(ROOT, 'sitemap.xml')) ? readFileSync(join(ROOT, 'sitemap.xml'), 'utf8') : '';
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
if (!sitemap) fail('sitemap.xml', 'missing');
const robots = existsSync(join(ROOT, 'robots.txt')) ? readFileSync(join(ROOT, 'robots.txt'), 'utf8') : '';
if (!/Sitemap: https:\/\/putnamleads\.com\/sitemap\.xml/.test(robots)) fail('robots.txt', 'missing or has no Sitemap line');
if (/Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt', 'blocks the whole site');
if (!existsSync(join(ROOT, 'llms.txt'))) fail('llms.txt', 'missing');

for (const [p, f] of pages) {
  const rel = relative(ROOT, f);
  const html = readFileSync(f, 'utf8');
  const lower = decode(html).toLowerCase();
  const noindex = /<meta name="robots" content="noindex/.test(html);

  // Head basics
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!title) fail(rel, 'no <title>');
  else if (decode(title).length > 65) warn(rel, `title is ${decode(title).length} characters (Google shows about 60)`);
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
  if (!desc) fail(rel, 'no meta description');
  else if (desc.length < 70 || desc.length > 165) warn(rel, `description is ${desc.length} characters (aim for 70 to 160)`);
  if (!/<html lang="en">/.test(html)) fail(rel, 'missing lang="en"');
  if (!/name="viewport"/.test(html)) fail(rel, 'missing viewport');
  if (!noindex) {
    const canon = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canon !== SITE + p) fail(rel, `canonical is ${canon}, expected ${SITE + p}`);
    if (!sitemapUrls.has(SITE + p)) fail(rel, 'indexable page is not in sitemap.xml');
    for (const og of ['og:title', 'og:description', 'og:image', 'og:url']) if (!html.includes(`property="${og}"`)) fail(rel, `missing ${og}`);
  }

  // One h1, no skipped heading levels
  const heads = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
  if (heads.filter((h) => h === 1).length !== 1) fail(rel, `has ${heads.filter((h) => h === 1).length} h1 tags, expected 1`);
  for (let i = 1; i < heads.length; i++) if (heads[i] > heads[i - 1] + 1) fail(rel, `heading jumps from h${heads[i - 1]} to h${heads[i]}`);

  // Unique ids
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  if (dup.length) fail(rel, `duplicate ids: ${[...new Set(dup)].join(', ')}`);

  // Images: alt, width, height
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\salt="/.test(tag)) fail(rel, `image without alt: ${tag.slice(0, 80)}`);
    if (!/\swidth="/.test(tag) || !/\sheight="/.test(tag)) fail(rel, `image without width/height: ${tag.slice(0, 80)}`);
  }

  // New-tab links say so and use rel=noopener
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>([\s\S]*?)<\/a>/g)) {
    if (!/rel="noopener/.test(m[0])) fail(rel, `new-tab link without rel=noopener: ${m[0].slice(0, 80)}`);
    if (!/opens in new tab/.test(m[1])) fail(rel, `new-tab link doesn't say so to screen readers: ${m[0].slice(0, 80)}`);
  }

  // Internal links and assets resolve
  for (const m of html.matchAll(/\s(?:href|src|srcset|poster|data-src)="([^"]+)"/g)) {
    for (const raw of m[1].split(',').map((s) => s.trim().split(/\s+/)[0])) {
      if (!raw || /^(https?:|mailto:|tel:|sms:|data:)/.test(raw)) continue;
      const [pathPart, hash] = raw.replace(/\?[^#]*/, '').split('#');
      let target = pathPart || p;
      if (!target.startsWith('/')) target = join(dirname(p.endsWith('/') ? p + 'x' : p), target).replace(/\\/g, '/');
      if (target.endsWith('/') || target === '') {
        if (!pages.has(target)) { fail(rel, `link to missing page ${raw}`); continue; }
        if (hash && !idsByPath.get(target).has(hash)) fail(rel, `link to missing anchor ${raw}`);
      } else if (target.endsWith('.html')) {
        if (!pages.has(target)) fail(rel, `link to missing page ${raw}`);
      } else if (!existsSync(join(ROOT, target))) fail(rel, `missing file ${raw}`);
    }
  }

  // Structured data parses, and FAQ answers match what's on the page
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) fail(rel, 'no structured data');
  for (const b of blocks) {
    let data;
    try { data = JSON.parse(b[1]); } catch (e) { fail(rel, `structured data doesn't parse: ${e.message}`); continue; }
    const graph = data['@graph'] || [data];
    const faq = graph.find((n) => n['@type'] === 'FAQPage');
    if (faq) {
      const visible = [...html.matchAll(/<summary>([\s\S]*?)<\/summary>\s*<p>([\s\S]*?)<\/p>/g)].map((m) => [decode(m[1]), decode(m[2])]);
      if (visible.length !== faq.mainEntity.length) fail(rel, `FAQ markup has ${faq.mainEntity.length} questions, page shows ${visible.length}`);
      faq.mainEntity.forEach((q, i) => {
        if (!visible[i] || visible[i][0] !== q.name || visible[i][1] !== q.acceptedAnswer.text) fail(rel, `FAQ markup question ${i + 1} doesn't match the page`);
      });
    }
    const biz = graph.find((n) => n['@id'] === `${SITE}/#business`);
    if (!biz) fail(rel, 'structured data has no business entry');
  }

  // CSP hash matches the inline script
  const csp = (html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/) || [])[1];
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    const h = createHash('sha256').update(m[1]).digest('base64');
    if (!csp || !csp.includes(`'sha256-${h}'`)) fail(rel, 'inline script is not allowed by the page security policy');
  }
  if (/\sstyle="/.test(html)) fail(rel, 'inline style attribute would be blocked by the page security policy');

  // Copy rules: no pilot leftovers, banned phrases, guarantees
  for (const w of BANNED) {
    if (lower.includes(w) && !ALLOWED_CONTEXT.some((r) => r.test(lower))) fail(rel, `banned or outdated phrase: "${w}"`);
  }
  if (/\$\d/.test(lower)) {
    for (const m of lower.matchAll(/\$(\d+)/g)) if (!['299', '175'].includes(m[1])) fail(rel, `unexpected price $${m[1]}`);
  }

  // Security: no outside code, no inline event handlers, no forms posting anywhere
  for (const m of html.matchAll(/<script\b[^>]*\ssrc="([^"]+)"/g)) if (!m[1].startsWith('/')) fail(rel, `loads a script from outside the site: ${m[1]}`);
  for (const m of html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)) if (!m[1].startsWith('/')) fail(rel, `loads a stylesheet from outside the site: ${m[1]}`);
  if (/<iframe\b/i.test(html)) fail(rel, 'has an iframe');
  if (/\son[a-z]+="/i.test(html)) fail(rel, 'has an inline event handler (onclick= and similar)');
  if (/<form\b/i.test(html)) fail(rel, 'has a form; forms need a reviewed backend with spam protection first');
  if (/http:\/\//.test(html.replace(/http:\/\/schema\.org/g, ''))) fail(rel, 'has an insecure http:// link');
  if (!csp || !/default-src 'self'/.test(csp) || !/object-src 'none'/.test(csp) || !/base-uri 'self'/.test(csp)) fail(rel, 'security policy is missing or too loose');

  // Secrets
  if (/(api[_-]?key|secret|password)\s*[:=]\s*["'][^"']{8,}/i.test(html)) fail(rel, 'looks like a secret');
}

// Phone number is the same everywhere
for (const [p, f] of pages) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/tel:([+\d]+)/g)) if (m[1] !== '+13862277496') fail(relative(ROOT, f), `different phone number ${m[1]}`);
}
// Every sitemap URL is a real page
for (const u of sitemapUrls) if (!pages.has(u.replace(SITE, ''))) fail('sitemap.xml', `lists ${u}, which doesn't exist`);

// security.txt is present, the same in both places, and not expired
for (const f of ['.well-known/security.txt', 'security.txt']) {
  const fp = join(ROOT, f);
  if (!existsSync(fp)) { fail(f, 'missing'); continue; }
  const t = readFileSync(fp, 'utf8');
  const exp = (t.match(/^Expires: (.+)$/m) || [])[1];
  if (!/^Contact: /m.test(t)) fail(f, 'no Contact line');
  if (!exp || new Date(exp) < new Date()) fail(f, 'Expires is missing or in the past');
  else if (new Date(exp) - new Date() < 30 * 864e5) warn(f, 'expires within 30 days; update the date in build.mjs');
}
if (!/^\s*- \.well-known/m.test(readFileSync(join(ROOT, '_config.yml'), 'utf8'))) fail('_config.yml', 'must include .well-known so security.txt is published');

// Secrets anywhere in the published files or the build scripts
const TOKEN = /\b(?:ghp_|github_pat_|sk-[A-Za-z0-9]|xox[bpa]-|AKIA)[A-Za-z0-9_-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/;
function walkAll(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === '.git' || n === 'node_modules') continue;
    const p2 = join(dir, n);
    if (statSync(p2).isDirectory()) walkAll(p2, out);
    else if (/\.(html|js|mjs|css|txt|xml|json|webmanifest|yml|md)$/.test(n)) out.push(p2);
  }
  return out;
}
for (const f of walkAll(ROOT)) if (TOKEN.test(readFileSync(f, 'utf8'))) fail(relative(ROOT, f), 'looks like it contains a secret or private key');

for (const w of warns) console.log('warn  ' + w);
for (const e of errors) console.log('FAIL  ' + e);
console.log(`\nChecked ${pages.size} pages: ${errors.length} problems, ${warns.length} warnings.`);
process.exit(errors.length ? 1 : 0);
