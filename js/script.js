/* ============================================================
   LUXURY WEDDING INVITATION — script.js
   Intro · doors · hall · scroll reveals · countdown · audio
   ============================================================ */
(function () {
  'use strict';

  var C = window.WEDDING_CONFIG || {};
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- tiny helpers ---------- */
  function $(s, ctx) { return (ctx || document).querySelector(s); }
  function $$(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function arFirst(s) { return String(s || '').trim().split(/\s+/)[0] || ''; }

  var docEl = document.documentElement;
  var body = document.body;

  /* ============================================================
     1 · APPLY CONFIG TEXT
     ============================================================ */
  (function applyText() {
    var overrides = {
      headlineEn: getPath('couple.headlineEn'),
      groomAr: getPath('couple.groom.ar'),
      groomEn: getPath('couple.groom.en'),
      brideAr: getPath('couple.bride.ar'),
      brideEn: getPath('couple.bride.en'),
      dateEn: getPath('wedding.dateLabelEn'),
      dateAr: getPath('wedding.dateLabelAr'),
      welcomeAr: getPath('couple.welcomeAr'),
      monogram: getPath('couple.groom.firstName'),
      monogram2: getPath('couple.bride.firstName'),
      cdTitle: getPath('wedding.countdownTitleEn'),
      cdQuote: getPath('wedding.countdownSubtitleAr'),
      cdDateChip: getPath('wedding.dateLabelAr'),
      cdTimeChip: getPath('wedding.ceremonyTime'),
      cdDoneEn: getPath('wedding.countdownDoneTitleEn'),
      cdDoneAr: getPath('wedding.countdownDoneAr'),
      venueNameAr: getPath('venue.nameAr'),
      venueNameEn: getPath('venue.nameEn'),
      venueCityAr: getPath('venue.cityAr'),
      venueCityEn: getPath('venue.cityEn'),
      venueAddr: getPath('venue.addressAr'),
      venueRec: getPath('venue.guestsReception'),
      mapBtnAr: getPath('venue.mapsButtonAr'),
      mapBtnEn: getPath('venue.mapsButtonEn'),
      arrEn: getPath('hall.arrivalLineEn'),
      arrAr: getPath('hall.arrivalLineAr')
    };

    function getPath(p) {
      return p.split('.').reduce(function (o, k) { return o && o[k] !== undefined ? o[k] : undefined; }, C);
    }

    // computed fields
    var g = C.couple && C.couple.groom || {};
    var b = C.couple && C.couple.bride || {};
    overrides.introNames = [g.en, b.en].filter(Boolean).join(' & ');
    overrides.groomAr2 = arFirst(g.ar);
    overrides.brideAr2 = arFirst(b.ar);

    $$('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = overrides[key];
      if (val !== undefined && val !== null && val !== '') el.textContent = val;
    });

    // venue + countdown chips are inside reveal elements; also fix the date chip value references
    var mapBtn = $('#map-btn');
    if (mapBtn && C.venue && C.venue.mapsUrl) mapBtn.setAttribute('href', C.venue.mapsUrl);
  })();

  /* ============================================================
     2 · IMAGES (config paths + graceful fallback)
     ============================================================ */
  (function applyImages() {
    if (!C.images) return;

    var defaults = {
      coupleMain: 'assets/images/couple-main.svg',
      groom: 'assets/images/groom.svg',
      bride: 'assets/images/bride.svg',
      'gallery-0': 'assets/images/gallery/photo-1.svg',
      'gallery-1': 'assets/images/gallery/photo-2.svg',
      'gallery-2': 'assets/images/gallery/photo-3.svg',
      'gallery-3': 'assets/images/gallery/photo-4.svg'
    };

    function pick(key) {
      if (key === 'coupleMain') return C.images.coupleMain;
      if (key === 'groom') return C.images.groom;
      if (key === 'bride') return C.images.bride;
      if (key.indexOf('gallery') === 0) {
        var i = parseInt(key.split('-')[1], 10);
        return C.images.gallery && C.images.gallery[i];
      }
      return undefined;
    }

    $$('img[data-img]').forEach(function (img) {
      var key = img.getAttribute('data-img');
      var src = pick(key);
      var fallback = defaults[key];
      img.setAttribute('loading', key === 'coupleMain' ? 'eager' : 'lazy');
      if (src) img.setAttribute('src', src);
      img.addEventListener('error', function () {
        var cur = img.getAttribute('src');
        if (cur !== fallback) {
          img.setAttribute('src', fallback);
          if (window.console) console.warn('[wedding] image missing, using placeholder: ' + cur);
        } else if (window.console) {
          console.warn('[wedding] placeholder image missing: ' + fallback);
        }
      }, true);
    });

    // alt/labels from config names
    if (C.couple) {
      $$('img[data-img="bride"]').forEach(function (img) {
        img.alt = 'صورة العروس' + (C.couple.bride.ar ? ' — ' + C.couple.bride.ar : '');
      });
      $$('img[data-img="groom"]').forEach(function (img) {
        img.alt = 'صورة العريس' + (C.couple.groom.ar ? ' — ' + C.couple.groom.ar : '');
      });
    }
  })();

  /* ============================================================
     3 · PARTICLE SYSTEM (canvas)
     ============================================================ */
  function ParticleSystem(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.colors = opts.colors || ['#d8b45a', '#f0d795', '#7a5c24'];
    this.speedMul = opts.speed || 1;
    this.sizeMul = opts.size || 1;
    this.parts = [];
    this._raf = 0;
    this._on = false;
    this._sprites = {};
    var self = this;
    this._resize = function () { self.resize(); };
    window.addEventListener('resize', this._resize);
    this.resize();
    self._buildSprites();
    if (reducedMotion) {
      self.drawStatic();
    } else {
      self._on = true;
      self._raf = requestAnimationFrame(self._tick.bind(self));
    }
  }

  ParticleSystem.prototype._buildSprites = function () {
    var self = this;
    this.colors.forEach(function (col) {
      if (self._sprites[col]) return;
      var s = document.createElement('canvas');
      s.width = s.height = 32;
      var c = s.getContext('2d');
      var g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, col);
      g.addColorStop(0.35, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = 1;
      c.fillStyle = g;
      c.fillRect(0, 0, 32, 32);
      self._sprites[col] = s;
    });
  };

  ParticleSystem.prototype.resize = function () {
    var dpr = clamp(window.devicePixelRatio || 1, 1, 2);
    this.w = this.canvas.clientWidth || this.canvas.offsetWidth || window.innerWidth;
    this.h = this.canvas.clientHeight || this.canvas.offsetHeight || window.innerHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.count = Math.max(10, Math.round((this._max || 60) * Math.min(1, (this.w * this.h) / (1500 * 820))));
    this._spawn();
  };

  ParticleSystem.prototype._max = 60;

  ParticleSystem.prototype._spawn = function () {
    var self = this;
    var parts = [];
    for (var i = 0; i < this.count; i++) {
      parts.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(0.08 + Math.random() * 0.22),
        size: (0.7 + Math.random() * 2.1) * this.sizeMul,
        alpha: 0.25 + Math.random() * 0.5,
        tw: Math.random() * 6.28,
        ts: 0.3 + Math.random() * 0.9,
        col: self.colors[(Math.random() * self.colors.length) | 0]
      });
    }
    this.parts = parts;
  };

  ParticleSystem.prototype._tick = function () {
    if (!this._on) return;
    if (document.hidden) { this._raf = requestAnimationFrame(this._tick.bind(this)); return; }
    var ctx = this.ctx;
    var t = performance.now() / 1000;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      p.x += p.vx * this.speedMul + Math.sin(t * 0.4 + p.tw) * 0.12;
      p.y += p.vy * this.speedMul;
      var a = p.alpha * (0.55 + 0.45 * Math.sin(t * p.ts + p.tw));
      if (p.y < -10) { p.y = this.h + 8; p.x = Math.random() * this.w; }
      if (p.x < -12) p.x = this.w + 10;
      if (p.x > this.w + 12) p.x = -10;
      var size = p.size * 4.4;
      ctx.globalAlpha = a;
      ctx.drawImage(this._sprites[p.col], p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    this._raf = requestAnimationFrame(this._tick.bind(this));
  };

  ParticleSystem.prototype.drawStatic = function () {
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = 'lighter';
    var self = this;
    this.parts.slice(0, 40).forEach(function (p) {
      var size = p.size * 4;
      ctx.globalAlpha = 0.5;
      ctx.drawImage(self._sprites[p.col], p.x - size / 2, p.y - size / 2, size, size);
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  };

  ParticleSystem.prototype.stop = function () {
    this._on = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._resize);
    this.ctx.clearRect(0, 0, this.w, this.h);
  };

  // ---- instantiate ----
  var eff = C.effects || {};

  var introParticles = spawnIf('#canvas-intro', Math.round(eff.particles || 60) * 0.5, 0.9, 0.9);
  var hallParticles = spawnIf('#canvas-hall', Math.round(eff.particles || 60) * 0.45, 0.7, 0.75);
  var siteParticles = spawnIf('#canvas-site', Math.round(eff.particles || 60) * 0.8, 1, 1);

  function spawnIf(sel, count, speed, size) {
    var cv = $(sel);
    if (!cv) return null;
    var ps = new ParticleSystem(cv, {
      count: count,
      speed: speed,
      size: size,
      colors: ['#d8b45a', '#f0d795', '#8a6d1f', '#c9a85c']
    });
    ps._max = count;
    ps.resize();
    return ps;
  }

  /* ============================================================
     4 · AUDIO
     ============================================================ */
  var audioToggle = $('#audio-toggle');
  var audio = null;
  var audioLoaded = false;

  function initAudio() {
    if (audio) return;
    var src = C.audio && C.audio.src;
    if (!src) return;
    try {
      audio = new Audio(src);
      audio.loop = true;
      audio.preload = 'auto';
      var vol = typeof (C.audio.volume) === 'number' ? C.audio.volume : 0.55;
      audio.volume = clamp(vol, 0, 1);
      audio.addEventListener('canplaythrough', function () { audioLoaded = true; }, { once: true });
      audio.addEventListener('playing', function () {
        audioToggle.classList.add('is-playing', 'is-on');
        audioToggle.setAttribute('aria-pressed', 'true');
      });
      audio.addEventListener('pause', function () {
        audioToggle.classList.remove('is-playing');
        audioToggle.setAttribute('aria-pressed', 'false');
      });
      audio.addEventListener('error', function () {
        if (window.console) console.warn('[wedding] audio not available: ' + src);
      }, true);
    } catch (e) {
      audio = null;
    }
  }

  function tryPlay() {
    initAudio();
    if (!audio) return Promise.resolve();
    return audio.play().catch(function () {
      // autoplay blocked or file missing — UI stays safe
    });
  }

  audioToggle.addEventListener('click', function () {
    initAudio();
    if (!audio) return;
    if (audio.paused) {
      tryPlay();
    } else {
      audio.pause();
    }
  });

  // show the toggle shortly after load
  setTimeout(function () { audioToggle.classList.add('is-on'); }, 900);

  /* ============================================================
     5 · HALL BACKGROUND
     ============================================================ */
  var hallBg = $('#hall-bg');
  if (hallBg && C.hall && C.hall.image) {
    hallBg.style.backgroundImage = 'url("' + C.hall.image + '")';
  }

  /* ============================================================
     6 · CINEMATIC OPENING
     ============================================================ */
  var stage = $('#stage');
  var intro = $('#intro');
  var doors = $('#doors');
  var hall = $('#hall');
  var arrival = $('#arrival');
  var openBtn = $('#open-btn');

  var opened = false;

  function unlockPage() {
    docEl.classList.remove('locked');
    body.classList.remove('locked');
    window.scrollTo(0, 0);
  }

  openBtn.addEventListener('click', function () {
    if (opened) return;
    opened = true;
    openBtn.setAttribute('aria-disabled', 'true');
    tryPlay();

    // reduced-motion users get a quick, flicker-free transition
    function later(ms) { return reducedMotion ? 60 : ms; }

    // 1 · hide intro
    intro.classList.add('is-out');
    setTimeout(function () {
      intro.style.display = 'none';
      if (introParticles) introParticles.stop();
    }, later(1000));

    // 2 · doors open + hall dolly + arrival text
    doors.classList.add('is-on');
    setTimeout(function () {
      doors.classList.add('is-open');
      hall.classList.add('hall-seq');
      arrival.classList.add('is-on');
    }, later(140));

    // 3 · arrival text fades away
    setTimeout(function () {
      arrival.classList.add('is-off');
    }, later(4300));

    // 4 · reveal the invitation page behind
    setTimeout(function () {
      unlockPage();
      window.scrollTo(0, 0);
    }, later(4600));

    // 5 · crossfade whole stage
    setTimeout(function () {
      stage.classList.add('is-gone');
    }, later(5000));

    setTimeout(function () {
      stage.style.display = 'none';
      if (hallParticles) hallParticles.stop();
    }, later(7200));
  });

  // stagger the intro reveal once DOM + fonts settle
  setTimeout(function () { intro.classList.add('ready'); }, 250);

  /* ============================================================
     7 · COUNTDOWN
     ============================================================ */
  (function countdown() {
    var daysEl = $('#cd-days'), hoursEl = $('#cd-hours'), minEl = $('#cd-min'), secEl = $('#cd-sec');
    var doneEl = $('#cd-done'), doneArEl = $('#cd-done-ar');
    var grid = $('.cd-grid');
    if (!daysEl || !C.wedding) return;

    var target = new Date(C.wedding.countdownDateTime);

    if (isNaN(target.getTime())) {
      // invalid date → show the "ready" message instead of broken numbers
      if (doneEl) doneEl.classList.add('is-on');
      if (doneArEl) doneArEl.classList.add('is-on');
      if (grid) { grid.classList.add('cd-faded'); grid.setAttribute('aria-hidden', 'true'); }
      if (window.console) console.warn('[wedding] countdown date invalid:', C.wedding.countdownDateTime);
      return;
    }

    var finished = false;

    function render() {
      var now = Date.now();
      var diff = target.getTime() - now;

      if (diff <= 0) {
        if (daysEl) daysEl.textContent = '00';
        if (hoursEl) hoursEl.textContent = '00';
        if (minEl) minEl.textContent = '00';
        if (secEl) secEl.textContent = '00';
        if (!finished) {
          finished = true;
          if (grid) { grid.classList.add('cd-faded'); grid.setAttribute('aria-hidden', 'true'); }
          if (doneEl) doneEl.classList.add('is-on');
          if (doneArEl) doneArEl.classList.add('is-on');
        }
        return;
      }

      var sec = Math.floor(diff / 1000);
      var d = Math.floor(sec / 86400);
      var h = Math.floor((sec % 86400) / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;

      daysEl.textContent = pad(d);
      hoursEl.textContent = pad(h);
      minEl.textContent = pad(m);
      secEl.textContent = pad(s);
    }

    render();
    setInterval(render, 1000);
  })();

  /* ============================================================
     8 · SCROLL REVEALS
     ============================================================ */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { setTimeout(function () { el.classList.add('is-in'); }, 40); });
  }

  /* ============================================================
     9 · SCROLL PROGRESS + PARALLAX
     ============================================================ */
  var progressBar = $('.scroll-progress');
  var parallaxEls = $$('.parallax');
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var st = window.pageYOffset || docEl.scrollTop || 0;
      var max = docEl.scrollHeight - window.innerHeight;
      if (progressBar) progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp(st / max, 0, 1) : 0) + ')';

      var vh = window.innerHeight;
      for (var i = 0; i < parallaxEls.length; i++) {
        var el = parallaxEls[i];
        if (!el.parentElement) continue;
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        var mid = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translateY(' + (mid * -0.06).toFixed(1) + 'px)';
      }
      ticking = false;
    });
  }

  if (!reducedMotion) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============================================================
     10 · CUSTOM CURSOR
     ============================================================ */
  (function cursor() {
    if (!hasFinePointer) return;
    if (C.effects && C.effects.customCursor === false) return;
    var ring = $('#cursor');
    if (!ring || reducedMotion) return;

    var x = 0, y = 0, on = false;
    document.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      if (!on) { on = true; ring.classList.add('is-on'); }
      ring.style.transform = 'translate(' + (x - 6) + 'px,' + (y - 6) + 'px) translate(-50%,-50%) scale(1)';
    });

    function setActive(active) {
      ring.classList.toggle('is-active', active);
    }
    var interact = 'a, button, [role="button"], .gal-grid .img-frame';
    document.addEventListener('pointerover', function (e) {
      if (e.target && e.target.closest && e.target.closest(interact)) setActive(true);
    });
    document.addEventListener('pointerout', function (e) {
      if (e.target && e.target.closest && e.target.closest(interact)) setActive(false);
    });
  })();

  /* ============================================================
     11 · LIGHTBOX (gallery)
     ============================================================ */
  (function lightbox() {
    var box = $('#lightbox');
    var img = $('#lightbox-img');
    var cap = $('#lightbox-caption');
    var close = $('#lightbox-close');
    if (!box || !img) return;

    function open(src, caption) {
      img.setAttribute('src', src);
      if (cap) cap.textContent = caption || '';
      box.classList.add('is-on');
      document.addEventListener('keydown', esc, { once: true });
    }
    function closeBox() {
      box.classList.remove('is-on');
      document.removeEventListener('keydown', esc);
    }
    function esc(e) { if (e.key === 'Escape') closeBox(); }

    $$('.gal-grid .img-frame, .gal-main, .portrait .img-frame').forEach(function (frame) {
      var it = frame.querySelector('img');
      if (!it) return;
      frame.setAttribute('tabindex', '0');
      frame.setAttribute('role', 'button');
      frame.addEventListener('click', function () {
        open(it.getAttribute('src'), it.alt);
      });
      frame.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(it.getAttribute('src'), it.alt); }
      });
    });

    if (close) close.addEventListener('click', closeBox);
    box.addEventListener('click', function (e) { if (e.target === box) closeBox(); });
  })();

  /* ============================================================
     12 · SMALL NICETIES
     ============================================================ */
  window.addEventListener('error', function (e) {
    if (e.target && (e.target.tagName === 'IMG' || e.target.tagName === 'AUDIO')) {
      // already handled at element level
      return;
    }
  }, true);

})();