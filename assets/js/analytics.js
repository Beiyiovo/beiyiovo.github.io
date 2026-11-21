/* ============================================================
   analytics.js — 匿名访客行为采集（完全静默）
   ------------------------------------------------------------
   零依赖、无框架、失败静默。未配置接收端时不发起任何外部请求；
   页面上不注入任何可见元素、不弹窗、不要求访客填写任何信息。

   配置优先级：页面加载前 window.SITE_TRACK = {...} > 下方 CONFIG
     baiduId  : 百度统计 ID（hm.js? 后面那串）
     gaId     : GA4 衡量 ID（G-XXXXXXXXXX）
     endpoint : 自定义上报地址（支持 sendBeacon，可空）
     debug    : true 或 URL 加 ?track-debug=1，事件打印到控制台并写入 window.__trackLog

   当前已启用：百度统计（baiduId），后台看 PV/UV/地域/设备/来源/停留/事件。
   ============================================================ */
(function () {
  'use strict';
  var D = document, W = window;

  var CONFIG = {
    baiduId: '393ff6473192b2e45f8393059de52e67',
    gaId: '',
    endpoint: '',
    debug: false
  };
  try {
    if (W.SITE_TRACK) {
      for (var ck in W.SITE_TRACK) {
        if (Object.prototype.hasOwnProperty.call(W.SITE_TRACK, ck)) CONFIG[ck] = W.SITE_TRACK[ck];
      }
    }
  } catch (e) {}
  if (location.search.indexOf('track-debug=1') > -1) CONFIG.debug = true;
  if (location.search.indexOf('static=1') > -1) return; /* QA 静态模式不上报 */

  /* ---------- 工具 ---------- */
  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- 匿名访客 ID（仅用于区分独立访客，不含任何身份信息） ---------- */
  var VID_KEY = 'wb_track_vid';
  var vid = lsGet(VID_KEY);
  if (!vid) {
    vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    lsSet(VID_KEY, vid);
  }

  /* ---------- 接收端注入（仅在配置后） ---------- */
  if (CONFIG.baiduId) {
    W._hmt = W._hmt || [];
    var hm = D.createElement('script');
    hm.async = 1; hm.src = 'https://hm.baidu.com/hm.js?' + CONFIG.baiduId;
    D.head.appendChild(hm);
  }
  if (CONFIG.gaId) {
    W.dataLayer = W.dataLayer || [];
    W.gtag = function () { W.dataLayer.push(arguments); };
    W.gtag('js', new Date());
    W.gtag('config', CONFIG.gaId, { transport_type: 'beacon' });
    var ga = D.createElement('script');
    ga.async = 1; ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.gaId;
    D.head.appendChild(ga);
  }
  if (CONFIG.debug) W.__trackLog = [];

  /* ---------- 统一上报 ---------- */
  function send(name, payload) {
    var detail = payload || {};
    var p = { v: 1, vid: vid, page: location.pathname, ts: Date.now() };
    for (var k in detail) {
      if (Object.prototype.hasOwnProperty.call(detail, k)) p[k] = detail[k];
    }
    if (CONFIG.debug) {
      W.__trackLog.push({ event: name, data: p });
      try { console.log('[track]', name, p); } catch (e) {}
    }
    if (CONFIG.baiduId && W._hmt) {
      W._hmt.push(['_trackEvent', 'portfolio', name, p.page, p.sec || p.depth || 0]);
    }
    if (CONFIG.gaId && W.gtag) {
      W.gtag('event', name, {
        visitor_id: vid, page_path: p.page,
        detail: JSON.stringify(detail)
      });
    }
    if (CONFIG.endpoint && W.navigator && W.navigator.sendBeacon) {
      try {
        W.navigator.sendBeacon(CONFIG.endpoint, new Blob(
          [JSON.stringify({ event: name, data: p })], { type: 'application/json' }
        ));
      } catch (e) {}
    }
  }

  /* ---------- 页面浏览 ---------- */
  send('pageview', {
    title: D.title,
    lang: D.documentElement.dataset.lang || 'zh',
    ref: D.referrer || '(none)'
  });

  /* ---------- 停留时长（离开时上报一次） ---------- */
  var t0 = Date.now(), left = false;
  function dwell() {
    if (left) return;
    left = true;
    var sec = Math.round((Date.now() - t0) / 1000);
    if (sec >= 1) send('dwell', { sec: sec, scroll: maxScroll });
  }
  W.addEventListener('pagehide', dwell);
  D.addEventListener('visibilitychange', function () {
    if (D.visibilityState === 'hidden') dwell();
  });

  /* ---------- 滚动深度 ---------- */
  var maxScroll = 0, marks = {};
  W.addEventListener('scroll', function () {
    var h = D.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    if (max <= 0) return;
    var pct = Math.round(h.scrollTop / max * 100);
    if (pct > maxScroll) maxScroll = pct;
    [25, 50, 75, 100].forEach(function (m) {
      if (pct >= m && !marks[m]) { marks[m] = 1; send('scroll', { depth: m }); }
    });
  }, { passive: true });

  /* ---------- 点击热区（事件委托，先于业务脚本捕获） ---------- */
  function labelOf(el) {
    var t = el.getAttribute('data-track');
    if (t) return t;
    if (el.hasAttribute('data-copy')) return 'copy-email';
    if (el.classList.contains('vcard-hit')) {
      var c = el.closest('.vcard');
      var h3 = c && c.querySelector('.vmeta h3');
      return 'video:' + ((h3 && h3.textContent.trim()) || 'untitled');
    }
    if (el.classList.contains('ls-btn')) return 'lang:' + (el.getAttribute('data-lang-set') || '');
    if (el.tagName === 'A' && /^https?:/.test(el.getAttribute('href') || '')) {
      return 'outbound:' + el.href.replace(/^https?:\/\//, '').split('/')[0];
    }
    var txt = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36);
    if (!txt) return '';
    return el.tagName.toLowerCase() + ':' + txt;
  }
  D.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button,[data-track]') : null;
    if (!el) return;
    var label = labelOf(el);
    if (!label) return;
    send('click', {
      el: label,
      href: (el.getAttribute('href') || '').slice(0, 160)
    });
  }, true);

  /* ---------- 视频观看（含弹层） ---------- */
  var vm = D.getElementById('vmVideo');
  if (vm) {
    var seen = {};
    function title() { return ((D.getElementById('vmTitle') || {}).textContent || '').trim(); }
    vm.addEventListener('play', function () {
      send('video', { act: 'play', title: title() });
    });
    vm.addEventListener('timeupdate', function () {
      if (!isFinite(vm.duration) || vm.duration <= 0) return;
      var pct = Math.floor(vm.currentTime / vm.duration * 100);
      [25, 50, 75].forEach(function (m) {
        if (pct >= m && !seen['p' + m]) {
          seen['p' + m] = 1;
          send('video', { act: 'p' + m, title: title() });
        }
      });
    });
    vm.addEventListener('ended', function () {
      send('video', { act: 'complete', title: title() });
    });
    D.addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('.vcard-hit')) seen = {};
    }, true);
  }
})();
