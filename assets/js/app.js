/* ============================================================
   个人作品集 · app.js（R3）
   双语切换 / GSAP 逐页动效（IO 兜底）/ 数字滚动 / 进度条 / 灯箱
   ?static=1 → 跳过全部动效（QA 截图与降级口径）
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;
  var KEY = 'site-lang';
  var STATIC = location.search.indexOf('static=1') > -1;
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var hasGsap = !STATIC && !reduced && !!(window.gsap && window.ScrollTrigger);

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

  /* ---------- 进场动效 ---------- */
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    var revealEls = Array.prototype.slice.call(d.querySelectorAll('.reveal'));
    revealEls.forEach(function (el) { el.classList.remove('reveal'); });

    // 时间线：整组 stagger
    d.querySelectorAll('.timeline').forEach(function (tl) {
      var items = tl.querySelectorAll('.tl-item');
      if (items.length) {
        gsap.from(items, { opacity: 0, x: -28, duration: 0.7, stagger: 0.13, ease: 'power3.out',
          scrollTrigger: { trigger: tl, start: 'top 82%', once: true } });
      }
    });

    // 其余 reveal 元素：逐个进场，保留 data-delay 节奏
    revealEls.forEach(function (el) {
      if (el.closest('.timeline')) return;
      gsap.from(el, { opacity: 0, y: 24, duration: 0.75, delay: parseFloat(el.dataset.delay || 0), ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });

    // 首页数据区：随滚动轻微上浮（scrub）
    var stats = d.querySelector('.stats');
    if (stats) {
      gsap.to(stats.querySelectorAll('.stat'), { y: function (i) { return -(6 + i * 5); }, ease: 'none',
        scrollTrigger: { trigger: stats, start: 'top 92%', end: 'bottom 45%', scrub: 0.5 } });
    }

    // 章节转场：分隔线扫入
    d.querySelectorAll('.sec').forEach(function (sec, i) {
      if (i === 0) return;
      gsap.to(sec, { '--sw': 1, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 96%', end: 'top 58%', scrub: 0.5 } });
    });

    // 项目封面视差
    d.querySelectorAll('.p-cover').forEach(function (img) {
      var wrap = img.closest('.p-cover-wrap') || img;
      gsap.fromTo(img, { yPercent: -3 }, { yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // 画廊逐张入场
    d.querySelectorAll('.gallery figure').forEach(function (fig, i2) {
      gsap.from(fig, { y: 26, opacity: 0, duration: 0.7, delay: (i2 % 4) * 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: fig, start: 'top 94%', once: true } });
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else {
    var io = null;
    if (!STATIC && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
    }
    d.querySelectorAll('.reveal').forEach(function (el) {
      if (STATIC) { el.classList.add('in'); return; }
      if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay;
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  /* ---------- 数字滚动 ---------- */
  var counters = d.querySelectorAll('[data-count]');
  if (STATIC || reduced || !('IntersectionObserver' in window)) {
    counters.forEach(function (el) { el.textContent = el.dataset.count; });
  } else {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        co.unobserve(en.target);
        var el = en.target;
        var end = parseFloat(el.dataset.count);
        var dec = el.dataset.dec ? parseInt(el.dataset.dec, 10) : 0;
        var dur = 1100;
        var t0 = performance.now();
        function step(t) {
          var p = Math.min(1, (t - t0) / dur);
          var v = end * (1 - Math.pow(1 - p, 3));
          el.textContent = v.toFixed(dec);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { el.textContent = '0'; co.observe(el); });
  }

  /* ---------- 移动端菜单 ---------- */
  var burger = d.querySelector('.burger');
  var menu = d.querySelector('.nav-links');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('open'); });
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
  d.querySelectorAll('.gallery img').forEach(function (img) {
    img.addEventListener('click', function () {
      lb.querySelector('img').src = img.currentSrc || img.src;
      lb.classList.add('open');
    });
  });

  /* ---------- 页脚年份 ---------- */
  d.querySelectorAll('.year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- 阅读进度条 ---------- */
  var bar = d.createElement('div');
  bar.className = 'progress';
  d.body.appendChild(bar);
  function updBar() {
    var h = d.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max > 0) bar.style.transform = 'scaleX(' + (h.scrollTop / max) + ')';
  }
  d.addEventListener('scroll', updBar, { passive: true });
  updBar();
})();
