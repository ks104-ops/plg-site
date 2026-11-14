/* Marketing Check-Up: questions, validation and results.
   Shared by the browser (assets/quiz.js) and the server (functions/api/*),
   so what the page asks and what the server accepts can never drift apart. */

export const QUESTIONS = [
  {
    id: 'business', type: 'single',
    q: 'What kind of business do you run?',
    options: [
      ['lawn', 'Lawn care or landscaping'],
      ['hvac', 'HVAC'],
      ['plumbing', 'Plumbing'],
      ['roofing', 'Roofing'],
      ['trades', 'Another contractor or trade'],
      ['service', 'Another local service'],
    ],
  },
  {
    id: 'area', type: 'single',
    q: 'Where do you mainly work?',
    options: [
      ['palatka', 'The Palatka area'],
      ['putnam', 'All of Putnam County'],
      ['nearby', 'Putnam plus nearby counties'],
      ['wider', 'A wider area than that'],
    ],
  },
  {
    id: 'goal', type: 'single',
    q: 'What’s your #1 goal right now?',
    options: [
      ['calls', 'More calls'],
      ['reviews', 'Better reviews'],
      ['google', 'Show up on Google'],
      ['website', 'A website'],
      ['time', 'Save time'],
      ['other', 'Something else'],
    ],
  },
  {
    id: 'sources', type: 'multi',
    q: 'Where do most new customers find you today?',
    hint: 'Pick all that apply.',
    options: [
      ['referrals', 'Word of mouth and referrals'],
      ['google', 'Google search or Maps'],
      ['social', 'Facebook or Instagram'],
      ['nextdoor', 'Nextdoor or local groups'],
      ['leadsites', 'Paid lead sites'],
      ['signs', 'Truck, yard signs or flyers'],
      ['unsure', 'Not sure'],
    ],
  },
  {
    id: 'gbp', type: 'single',
    q: 'Do you have a Google Business Profile?',
    hint: 'It’s the listing with your hours, photos and reviews that shows up on Google and Maps.',
    options: [
      ['active', 'Yes, and I update it at least monthly'],
      ['rarely', 'Yes, but I rarely touch it'],
      ['unsure', 'I think so, but I’m not sure'],
      ['no', 'No'],
    ],
  },
  {
    id: 'know', type: 'grid',
    q: 'How well do you know these?',
    hint: 'No wrong answers. This just helps us explain things at the right level.',
    rows: [
      { id: 'seo', label: 'SEO (showing up in search results)', options: [['1', 'New to me'], ['2', 'Heard of it'], ['3', 'Know the basics'], ['4', 'Know it well']] },
      { id: 'gbpKnow', label: 'Google Business Profile', options: [['1', 'New to me'], ['2', 'Heard of it'], ['3', 'Know the basics'], ['4', 'Know it well']] },
    ],
  },
  {
    id: 'missed', type: 'single',
    q: 'You miss a call while you’re on a job. What usually happens?',
    options: [
      ['someone', 'Someone else answers for me'],
      ['sameday', 'I call back the same day'],
      ['later', 'I call back when I can, sometimes the next day'],
      ['slip', 'Honestly, some slip through'],
    ],
  },
  {
    id: 'reviewsGrid', type: 'grid',
    q: 'How do you handle reviews?',
    rows: [
      { id: 'ask', label: 'Asking happy customers for a review', options: [['always', 'Every time'], ['sometimes', 'Sometimes'], ['rarely', 'Rarely or never']] },
      { id: 'reply', label: 'Replying to the reviews you get', options: [['always', 'Every time'], ['sometimes', 'Sometimes'], ['rarely', 'Rarely or never']] },
    ],
  },
  {
    id: 'frustration', type: 'text', optional: true, max: 500,
    q: 'What’s your biggest frustration with marketing?',
    hint: 'Optional. A sentence is plenty.',
  },
  {
    id: 'budget', type: 'single',
    q: 'About how much do you spend on marketing in a typical month?',
    options: [
      ['0', '$0'],
      ['lt100', 'Under $100'],
      ['100-300', '$100 to $300'],
      ['300-750', '$300 to $750'],
      ['750plus', '$750 or more'],
      ['skip', 'I’d rather not say'],
    ],
  },
];

/* Outcome-only results. No how-to steps, no promises. */
export const OPPORTUNITIES = {
  gbp: {
    title: 'Get found on Google and Maps',
    text: 'When someone nearby searches for what you do, a complete, active Google profile is what puts your name and number in front of them. Yours has room to bring in more of those calls.',
  },
  missed: {
    title: 'Turn missed calls into booked jobs',
    text: 'A call you can’t answer on a job is a customer deciding whether to wait or call someone else. Getting back to them in seconds keeps more of those jobs yours.',
  },
  reviews: {
    title: 'Earn more fresh reviews',
    text: 'Recent reviews are one of the first things people check before they call. A steady flow of new ones from real customers helps strangers trust you faster.',
  },
  replies: {
    title: 'Show you care in your reviews',
    text: 'Replies tell future customers someone is paying attention. A short, kind reply to every review makes your business look established and responsive.',
  },
  referrals: {
    title: 'Help referrals find you',
    text: 'Even when a friend recommends you, most people look you up first. Being easy to find, with good reviews waiting, helps more of those referrals turn into calls.',
  },
  leadsites: {
    title: 'Rely less on paid lead sites',
    text: 'Customers who find you directly don’t come with a per-lead fee or three competitors. A stronger presence of your own means more calls that are yours alone.',
  },
  social: {
    title: 'Show your work where locals scroll',
    text: 'Before-and-after photos and quick job videos show neighbors what you do. Regular posts keep your name in mind before they need you.',
  },
  time: {
    title: 'Get time back every week',
    text: 'Follow-ups, reminders and review requests that go out on their own mean less chasing at night and fewer jobs slipping through the cracks.',
  },
  website: {
    title: 'Give customers a place to land',
    text: 'A simple, fast site that works on phones answers the basics (what you do, where, and how to reach you) so people are ready to call.',
  },
  clarity: {
    title: 'Know what’s actually working',
    text: 'Plain-English numbers on where your calls come from let you stop guessing and put your time and money where it pays off.',
  },
  ai: {
    title: 'Show up when people ask AI',
    text: 'More people now ask tools like ChatGPT for a local recommendation. Clear, consistent info about your business across the web gives you a better shot at being mentioned.',
  },
};

const ORDER = ['missed', 'gbp', 'reviews', 'time', 'website', 'leadsites', 'referrals', 'replies', 'clarity', 'social', 'ai'];

/* Pick the 3 biggest opportunities from a validated answer set. */
export function topOpportunities(a) {
  const s = Object.fromEntries(ORDER.map((k) => [k, 0]));
  const src = a.sources || [];
  const has = (v) => src.includes(v);
  const n = (v) => Number(v) || 0;

  s.gbp += { no: 5, unsure: 4, rarely: 3, active: 0 }[a.gbp] || 0;
  if (a.goal === 'google') s.gbp += 3;
  if (!has('google')) s.gbp += 1;
  if (n(a.gbpKnow) <= 2) s.gbp += 1;

  s.missed += { slip: 5, later: 3, sameday: 1, someone: 0 }[a.missed] || 0;
  if (a.goal === 'calls') s.missed += 2;

  s.reviews += { rarely: 4, sometimes: 2, always: 0 }[a.ask] || 0;
  if (a.goal === 'reviews') s.reviews += 3;

  s.replies += { rarely: 3, sometimes: 1.5, always: 0 }[a.reply] || 0;
  if (a.goal === 'reviews') s.replies += 1;

  if (has('referrals') && !has('google')) s.referrals += 3;
  if (has('leadsites')) s.leadsites += 3;
  if (!has('social')) s.social += 1.5;
  if (['lawn', 'roofing'].includes(a.business)) s.social += 0.5;

  if (a.goal === 'time') s.time += 5;
  if (a.missed === 'later' || a.missed === 'slip') s.time += 1;
  if (a.goal === 'website') s.website += 5;

  if (has('unsure')) s.clarity += 3;
  if (n(a.seo) <= 2) s.clarity += 1;
  if (['300-750', '750plus'].includes(a.budget)) s.clarity += 1.5;

  s.ai += 1;

  return ORDER.slice()
    .sort((x, y) => (s[y] - s[x]) || (ORDER.indexOf(x) - ORDER.indexOf(y)))
    .slice(0, 3);
}

/* Server-side (and client-side) validation. Returns { ok, answers } or { ok:false, error }. */
export function validateAnswers(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, error: 'answers must be an object' };
  const out = {};
  for (const q of QUESTIONS) {
    if (q.type === 'single') {
      const v = input[q.id];
      if (!q.options.some(([k]) => k === v)) return { ok: false, error: 'invalid ' + q.id };
      out[q.id] = v;
    } else if (q.type === 'multi') {
      const v = input[q.id];
      if (!Array.isArray(v) || v.length < 1 || v.length > q.options.length) return { ok: false, error: 'invalid ' + q.id };
      const allowed = new Set(q.options.map(([k]) => k));
      const uniq = [...new Set(v)];
      if (!uniq.every((x) => allowed.has(x))) return { ok: false, error: 'invalid ' + q.id };
      out[q.id] = uniq;
    } else if (q.type === 'grid') {
      for (const r of q.rows) {
        const v = input[r.id];
        if (!r.options.some(([k]) => k === v)) return { ok: false, error: 'invalid ' + r.id };
        out[r.id] = v;
      }
    } else if (q.type === 'text') {
      const v = input[q.id] == null ? '' : input[q.id];
      if (typeof v !== 'string' || v.length > q.max) return { ok: false, error: 'invalid ' + q.id };
      out[q.id] = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    }
  }
  return { ok: true, answers: out };
}

/* Contact step validation. Phone (10+ digits) or email is required; name and business are optional. */
export function validateContact(input) {
  const clean = (v, max) => (typeof v === 'string' ? v.replace(/[\u0000-\u001F\u007F]/g, ' ').trim() : '').slice(0, max);
  const name = clean(input && input.name, 80);
  const business = clean(input && input.business, 120);
  const contact = clean(input && input.contact, 120);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact);
  const digits = contact.replace(/\D/g, '');
  const isPhone = /^[\d\s().+-]+$/.test(contact) && digits.length >= 10 && digits.length <= 15;
  if (!isEmail && !isPhone) return { ok: false, error: 'Please enter a phone number or email so we can reach you.' };
  return { ok: true, contact: { name, business, contact } };
}
