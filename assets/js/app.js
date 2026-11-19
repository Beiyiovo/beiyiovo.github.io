/* ============================================================
   个人作品集 · app.js（R1 骨架版，零依赖）
   双语切换 / 滚动进场 / 数字滚动 / 移动端菜单 / 灯箱 / 页脚年份
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var root = d.documentElement;
  var KEY = 'site-lang';

  /* ---------- 双语 ---------- */
  // 启动时把元素内的中文内容缓存为 data-zh（页面默认写中文，英文写在 data-en）
  d.querySelectorAll('[data-i18n]').forEach(function (el) {
    if (el.getAttribute('data-zh') === null) {
      el.setAttribute('data-zh', el.innerHTML);
    }
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

  /* ---------- 滚动进场 ---------- */
  var io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
  }
  d.querySelectorAll('.reveal').forEach(function (el) {
    if (el.dataset.delay) el.style.transitionDelay = el.dataset.delay;
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* ---------- 数字滚动 ---------- */
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  if (!reduced && 'IntersectionObserver' in window) {
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
    d.querySelectorAll('[data-count]').forEach(function (el) {
      el.textContent = '0';
      co.observe(el);
    });
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

  /* ---------- GSAP 增强（自托管；未加载时自动跳过） ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    d.querySelectorAll('.p-cover').forEach(function (img) {
      var wrap = img.closest('.p-cover-wrap') || img;
      gsap.fromTo(img, { yPercent: -3 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    d.querySelectorAll('.gallery figure').forEach(function (fig, i) {
      gsap.from(fig, {
        y: 26, opacity: 0, duration: 0.7, delay: (i % 4) * 0.07, ease: 'power2.out',
        scrollTrigger: { trigger: fig, start: 'top 94%', once: true }
      });
    });
  }
})();
