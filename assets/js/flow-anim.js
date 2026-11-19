/* ============================================================
   个人作品集 · flow-anim.js（R2）
   三端数据链路可交互演示动画：模式聚焦切换 + 真实 CRC-8/SMBUS 实时帧
   ============================================================ */
(function () {
  'use strict';
  var flow = document.querySelector('.flow');
  if (!flow) return;

  /* 尊重减少动效偏好：暂停 SMIL 数据点动画（静态展示） */
  var reduced = false;
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var svg = flow.querySelector('svg');
  if (reduced && svg && svg.pauseAnimations) svg.pauseAnimations();

  /* 模式聚焦切换：本地 AP 直连 / 云中转 */
  var btns = flow.querySelectorAll('.flow-btn');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      btns.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      flow.classList.remove('mode-local', 'mode-cloud');
      flow.classList.add('mode-' + b.dataset.mode);
      setRate(b.dataset.mode === 'cloud' ? 6000 : 2000);
    });
  });

  /* CRC-8（SMBUS，poly 0x07 / init 0x00）——与固件、App、小程序同一算法 */
  function crc8(str) {
    var crc = 0;
    for (var i = 0; i < str.length; i++) {
      crc ^= str.charCodeAt(i) & 0xFF;
      for (var b = 0; b < 8; b++) {
        crc = (crc & 1) ? ((crc >> 1) ^ 0x07) : (crc >> 1);
      }
    }
    return crc & 0xFF;
  }
  if (crc8('123456789') !== 0xF4) console.warn('CRC8 self-check failed');

  var code = document.getElementById('flowFrame');
  var crcEl = document.getElementById('flowCrc');
  var up = 3600;
  var step = 4;
  function hex(n) { var s = n.toString(16).toUpperCase(); return s.length < 2 ? '0' + s : s; }

  function frame() {
    var hr = 68 + Math.floor(Math.random() * 18);
    var spo2 = 96 + Math.floor(Math.random() * 4);
    var temp = (36.2 + Math.random() * 0.6).toFixed(1);
    step += Math.floor(Math.random() * 3);
    var sleep = Math.random() < 0.1 ? 1 : 0;
    up += Math.floor(Math.random() * 6) + 2;
    var payload = '$HR=' + hr + ',SPO2=' + spo2 + ',TEMP=' + temp + ',STEP=' + step + ',SLEEP=' + sleep + ',SDUR=0,UP=' + up;
    var c = crc8(payload);
    if (code) code.textContent = payload + '*' + hex(c);
    if (crcEl) {
      crcEl.textContent = 'CRC \u2713 0x' + hex(c);
      crcEl.classList.remove('flash');
      void crcEl.offsetWidth;
      crcEl.classList.add('flash');
    }
  }

  var timer = null;
  function setRate(ms) {
    if (timer) clearInterval(timer);
    if (!reduced) timer = setInterval(frame, ms);
  }
  frame();
  if (!reduced) timer = setInterval(frame, 2000);
})();
