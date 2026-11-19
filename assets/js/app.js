/* ============================================================
   app.js — 双语 / 进场 / 计数器 / 灯箱 / 交互
   ?static=1 跳过动效（QA 与降级口径）
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;
  var KEY = 'site-lang';
  var STATIC = location.search.indexOf('static=1') > -1;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var animated = !STATIC && !reduced;
  var hasGsap = animated && !!(window.gsap && window.ScrollTrigger);
  if (STATIC) root.classList.add('static');

  /* ---------- 双语 ---------- */
  d.querySelectorAll('[data-i18n]').forEach(function (el) {
    if (el.getAttribute('data-zh') === null) el.setAttribute('data-zh', el.innerHTML);
  });

  function apply(lang) {
    root.dataset.lang = lang;
    root.lang = lang === 'en' ? 'en' : 'zh-CN';
    d.querySelectorAll('[data-i18n]').forEach(function (el) {
      var v = el.getAttribute(lang === 'en' ? 'data-en' : 'data-zh');
      if (v !== null) el.innerHTML = v;
    });
    d.querySelectorAll('.lang-switch').forEach(function (b) {
      b.textContent = lang === 'en' ? '中文' : 'EN';
    });
    if (typeof window.__onLangChange === 'function') {
      try { window.__onLangChange(lang); } catch (e) {}
    }
  }

  var lang = 'zh';
  try { lang = localStorage.getItem(KEY) || 'zh'; } catch (e) {}
  apply(lang);

  d.querySelectorAll('.lang-switch').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = lang === 'zh' ? 'en' : 'zh';
      try { localStorage.setItem(KEY, lang); } catch (e) {}
      apply(lang);
    });
  });

  /* ---------- 进场 ---------- */
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    var revealEls = Array.prototype.slice.call(d.querySelectorAll('.reveal'));
    revealEls.forEach(function (el) { el.classList.remove('reveal'); });

    // 时间线整组 stagger
    d.querySelectorAll('.timeline').forEach(function (tl) {
      var items = tl.querySelectorAll('.tl-item');
      if (items.length) {
        gsap.from(items, {
          opacity: 0, y: 22, duration: 0.8, stagger: 0.09, ease: 'power3.out',
          scrollTrigger: { trigger: tl, start: 'top 84%', once: true }
        });
      }
    });

    revealEls.forEach(function (el) {
      if (el.closest('.timeline')) return;
      gsap.from(el, {
        opacity: 0, y: 26, duration: 0.9, delay: parseFloat(el.dataset.delay || 0),
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 94%', once: true }
      });
    });

    // 大标题：逐行上浮
    d.querySelectorAll('.hero-copy h1').forEach(function (h) {
      gsap.from(h, { opacity: 0, y: 30, duration: 1.1, delay: 0.08, ease: 'power3.out' });
    });

    // 数据区轻微错位
    var stats = d.querySelector('.stats');
    if (stats) {
      gsap.to(stats.querySelectorAll('.stat'), {
        y: function (i) { return -(4 + i * 4); }, ease: 'none',
        scrollTrigger: { trigger: stats, start: 'top 96%', end: 'bottom 40%', scrub: 0.6 }
      });
    }

    // 封面视差
    d.querySelectorAll('.p-cover').forEach(function (img) {
      var wrap = img.closest('.p-cover-wrap') || img;
      gsap.fromTo(img, { yPercent: -2 }, { yPercent: 3, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    d.querySelectorAll('.gallery figure').forEach(function (fig, i) {
      gsap.from(fig, { y: 24, opacity: 0, duration: 0.8, delay: (i % 4) * 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: fig, start: 'top 95%', once: true } });
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    var io = null;
    if (animated && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    }
    d.querySelectorAll('.reveal').forEach(function (el) {
      if (!animated) { el.classList.add('in'); return; }
      if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay;
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ---------- 数字滚动 ---------- */
  var counters = d.querySelectorAll('[data-count]');
  if (!animated || !('IntersectionObserver' in window)) {
    counters.forEach(function (el) { el.textContent = el.dataset.count; });
  } else {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target;
        var end = parseFloat(el.dataset.count);
        var dec = el.dataset.dec ? parseInt(el.dataset.dec, 10) : 0;
        var dur = 1400;
        var t0 = performance.now();
        function step(t) {
          var p = Math.min(1, (t - t0) / dur);
          var v = end * (1 - Math.pow(1 - p, 3));
          el.textContent = v.toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { el.textContent = '0'; co.observe(el); });
  }

  /* ---------- 导航：滚动状态 ---------- */
  var nav = d.querySelector('.nav');
  function onScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 12);
  }
  d.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  var burger = d.querySelector('.burger');
  var menu = d.querySelector('.nav-links');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- 卡片跟随光 ---------- */
  if (window.matchMedia('(hover:hover)').matches) {
    d.querySelectorAll('.pcard, .hv-panel').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ---------- 灯箱 ---------- */
  var lb = d.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<img alt="">';
  d.body.appendChild(lb);
  lb.addEventListener('click', function () { lb.classList.remove('open'); });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') lb.classList.remove('open');
  });
  d.querySelectorAll('.gallery img, .zoomable').forEach(function (img) {
    img.addEventListener('click', function () {
      lb.querySelector('img').src = img.currentSrc || img.src;
      lb.classList.add('open');
    });
  });

  /* ---------- 复制邮箱 ---------- */
  var toast = d.createElement('div');
  toast.className = 'toast';
  d.body.appendChild(toast);
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }
  function legacyCopy(text) {
    var ta = d.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    d.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = d.execCommand('copy'); } catch (e) { ok = false; }
    d.body.removeChild(ta);
    return ok;
  }

  d.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var shown = false;
      function done() {
        if (shown) return;
        shown = true;
        showToast(lang === 'en' ? 'Copied — ' + text : '已复制 · ' + text);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text); done(); });
        setTimeout(function () { if (!shown) { legacyCopy(text); done(); } }, 800);
      } else {
        legacyCopy(text);
        done();
      }
    });
  });

  /* ---------- 页脚年份 ---------- */
  d.querySelectorAll('.year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 阅读进度 ---------- */
  var bar = d.createElement('div');
  bar.className = 'progress';
  d.body.appendChild(bar);
  function updBar() {
    var h = d.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max > 0) bar.style.transform = 'scaleX(' + Math.min(1, h.scrollTop / max) + ')';
  }
  d.addEventListener('scroll', updBar, { passive: true });
  updBar();

  /* ---------- 对外暴露 ---------- */
  window.SITE = { animated: animated, static: STATIC, lang: function () { return lang; } };
})();
