/* Putnam Lead Group — progressive enhancement. The page works without this file. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var saveData = navigator.connection && navigator.connection.saveData;
  var hasIO = 'IntersectionObserver' in window;

  /* Sticky nav hairline */
  var nav = document.querySelector('.nav');
  function onScrollNav() { nav.classList.toggle('scrolled', window.scrollY > 8); }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll('.reveal');
  if (hasIO && !reduce.matches) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el, i) {
      // light stagger for siblings inside grids
      var sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 4) * 70 + 'ms';
      rio.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* Statement: words light up as you scroll */
  var scrub = document.querySelector('.scrub');
  var words = [];
  if (scrub) {
    var parts = scrub.textContent.trim().split(/\s+/);
    var full = scrub.innerHTML;
    scrub.innerHTML = '<span class="sr">' + full + '</span><span aria-hidden="true">' +
      parts.map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ') + '</span>';
    words = scrub.querySelectorAll('.w');
  }
  function onScrollScrub() {
    if (!words.length) return;
    var r = scrub.getBoundingClientRect();
    var vh = window.innerHeight;
    // progress 0 when top hits 85% of viewport, 1 when bottom reaches 45%
    var start = vh * 0.85, end = vh * 0.45;
    var p = (start - r.top) / ((start - end) + r.height);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
  }

  /* Hero parallax */
  var fanMain = document.querySelector('.fan-main');
  var fanSides = document.querySelectorAll('.fan-side');
  function onScrollHero() {
    if (!fanMain) return;
    var y = Math.min(window.scrollY, 700);
    fanMain.style.setProperty('--lift', (-y * 0.08).toFixed(1) + 'px');
    fanSides.forEach(function (el) { el.style.setProperty('--drop', (y * 0.06).toFixed(1) + 'px'); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      onScrollNav();
      if (!reduce.matches) { onScrollScrub(); onScrollHero(); }
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* Hero video: start after the page has loaded, never with reduced motion or Save-Data */
  var heroVid = document.querySelector('.hero-vid');
  if (heroVid && !reduce.matches && !saveData) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        heroVid.src = heroVid.getAttribute('data-src');
        var p = heroVid.play(); if (p && p.catch) p.catch(function () {});
      }, 600);
    });
  }

  /* Showcase videos */
  var reels = document.querySelectorAll('.reel');
  function setBtn(btn, playing) {
    btn.classList.toggle('playing', playing);
    btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
  }
  reels.forEach(function (reel) {
    var v = reel.querySelector('video');
    var btn = reel.querySelector('.vbtn');
    v.removeAttribute('controls');
    v.addEventListener('play', function () { setBtn(btn, true); });
    v.addEventListener('pause', function () { setBtn(btn, false); });
    btn.addEventListener('click', function () {
      if (v.paused) { reel.userPaused = false; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else { reel.userPaused = true; v.pause(); }
    });
  });
  if (hasIO && !reduce.matches && !saveData) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var reel = e.target, v = reel.querySelector('video');
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          if (!reel.userPaused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { threshold: [0, 0.6] });
    reels.forEach(function (r) { vio.observe(r); });
  }

  /* Rail prev/next */
  var rail = document.getElementById('rail');
  var rbtns = document.querySelectorAll('.rbtn');
  function step() { var r = rail.querySelector('.reel'); return r ? r.getBoundingClientRect().width + 22 : 300; }
  function updateRail() {
    var max = rail.scrollWidth - rail.clientWidth - 4;
    rbtns[0].disabled = rail.scrollLeft <= 4;
    rbtns[1].disabled = rail.scrollLeft >= max;
  }
  if (rail) {
    rbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        rail.scrollBy({ left: step() * Number(b.getAttribute('data-dir')), behavior: reduce.matches ? 'auto' : 'smooth' });
      });
    });
    rail.addEventListener('scroll', function () { requestAnimationFrame(updateRail); }, { passive: true });
    window.addEventListener('resize', updateRail, { passive: true });
    updateRail();
  }
})();
