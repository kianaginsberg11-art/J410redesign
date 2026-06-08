let currentSlide = 0;

function slideTo(index) {
  const slides = document.querySelectorAll('.slide');
  if (!slides.length) return;
  slides[currentSlide].classList.remove('active');
  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  const inner = document.querySelector('.slide-track-inner');
  if (inner) {
    inner.style.transition = '';
    inner.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
  }
  const counter = document.querySelector('.slide-counter');
  if (counter) counter.textContent = (currentSlide + 1) + ' / ' + slides.length;
  document.querySelectorAll('.slide-dot').forEach(function (d, i) {
    d.classList.toggle('active', i === currentSlide);
  });
}

function slidePrev() { slideTo(currentSlide - 1); }
function slideNext() { slideTo(currentSlide + 1); }

function toggleNav() {
  const navLinks = document.querySelector(".nav-links");
  const hamburger = document.querySelector(".hamburger");

  if (!navLinks || !hamburger) return;

  navLinks.classList.toggle("open");
  hamburger.setAttribute("aria-expanded", navLinks.classList.contains("open") ? "true" : "false");
}

function playAudio(audioId) {
  const selectedAudio = document.getElementById(audioId);
  if (!selectedAudio) return;

  document.querySelectorAll("audio").forEach(audio => {
    if (audio !== selectedAudio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  document.querySelectorAll('.audio-speaker').forEach(btn => btn.classList.remove('playing'));

  if (selectedAudio.paused) {
    selectedAudio.play();
    const btn = selectedAudio.parentElement?.querySelector('.audio-speaker');
    if (btn) btn.classList.add('playing');
  } else {
    selectedAudio.pause();
  }
}

document.addEventListener("ended", function (e) {
  if (e.target.tagName !== "AUDIO") return;
  document.querySelectorAll('.audio-speaker').forEach(btn => btn.classList.remove('playing'));
}, true);

window.addEventListener('load', function () {
  document.querySelectorAll('.audio-card-wrap').forEach(function (card) {
    const still = card.querySelector('.card-still');
    if (!still) return;
    card.addEventListener('mouseenter', function () { still.style.opacity = '1'; });
    card.addEventListener('mouseleave', function () { still.style.opacity = '0'; });
  });
});

// Close mobile nav when an anchor link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelector('.nav-links')?.classList.remove('open');
    document.querySelector('.hamburger')?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener("play", function (e) {
  if (e.target.tagName !== "AUDIO") return;
  document.querySelectorAll("audio").forEach(audio => {
    if (audio !== e.target) audio.pause();
  });
}, true);

const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener("scroll", () => {
  if (!backToTopBtn) return;
  backToTopBtn.style.display = window.scrollY > 300 ? "block" : "none";
});

backToTopBtn?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ── Kotel Wall ──────────────────────────────────────────────
(function () {
  const NOTE_W    = 58;
  const NOTE_H    = 70;
  const PAD       = 20;
  const MAX_NOTES = 60;

  function getSavedNotes() {
    try { return JSON.parse(localStorage.getItem('kotelNotes') || '[]'); }
    catch { return []; }
  }

  function noteCoords(data, wall) {
    const W = wall.clientWidth;
    const H = wall.clientHeight;
    const x = Math.max(PAD, Math.min(
      Math.round(data.xFrac * (W - NOTE_W - PAD * 2)),
      W - NOTE_W - PAD
    ));
    const y = Math.max(PAD, Math.min(
      Math.round(data.yFrac * (H - NOTE_H - PAD * 2)),
      H - NOTE_H - PAD
    ));
    return { x, y };
  }

  function renderNote(data, animate) {
    const wall = document.getElementById('kotelWall');
    if (!wall) return;
    const { x, y } = noteCoords(data, wall);

    const note = document.createElement('div');
    note.className   = 'kotel-note';
    note.textContent = data.text;
    note.style.left  = x + 'px';
    note.style.top   = y + 'px';
    note.style.transform = `rotate(${data.rot}deg)`;

    if (animate) {
      note.style.opacity    = '0';
      note.style.transform  = `rotate(${data.rot}deg) scale(0.5)`;
      note.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      wall.appendChild(note);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        note.style.opacity   = '1';
        note.style.transform = `rotate(${data.rot}deg) scale(1)`;
      }));
    } else {
      wall.appendChild(note);
    }
  }

  function reloadNotes() {
    const wall = document.getElementById('kotelWall');
    if (!wall) return;
    wall.querySelectorAll('.kotel-note').forEach(n => n.remove());
    getSavedNotes().forEach(n => renderNote(n, false));
  }
  window.reloadNotes = reloadNotes;

  function addNote() {
    const input = document.getElementById('kotelInput');
    const wall  = document.getElementById('kotelWall');
    if (!input || !wall) return;

    const text = input.value.trim();
    if (!text) return;

    const xFrac = 0.04 + Math.random() * 0.88;
    const yFrac = 0.68 + Math.random() * 0.24;
    const rot   = (Math.random() - 0.5) * 14;

    const data = { text, xFrac, yFrac, rot };
    renderNote(data, true);

    const saved = getSavedNotes();
    if (saved.length >= MAX_NOTES) saved.shift();
    saved.push(data);
    try { localStorage.setItem('kotelNotes', JSON.stringify(saved)); } catch {}

    input.value = '';
    const cc = document.getElementById('kotelCharCount');
    if (cc) cc.textContent = '0 / 120';
  }

  window.addEventListener('load', function () {
    reloadNotes();

    document.getElementById('kotelSubmit')
      ?.addEventListener('click', addNote);

    document.getElementById('kotelClear')
      ?.addEventListener('click', function () {
        if (!confirm('Remove all notes from the wall?')) return;
        try { localStorage.removeItem('kotelNotes'); } catch {}
        document.querySelectorAll('#kotelWall .kotel-note').forEach(n => n.remove());
      });

    const input = document.getElementById('kotelInput');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addNote(); }
      });
      input.addEventListener('input', function () {
        const cc = document.getElementById('kotelCharCount');
        if (cc) cc.textContent = input.value.length + ' / 120';
      });
    }

    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(reloadNotes, 200);
    });
  });
}());

// ── Keyboard + swipe navigation for slideshow ──────────────────────────────
document.addEventListener('keydown', function (e) {
  if (document.querySelector('.lightbox.open')) return;
  if (e.key === 'ArrowLeft')  slidePrev();
  if (e.key === 'ArrowRight') slideNext();
});

(function () {
  const track = document.querySelector('.slide-track');
  if (!track) return;

  // Wrap slides in an inner strip so we can translateX the whole track
  const inner = document.createElement('div');
  inner.className = 'slide-track-inner';
  Array.from(track.querySelectorAll('.slide')).forEach(function (s) { inner.appendChild(s); });
  track.appendChild(inner);

  let startX = 0;
  let dragging = false;

  track.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX;
    dragging = true;
    inner.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    const dx     = e.touches[0].clientX - startX;
    const slides = document.querySelectorAll('.slide');
    const atEdge = (currentSlide === 0 && dx > 0) || (currentSlide === slides.length - 1 && dx < 0);
    const pct    = (dx / track.offsetWidth) * 100 * (atEdge ? 0.2 : 1);
    inner.style.transform = 'translateX(' + (-(currentSlide * 100) + pct) + '%)';
  }, { passive: true });

  track.addEventListener('touchend', function (e) {
    dragging = false;
    inner.style.transition = '';
    const dx = startX - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) {
      dx > 0 ? slideNext() : slidePrev();
    } else {
      inner.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    }
  }, { passive: true });
}());

// ── Active nav link via IntersectionObserver ────────────────────────────────
(function () {
  const pages = document.querySelectorAll('.page');
  const links = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(function (link) {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { rootMargin: '-30% 0px -30% 0px' });

  pages.forEach(function (page) { observer.observe(page); });
}());

// ── Scroll-reveal animations ────────────────────────────────────────────────
(function () {
  const revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  [
    '.section-heading',
    '.section-intro',
    '.story-photo',
    'blockquote',
    '.flip-card',
    '.audio-card-wrap',
    '.infographic .stat-card',
    '.infographic .org-card',
    '.video-wrapper',
    '.about-circle',
    '.kotel-wrapper',
    '.story-main p',
  ].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  });
}());

// ── Scroll progress bar ────────────────────────────────────────────────────
(function () {
  const bar = document.getElementById('progress-bar');
  if (!bar) return;
  window.addEventListener('scroll', function () {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (total > 0 ? (window.scrollY / total) * 100 : 0) + '%';
  }, { passive: true });
}());

// ── Animated stat counters ─────────────────────────────────────────────────
(function () {
  const configs = [
    { selector: '.infographic .stat-card:nth-child(1) .stat-num', end: 1500, decimals: 0, suffix: '', localize: true },
    { selector: '.infographic .stat-card:nth-child(2) .stat-num', end: 6.9,  decimals: 1, suffix: '%', localize: false },
    { selector: '.infographic .stat-card:nth-child(3) .stat-num', end: 100,  decimals: 0, suffix: '+', localize: false },
  ];

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateNum(el, cfg) {
    const dur = 1500;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / dur, 1);
      const val = cfg.end * easeOutCubic(p);
      const str = cfg.decimals > 0
        ? val.toFixed(cfg.decimals)
        : cfg.localize ? Math.floor(val).toLocaleString() : String(Math.floor(val));
      el.textContent = str + cfg.suffix;
      if (p < 1) { requestAnimationFrame(tick); } else { el.classList.add('popped'); }
    }
    requestAnimationFrame(tick);
  }

  const obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const cfg = configs.find(function (c) { return document.querySelector(c.selector) === el; });
      if (cfg) animateNum(el, cfg);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });

  configs.forEach(function (cfg) {
    const el = document.querySelector(cfg.selector);
    if (el) obs.observe(el);
  });
}());

// ── Slideshow dot indicators ───────────────────────────────────────────────
(function () {
  const slides = document.querySelectorAll('.slide');
  const counter = document.querySelector('.slide-counter');
  if (!slides.length || !counter) return;

  const wrap = document.createElement('div');
  wrap.className = 'slide-dots';

  slides.forEach(function (_, i) {
    const dot = document.createElement('button');
    dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
    dot.addEventListener('click', function () { slideTo(i); });
    wrap.appendChild(dot);
  });

  counter.insertAdjacentElement('afterend', wrap);
}());

// ── Interactive infographic ────────────────────────────────────────────────
(function () {
  // -- Clickable stat cards --
  const statCards = document.querySelectorAll('.infographic .stat-card');
  const statMeta = [
    "Estimated by Hillel International, based on enrollment data. Jewish students are among the larger religious minority groups on campus.",
    "Based on Cal Poly's total undergraduate enrollment of approximately 21,700 students in 2024–25. Campus Jewish populations vary widely by school.",
    "Chabad hosts weekly Friday Shabbat dinners drawing 80–120 students. Attendance has grown significantly in recent years."
  ];

  statCards.forEach(function (card, i) {
    card.classList.add('interactive');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');

    const hint = document.createElement('span');
    hint.className = 'stat-hint';
    hint.textContent = '+ tap to learn more';
    card.appendChild(hint);

    const ctx = document.createElement('p');
    ctx.className = 'stat-context';
    ctx.textContent = statMeta[i] || '';
    card.appendChild(ctx);

    function toggle() {
      const was = card.classList.contains('active');
      statCards.forEach(function (c) { c.classList.remove('active'); c.setAttribute('aria-expanded', 'false'); });
      if (!was) { card.classList.add('active'); card.setAttribute('aria-expanded', 'true'); }
    }
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  // -- Clickable Shabbat timeline steps --
  const steps = document.querySelectorAll('.infographic .shabbat-step');
  const stepDescs = [
    "As the sun sets, the Jewish Sabbath begins — 25 hours of rest, reflection, and community. Students pause from schoolwork, screens, and daily routines.",
    "Chabad and Hillel both host Friday night dinners, drawing 80–120 students each week. Homemade meals, blessings over wine and challah, and long tables full of conversation.",
    "Morning prayers take place at local synagogues or on campus. For observant students, this is a cornerstone of the weekly Shabbat experience.",
    "After three stars appear in the sky, Shabbat ends with Havdalah — a brief ceremony with a braided candle, wine, and spices, marking the return to the everyday week."
  ];

  const shabbatGrid = document.querySelector('.infographic .shabbat-grid');
  const detail = document.createElement('div');
  detail.className = 'shabbat-detail';
  detail.setAttribute('aria-live', 'polite');
  if (shabbatGrid) shabbatGrid.insertAdjacentElement('afterend', detail);

  steps.forEach(function (step, i) {
    step.classList.add('interactive');
    step.setAttribute('tabindex', '0');
    step.setAttribute('role', 'button');
    step.setAttribute('aria-expanded', 'false');

    function toggle() {
      const was = step.classList.contains('active');
      steps.forEach(function (s) { s.classList.remove('active'); s.setAttribute('aria-expanded', 'false'); });
      if (!was) {
        step.classList.add('active');
        step.setAttribute('aria-expanded', 'true');
        detail.innerHTML = '<p>' + stepDescs[i] + '</p>';
        detail.classList.add('visible');
      } else {
        detail.innerHTML = '';
        detail.classList.remove('visible');
      }
    }
    step.addEventListener('click', toggle);
    step.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}());

// ══════════════════════════════════════════
// WHIMSY & FUN
// ══════════════════════════════════════════

// Confetti burst (used on Kotel submit)
function confettiBurst(cx, cy) {
  var colors = ['#b87878','#c8a882','#5a8a6e','#7a9070','#9a6880','#c8a0a0','#6b9a7a','#c896a8'];
  for (var i = 0; i < 60; i++) {
    var angle = Math.random() * Math.PI * 2;
    var dist  = 90 + Math.random() * 170;
    var w     = 5 + Math.random() * 8;
    var h     = 5 + Math.random() * 9;
    var el    = document.createElement('div');
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;left:' + cx + 'px;top:' + cy + 'px;width:' + w + 'px;height:' + h + 'px;background:' + colors[Math.floor(Math.random() * colors.length)] + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '3px') + ';animation:confetti-fall 1.3s ease-out forwards;';
    el.style.setProperty('--x', (Math.cos(angle) * dist) + 'px');
    el.style.setProperty('--y', (Math.sin(angle) * dist - 140) + 'px');
    el.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(el);
    setTimeout(function(e) { return function() { e.remove(); }; }(el), 1400);
  }
}

// Floating stars (used on Kotel submit)
function floatStars(fromEl) {
  var glyphs = ['✦','✧','★','✨','💫','🌟'];
  var rect = fromEl.getBoundingClientRect();
  var cx = rect.left + rect.width / 2;
  var cy = rect.top  + rect.height / 2;
  for (var i = 0; i < 12; i++) {
    var el = document.createElement('div');
    el.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    el.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;font-size:' + (11 + Math.random() * 13) + 'px;left:' + (cx + (Math.random() - 0.5) * 90) + 'px;top:' + cy + 'px;animation:star-float 1.1s ease-out forwards;';
    el.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
    el.style.setProperty('--dy', -(65 + Math.random() * 90) + 'px');
    document.body.appendChild(el);
    setTimeout(function(e) { return function() { e.remove(); }; }(el), 1200);
  }
}

// Kotel submit → confetti + floating stars
(function () {
  var btn = document.getElementById('kotelSubmit');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var input = document.getElementById('kotelInput');
    if (!input || !input.value.trim()) return;
    var r = btn.getBoundingClientRect();
    confettiBurst(r.left + r.width / 2, r.top + r.height / 2);
    floatStars(btn);
  }, true); // capture phase: fires before addNote clears the input
}());

// Audio wave bars injected into each portrait
(function () {
  document.querySelectorAll('.audio-card-wrap').forEach(function (wrap) {
    var rollover = wrap.querySelector('.rollover-wrap');
    if (!rollover) return;
    var bars = document.createElement('div');
    bars.className = 'wave-bars';
    bars.innerHTML = '<span></span><span></span><span></span><span></span>';
    rollover.appendChild(bars);
  });
}());

// Cursor sparkle trail (desktop only)
(function () {
  if (window.matchMedia('(pointer: coarse)').matches) return;
  var colors = ['#b87878','#c8a882','#5a8a6e','#7a9070','#9a6880'];
  var last = 0;
  document.addEventListener('mousemove', function (e) {
    var now = Date.now();
    if (now - last < 80) return;
    last = now;
    var sz = 4 + Math.random() * 5;
    var el = document.createElement('div');
    el.className = 'cursor-spark';
    el.style.width  = sz + 'px';
    el.style.height = sz + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = e.clientX + 'px';
    el.style.top  = e.clientY + 'px';
    el.style.setProperty('--dx', ((Math.random() - 0.5) * 20) + 'px');
    el.style.setProperty('--dy', -(16 + Math.random() * 28) + 'px');
    document.body.appendChild(el);
    setTimeout(function(e) { return function() { e.remove(); }; }(el), 560);
  });
}());

// ── Reading time in hero ───────────────────────────────────────────────────
(function () {
  var article = document.querySelector('.story-main');
  var byline  = document.querySelector('.hero-content .byline');
  if (!article || !byline) return;
  var words = article.textContent.trim().split(/\s+/).length;
  var mins  = Math.max(1, Math.ceil(words / 200));
  var el    = document.createElement('p');
  el.className   = 'hero-reading-time';
  el.textContent = '~' + mins + ' min read';
  byline.insertAdjacentElement('afterend', el);
}());


// ── Audio progress bars ────────────────────────────────────────────────────
(function () {
  window.addEventListener('load', function () {
    document.querySelectorAll('.audio-card-wrap').forEach(function (wrap) {
      var audio   = wrap.querySelector('audio');
      var speaker = wrap.querySelector('.audio-speaker');
      if (!audio || !speaker) return;

      var bar  = document.createElement('div');
      bar.className = 'audio-progress';
      var fill = document.createElement('div');
      fill.className = 'audio-progress-fill';
      bar.appendChild(fill);
      speaker.insertAdjacentElement('afterend', bar);

      audio.addEventListener('timeupdate', function () {
        if (!audio.duration) return;
        fill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      });
      audio.addEventListener('seeked', function () {
        fill.style.width = (audio.duration ? audio.currentTime / audio.duration * 100 : 0) + '%';
      });
      audio.addEventListener('ended', function () {
        fill.style.width = '0%';
      });
    });
  });
}());

// ── Photo lightbox ─────────────────────────────────────────────────────────
(function () {
  var slides = [];
  var lbIdx  = 0;

  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Photo lightbox');

  var closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = '&times;';

  var prevBtn = document.createElement('button');
  prevBtn.className = 'lightbox-nav lightbox-prev';
  prevBtn.setAttribute('aria-label', 'Previous photo');
  prevBtn.innerHTML = '&#8249;';

  var nextBtn = document.createElement('button');
  nextBtn.className = 'lightbox-nav lightbox-next';
  nextBtn.setAttribute('aria-label', 'Next photo');
  nextBtn.innerHTML = '&#8250;';

  var inner = document.createElement('div');
  inner.className = 'lightbox-inner';

  var lbImg = document.createElement('img');
  lbImg.alt = '';

  var lbCap = document.createElement('figcaption');
  lbCap.className = 'lightbox-caption';

  inner.appendChild(lbImg);
  inner.appendChild(lbCap);
  lb.appendChild(closeBtn);
  lb.appendChild(prevBtn);
  lb.appendChild(nextBtn);
  lb.appendChild(inner);
  document.body.appendChild(lb);

  function showSlide(idx) {
    lbIdx    = (idx + slides.length) % slides.length;
    var s    = slides[lbIdx];
    lbImg.src        = s.src;
    lbImg.alt        = s.alt;
    lbCap.textContent = s.caption;
    prevBtn.style.display = slides.length > 1 ? '' : 'none';
    nextBtn.style.display = slides.length > 1 ? '' : 'none';
  }

  function openLightbox(idx) {
    showSlide(idx);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', function () { showSlide(lbIdx - 1); });
  nextBtn.addEventListener('click', function () { showSlide(lbIdx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  showSlide(lbIdx - 1);
    if (e.key === 'ArrowRight') showSlide(lbIdx + 1);
  });

  window.addEventListener('load', function () {
    document.querySelectorAll('.slide').forEach(function (fig, i) {
      var img = fig.querySelector('img');
      var cap = fig.querySelector('figcaption');
      if (!img) return;
      slides.push({ src: img.src, alt: img.alt, caption: cap ? cap.textContent : '' });
      img.addEventListener('click', function () { openLightbox(i); });
    });
  });
}());

// ── Dreidel spin on click ──────────────────────────────────────────────────
(function () {
  document.querySelectorAll('#story .j-doodle--scatter').forEach(function (svg) {
    if (!svg.querySelector('rect')) return;
    svg.style.pointerEvents = 'auto';
    svg.style.cursor = 'pointer';
    svg.style.zIndex = '5';

    svg.addEventListener('click', function () {
      if (svg.dataset.spinning === '1') return;
      svg.dataset.spinning = '1';
      var m       = (svg.style.transform || '').match(/rotate\(([-\d.]+)deg\)/);
      var baseRot = m ? parseFloat(m[1]) : 14;
      var dur     = 1100;
      var start   = null;
      function step(ts) {
        if (!start) start = ts;
        var t     = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        svg.style.transform = 'rotate(' + (baseRot + 720 * eased) + 'deg)';
        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          svg.style.transform = 'rotate(' + baseRot + 'deg)';
          svg.dataset.spinning = '0';
        }
      }
      requestAnimationFrame(step);
    });
  });
}());

// ── Kotel note count ───────────────────────────────────────────────────────
(function () {
  function getNoteCount() {
    try { return JSON.parse(localStorage.getItem('kotelNotes') || '[]').length; } catch (e) { return 0; }
  }

  function updateCount() {
    var counter = document.getElementById('kotelNoteCount');
    if (!counter) return;
    var n = getNoteCount();
    counter.textContent = n === 0
      ? 'Be the first to leave a note at the Wall.'
      : n + ' note' + (n === 1 ? '' : 's') + ' left at the Wall';
  }

  window.addEventListener('load', function () {
    var form = document.querySelector('.kotel-form');
    if (!form) return;
    var counter = document.createElement('p');
    counter.id        = 'kotelNoteCount';
    counter.className = 'kotel-note-count';
    form.insertAdjacentElement('beforebegin', counter);
    updateCount();

    var wall = document.getElementById('kotelWall');
    if (wall) new MutationObserver(updateCount).observe(wall, { childList: true });
  });
}());

// ── Blockquote hover expand ────────────────────────────────────────────────
(function () {
  var bq = document.querySelector('blockquote');
  if (!bq) return;
  var attr = document.createElement('div');
  attr.className = 'blockquote-attr';
  attr.innerHTML  = '"Honestly, Chabad is the best thing that has happened to me here." — Taylor';
  bq.appendChild(attr);
}());

// ── Hebrew / Jewish term glossary tooltips ────────────────────────────────
(function () {
  var glossary = {
    'Shabbat':  'The Jewish Sabbath — observed from Friday sundown to Saturday nightfall as a day of rest, prayer, and community.',
    'Chabad':   'An Orthodox Jewish movement known for its welcoming, outreach-centered approach to all Jews regardless of background.',
    'Kotel':    'The Western Wall in Jerusalem, Judaism\'s holiest accessible site. Visitors tuck handwritten prayers into its ancient stones.',
    'Havdalah': 'A ceremony marking the end of Shabbat — a braided candle, wine, and fragrant spices welcome the return of the regular week.',
    'challah':  'Traditional braided bread eaten on Shabbat and Jewish holidays, blessed and broken at the dinner table.',
    'kippot':   'Small head coverings (singular: kippah) worn by Jewish men as a sign of reverence.',
    'kippah':   'A small head covering worn by Jewish men as a sign of reverence.',
    'Tzedakah': 'The Jewish concept of charitable giving — a moral obligation rather than optional generosity.',
    'Hillel':   'A Jewish campus organization providing community and programming for Jewish college students worldwide.',
    'diaspora': 'Jewish communities living outside of Israel, scattered across the world since ancient times.',
  };

  var terms   = Object.keys(glossary).sort(function (a, b) { return b.length - a.length; });
  var pattern = new RegExp('\\b(' + terms.map(function (t) {
    return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|') + ')\\b', 'gi');

  var tip = document.createElement('div');
  tip.id  = 'glossary-tooltip';
  document.body.appendChild(tip);
  var hideTimer;

  function showTip(el) {
    clearTimeout(hideTimer);
    tip.textContent = el.dataset.def;
    tip.classList.add('visible');
    var rect = el.getBoundingClientRect();
    var tw   = tip.offsetWidth;
    var th   = tip.offsetHeight;
    var top  = rect.top + window.scrollY - th - 10;
    var left = rect.left + window.scrollX + rect.width / 2 - tw / 2;
    left = Math.max(10, Math.min(left, window.innerWidth - tw - 10));
    if (top < window.scrollY + 10) top = rect.bottom + window.scrollY + 10;
    tip.style.top  = top + 'px';
    tip.style.left = left + 'px';
  }
  function hideTip() { hideTimer = setTimeout(function () { tip.classList.remove('visible'); }, 100); }

  var seen = new Set();

  function wrapNode(node) {
    var text = node.nodeValue;
    if (!pattern.test(text)) return;
    pattern.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = pattern.exec(text)) !== null) {
      var matched = m[0];
      var key = terms.find(function (t) { return t.toLowerCase() === matched.toLowerCase(); });
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      last = m.index + matched.length;
      if (!key || seen.has(key)) { frag.appendChild(document.createTextNode(matched)); continue; }
      seen.add(key);
      var span = document.createElement('span');
      span.className   = 'glossary-term';
      span.textContent = matched;
      span.tabIndex    = 0;
      span.dataset.def = glossary[key];
      span.addEventListener('mouseenter', function () { showTip(this); });
      span.addEventListener('mouseleave', hideTip);
      span.addEventListener('focus',      function () { showTip(this); });
      span.addEventListener('blur',       hideTip);
      frag.appendChild(span);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function walk(root) {
    var nodes = [], n;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var tag = node.parentNode && node.parentNode.tagName && node.parentNode.tagName.toLowerCase();
        if (['script','style','textarea','input','button','a'].indexOf(tag) > -1) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && node.parentNode.classList && node.parentNode.classList.contains('glossary-term')) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && node.parentNode.getAttribute && node.parentNode.getAttribute('aria-hidden') === 'true') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(wrapNode);
  }

  ['#story','#kotel','#audio','#infographic','#video','#photos'].forEach(function (sel) {
    var el = document.querySelector(sel);
    if (el) walk(el);
  });
}());

// ── Nav section progress dots ──────────────────────────────────────────────
(function () {
  var links = document.querySelectorAll('.nav-links a');
  links.forEach(function (link) {
    var dot = document.createElement('span');
    dot.className = 'nav-progress-dot';
    link.appendChild(dot);
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      links.forEach(function (link) {
        if (link.getAttribute('href') === '#' + id) {
          link.querySelector('.nav-progress-dot').classList.add('visited');
        }
      });
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('.page').forEach(function (p) { observer.observe(p); });
}());

// ── Share button ───────────────────────────────────────────────────────────
(function () {
  var icon = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
  var btn = document.createElement('button');
  btn.className = 'share-btn';
  btn.setAttribute('aria-label', 'Share this story');
  btn.innerHTML = icon + ' Share';
  document.body.appendChild(btn);

  btn.addEventListener('click', function () {
    var url  = window.location.href;
    var orig = btn.innerHTML;
    function confirm() {
      btn.classList.add('copied');
      btn.innerHTML = '✓ Link copied!';
      setTimeout(function () { btn.classList.remove('copied'); btn.innerHTML = orig; }, 2200);
    }
    if (navigator.share) {
      navigator.share({ title: document.title, url: url }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(confirm);
    } else {
      var ta = document.createElement('textarea');
      ta.value = url;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); confirm(); } catch (e) {}
      ta.remove();
    }
  });
}());

// ── Keyboard shortcut guide ────────────────────────────────────────────────
(function () {
  var shortcuts = [
    { keys: ['←', '→'], desc: 'Navigate photos' },
    { keys: ['Esc'],     desc: 'Close lightbox'  },
    { keys: ['?'],       desc: 'Show this guide'  },
  ];

  var overlay = document.createElement('div');
  overlay.className = 'shortcuts-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Keyboard shortcuts');

  var rows = shortcuts.map(function (s) {
    var keys = s.keys.map(function (k) { return '<kbd>' + k + '</kbd>'; }).join(' ');
    return '<div class="shortcut-row"><span>' + s.desc + '</span><span class="shortcut-keys">' + keys + '</span></div>';
  }).join('');

  overlay.innerHTML = '<div class="shortcuts-modal"><h3>Keyboard shortcuts</h3>' + rows + '<button class="shortcuts-close-btn">Close</button></div>';
  document.body.appendChild(overlay);

  var closeBtn = overlay.querySelector('.shortcuts-close-btn');
  function open()  { overlay.classList.add('open');    closeBtn.focus(); }
  function close() { overlay.classList.remove('open'); }

  var helpBtn = document.createElement('button');
  helpBtn.className = 'shortcuts-btn';
  helpBtn.setAttribute('aria-label', 'Keyboard shortcuts');
  helpBtn.textContent = '?';
  document.body.appendChild(helpBtn);

  helpBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === '?' && !overlay.classList.contains('open') && !document.querySelector('.lightbox.open')) open();
    if (e.key === 'Escape' && overlay.classList.contains('open')) close();
  });
}());

// ── Hero title word-by-word reveal ──────────────────────────────────────────
(function () {
  var h1 = document.querySelector('.hero h1');
  if (!h1) return;
  var words = h1.textContent.trim().split(/\s+/);
  h1.innerHTML = words.map(function (w, i) {
    return '<span class="hero-word" style="animation-delay:' + (0.12 + i * 0.14) + 's">' + w + '</span>';
  }).join(' ');
}());
