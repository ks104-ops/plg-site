# Security for putnamleads.com

## Report a problem

Email hello@putnamleads.com or call (386) 227-7496. The site also publishes this at
`/.well-known/security.txt`.

## What the site does to stay safe

- Plain HTML on GitHub Pages. No logins, no forms, no database, no customer data stored.
- No code from other companies: every script and style is served from putnamleads.com.
- A Content Security Policy on every page blocks outside scripts, frames, plugins and form posts.
- `site.js` refuses to run inside another site's frame (clickjacking).
- Every pull request runs `.github/site/check.mjs`, which fails on outside scripts, inline
  event handlers, forms, `http://` links, a loose security policy, secrets or private keys,
  broken links and an expired `security.txt`. The workflow uses no third-party actions.

## Settings only Kyle can turn on

GitHub Pages can't send security headers, and meta tags can't set some of them. If
putnamleads.com is proxied through Cloudflare (orange cloud), add them there.

### Cloudflare: Rules > Transform Rules > Modify Response Header (free plan)

Rule name: `PLG security headers`. When: Hostname equals `putnamleads.com`. Set static:

| Header | Value |
| --- | --- |
| `X-Frame-Options` | `DENY` |
| `Content-Security-Policy` | `frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |

### Cloudflare: SSL/TLS

- Edge Certificates: **Always Use HTTPS** on, **Minimum TLS Version** 1.2.
- Edge Certificates: **HSTS** on, max-age 12 months. Leave "preload" off for now.
- Speed > Optimization: keep **Rocket Loader off** (it rewrites scripts and would trip the page's security policy).

### Cloudflare: domain and DNS

- **DNSSEC** on for putnamleads.com and putnamleadgroup.com.
- **Registrar lock** and auto-renew on for both domains.
- Email anti-spoofing for putnamleads.com: SPF, DKIM (from Google Workspace) and a DMARC record
  starting at `p=none`, then `p=quarantine` once reports look clean.
- AI Crawl Control / Bots: make sure search and AI answer crawlers are **allowed**, or the
  site can't show up in ChatGPT, Perplexity or Google AI Overviews.

### GitHub

- Two-factor sign-in on the ks104-ops account.
- Branch protection on `main`: require a pull request and the **Site check** to pass.
- Pages: **Enforce HTTPS** on.

## If analytics are added later

Turning on Cloudflare Web Analytics adds a script from `static.cloudflareinsights.com`.
Allow it in `CSP` inside `.github/site/build.mjs` and update the privacy page in the same change.
