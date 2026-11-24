#!/usr/bin/env node
// Builds every page of putnamleads.com from one place, so the header, footer,
// contact details and business data stay the same on every page.
//
//   node .github/site/build.mjs        (writes the HTML files, sitemap.xml, llms.txt)
//
// Edit the text here, run the build, and commit both this file and the output.
// The site-check workflow fails if the committed HTML doesn't match this file.
// No dependencies. GitHub Pages serves the output as plain files.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = 'https://putnamleads.com';
const UPDATED = '2026-11-24';

// ---- Business facts (one source of truth) ---------------------------------
const B = {
  name: 'Putnam Lead Group',
  legal: 'Putnam Lead Group LLC',
  phone: '+13862277496',
  phoneTxt: '(386) 227-7496',
  email: 'hello@putnamleads.com',
  book: 'https://calendar.app.google/a9EtzHDwfKSSUBdz9',
  founder: 'Kyle Simmons',
  cleanup: 299,
  monthly: 175,
  social: {
    Facebook: 'https://www.facebook.com/profile.php?id=61596163680898',
    Instagram: 'https://www.instagram.com/putnamleads/',
    'X (Twitter)': 'https://x.com/PutnamLeads',
    LinkedIn: 'https://www.linkedin.com/company/144083341/',
  },
};
const SMS_BODY = "Hi Kyle, can you check how my business shows up? It's: ";
const SMS = `sms:${B.phone}?&body=${encodeURIComponent(SMS_BODY)}`;
const TOWNS = ['Palatka', 'East Palatka', 'Crescent City', 'Interlachen', 'Welaka', 'Pomona Park', 'San Mateo', 'Satsuma', 'Hollister', 'Florahome', 'Putnam Hall', 'Georgetown', 'Bostwick', 'Lake Como', 'Melrose'];
const TRADES = ['lawn care and landscaping', 'HVAC', 'plumbing', 'roofing', 'electrical', 'pressure washing', 'pest control', 'tree service', 'fencing', 'metal fabrication'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (s) => esc(s);
const strip = (html) => html.replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”').replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
const newTab = '<span class="sr"> (opens in new tab)</span>';
const bookBtn = (label = 'Book a free 15-min call', cls = 'btn') => `<a class="${cls}" href="${B.book}" target="_blank" rel="noopener">${label}${newTab}</a>`;
const textLink = (label = 'or text me your business name', cls = 'link-arrow') => `<a class="${cls}" href="${attr(SMS)}">${label}</a>`;

// ---- Structured data -------------------------------------------------------
const ID = { biz: `${SITE}/#business`, site: `${SITE}/#website`, kyle: `${SITE}/#kyle`, cleanup: `${SITE}/pricing/#cleanup`, monthly: `${SITE}/pricing/#monthly` };
const offers = [
  { '@type': 'Offer', '@id': ID.cleanup, name: 'One-time cleanup', description: 'Google Business Profile, Apple Maps, Bing and directory cleanup, plus website wording fixes, for one location.', price: String(B.cleanup), priceCurrency: 'USD', url: `${SITE}/pricing/`, seller: { '@id': ID.biz }, areaServed: { '@type': 'AdministrativeArea', name: 'Putnam County, Florida' } },
  { '@type': 'Offer', '@id': ID.monthly, name: 'Keep It Fresh monthly plan', description: 'A Google post every week, your job photos added, every review answered, holiday hours handled and a plain monthly report. Month to month, stop with 30 days written notice.', price: String(B.monthly), priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: String(B.monthly), priceCurrency: 'USD', unitCode: 'MON', referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'MON' } }, url: `${SITE}/pricing/`, seller: { '@id': ID.biz }, areaServed: { '@type': 'AdministrativeArea', name: 'Putnam County, Florida' } },
];
const areaServed = [
  { '@type': 'AdministrativeArea', name: 'Putnam County, Florida', sameAs: 'https://en.wikipedia.org/wiki/Putnam_County,_Florida' },
  ...TOWNS.map((t) => ({ '@type': 'Place', name: `${t}, Florida` })),
];
const business = {
  '@type': 'ProfessionalService',
  '@id': ID.biz,
  name: B.name,
  legalName: B.legal,
  alternateName: 'PLG',
  slogan: 'Get found. Get trusted. Get the job.',
  description: 'Veteran-owned local marketing for service businesses in Palatka and Putnam County, Florida: Google Business Profile setup and cleanup, Apple Maps and Bing listings, review replies and review requests, social posts from job photos, and visibility in AI search tools like ChatGPT, Gemini, Perplexity and Google AI Overviews.',
  url: `${SITE}/`,
  logo: { '@type': 'ImageObject', url: `${SITE}/assets/brand/icon-512.png`, width: 512, height: 512 },
  image: `${SITE}/assets/brand/PLG-open-graph-1200x630.jpg`,
  telephone: B.phone,
  email: B.email,
  priceRange: `$${B.monthly}-$${B.cleanup}`,
  currenciesAccepted: 'USD',
  address: { '@type': 'PostalAddress', addressRegion: 'FL', addressCountry: 'US' },
  areaServed,
  founder: { '@id': ID.kyle },
  knowsAbout: ['Google Business Profile', 'Local SEO', 'Apple Business Connect', 'Bing Places', 'Online reviews', 'Review replies', 'Social media content', 'AI search visibility', 'Answer engine optimization', 'Generative engine optimization'],
  contactPoint: { '@type': 'ContactPoint', telephone: B.phone, email: B.email, contactType: 'sales', areaServed: 'US-FL', availableLanguage: 'en' },
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Putnam Lead Group pricing', itemListElement: offers },
  sameAs: Object.values(B.social),
  potentialAction: { '@type': 'ReserveAction', name: 'Book a free 15-minute call', target: { '@type': 'EntryPoint', urlTemplate: B.book, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] } },
};
const kyle = { '@type': 'Person', '@id': ID.kyle, name: B.founder, jobTitle: 'Founder', description: 'Marine Corps veteran and founder of Putnam Lead Group, based in the Palatka area of Putnam County, Florida.', image: `${SITE}/assets/brand/kyle.jpg`, worksFor: { '@id': ID.biz }, url: `${SITE}/about/` };
const website = { '@type': 'WebSite', '@id': ID.site, url: `${SITE}/`, name: B.name, inLanguage: 'en-US', publisher: { '@id': ID.biz } };
const faqLd = (faqs) => ({ '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: strip(f.q), acceptedAnswer: { '@type': 'Answer', text: strip(f.a) } })) });
const service = (name, type, desc, url, offerId) => ({ '@type': 'Service', name, serviceType: type, description: desc, url: `${SITE}${url}`, provider: { '@id': ID.biz }, areaServed: { '@type': 'AdministrativeArea', name: 'Putnam County, Florida' }, offers: offerId.map((id) => ({ '@id': id })) });

// ---- Shared pieces --------------------------------------------------------
const NAV = [
  ['/#services', 'Services'],
  ['/pricing/', 'Pricing'],
  ['/services/ai-search/', 'AI search'],
  ['/about/', 'About'],
  ['/#faq', 'FAQ'],
];
const ICON_PHONE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>';
const ICON_TEXT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.7A8 8 0 1 1 21 12z"/></svg>';
const ICON_CAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';

// Cache-busting: the CSS and JS links change whenever the files change.
import { readFileSync } from 'node:fs';
const ver = (f) => createHash('sha256').update(readFileSync(join(ROOT, f))).digest('hex').slice(0, 10);
const CSS_URL = `/assets/site.css?v=${ver('assets/site.css')}`;
const JS_URL = `/assets/site.js?v=${ver('assets/site.js')}`;

const INLINE_JS = "document.documentElement.classList.add('js')";
const INLINE_HASH = createHash('sha256').update(INLINE_JS).digest('base64');
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${INLINE_HASH}'`,
  "style-src 'self'",
  "img-src 'self' data:",
  "media-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ');

function head(p) {
  const url = `${SITE}${p.path}`;
  const og = p.ogImage || `${SITE}/assets/brand/PLG-open-graph-1200x630.jpg`;
  const graph = { '@context': 'https://schema.org', '@graph': p.schema };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="strict-origin-when-cross-origin">
<title>${esc(p.title)}</title>
<meta name="description" content="${attr(p.description)}">
<meta name="robots" content="${p.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">
<meta name="theme-color" content="#013365">
<meta name="color-scheme" content="light">
<meta name="author" content="${B.founder}">
<meta name="geo.region" content="US-FL">
<meta name="geo.placename" content="Putnam County, Florida">
<link rel="icon" href="/assets/brand/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/brand/icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/brand/icon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/brand/icon-180.png">
<link rel="manifest" href="/assets/brand/site.webmanifest">
${p.noindex ? '' : `<link rel="canonical" href="${url}">\n`}<link rel="alternate" type="text/plain" title="Plain-text summary for AI tools" href="/llms.txt">
<meta property="og:type" content="${p.ogType || 'website'}">
<meta property="og:site_name" content="${B.name}">
<meta property="og:locale" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${attr(p.ogTitle || p.title)}">
<meta property="og:description" content="${attr(p.description)}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Putnam Lead Group logo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@PutnamLeads">
<meta name="twitter:title" content="${attr(p.ogTitle || p.title)}">
<meta name="twitter:description" content="${attr(p.description)}">
<meta name="twitter:image" content="${og}">
<meta name="twitter:image:alt" content="Putnam Lead Group logo">
${p.preload || ''}<link rel="stylesheet" href="${CSS_URL}">
<script type="application/ld+json">
${JSON.stringify(graph)}
</script>
<script>${INLINE_JS}</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
`;
}

function header(p) {
  const links = (cls) => NAV.map(([href, label]) => `<li><a href="${href}"${p.path === href ? ' aria-current="page"' : ''}>${label}</a></li>`).join('\n        ');
  return `
<header class="nav" id="top">
  <div class="nav-in">
    <a class="nav-logo" href="/" aria-label="Putnam Lead Group home">
      <picture>
        <source srcset="/assets/brand/plg-logo-300.webp 300w, /assets/brand/plg-logo-440.webp 440w" sizes="150px" type="image/webp">
        <img src="/assets/brand/plg-logo-440.png" width="440" height="127" alt="Putnam Lead Group">
      </picture>
    </a>
    <nav aria-label="Main">
      <ul class="nav-links">
        ${links()}
      </ul>
    </nav>
    ${bookBtn('Book a call', 'btn btn-sm')}
    <details class="menu">
      <summary aria-label="Menu"><svg class="i-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="i-close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></summary>
      <nav class="menu-panel" aria-label="Menu">
        <ul>
          ${links()}
          <li><a href="tel:${B.phone}">Call ${B.phoneTxt}</a></li>
        </ul>
      </nav>
    </details>
  </div>
</header>
`;
}

function footer(p) {
  const social = Object.entries(B.social).map(([n, u]) => `<li><a href="${u}" target="_blank" rel="noopener me">${n}${newTab}</a></li>`).join('\n      ');
  return `
<footer class="foot" id="contact" aria-labelledby="contact-h">
  <div class="wrap foot-cta">
    <h2 id="contact-h" class="reveal">${p.footHead || 'Let&rsquo;s get your<br><span class="teal">phone ringing.</span>'}</h2>
    <p class="sub light reveal">Book a free 15-minute call, or text me your business name. I&rsquo;ll look you up the way a customer would and tell you honestly what I see.</p>
    <div class="cta-row center reveal">
      ${bookBtn('Book a free 15-min call', 'btn btn-teal')}
      ${textLink('Text me your business name', 'link-arrow light')}
    </div>
    <ul class="contact-list reveal">
      <li><span>Call or text</span><a href="tel:${B.phone}">${B.phoneTxt}</a></li>
      <li><span>Email</span><a href="mailto:${B.email}">${B.email}</a></li>
    </ul>
  </div>
  <nav class="wrap foot-nav" aria-label="Site">
    <div>
      <h3>Services</h3>
      <ul>
        <li><a href="/services/google-business-profile/">Google Business Profile cleanup</a></li>
        <li><a href="/services/reviews/">Review replies and requests</a></li>
        <li><a href="/services/ai-search/">AI search visibility</a></li>
        <li><a href="/#see-it">Follow-up that runs itself</a></li>
      </ul>
    </div>
    <div>
      <h3>Company</h3>
      <ul>
        <li><a href="/pricing/">Pricing</a></li>
        <li><a href="/about/">About Kyle</a></li>
        <li><a href="/service-area/">Service area</a></li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
        <li><a href="/accessibility/">Accessibility</a></li>
      </ul>
    </div>
    <div>
      <h3>Free help</h3>
      <ul>
        <li><a href="/guides/google-profile-check/">60-second Google profile check</a></li>
        <li><a href="/guides/ai-search-test/">2-minute AI search test</a></li>
        <li><a href="/#faq">Questions and answers</a></li>
        <li><a href="${B.book}" target="_blank" rel="noopener">Book a free call${newTab}</a></li>
      </ul>
    </div>
  </nav>
  <div class="wrap foot-base">
    <ul class="social" aria-label="Putnam Lead Group on social media">
      ${social}
    </ul>
    <p>&copy; 2026 ${B.legal} &middot; Veteran-owned &middot; Serving Palatka and all of Putnam County, FL</p>
  </div>
</footer>

<nav class="callbar" aria-label="Quick contact">
  <a href="tel:${B.phone}">${ICON_PHONE}Call</a>
  <a href="${attr(SMS)}">${ICON_TEXT}Text</a>
  <a href="${B.book}" target="_blank" rel="noopener">${ICON_CAL}Book${newTab}</a>
</nav>

<script src="${JS_URL}" defer></script>
</body>
</html>
`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([href, label], i) => (i === items.length - 1 ? `<li><span aria-current="page">${label}</span></li>` : `<li><a href="${href}">${label}</a></li>`)).join('')}</ol></nav>`;
const crumbLd = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([href, label], i) => ({ '@type': 'ListItem', position: i + 1, name: strip(label), item: `${SITE}${href}` })) });
const webPage = (p, extra = {}) => ({ '@type': 'WebPage', '@id': `${SITE}${p.path}#webpage`, url: `${SITE}${p.path}`, name: p.title, description: p.description, isPartOf: { '@id': ID.site }, about: { '@id': ID.biz }, inLanguage: 'en-US', dateModified: UPDATED, ...extra });
const faqHtml = (faqs, cls = '') => `<div class="qa">\n${faqs.map((f) => `      <details class="reveal${cls}">\n        <summary>${f.q}</summary>\n        <p>${f.a}</p>\n      </details>`).join('\n')}\n    </div>`;
const pageHero = (items, eyebrow, h1, lede, ctas = true) => `
<section class="page-hero" aria-labelledby="page-h">
  <div class="wrap">
    ${crumbs(items)}
    <p class="eyebrow">${eyebrow}</p>
    <h1 id="page-h">${h1}</h1>
    <p class="lede">${lede}</p>
    ${ctas ? `<div class="cta-row">\n      ${bookBtn()}\n      ${textLink()}\n    </div>` : ''}
  </div>
</section>`;
const checks = (items) => `<ul class="checks">\n${items.map((i) => `        <li>${i}</li>`).join('\n')}\n      </ul>`;

// ---- Shared copy -------------------------------------------------------------
const CLEANUP_ITEMS = [
  'Your Google Business Profile set up or cleaned up: name, hours, services, service areas, categories and photos',
  'Apple Maps, Bing and Yelp listings created or corrected, and your Facebook page details matched',
  'Your name, phone and website made to match on the main directories',
  'A one-tap Google review link and a short, honest ask you can text every customer',
  'Help getting back a Google profile you lost access to',
  'If you have a website: wording that says what you do and where, and Google and Bing able to read it',
  'A plain-English list of everything we fixed',
];
const MONTHLY_ITEMS = [
  'A new post on your Google profile every week',
  'Your job photos added to your profile',
  'Every Google review answered, in your business&rsquo;s name',
  'Holiday hours set before every holiday',
  'A short, plain-English report each month: what we did and what changed',
];
const TERMS_LINE = 'Month to month. Stop anytime with 30 days&rsquo; written notice.';
const FOUNDING = `<strong>Founding 6:</strong> our first 6 monthly clients keep $${B.monthly} a month for as long as they stay.`;

const PRICE_FAQ = [
  { q: 'How much does Putnam Lead Group cost?', a: `Two simple prices. The one-time cleanup is $${B.cleanup}. The optional monthly plan is $${B.monthly} a month. You&rsquo;ll know the price before any work starts.` },
  { q: 'Is there a contract?', a: 'No long contract. The monthly plan is month to month. To stop, give us 30 days&rsquo; written notice, by email or text.' },
  { q: 'What is the Founding 6?', a: `Our first 6 monthly clients keep the $${B.monthly} a month price for as long as they stay on the plan, even if the price goes up later.` },
  { q: 'What&rsquo;s included in the $299 cleanup?', a: 'We set up or clean up your Google Business Profile, create or fix your Apple Maps and Bing listings, make your name, phone and website match across the main directories, and tidy your website wording if you have one. You get a plain-English list of what we fixed.' },
  { q: 'What does the $175 a month plan do?', a: 'The Keep It Fresh plan keeps your profile active after the cleanup: a new Google post every week, your job photos added, every review answered, holiday hours set, and a short plain-English report each month.' },
  { q: 'What&rsquo;s not included?', a: 'Building a brand-new website, paid ads, paid tools or directory upgrades, and any promise of rankings or a number of leads. If you ever need one of those, we&rsquo;ll quote it first.' },
  { q: 'Do I keep my accounts?', a: 'Yes. Your Google profile, listings, website and social accounts stay in your name. We work as a manager you can remove at any time.' },
];

// ---- Pages ---------------------------------------------------------------------
const pages = [];

// HOME
{
  const faqs = [
    PRICE_FAQ[0],
    PRICE_FAQ[1],
    { q: 'Do I have to learn new software?', a: 'No. You keep using your phone the way you do now. We handle the setup and the upkeep.' },
    { q: 'Do I need a website?', a: 'Not to start. Most of what we do runs off your Google Business Profile and your phone. If you have a website, we make sure it says clearly what you do and where you work.' },
    { q: 'Can you promise I&rsquo;ll be at the top of Google?', a: 'No, and be careful with anyone who does. Google decides rankings. We focus on what you can control: a complete, accurate, active profile with real reviews and fast replies.' },
    { q: 'Are the reviews real?', a: 'Always. We only ask your actual customers, we never offer anything in exchange, and we never write, buy or fake reviews.' },
    { q: 'What is &ldquo;AI search&rdquo;?', a: 'It&rsquo;s when people ask tools like ChatGPT, Gemini, Perplexity, Grok or Google&rsquo;s AI Overviews for a recommendation instead of scrolling a list of links. Those tools pull from what&rsquo;s published about you, so clear, consistent information matters.' },
    { q: 'What area do you serve?', a: `Palatka and all of Putnam County, Florida, including ${TOWNS.slice(1, 8).join(', ')} and nearby communities.` },
    { q: 'Who will I work with?', a: `${B.founder}, the founder, a Marine Corps veteran who lives in the Palatka area. No call centers and no hand-offs.` },
  ];
  const p = {
    path: '/', file: 'index.html', priority: '1.0',
    title: 'Palatka & Putnam County Local Marketing | Putnam Lead Group',
    ogTitle: 'Putnam Lead Group | Get found, get trusted, get the job',
    description: `Veteran-owned local marketing in Palatka and Putnam County, FL: a $${B.cleanup} Google profile cleanup, real reviews, AI search and a $${B.monthly}/month plan.`,
    preload: '<link rel="preload" as="image" href="/assets/reels/missed-call.webp" fetchpriority="high">\n',
  };
  p.schema = [business, website, kyle, webPage(p, { primaryImageOfPage: { '@type': 'ImageObject', url: `${SITE}/assets/brand/PLG-open-graph-1200x630.jpg` } }), faqLd(faqs)];
  p.body = `
<main id="main">

<!-- HERO -->
<section class="hero" aria-labelledby="hero-h">
  <div class="wrap hero-copy">
    <p class="eyebrow">Veteran-owned &middot; Palatka &amp; Putnam County, FL</p>
    <h1 id="hero-h">Get found.<br>Get trusted.<br><span class="grad">Get the job.</span></h1>
    <p class="lede">Local marketing for Putnam County service businesses. We get you showing up on Google Maps and in AI search, earning more real reviews, and making it one tap for a new customer to call you.</p>
    <p class="trades">For lawn care, HVAC, plumbing, roofing and other contractors in Palatka and across Putnam County.</p>
    <div class="cta-row">
      ${bookBtn()}
      <a class="link-arrow" href="tel:${B.phone}">or call ${B.phoneTxt}</a>
    </div>
  </div>
  <div class="hero-stage" aria-hidden="true">
    <div class="fan">
      <img class="fan-side fan-l" src="/assets/reels/after-hours-chat.webp" width="720" height="1280" alt="" loading="lazy" decoding="async">
      <div class="fan-main">
        <img class="hero-poster" src="/assets/reels/missed-call.webp" width="720" height="1280" alt="" fetchpriority="high" decoding="async">
        <video class="hero-vid" muted loop playsinline preload="none" data-src="/assets/reels/missed-call.mp4" width="720" height="1280"></video>
      </div>
      <img class="fan-side fan-r" src="/assets/reels/review-request.webp" width="720" height="1280" alt="" loading="lazy" decoding="async">
    </div>
  </div>
</section>

<!-- STATEMENT -->
<section class="statement" aria-label="Why it matters">
  <div class="wrap">
    <p class="scrub">You&rsquo;re great at the work. But if people can&rsquo;t find you, don&rsquo;t trust what they see, or don&rsquo;t hear back, they call the next name on the list. We fix those three things.</p>
  </div>
</section>

<!-- SERVICES -->
<section class="section" id="services" aria-labelledby="svc-h">
  <div class="wrap">
    <p class="eyebrow reveal">What we do</p>
    <h2 id="svc-h" class="reveal">Less chasing.<br>More booked jobs.</h2>
    <p class="sub reveal">Four services now and one coming next, with one goal: more calls and bids from your own neighbors, without hiring anyone.</p>

    <div class="bento">
      <article class="tile tile-lg reveal">
        <span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg></span>
        <h3>Show up when locals search.</h3>
        <p>We set up or clean up your Google Business Profile, plus Apple Maps and Bing: correct hours, services, photos and service areas, so the right people find you and see a business that&rsquo;s open and active.</p>
        <p class="change"><b>What changes:</b> more people searching &ldquo;near me&rdquo; see you, and calling you is one tap away.</p>
        <a class="link-arrow" href="/services/google-business-profile/">Google profile cleanup</a>
      </article>

      <article class="tile tile-lg tile-dark reveal">
        <span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.7 7.1L4 20.5l1.4-4.7A8 8 0 1 1 21 12z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg></span>
        <h3>Follow-up help, coming next.</h3>
        <p>Missed-call text-back, quote follow-ups and appointment reminders, set up on your own phone so every text comes from you. Not part of the posted plans yet. Ask about it on the call.</p>
        <p class="change"><b>Why it matters:</b> a missed call while you&rsquo;re on a roof, under a sink or behind a mower is often a lost job.</p>
        <a class="link-arrow light" href="#see-it">See the demos</a>
      </article>

      <article class="tile reveal">
        <span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg></span>
        <h3>Turn customers into reviews.</h3>
        <p>Every review gets a thoughtful reply. Every customer gets the same easy, polite ask. Real reviews only, never fake or bought.</p>
        <p class="change"><b>What changes:</b> a profile that looks cared for, with fresh reviews that help strangers trust you.</p>
        <a class="link-arrow" href="/services/reviews/">Review help</a>
      </article>

      <article class="tile reveal">
        <span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="3.2"/><path d="M17 8.5h.01"/></svg></span>
        <h3>Show your work, without the extra work.</h3>
        <p>A Google post every week and your job photos added to your profile, in the Keep It Fresh plan. You snap the photos; we turn them into posts.</p>
        <p class="change"><b>What changes:</b> you look established and busy, because you are.</p>
      </article>

      <article class="tile reveal">
        <span class="ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z"/></svg></span>
        <h3>Be part of the answer in AI search.</h3>
        <p>More people now ask ChatGPT, Gemini, Perplexity or Grok &ldquo;who&rsquo;s a good roofer near Palatka?&rdquo; We make your business info clear and consistent across the web, so those tools have what they need to mention you.</p>
        <p class="change"><b>What changes:</b> you&rsquo;re in the running where your next customer is already looking.</p>
        <a class="link-arrow" href="/services/ai-search/">How AI search works for you</a>
      </article>
    </div>
  </div>
</section>

<!-- SHOWCASE -->
<section class="section showcase" id="see-it" aria-labelledby="see-h">
  <div class="wrap">
    <p class="eyebrow reveal">See it work</p>
    <h2 id="see-h" class="reveal">See it from your<br>customer&rsquo;s side.</h2>
    <p class="sub reveal">Six everyday moments where a lead usually goes cold. These demos show the follow-up help we&rsquo;re building next. It isn&rsquo;t part of the posted plans yet.</p>
  </div>
  <div class="rail-wrap">
    <ul class="rail" id="rail" aria-label="Six short demo videos">
${[
  ['missed-call', 'Demo: a missed caller gets a text back and books an estimate', 'Missed a call on the job?', 'The caller gets a friendly text, and the estimate still gets booked.'],
  ['after-hours-chat', 'Demo: a website visitor chats after hours and a callback is set', 'Closed for the night?', 'Your website still answers and sets up a callback for the morning.'],
  ['review-request', 'Demo: a customer gets a polite review request and leaves a review', 'Forget to ask for reviews?', 'Every customer gets a polite, well-timed ask.'],
  ['appointment-reminder', 'Demo: an appointment reminder lets the customer reschedule instead of no-showing', 'Drove out for a no-show?', 'A reminder goes out first, so plans change before you&rsquo;re in the truck.'],
  ['quote-follow-up', 'Demo: a quiet quote gets a friendly follow-up and the job is booked', 'Quotes going quiet?', 'A friendly check-in keeps your bid top of mind.'],
  ['weekend-message', 'Demo: a weekend message gets a reply and an estimate is booked', 'Weekend messages piling up?', 'They get a reply, and Monday starts with jobs on the books.'],
].map(([f, label, b, t]) => `      <li class="reel">
        <figure>
          <div class="reel-media"><video muted loop playsinline preload="none" poster="/assets/reels/${f}.webp" src="/assets/reels/${f}.mp4" width="720" height="1280" aria-label="${label}"></video><button class="vbtn" type="button" aria-label="Play video"></button></div>
          <figcaption><b>${b}</b> ${t}</figcaption>
        </figure>
      </li>`).join('\n')}
    </ul>
    <div class="rail-ctrl wrap">
      <button class="rbtn" type="button" data-dir="-1" aria-controls="rail" aria-label="Previous video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <button class="rbtn" type="button" data-dir="1" aria-controls="rail" aria-label="Next video"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>
    </div>
  </div>
  <p class="wrap fine reveal">Demo conversations. Phone numbers and names are examples.</p>
</section>

<!-- FREE CHECK -->
<section class="check-strip" id="free-check" aria-labelledby="check-h">
  <div class="wrap check-in">
    <div>
      <p class="eyebrow reveal">Free, no strings</p>
      <h2 id="check-h" class="reveal">Text me your business name.</h2>
      <p class="sub reveal">I&rsquo;ll look you up the way a new customer would, on Google, on Maps and in AI search, and text you back the 3 things I&rsquo;d fix first. Free, whether or not you ever hire us.</p>
    </div>
    <div class="check-card reveal">
      <ol>
        <li>Can people find you when they search your trade and town?</li>
        <li>Are your hours, phone and photos right?</li>
        <li>Do your reviews look recent and answered?</li>
        <li>What do AI tools say when someone asks for your kind of business?</li>
      </ol>
      <div class="cta-row">
        <a class="btn" href="${attr(SMS)}">Text ${B.phoneTxt}</a>
        <a class="link-arrow" href="/guides/google-profile-check/">or check it yourself</a>
      </div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="section" id="how" aria-labelledby="how-h">
  <div class="wrap">
    <p class="eyebrow reveal">How it works</p>
    <h2 id="how-h" class="reveal">Three steps.<br>No new software to learn.</h2>
    <ol class="steps">
      <li class="step reveal">
        <span class="num" aria-hidden="true">01</span>
        <h3>A quick call.</h3>
        <p>Fifteen minutes. We look at how your business shows up today and where leads are slipping through.</p>
      </li>
      <li class="step reveal">
        <span class="num" aria-hidden="true">02</span>
        <h3>We clean it up.</h3>
        <p>You add us as a manager and text us job photos. We fix your profile, listings and website wording, and handle reviews and content from there.</p>
      </li>
      <li class="step reveal">
        <span class="num" aria-hidden="true">03</span>
        <h3>You see what changed.</h3>
        <p>A short, plain-English report each month: what we did and what changed. No jargon.</p>
      </li>
    </ol>
  </div>
</section>

<!-- PRICING -->
<section class="pricing" id="pricing" aria-labelledby="pricing-h">
  <div class="wrap">
    <p class="eyebrow light reveal">Pricing</p>
    <h2 id="pricing-h" class="reveal">Two prices.<br><span class="teal">No surprises.</span></h2>
    <p class="sub light reveal">Start with a one-time cleanup. Keep it fresh with the monthly plan if you want to. You&rsquo;ll know the price before any work starts.</p>
    <div class="plans">
      <article class="plan reveal">
        <p class="tag">Start here</p>
        <h3>One-time cleanup</h3>
        <p class="price">$${B.cleanup}<small>one time</small></p>
        <p>Get your business showing up right everywhere customers look.</p>
        ${checks(CLEANUP_ITEMS.slice(0, 4))}
        <div class="cta-row">${bookBtn('Book a free call', 'btn btn-teal')}</div>
      </article>
      <article class="plan featured reveal">
        <p class="tag">Keep it fresh</p>
        <h3>Keep It Fresh plan</h3>
        <p class="price">$${B.monthly}<small>a month</small></p>
        <p>${TERMS_LINE}</p>
        ${checks(MONTHLY_ITEMS.slice(0, 4))}
        <p class="founding">${FOUNDING}</p>
        <div class="cta-row">${bookBtn('Book a free call', 'btn btn-teal')}</div>
      </article>
    </div>
    <p class="fine reveal">Follow-up help like missed-call text-back isn&rsquo;t in the posted plans yet. Ask on the call. <a class="link-arrow" href="/pricing/">Full pricing details</a></p>
  </div>
</section>

<!-- ABOUT -->
<section class="section about" id="about" aria-labelledby="about-h">
  <div class="wrap about-in">
    <picture class="founder reveal">
      <source srcset="/assets/brand/kyle.webp" type="image/webp">
      <img src="/assets/brand/kyle.jpg" width="600" height="600" alt="Kyle Simmons, founder of Putnam Lead Group" loading="lazy" decoding="async">
    </picture>
    <div>
      <p class="eyebrow reveal">About</p>
      <h2 id="about-h" class="reveal">Veteran-owned.<br>Local to Putnam County.</h2>
      <p class="sub reveal">Putnam Lead Group is run by ${B.founder}, a Marine Corps veteran who lives in the Palatka area. No call centers and no hand-offs: you deal with Kyle directly, someone local you can actually meet.</p>
      <ul class="towns reveal" aria-label="Towns we serve">
        ${TOWNS.slice(0, 8).map((t) => `<li>${t}</li>`).join('')}
      </ul>
      <p class="more reveal"><a class="link-arrow" href="/about/">More about Kyle</a> &nbsp; <a class="link-arrow" href="/service-area/">Full service area</a></p>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="section faq" id="faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <p class="eyebrow reveal">FAQ</p>
    <h2 id="faq-h" class="reveal">Good questions.</h2>
    ${faqHtml(faqs)}
  </div>
</section>

</main>
`;
  pages.push(p);
}

// PRICING
{
  const items = [['/', 'Home'], ['/pricing/', 'Pricing']];
  const p = {
    path: '/pricing/', file: 'pricing/index.html', priority: '0.9',
    title: `Pricing: $${B.cleanup} Cleanup, $${B.monthly}/Month Plan | Putnam Lead Group`,
    description: `A $${B.cleanup} one-time Google, Apple Maps and Bing cleanup, plus an optional $${B.monthly} a month plan for Putnam County businesses. Month to month.`,
  };
  p.schema = [business, webPage(p), crumbLd(items), faqLd(PRICE_FAQ)];
  p.body = `
<main id="main">
${pageHero(items, 'Pricing', `Two prices.<br>No surprises.`, `A $${B.cleanup} one-time cleanup gets you showing up right. An optional $${B.monthly} a month plan keeps you fresh. You&rsquo;ll know the price before any work starts.`)}

<section class="pricing" aria-labelledby="plans-h">
  <div class="wrap">
    <h2 id="plans-h" class="sr">Plans</h2>
    <div class="plans">
      <article class="plan" id="cleanup">
        <p class="tag">Start here</p>
        <h3>One-time cleanup</h3>
        <p class="price">$${B.cleanup}<small>one time</small></p>
        <p>For one location. Get your business showing up right everywhere customers look.</p>
        ${checks(CLEANUP_ITEMS)}
        <div class="cta-row">${bookBtn('Book a free call', 'btn btn-teal')}</div>
      </article>
      <article class="plan featured" id="monthly">
        <p class="tag">Keep it fresh</p>
        <h3>Keep It Fresh plan</h3>
        <p class="price">$${B.monthly}<small>a month</small></p>
        <p>${TERMS_LINE} Most businesses start it after the cleanup.</p>
        ${checks(MONTHLY_ITEMS)}
        <p class="founding">${FOUNDING}</p>
        <div class="cta-row">${bookBtn('Book a free call', 'btn btn-teal')}</div>
      </article>
    </div>
    <p class="fine">Follow-up help like missed-call text-back isn&rsquo;t in the posted plans yet. If it would help your business, ask on the call. Any text it sends comes from your own phone and account.</p>
  </div>
</section>

<section class="section tight" aria-labelledby="not-h">
  <div class="wrap prose">
    <h2 id="not-h">What&rsquo;s not included</h2>
    <ul>
      <li>Building a brand-new website</li>
      <li>Paid ads, or the ad spend itself</li>
      <li>Paid tools, paid directory upgrades or a new phone number</li>
      <li>Any promise of rankings, review counts or a number of leads</li>
    </ul>
    <p>If you ever need one of these, we&rsquo;ll tell you the price first. Nothing gets bought on your behalf without your OK.</p>

    <h2>How it starts</h2>
    <ol>
      <li><strong>A free 15-minute call.</strong> We look at how you show up today.</li>
      <li><strong>You say yes to the cleanup.</strong> You add us as a manager on your Google profile. No passwords needed.</li>
      <li><strong>We fix it and show you.</strong> You get a plain-English list of what changed, then decide on the monthly plan.</li>
    </ol>
    <div class="cta-row">${bookBtn()} ${textLink()}</div>
  </div>
</section>

<section class="section faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <p class="eyebrow">Pricing questions</p>
    <h2 id="faq-h">Straight answers.</h2>
    ${faqHtml(PRICE_FAQ)}
  </div>
</section>
</main>
`;
  pages.push(p);
}

// GOOGLE BUSINESS PROFILE
{
  const items = [['/', 'Home'], ['/#services', 'Services'], ['/services/google-business-profile/', 'Google Business Profile']];
  const faqs = [
    { q: 'What is a Google Business Profile?', a: 'It&rsquo;s the box with your name, map pin, hours, photos and reviews that shows up when someone searches for your business or your trade on Google or Google Maps. For most local service businesses, it&rsquo;s the first thing a new customer sees.' },
    { q: 'Do you need my Google password?', a: 'No. You add us as a manager on your profile, and you can remove us at any time. Your profile stays in your name.' },
    { q: 'What if I don&rsquo;t have a profile yet?', a: 'We create it with you and walk you through Google&rsquo;s verification step, which Google requires before a new profile goes live.' },
    { q: 'What if someone else set up my profile and I lost access?', a: 'That happens a lot. We help you request ownership back through Google, then clean it up once you&rsquo;re in.' },
    { q: 'Do you hide my home address?', a: 'If you work at customers&rsquo; homes and don&rsquo;t have a shop, your profile can show a service area instead of a street address. We set it up the way that fits how you work.' },
    { q: 'Will this put me at the top of Google?', a: 'No one can promise that, and Google decides rankings. A complete, accurate, active profile with real reviews gives you the best shot at showing up when locals search.' },
  ];
  const p = {
    path: '/services/google-business-profile/', file: 'services/google-business-profile/index.html', priority: '0.9',
    title: 'Google Business Profile Help in Palatka, FL | Putnam Lead Group',
    description: `Google Business Profile setup, cleanup and recovery for Palatka and Putnam County businesses, plus Apple Maps and Bing. Part of the $${B.cleanup} one-time cleanup.`,
  };
  p.schema = [business, webPage(p), crumbLd(items), service('Google Business Profile cleanup', 'Google Business Profile management', 'Setup, cleanup and recovery of Google Business Profiles, plus Apple Maps and Bing listings, for local service businesses in Putnam County, Florida.', p.path, [ID.cleanup, ID.monthly]), faqLd(faqs)];
  p.body = `
<main id="main">
${pageHero(items, 'Google Business Profile', 'Show up when Putnam County searches for you.', 'When someone in Palatka searches &ldquo;lawn care near me&rdquo; or your business name, your Google profile is the first thing they see. We set it up or clean it up so it&rsquo;s right, complete and looks open for business.')}

<section class="section tight" aria-labelledby="why-h">
  <div class="wrap prose">
    <h2 id="why-h">Why your Google profile matters</h2>
    <p>Most people pick a local contractor from the map results, not from a list of websites. They look at three things: are you open, do other people trust you, and can they reach you in one tap. A profile with old hours, no photos or unanswered reviews quietly sends that call to the next name on the list.</p>

    <h2>What we fix</h2>
    ${checks([
      'Your business name, exactly as it should be, with no keyword stuffing that can get a profile suspended',
      'The right main category and services, so you show up for the work you actually want',
      'Hours, holiday hours, phone and website link',
      'Service areas across Putnam County, or your shop address if customers come to you',
      'Real photos of your work and your team',
      'Apple Maps and Bing listings, so iPhone and Bing users find the same correct info',
      'Your name, phone and website made to match on the main directories',
    ])}

    <h2>What changes for you</h2>
    <ul>
      <li>People searching your trade and town see a business that&rsquo;s complete and active.</li>
      <li>Calling, texting or getting directions to you is one tap.</li>
      <li>Google, Apple, Bing and AI tools all see the same correct information about you.</li>
    </ul>
    <p class="note">The Google profile cleanup is part of the <a href="/pricing/#cleanup">$${B.cleanup} one-time cleanup</a>. The <a href="/pricing/#monthly">$${B.monthly} a month plan</a> keeps it fresh with new posts, photos and review replies.</p>
    <div class="cta-row">${bookBtn()} ${textLink()}</div>
  </div>
</section>

<section class="section faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <p class="eyebrow">Google profile questions</p>
    <h2 id="faq-h">Good questions.</h2>
    ${faqHtml(faqs)}
  </div>
</section>
</main>
`;
  pages.push(p);
}

// REVIEWS
{
  const items = [['/', 'Home'], ['/#services', 'Services'], ['/services/reviews/', 'Reviews']];
  const faqs = [
    { q: 'Do you write or buy reviews?', a: 'Never. Every review comes from a real customer. Fake reviews break Google&rsquo;s rules and the law, and they can get a profile penalized.' },
    { q: 'Can I give a discount for a review?', a: 'No. Offering anything in exchange for a review breaks Google&rsquo;s rules. We make asking easy and polite instead.' },
    { q: 'Who sends the review request?', a: 'You do, from your own phone or email, to customers you&rsquo;ve finished a job for. We write the short ask and set up the one-tap link. We never text your customers for you.' },
    { q: 'How do you handle a bad review?', a: 'With a calm, professional reply that thanks them, never argues, and offers to make it right offline. Future customers read how you respond as much as the review itself.' },
    { q: 'Is this included in the price?', a: `The review link and the ask come with the $${B.cleanup} cleanup. Replies to every review are part of the $${B.monthly} a month plan.` },
  ];
  const p = {
    path: '/services/reviews/', file: 'services/reviews/index.html', priority: '0.8',
    title: 'Review Replies & Requests, Putnam County FL | Putnam Lead Group',
    description: 'Real reviews only. Replies to every Google review and polite review requests for Palatka and Putnam County businesses. Never fake, bought or gated.',
  };
  p.schema = [business, webPage(p), crumbLd(items), service('Review replies and review requests', 'Online review management', 'Replies to every Google review and polite, rule-following review requests to real customers, for local service businesses in Putnam County, Florida.', p.path, [ID.monthly]), faqLd(faqs)];
  p.body = `
<main id="main">
${pageHero(items, 'Reviews', 'Turn customers into real reviews.', 'Strangers trust your reviews before they trust you. We reply to every review in your business&rsquo;s name and make it easy for every customer to leave one. Real reviews only.')}

<section class="section tight" aria-labelledby="how-h">
  <div class="wrap prose">
    <h2 id="how-h">What your customers see</h2>
    <ul>
      <li><strong>After a job:</strong> a short, friendly thank-you from you, with a one-tap link to leave a review.</li>
      <li><strong>On your profile:</strong> every review answered, the good ones with thanks and the hard ones with grace.</li>
      <li><strong>Over time:</strong> fresh reviews that show you&rsquo;re busy and you care.</li>
    </ul>

    <h2>Our rules</h2>
    ${checks([
      'We only ask real customers',
      'We never offer anything in exchange for a review',
      'We ask every customer the same way, happy or not',
      'We never write, buy or fake a review',
    ])}
    <p class="note">The review link and the ask come with the <a href="/pricing/#cleanup">$${B.cleanup} cleanup</a>. Replies to every review are part of the <a href="/pricing/#monthly">$${B.monthly} a month plan</a>.</p>
    <div class="cta-row">${bookBtn()} ${textLink()}</div>
  </div>
</section>

<section class="section faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <p class="eyebrow">Review questions</p>
    <h2 id="faq-h">Good questions.</h2>
    ${faqHtml(faqs)}
  </div>
</section>
</main>
`;
  pages.push(p);
}

// AI SEARCH
{
  const items = [['/', 'Home'], ['/#services', 'Services'], ['/services/ai-search/', 'AI search']];
  const faqs = [
    { q: 'What is AI search?', a: 'It&rsquo;s when people ask tools like ChatGPT, Google Gemini, Perplexity, Grok or Google&rsquo;s AI Overviews a question, like &ldquo;who&rsquo;s a good plumber in Palatka?&rdquo;, and get one written answer instead of a list of links.' },
    { q: 'Where do AI tools get information about my business?', a: 'From what&rsquo;s published about you: your Google Business Profile, your website, directories like Apple Maps, Bing and Yelp, your reviews, and local news or social posts. When that information is missing or doesn&rsquo;t match, they may skip you or get you wrong.' },
    { q: 'What do AEO and GEO mean?', a: 'AEO is answer engine optimization and GEO is generative engine optimization. Both mean making your business easy for AI tools to understand, trust and mention. For a local business, it starts with the same basics as Google: accurate, consistent, complete information.' },
    { q: 'Is this different from regular SEO?', a: 'It builds on it. SEO (search engine optimization) helps you show up in Google&rsquo;s list of results. AI search adds a new place customers ask, and those tools reward clear facts, consistency and real reviews.' },
    { q: 'Can you guarantee ChatGPT will recommend me?', a: 'No. No one controls what an AI tool says. We make sure the information those tools rely on is clear, correct and consistent, so you&rsquo;re in the running.' },
  ];
  const p = {
    path: '/services/ai-search/', file: 'services/ai-search/index.html', priority: '0.8',
    title: 'Get Found in ChatGPT, Gemini & AI Search | Putnam Lead Group',
    description: 'When customers ask ChatGPT, Gemini, Perplexity or Google AI Overviews for a local contractor, make sure they have the right facts about your business.',
  };
  p.schema = [business, webPage(p), crumbLd(items), service('AI search visibility', 'Answer engine optimization', 'Making local service businesses in Putnam County, Florida easy for AI tools like ChatGPT, Gemini, Perplexity and Google AI Overviews to understand and mention, through accurate, consistent business information.', p.path, [ID.cleanup, ID.monthly]), faqLd(faqs)];
  p.body = `
<main id="main">
${pageHero(items, 'AI search', 'Be part of the answer when customers ask AI.', 'More people now ask ChatGPT, Gemini, Perplexity or Google&rsquo;s AI Overviews &ldquo;who&rsquo;s a good roofer near Palatka?&rdquo; and call whoever comes up. We make sure those tools have clear, correct facts about your business.')}

<section class="section tight" aria-labelledby="ai-h">
  <div class="wrap prose">
    <h2 id="ai-h">How AI tools pick a business to mention</h2>
    <p>AI tools don&rsquo;t have a phone book. They read what&rsquo;s published about you across the web and look for facts that agree. A business with a complete Google profile, matching listings, a clear website and real reviews is easy to recommend. A business with gaps or conflicting info is easy to skip.</p>

    <h2>What we do about it</h2>
    ${checks([
      'Make your name, phone, website and service area match everywhere',
      'Spell out what you do and where you do it, in plain words, on your profile and website',
      'Answer the questions customers really ask, so AI tools have something clear to quote',
      'Keep fresh, real reviews coming in',
      'Look at what the big AI tools say about your kind of business in your town, and tell you in plain English',
    ])}

    <h2>What changes for you</h2>
    <p>You&rsquo;re in the running where your next customer is already looking, with the same correct information on Google, Apple Maps, Bing and in AI answers.</p>
    <p>Want to see where you stand first? Try the free <a href="/guides/ai-search-test/">2-minute AI search test</a>.</p>
    <p class="note">This work is built into the <a href="/pricing/#cleanup">$${B.cleanup} cleanup</a> and kept current by the <a href="/pricing/#monthly">$${B.monthly} a month plan</a>.</p>
    <div class="cta-row">${bookBtn()} ${textLink()}</div>
  </div>
</section>

<section class="section faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <p class="eyebrow">AI search questions</p>
    <h2 id="faq-h">Plain answers.</h2>
    ${faqHtml(faqs)}
  </div>
</section>
</main>
`;
  pages.push(p);
}

// SERVICE AREA
{
  const items = [['/', 'Home'], ['/service-area/', 'Service area']];
  const p = {
    path: '/service-area/', file: 'service-area/index.html', priority: '0.7',
    title: 'Serving Palatka & All of Putnam County, FL | Putnam Lead Group',
    description: `Local marketing for service businesses in Palatka, Crescent City, Interlachen, Welaka and across Putnam County, Florida. Veteran-owned and local.`,
  };
  p.schema = [business, webPage(p), crumbLd(items)];
  p.body = `
<main id="main">
${pageHero(items, 'Service area', 'Palatka and all of Putnam County.', 'We work with local service businesses across Putnam County, Florida. We live here, so we can meet you at your shop, your truck or a job site.')}

<section class="section tight" aria-labelledby="towns-h">
  <div class="wrap prose">
    <h2 id="towns-h">Towns we serve</h2>
    <ul class="towns">
      ${TOWNS.map((t) => `<li>${t}</li>`).join('\n      ')}
    </ul>
    <p>Near Putnam County but just over the line? Call or text and ask. If we can do a good job for you, we will.</p>

    <h2>Businesses we work with</h2>
    <p>Local service businesses that live on phone calls and bids, including ${TRADES.join(', ')}. If customers find you on Google and call you for a quote, we can help.</p>

    <h2>Why local matters</h2>
    <p>We know the towns, the roads and the way people here pick a contractor. You deal with ${B.founder} directly, someone you can meet in person, not a call center out of state.</p>
    <div class="cta-row">${bookBtn()} ${textLink()}</div>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// ABOUT
{
  const items = [['/', 'Home'], ['/about/', 'About']];
  const p = {
    path: '/about/', file: 'about/index.html', priority: '0.7', ogType: 'profile',
    title: 'About Kyle Simmons, Veteran-Owned Putnam Lead Group',
    description: `Putnam Lead Group is veteran-owned local marketing in the Palatka area, run by Marine Corps veteran ${B.founder}. No call centers, no long contracts.`,
  };
  p.schema = [business, kyle, webPage(p, { '@type': 'AboutPage', mainEntity: { '@id': ID.kyle } }), crumbLd(items)];
  p.body = `
<main id="main">
${pageHero(items, 'About', 'Veteran-owned. Local to Putnam County.', `I&rsquo;m ${B.founder}, a Marine Corps veteran who lives in the Palatka area. I started Putnam Lead Group to help the local businesses I call on myself get found, get trusted and get the job.`, false)}

<section class="section tight about" aria-labelledby="who-h">
  <div class="wrap about-in">
    <picture class="founder">
      <source srcset="/assets/brand/kyle.webp" type="image/webp">
      <img src="/assets/brand/kyle.jpg" width="600" height="600" alt="Kyle Simmons, founder of Putnam Lead Group" loading="lazy" decoding="async">
    </picture>
    <div class="prose">
      <h2 id="who-h">Why I do this</h2>
      <p>The best tradespeople in our county are usually too busy doing the work to keep up with Google, reviews and messages. Customers can&rsquo;t hire someone they can&rsquo;t find, and they won&rsquo;t wait long for a reply. I fix that part, so you can keep doing the part you&rsquo;re great at.</p>
    </div>
  </div>
</section>

<section class="section tight" aria-labelledby="rules-h">
  <div class="wrap prose">
    <h2 id="rules-h">How I work</h2>
    ${checks([
      '<strong>You deal with me directly.</strong> No call centers and no hand-offs.',
      '<strong>Plain English.</strong> You&rsquo;ll always know what I did and why.',
      '<strong>Real reviews only.</strong> Never fake, bought or traded for a discount.',
      '<strong>No ranking promises.</strong> Nobody can promise #1 on Google, so I won&rsquo;t.',
      '<strong>Your accounts stay yours.</strong> I work as a manager you can remove at any time.',
      '<strong>No long contracts.</strong> The monthly plan is month to month.',
    ])}
    <div class="cta-row">${bookBtn()} ${textLink()}</div>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// GUIDE
{
  const items = [['/', 'Home'], ['/guides/google-profile-check/', 'Google profile check']];
  const steps = [
    ['Search your business name and town', 'On your phone, search your business name plus your town, like you were a new customer. Does your profile come up, with your correct name?'],
    ['Check your hours', 'Are your regular and holiday hours right? Wrong hours are the fastest way to lose a call.'],
    ['Tap your phone number', 'Does it call you? Does the website link open the right page?'],
    ['Look at your services and service area', 'Does it list the work you actually want, and the towns you actually drive to?'],
    ['Scroll your photos', 'Are there real photos of your work from the last few months, or just a logo?'],
    ['Read your newest reviews', 'Is the newest one recent? Did every review get a reply?'],
    ['Search your trade and town', 'Search something like &ldquo;roofer Palatka&rdquo; or &ldquo;lawn care near me.&rdquo; Do you show up in the map results?'],
    ['Ask an AI tool', 'Ask ChatGPT, Gemini or Perplexity &ldquo;who&rsquo;s a good [your trade] in [your town]?&rdquo; Are you mentioned? Is what it says about you right?'],
    ['Check Apple Maps', 'On an iPhone, search your business in Apple Maps. Is it there, and is it right?'],
    ['Count your &ldquo;no&rdquo; answers', 'Every &ldquo;no&rdquo; is a spot where a customer might call someone else instead.'],
  ];
  const p = {
    path: '/guides/google-profile-check/', file: 'guides/google-profile-check/index.html', priority: '0.7', ogType: 'article',
    title: 'The 60-Second Google Profile Check for Local Businesses | PLG',
    description: 'A free 10-point self-check for local contractors: see your business the way a new customer does on Google, Apple Maps and AI search.',
  };
  p.schema = [business, webPage(p, { '@type': 'WebPage' }), crumbLd(items), { '@type': 'Article', '@id': `${SITE}${p.path}#article`, headline: 'The 60-second Google profile check for local service businesses', description: p.description, author: { '@id': ID.kyle }, publisher: { '@id': ID.biz }, datePublished: UPDATED, dateModified: UPDATED, mainEntityOfPage: { '@id': `${SITE}${p.path}#webpage` }, image: `${SITE}/assets/brand/PLG-open-graph-1200x630.jpg`, inLanguage: 'en-US' }];
  p.body = `
<main id="main">
${pageHero(items, 'Free guide', 'The 60-second Google profile check.', 'See your business the way a new customer does. Grab your phone and answer these ten questions. Every &ldquo;no&rdquo; is a spot where a call might go to someone else.', false)}

<section class="section tight" aria-labelledby="steps-h">
  <div class="wrap prose">
    <h2 id="steps-h">The 10 questions</h2>
    <ol>
${steps.map(([t, d]) => `      <li><strong>${t}.</strong> ${d}</li>`).join('\n')}
    </ol>
    <p class="note">Got more than two &ldquo;no&rdquo; answers? Text me your business name and I&rsquo;ll run this check for you, free, and tell you what I&rsquo;d fix first.</p>
    <div class="cta-row"><a class="btn" href="${attr(SMS)}">Text ${B.phoneTxt}</a> <a class="link-arrow" href="/pricing/">See pricing</a></div>
    <p class="updated">By ${B.founder} &middot; Updated November 24, 2026</p>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// GUIDE: AI SEARCH TEST (first drafted on the marketing branch, folded in here)
{
  const items = [['/', 'Home'], ['/guides/ai-search-test/', 'AI search test']];
  const faqs = [
    { q: 'Can anyone guarantee ChatGPT will recommend my business?', a: 'No. Nobody controls what AI tools say. What you can do is make sure the facts about your business are complete, consistent and easy to find, so those tools have good information to work with.' },
    { q: 'Which AI tools should I test?', a: 'Start with ChatGPT, Google (look for the AI answer at the top or the AI Mode tab), Gemini and Perplexity. Customers use different ones, so check at least two.' },
    { q: 'Do I need a website for AI search?', a: 'It helps a lot. A simple page that names your services and the towns you serve gives AI tools and Google something clear to read. Your Google profile and reviews still matter most for most local trades.' },
    { q: 'How often should I re-test?', a: 'Once a month is plenty. Use the same questions each time so you can see whether anything changed.' },
  ];
  const p = {
    path: '/guides/ai-search-test/', file: 'guides/ai-search-test/index.html', priority: '0.7', ogType: 'article',
    title: 'Does ChatGPT Recommend You? Free AI Search Test | PLG',
    description: 'A free 2-minute test for Palatka and Putnam County businesses: see if ChatGPT, Gemini or Perplexity names you, plus 7 fixes you can do yourself.',
  };
  p.schema = [business, webPage(p, { '@type': 'WebPage' }), crumbLd(items), { '@type': 'Article', '@id': `${SITE}${p.path}#article`, headline: 'Does ChatGPT recommend your business? A free 2-minute AI search test', description: p.description, author: { '@id': ID.kyle }, publisher: { '@id': ID.biz }, datePublished: UPDATED, dateModified: UPDATED, mainEntityOfPage: { '@id': `${SITE}${p.path}#webpage` }, image: `${SITE}/assets/brand/PLG-open-graph-1200x630.jpg`, inLanguage: 'en-US' }, faqLd(faqs)];
  p.body = `
<main id="main">
${pageHero(items, 'Free guide', 'Does ChatGPT recommend your business?', 'More people now ask ChatGPT, Gemini, Perplexity or Google&rsquo;s AI answers &ldquo;who&rsquo;s a good roofer near Palatka?&rdquo; instead of scrolling through results. Here&rsquo;s a free test you can run on your phone right now.', false)}

<section class="section tight" aria-labelledby="test-h">
  <div class="wrap prose">
    <h2 id="test-h">The 2-minute test</h2>
    <ol>
      <li>Open ChatGPT, Gemini, Perplexity, or Google and look at the AI answer at the top.</li>
      <li>Ask: &ldquo;Who&rsquo;s a good [your trade] in [your town], Florida?&rdquo; For example, &ldquo;Who&rsquo;s a good lawn care company in Palatka, Florida?&rdquo;</li>
      <li>Then ask: &ldquo;What do people say about [your business name] in [your town]?&rdquo;</li>
      <li>Write down three things: did you come up, are your phone and services right, and who came up instead?</li>
    </ol>
    <p class="note">Not sure what you&rsquo;re looking at? Text me your business name and trade. I&rsquo;ll run this test plus a Google check and text you what I find. Free.</p>
    <div class="cta-row"><a class="btn" href="${attr(SMS)}">Text ${B.phoneTxt}</a> <a class="link-arrow" href="/services/ai-search/">How we help with AI search</a></div>

    <h2>Why a good business gets left out</h2>
    <p>AI tools tend to build their answers from what&rsquo;s already published about you: your Google profile, your reviews, your website, and listings like Yelp, Facebook, Apple Maps and Bing. When those are thin or don&rsquo;t match, the tool has little to go on, so it names someone else. The usual gaps:</p>
    <ul>
      <li>A Google profile with missing services, old photos or no service area.</li>
      <li>Only a handful of reviews, or reviews nobody answered.</li>
      <li>No website, or a website that never says which towns you serve.</li>
      <li>A different phone number or business name on different sites.</li>
    </ul>

    <h2>7 fixes you can do yourself</h2>
    <ol>
      <li>Finish every section of your Google Business Profile, especially services and service area.</li>
      <li>Use the exact same business name, phone and town list everywhere.</li>
      <li>Ask every customer for a Google review the same way, and reply to every review you get.</li>
      <li>Put a sentence on your website like &ldquo;We do lawn care in Palatka, East Palatka and Interlachen.&rdquo;</li>
      <li>Add a short questions-and-answers section to your site with the questions customers really ask.</li>
      <li>Claim your free listings on Apple Maps, Bing and Yelp and match them to Google.</li>
      <li>Add fresh job photos to Google every month.</li>
    </ol>
    <p>None of this is a trick. It&rsquo;s making the true facts about your business easy for people and machines to find.</p>
    <p class="updated">By ${B.founder} &middot; Updated November 24, 2026</p>
  </div>
</section>

<section class="section faq" aria-labelledby="faq-h">
  <div class="wrap narrow">
    <p class="eyebrow">AI search test questions</p>
    <h2 id="faq-h">Plain answers.</h2>
    ${faqHtml(faqs)}
  </div>
</section>
</main>
`;
  pages.push(p);
}

// PRIVACY
{
  const items = [['/', 'Home'], ['/privacy/', 'Privacy']];
  const p = {
    path: '/privacy/', file: 'privacy/index.html', priority: '0.3',
    title: 'Privacy | Putnam Lead Group',
    description: 'How Putnam Lead Group handles your information: no cookies or ad trackers on this site, and contact details used only to reply and do the work you ask for.',
  };
  p.schema = [business, webPage(p), crumbLd(items)];
  // Keep this page true. If analytics, forms or chat are ever added, update it in the same change.
  p.body = `
<main id="main">
${pageHero(items, 'Privacy', 'Your information, plainly.', 'Short version: this site doesn&rsquo;t track you, and we only use your contact details to reply to you and do the work you ask for.', false)}

<section class="section tight" aria-labelledby="priv-h">
  <div class="wrap prose">
    <h2 id="priv-h">This website</h2>
    <p>This site has no contact forms, no ad trackers, no analytics scripts and no cookies of its own. It doesn&rsquo;t load any code from other companies.</p>
    <p>Like any website, the companies that host and deliver it may keep standard server logs, such as which pages were visited and when. The network that delivers the site may also set a strictly necessary security cookie to block bots. It isn&rsquo;t used for ads or tracking.</p>
    <h2>When you call, text, email or book</h2>
    <p>We use your name, number, email and what you tell us only to reply to you and to do the work you ask for. We never sell or rent your information.</p>
    <p>Booking a call uses Google&rsquo;s booking page, which follows Google&rsquo;s own privacy policy.</p>
    <h2>Text messages</h2>
    <p>If you text us, we&rsquo;ll text you back about what you asked. We don&rsquo;t send marketing texts unless you ask for them. Reply STOP at any time and we won&rsquo;t text you again.</p>
    <h2>Client accounts</h2>
    <p>If you hire us, we only access the accounts you invite us to, as a manager you can remove at any time.</p>
    <h2>Questions</h2>
    <p>Email <a href="mailto:${B.email}">${B.email}</a> or call <a href="tel:${B.phone}">${B.phoneTxt}</a>.</p>
    <p class="updated">${B.legal} &middot; Updated November 24, 2026</p>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// TERMS
{
  const items = [['/', 'Home'], ['/terms/', 'Terms']];
  const p = {
    path: '/terms/', file: 'terms/index.html', priority: '0.3',
    title: 'Terms of Use | Putnam Lead Group',
    description: 'Plain-English terms for using putnamleads.com: what the site is for, how prices work, no ranking guarantees, and who to contact.',
  };
  p.schema = [business, webPage(p), crumbLd(items)];
  // Plain-English website terms. Have an attorney review before relying on them for a dispute.
  p.body = `
<main id="main">
${pageHero(items, 'Terms', 'Terms of use, plainly.', 'By using this website, you agree to these simple terms. Work for clients is covered by the written agreement we make together.', false)}

<section class="section tight" aria-labelledby="terms-h">
  <div class="wrap prose">
    <h2 id="terms-h">What this site is for</h2>
    <p>This website explains what ${B.legal} does and how to reach us. It&rsquo;s general information, not legal, tax or financial advice.</p>
    <h2>Prices</h2>
    <p>Prices on this site are for one business location in Putnam County, Florida. Before any work starts, we confirm in writing what&rsquo;s included and what it costs. Prices on the site may change, but the price we agree on is the price you pay.</p>
    <h2>The monthly plan</h2>
    <p>The Keep It Fresh plan is month to month. To stop it, send us written notice by email or text, and the plan ends 30 days later. Founding 6 clients keep their $${B.monthly} a month price for as long as they stay on the plan without a break.</p>
    <h2>No guarantees on results</h2>
    <p>Google, Apple, Bing and AI tools decide what they show. We don&rsquo;t promise rankings, review counts, AI recommendations or a number of leads, and you should be careful with anyone who does.</p>
    <h2>Your accounts</h2>
    <p>Your Google profile, listings, website and social accounts stay yours. We only work in accounts you invite us to, and you can remove us at any time.</p>
    <h2>Text messages</h2>
    <p>If you text us, we&rsquo;ll reply about what you asked. Reply STOP at any time and we won&rsquo;t text you again. Message and data rates from your carrier may apply.</p>
    <h2>Other websites</h2>
    <p>This site links to other services, like our booking page on Google and our social media pages. Those services have their own terms and privacy policies.</p>
    <h2>Our content</h2>
    <p>The text, logo, photos and demo videos on this site belong to ${B.legal}. The demo conversations use example names and numbers.</p>
    <h2>Florida law</h2>
    <p>These terms are governed by the laws of the State of Florida.</p>
    <h2>Questions</h2>
    <p>Email <a href="mailto:${B.email}">${B.email}</a> or call <a href="tel:${B.phone}">${B.phoneTxt}</a>.</p>
    <p class="updated">${B.legal} &middot; Updated November 24, 2026</p>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// ACCESSIBILITY
{
  const items = [['/', 'Home'], ['/accessibility/', 'Accessibility']];
  const p = {
    path: '/accessibility/', file: 'accessibility/index.html', priority: '0.3',
    title: 'Accessibility | Putnam Lead Group',
    description: 'How putnamleads.com works for people who use screen readers, keyboards or zoom, and how to tell us about a problem so we can fix it.',
  };
  p.schema = [business, webPage(p), crumbLd(items)];
  p.body = `
<main id="main">
${pageHero(items, 'Accessibility', 'Everyone should be able to use this site.', 'We build this website to work for people who use screen readers, keyboards, zoom or voice control, on phones and computers.', false)}

<section class="section tight" aria-labelledby="a11y-h">
  <div class="wrap prose">
    <h2 id="a11y-h">What we aim for</h2>
    <p>We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA, the standard most often used for the Americans with Disabilities Act (ADA).</p>
    ${checks([
      'Every page works with a keyboard alone, with a visible focus outline',
      'A &ldquo;Skip to content&rdquo; link on every page',
      'Text and buttons meet color contrast guidelines',
      'Images and demo videos have text descriptions, and the demo videos have no sound to miss',
      'Motion is reduced for anyone who turns on &ldquo;reduce motion&rdquo; on their device',
      'Buttons and links are big enough to tap',
      'Every way to reach us is plain text: phone, text message and email',
    ])}
    <h2>Found a problem?</h2>
    <p>If anything on this site is hard to use, please tell us and we&rsquo;ll fix it. Call or text <a href="tel:${B.phone}">${B.phoneTxt}</a> or email <a href="mailto:${B.email}">${B.email}</a>. We&rsquo;re also happy to share any information from this site another way, like by phone or email.</p>
    <p class="updated">${B.legal} &middot; Updated November 24, 2026</p>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// 404
{
  const p = {
    path: '/404.html', file: '404.html', noindex: true, sitemap: false,
    title: 'Page not found | Putnam Lead Group',
    description: 'That page isn’t here. Head back to Putnam Lead Group for local marketing help in Palatka and Putnam County.',
  };
  p.schema = [business];
  p.body = `
<main id="main">
<section class="page-hero" aria-labelledby="page-h">
  <div class="wrap">
    <p class="eyebrow">Page not found</p>
    <h1 id="page-h">That page isn&rsquo;t here.</h1>
    <p class="lede">It may have moved. Try one of these instead, or just call or text ${B.phoneTxt}.</p>
    <div class="cta-row"><a class="btn" href="/">Go to the home page</a> <a class="link-arrow" href="/pricing/">See pricing</a></div>
  </div>
</section>
</main>
`;
  pages.push(p);
}

// ---- Write -------------------------------------------------------------------
for (const p of pages) {
  const out = join(ROOT, p.file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, head(p) + header(p) + p.body + footer(p));
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.filter((p) => p.sitemap !== false).map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${UPDATED}</lastmod><priority>${p.priority}</priority></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

const llms = `# ${B.name}

> ${B.name} (PLG) is a veteran-owned local marketing business in Palatka, Putnam County, Florida, run by ${B.founder}, a Marine Corps veteran. It helps local service businesses such as lawn care, HVAC, plumbing, roofing and other contractors get found on Google, Apple Maps, Bing and AI search tools, earn real reviews, and reply to new leads fast.

## Key facts

- Business: ${B.legal}, veteran-owned
- Founder: ${B.founder}, Marine Corps veteran, lives in the Palatka area
- Service area: Palatka and all of Putnam County, Florida, including ${TOWNS.slice(1).join(', ')}
- Who it serves: local service businesses, including ${TRADES.join(', ')}
- Phone (call or text): ${B.phoneTxt}
- Email: ${B.email}
- Book a free 15-minute call: ${B.book}
- Website: ${SITE}/

## Pricing

- One-time cleanup: $${B.cleanup}. Google Business Profile setup or cleanup, Apple Maps and Bing listings, matching name, phone and website on the main directories, help recovering a lost Google profile, and website wording fixes if the business has a site. One location.
- Keep It Fresh monthly plan: $${B.monthly} a month, month to month, stop with 30 days' written notice. A Google post every week, job photos added, every review answered, holiday hours handled and a plain-English monthly report. Founding 6: the first 6 monthly clients keep $${B.monthly} a month for as long as they stay.
- Follow-up automations such as missed-call text-back are not part of the posted plans yet. PLG does not send texts to a client's customers.
- Not included: new website builds, paid ads, paid tools, or any promise of rankings or lead counts.

## How PLG works

- Clients deal with ${B.founder} directly, no call centers.
- Real reviews only. PLG never writes, buys, fakes or incentivizes reviews.
- PLG does not promise Google rankings or AI recommendations.
- Client accounts stay in the client's name; PLG works as a removable manager.

## Pages

- [Home](${SITE}/): services overview, demos, pricing and FAQ
- [Pricing](${SITE}/pricing/): the $${B.cleanup} cleanup and $${B.monthly}/month plan in detail
- [Google Business Profile](${SITE}/services/google-business-profile/): setup, cleanup and recovery
- [Reviews](${SITE}/services/reviews/): review replies and review requests
- [AI search](${SITE}/services/ai-search/): visibility in ChatGPT, Gemini, Perplexity and Google AI Overviews
- [Service area](${SITE}/service-area/): towns served in Putnam County
- [About](${SITE}/about/): ${B.founder} and how PLG works
- [60-second Google profile check](${SITE}/guides/google-profile-check/): free self-check for local businesses
- [AI search test](${SITE}/guides/ai-search-test/): free 2-minute test of whether ChatGPT, Gemini or Perplexity names a local business, plus 7 fixes
- [Privacy](${SITE}/privacy/), [Terms](${SITE}/terms/), [Accessibility](${SITE}/accessibility/)
`;
writeFileSync(join(ROOT, 'llms.txt'), llms);

const security = `Contact: mailto:${B.email}
Contact: tel:${B.phone}
Expires: 2027-11-24T00:00:00.000Z
Preferred-Languages: en
Canonical: ${SITE}/.well-known/security.txt
Policy: ${SITE}/.well-known/security.txt

# Found a security problem with putnamleads.com? Please email us.
# This is a static website with no logins, forms or stored customer data.
# Please don't run automated scans that could slow the site down.
`;
mkdirSync(join(ROOT, '.well-known'), { recursive: true });
writeFileSync(join(ROOT, '.well-known', 'security.txt'), security);
writeFileSync(join(ROOT, 'security.txt'), security);

console.log(`Built ${pages.length} pages, sitemap.xml, llms.txt and security.txt`);
