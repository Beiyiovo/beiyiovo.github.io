/* ============================================================
   shorts.js — 视频放映：点击卡片 → 弹层播放
   无框架；视频只在点击时才加载（卡片上没有任何请求）
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var modal = d.getElementById('vmodal');
  var video = d.getElementById('vmVideo');
  var titleEl = d.getElementById('vmTitle');
  var descEl = d.getElementById('vmDesc');
  if (!modal || !video) return;

  var trigger = null;
  var current = null;

  function open(card) {
    var src = card.getAttribute('data-src');
    if (!src) return;
    current = card;
    trigger = d.activeElement;

    var h3 = card.querySelector('.vmeta h3');
    var p = card.querySelector('.vmeta p');
    titleEl.textContent = h3 ? h3.textContent : '';
    descEl.textContent = p ? p.textContent : '';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    d.body.classList.add('vm-open');

    video.src = src;
    var p2 = video.play();
    if (p2 && p2.catch) p2.catch(function () { /* 用户可手动点播放 */ });

    var close = modal.querySelector('.vm-close');
    if (close) close.focus();
  }

  function close() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    d.body.classList.remove('vm-open');
    video.pause();
    video.removeAttribute('src');
    video.load();
    current = null;
    if (trigger && trigger.focus) trigger.focus();
  }

  d.querySelectorAll('.vcard').forEach(function (card) {
    var hit = card.querySelector('.vcard-hit');
    if (!hit) return;
    hit.addEventListener('click', function () { open(card); });
  });

  modal.querySelectorAll('[data-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal) close();
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });

  /* 语言切换时，若弹层开着，同步标题与描述 */
  window.__onLangChange = function () {
    if (!current) return;
    var h3 = current.querySelector('.vmeta h3');
    var p = current.querySelector('.vmeta p');
    if (h3) titleEl.textContent = h3.textContent;
    if (p) descEl.textContent = p.textContent;
  };
})();
