/* Marketing Check-Up (browser). Results are computed here, instantly.
   Saving is best-effort: if the API is unavailable the visitor still gets results. */
import { QUESTIONS, OPPORTUNITIES, topOpportunities, validateAnswers, validateContact } from './quiz-schema.js';

const root = document.getElementById('quiz');
if (root) init(root);

function init(root) {
  const api = (path) => new URL((root.dataset.api || 'api/') + path, document.baseURI).href;
  const total = QUESTIONS.length;
  const live = root.querySelector('.q-live');
  const stage = root.querySelector('.q-stage');
  let step = -1;
  let answers = {};
  let startedAt = 0;
  let saved = null; // { id, token } once the answers are stored
  let saving = Promise.resolve();
  let lastPointer = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const announce = (t) => { live.textContent = ''; setTimeout(() => { live.textContent = t; }, 30); };

  function focusHeading() {
    const h = stage.querySelector('[data-focus]');
    if (h) h.focus({ preventScroll: true });
    const top = root.getBoundingClientRect().top;
    if (top < 60 || top > window.innerHeight * 0.4) {
      root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function progress(n) {
    const pct = Math.round((n / total) * 100);
    return `<div class="q-top">
      <div class="q-bar" role="progressbar" aria-label="Check-up progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}" aria-valuetext="Question ${n} of ${total}"><span style="width:${pct}%"></span></div>
      <p class="q-count">Question ${n} of ${total}</p>
    </div>`;
  }

  function optionHtml(type, name, [value, label], checked) {
    return `<label class="q-opt"><input type="${type}" name="${name}" value="${esc(value)}"${checked ? ' checked' : ''}><span>${esc(label)}</span></label>`;
  }

  function renderStep() {
    const q = QUESTIONS[step];
    const n = step + 1;
    let body = '';
    if (q.type === 'single') {
      body = `<div class="q-opts">${q.options.map((o) => optionHtml('radio', q.id, o, answers[q.id] === o[0])).join('')}</div>`;
    } else if (q.type === 'multi') {
      const cur = answers[q.id] || [];
      body = `<div class="q-opts">${q.options.map((o) => optionHtml('checkbox', q.id, o, cur.includes(o[0]))).join('')}</div>`;
    } else if (q.type === 'grid') {
      body = q.rows.map((r) => `<fieldset class="q-row"><legend>${esc(r.label)}</legend>
        <div class="q-seg" style="--cols:${r.options.length}">${r.options.map((o) => optionHtml('radio', r.id, o, answers[r.id] === o[0])).join('')}</div></fieldset>`).join('');
    } else if (q.type === 'text') {
      body = `<label class="sr" for="q-text">${esc(q.q)}</label>
        <textarea id="q-text" name="${q.id}" rows="3" maxlength="${q.max}" placeholder="Type here, or skip">${esc(answers[q.id] || '')}</textarea>`;
    }
    const last = n === total;
    const nextLabel = q.type === 'text' ? 'Next' : last ? 'See my results' : 'Next';
    stage.innerHTML = `${progress(n)}
      <form class="q-step" novalidate>
        <fieldset class="q-main">
          <legend><span class="q-h" tabindex="-1" data-focus>${esc(q.q)}</span></legend>
          ${q.hint ? `<p class="q-hint">${esc(q.hint)}</p>` : ''}
          ${body}
        </fieldset>
        <p class="q-err" role="alert"></p>
        <div class="q-nav">
          <button type="button" class="q-back"${step === 0 ? ' hidden' : ''}>Back</button>
          <button type="submit" class="btn q-next">${q.type === 'text' && !answers[q.id] ? 'Skip' : nextLabel}</button>
        </div>
      </form>`;
    const form = stage.querySelector('form');
    form.addEventListener('pointerdown', () => { lastPointer = Date.now(); });
    form.addEventListener('change', () => {
      collect(q, form);
      // One tap on a single-choice answer moves on. Keyboard users press Next instead,
      // so arrow keys can move through the choices without jumping ahead.
      if (q.type === 'single' && Date.now() - lastPointer < 800) setTimeout(() => next(q, form), 220);
    });
    if (q.type === 'text') {
      const ta = form.querySelector('textarea');
      const btn = form.querySelector('.q-next');
      ta.addEventListener('input', () => { btn.textContent = ta.value.trim() ? nextLabel : 'Skip'; });
    }
    form.addEventListener('submit', (e) => { e.preventDefault(); collect(q, form); next(q, form); });
    form.querySelector('.q-back').addEventListener('click', () => { step -= 1; renderStep(); focusHeading(); announce(`Question ${step + 1} of ${total}`); });
    focusHeading();
  }

  function collect(q, form) {
    const fd = new FormData(form);
    if (q.type === 'single') answers[q.id] = fd.get(q.id) || undefined;
    else if (q.type === 'multi') answers[q.id] = fd.getAll(q.id);
    else if (q.type === 'grid') q.rows.forEach((r) => { answers[r.id] = fd.get(r.id) || undefined; });
    else if (q.type === 'text') answers[q.id] = (fd.get(q.id) || '').toString().slice(0, q.max);
  }

  function answered(q) {
    if (q.type === 'single') return !!answers[q.id];
    if (q.type === 'multi') return (answers[q.id] || []).length > 0;
    if (q.type === 'grid') return q.rows.every((r) => !!answers[r.id]);
    return true;
  }

  let advancing = false;
  function next(q, form) {
    if (advancing || QUESTIONS[step] !== q) return;
    const err = form.querySelector('.q-err');
    if (!answered(q)) {
      err.textContent = q.type === 'multi' ? 'Pick at least one.' : q.type === 'grid' ? 'Pick one answer in each row.' : 'Pick an answer to continue.';
      return;
    }
    advancing = true;
    setTimeout(() => { advancing = false; }, 300);
    if (step + 1 < total) {
      step += 1;
      renderStep();
      announce(`Question ${step + 1} of ${total}`);
    } else {
      finish();
    }
  }

  function finish() {
    const v = validateAnswers(answers);
    if (!v.ok) { step = 0; renderStep(); return; }
    const top = topOpportunities(v.answers);
    saving = save(v.answers);
    renderResults(top);
  }

  async function save(clean) {
    try {
      const res = await fetch(api('quiz'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: clean, ms: Date.now() - startedAt, website: root.querySelector('.q-hp').value }),
        keepalive: true,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.id && data.token) saved = { id: data.id, token: data.token };
    } catch (e) { /* offline or no API: results still shown */ }
  }

  function renderResults(top) {
    stage.innerHTML = `
      <div class="q-results">
        <p class="eyebrow">Your check-up results</p>
        <h3 class="q-h" tabindex="-1" data-focus>Your 3 biggest opportunities</h3>
        <ol class="q-opps">
          ${top.map((k, i) => `<li><span class="q-num" aria-hidden="true">${i + 1}</span><div><h4>${esc(OPPORTUNITIES[k].title)}</h4><p>${esc(OPPORTUNITIES[k].text)}</p></div></li>`).join('')}
        </ol>
        <form class="q-contact" novalidate>
          <h3 class="q-sub">Want me to look at your business?</h3>
          <p class="q-hint">Optional. Leave your info and Kyle will take a free look and follow up with ideas. You can also just call <a href="tel:+13862277496">(386)&nbsp;227-7496</a>.</p>
          <div class="q-fields">
            <label>Your name <span class="q-opt-tag">(optional)</span><input name="name" autocomplete="name" maxlength="80"></label>
            <label>Business name <span class="q-opt-tag">(optional)</span><input name="business" autocomplete="organization" maxlength="120"></label>
            <label class="q-wide">Best phone or email<input name="contact" autocomplete="on" maxlength="120" required aria-describedby="q-cerr"></label>
          </div>
          <p class="q-err" id="q-cerr" role="alert"></p>
          <div class="q-nav">
            <button type="button" class="q-back q-restart">Start over</button>
            <button type="submit" class="btn q-next">Send to Kyle</button>
          </div>
        </form>
      </div>`;
    const form = stage.querySelector('.q-contact');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const err = form.querySelector('.q-err');
      const c = validateContact({ name: fd.get('name'), business: fd.get('business'), contact: fd.get('contact') });
      if (!c.ok) { err.textContent = c.error; form.querySelector('[name=contact]').focus(); return; }
      const btn = form.querySelector('.q-next');
      btn.disabled = true; btn.textContent = 'Sending…'; err.textContent = '';
      let ok = false;
      await saving;
      if (saved) {
        try {
          const res = await fetch(api('quiz/contact'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...saved, ...c.contact, website: root.querySelector('.q-hp').value }),
          });
          ok = res.ok;
        } catch (e2) { ok = false; }
      }
      if (ok) {
        form.innerHTML = `<h3 class="q-sub" tabindex="-1" data-focus>Thanks${c.contact.name ? ', ' + esc(c.contact.name.split(' ')[0]) : ''}. Got it.</h3>
          <p class="q-hint">Kyle will take a look and reach out. Want to talk sooner? Call or text <a href="tel:+13862277496">(386)&nbsp;227-7496</a>.</p>`;
      } else {
        const body = encodeURIComponent(`Name: ${c.contact.name}\nBusiness: ${c.contact.business}\nContact: ${c.contact.contact}\n\nMy check-up results:\n${top.map((k, i) => `${i + 1}. ${OPPORTUNITIES[k].title}`).join('\n')}`);
        form.innerHTML = `<h3 class="q-sub" tabindex="-1" data-focus>We couldn’t send that just now.</h3>
          <p class="q-hint">Sorry about that. Please <a href="mailto:hello@putnamleads.com?subject=Marketing%20Check-Up&body=${body}">email it to Kyle</a> (it’s filled in for you) or call or text <a href="tel:+13862277496">(386)&nbsp;227-7496</a>.</p>`;
      }
      form.querySelector('[data-focus]').focus();
    });
    stage.querySelector('.q-restart').addEventListener('click', () => { answers = {}; saved = null; start(); });
    focusHeading();
    announce('Your results are ready.');
  }

  function start() {
    step = 0;
    startedAt = Date.now();
    root.classList.add('running');
    renderStep();
    announce(`Question 1 of ${total}`);
  }

  root.querySelector('.q-start').addEventListener('click', start);
  root.classList.add('ready');
}
