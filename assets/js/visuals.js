/* ============================================================
   visuals.js — 首页专用视觉
   1) Hero 实机仪表：PPG 波形 + 指针视差
   2) 轨迹：星轨 / 光点留痕 + 滚动叙事
   全部可降级：?static=1 / prefers-reduced-motion → 静态终态
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var S = window.SITE || { animated: true, static: false };
  var animated = S.animated !== false;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  /* ==========================================================
     1. Hero PPG 波形
     ========================================================== */
  (function heroWave() {
    var cv = d.getElementById('hvWave');
    if (!cv) return;
    var ctx = cv.getContext('2d');
    var w = 0, h = 0, running = false, raf = 0;

    // PPG 合成波：主峰 + 舒张期反射波 + 基线漂移
    function ppg(phase) {
      var p = phase % 1;
      var main = Math.exp(-Math.pow((p - 0.18) / 0.075, 2));
      var refl = 0.26 * Math.exp(-Math.pow((p - 0.46) / 0.10, 2));
      var wave = 0.06 * Math.sin(p * Math.PI * 2 - 0.6);
      return main + refl + wave;
    }

    function resize() {
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      w = r.width; h = r.height;
      cv.width = Math.round(w * DPR);
      cv.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function draw(time) {
      if (!w) resize();
      if (!w) return;
      ctx.clearRect(0, 0, w, h);

      var period = 60 / 73;              // 73 bpm
      var pxPerSec = w / 8.0;            // 窗口约 8 秒
      var baseY = h * 0.72;
      var amp = h * 0.52;
      var offset = animated ? (time / 1000) * pxPerSec : 0;

      // 填充
      var gradFill = ctx.createLinearGradient(0, 0, 0, h);
      gradFill.addColorStop(0, 'rgba(95,216,245,0.20)');
      gradFill.addColorStop(1, 'rgba(95,216,245,0)');

      ctx.beginPath();
      ctx.moveTo(0, h);
      for (var x = 0; x <= w; x += 2) {
        var sec = (x + offset) / pxPerSec;
        var cyc = sec / period;
        var y = baseY - ppg(cyc + 0.035 * Math.sin(cyc * 0.7)) * amp * (1 + 0.09 * Math.sin(cyc * 0.43 + 1.2));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = gradFill;
      ctx.fill();

      // 主曲线
      ctx.beginPath();
      for (var x2 = 0; x2 <= w; x2 += 1.5) {
        var s2 = (x2 + offset) / pxPerSec;
        var c2 = s2 / period;
        var y2 = baseY - ppg(c2 + 0.035 * Math.sin(c2 * 0.7)) * amp * (1 + 0.09 * Math.sin(c2 * 0.43 + 1.2));
        if (x2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      var grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, 'rgba(76,125,255,0.25)');
      grad.addColorStop(0.35, 'rgba(95,216,245,0.75)');
      grad.addColorStop(1, 'rgba(180,245,255,1)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = 'rgba(95,216,245,0.85)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 扫描头
      var headX = w - 2;
      var hc = ((headX + offset) / pxPerSec) / period;
      var headY = baseY - ppg(hc + 0.035 * Math.sin(hc * 0.7)) * amp * (1 + 0.09 * Math.sin(hc * 0.43 + 1.2));
      ctx.beginPath();
      ctx.arc(headX, headY, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = '#dffaff';
      ctx.shadowColor = '#5fd8f5';
      ctx.shadowBlur = 16;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    function loop(t) { draw(t); raf = requestAnimationFrame(loop); }

    function start() {
      if (running || !animated) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    if (animated) {
      draw(0);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
        }, { threshold: 0.05 }).observe(cv);
      } else { start(); }
      window.addEventListener('scroll', function () {
      if (mq.matches) return;
      scrollProgress();
      var r = stage.getBoundingClientRect();
      var near = r.bottom > -120 && r.top < (window.innerHeight || 800) + 120;
      if (near) {
        visible = true;
        if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
      }
    }, { passive: true });

    window.addEventListener('resize', function () { resize(); draw(performance.now()); });
    } else {
      draw(0);
      window.addEventListener('scroll', function () {
      if (mq.matches) return;
      scrollProgress();
      var r = stage.getBoundingClientRect();
      var near = r.bottom > -120 && r.top < (window.innerHeight || 800) + 120;
      if (near) {
        visible = true;
        if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
      }
    }, { passive: true });

    window.addEventListener('resize', function () { resize(); draw(0); });
    }
  })();

  /* ==========================================================
     Hero 指针视差
     ========================================================== */
  (function tilt() {
    var stage = d.getElementById('hvStage');
    var panel = d.getElementById('hvPanel');
    if (!stage || !panel) return;
    if (!animated || !window.matchMedia('(hover:hover)').matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, active = false;

    function render() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      panel.style.transform = 'perspective(1100px) rotateY(' + cx.toFixed(2) + 'deg) rotateX(' + cy.toFixed(2) + 'deg) translateZ(0)';
      if (Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 || active) {
        raf = requestAnimationFrame(render);
      } else { raf = 0; }
    }
    function kick() { if (!raf) raf = requestAnimationFrame(render); }

    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      tx = px * 9;
      ty = -py * 7;
      active = true;
      kick();
    });
    stage.addEventListener('pointerleave', function () {
      tx = 0; ty = 0; active = false; kick();
    });
  })();

  /* ==========================================================
     2. 轨迹：星轨 / 光点留痕
     ========================================================== */
  (function trace() {
    var stage = d.getElementById('traceStage');
    var cv = d.getElementById('traceCanvas');
    var reader = d.getElementById('traceReader');
    if (!stage || !cv || !reader) return;

    var nodes = Array.prototype.slice.call(stage.querySelectorAll('.tr-node'));
    if (!nodes.length) return;

    var ctx = cv.getContext('2d');
    var mq = window.matchMedia('(max-width: 900px)');
    var W = 0, H = 0;
    var pts = [];         // 样条采样点
    var nodeAt = [];      // 每个节点在采样中的索引
    var nodePos = [];     // 每个节点的画布坐标
    var nodeT = [];       // 归一化进度
    var stars = [];
    var bg = d.createElement('canvas');
    var bgc = bg.getContext('2d');
    var visible = false, raf = 0, last = 0;
    var progress = 0, target = 0;
    var activeIndex = 0;
    var t0 = performance.now();

    var COMETS = 4;
    var comets = [];

    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

    function catmullRom(points, per) {
      var out = [];
      var n = points.length;
      for (var i = 0; i < n - 1; i++) {
        var p0 = points[i - 1] || points[i];
        var p1 = points[i];
        var p2 = points[i + 1];
        var p3 = points[i + 2] || p2;
        for (var s = 0; s < per; s++) {
          var t = s / per, t2 = t * t, t3 = t2 * t;
          out.push({
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
          });
        }
      }
      out.push({ x: points[n - 1].x, y: points[n - 1].y });
      return out;
    }

    function layout() {
      var r = stage.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      cv.width = Math.round(W * DPR);
      cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      // 节点像素坐标
      nodePos = nodes.map(function (n) {
        return {
          x: parseFloat(n.dataset.x) / 100 * W,
          y: parseFloat(n.dataset.y) / 100 * H
        };
      });
      nodes.forEach(function (n, i) {
        n.style.left = nodes[i].dataset.x + '%';
        n.style.top = nodes[i].dataset.y + '%';
      });

      pts = catmullRom(nodePos, 110);
      nodeAt = nodePos.map(function (_, i) { return i * 110; });
      nodeT = nodeAt.map(function (idx) { return idx / (pts.length - 1); });

      // 星场
      stars = [];
      var count = Math.round(W * H / 5200);
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.1 + 0.25,
          a: Math.random() * 0.45 + 0.1,
          ph: Math.random() * Math.PI * 2,
          sp: 0.4 + Math.random() * 1.4
        });
      }

      // 背景缓存
      bg.width = Math.round(W * DPR);
      bg.height = Math.round(H * DPR);
      bgc.setTransform(DPR, 0, 0, DPR, 0, 0);
      bgc.clearRect(0, 0, W, H);
      var g1 = bgc.createRadialGradient(W * 0.16, H * 0.22, 0, W * 0.16, H * 0.22, Math.max(W, H) * 0.5);
      g1.addColorStop(0, 'rgba(45,120,190,0.16)');
      g1.addColorStop(1, 'rgba(45,120,190,0)');
      bgc.fillStyle = g1; bgc.fillRect(0, 0, W, H);
      var g2 = bgc.createRadialGradient(W * 0.86, H * 0.7, 0, W * 0.86, H * 0.7, Math.max(W, H) * 0.45);
      g2.addColorStop(0, 'rgba(80,90,220,0.14)');
      g2.addColorStop(1, 'rgba(80,90,220,0)');
      bgc.fillStyle = g2; bgc.fillRect(0, 0, W, H);
      stars.forEach(function (s) {
        bgc.beginPath();
        bgc.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        bgc.fillStyle = 'rgba(220,240,255,' + (s.a * 0.7).toFixed(3) + ')';
        bgc.fill();
      });

      comets = [];
      for (var c = 0; c < COMETS; c++) {
        comets.push({ p: Math.random(), speed: 0.000045 + Math.random() * 0.00005, len: 26 + Math.random() * 18 });
      }
    }

    function pointAt(t) {
      var idx = clamp(t, 0, 1) * (pts.length - 1);
      var i = Math.floor(idx);
      var f = idx - i;
      var a = pts[i];
      var b = pts[Math.min(i + 1, pts.length - 1)];
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }

    function drawPath(limit) {
      var total = pts.length - 1;
      var end = Math.floor(limit * total);
      var grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'rgba(95,216,245,0.30)');
      grad.addColorStop(0.5, 'rgba(110,220,255,0.85)');
      grad.addColorStop(1, 'rgba(150,205,255,1)');

      /* 未走到的部分：虚线，保证整条轨迹随时可读 */
      if (limit < 0.999) {
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([3, 7]);
        ctx.lineDashOffset = 0;
        var from = Math.max(0, end);
        ctx.moveTo(pts[from].x, pts[from].y);
        for (var k = from + 1; k <= total; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.strokeStyle = 'rgba(140,190,235,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      }

      if (limit <= 0.002) return;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var i = 1; i <= end; i++) ctx.lineTo(pts[i].x, pts[i].y);
      var lastP = pointAt(limit);
      ctx.lineTo(lastP.x, lastP.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.25;
      ctx.stroke();

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var j = 1; j <= end; j++) ctx.lineTo(pts[j].x, pts[j].y);
      ctx.lineTo(lastP.x, lastP.y);
      ctx.strokeStyle = 'rgba(95,216,245,0.14)';
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.restore();
    }

    function drawComet(c, time, dt) {
      if (!animated) return;
      c.p += c.speed * dt;
      if (c.p > 1.06) c.p = -0.02;
      if (c.p < 0) return;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      var N = 20;
      for (var i = 0; i < N; i++) {
        var tt = c.p - (i / N) * (c.len / 400);
        if (tt < 0) break;
        var p = pointAt(tt);
        var k = 1 - i / N;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.6 + k * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150,235,255,' + (k * k * 0.55).toFixed(3) + ')';
        ctx.fill();
      }
      var head = pointAt(c.p);
      ctx.beginPath();
      ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,253,255,0.95)';
      ctx.shadowColor = '#8fe9ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.restore();
    }

    function drawDots(time) {
      for (var i = 0; i < nodePos.length; i++) {
        var p = nodePos[i];
        var lit = nodeT[i] <= progress + 0.002;
        var isActive = i === activeIndex;
        var fade = lit ? 1 : 0.32;

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        if (lit) {
          var halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
          halo.addColorStop(0, 'rgba(95,216,245,' + (isActive ? 0.42 : 0.22) + ')');
          halo.addColorStop(1, 'rgba(95,216,245,0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // 外圈
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 7 : 5.2, 0, Math.PI * 2);
        ctx.strokeStyle = lit ? 'rgba(150,235,255,0.85)' : 'rgba(120,150,180,' + (0.3 * fade) + ')';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 核心
        ctx.beginPath();
        ctx.arc(p.x, p.y, isActive ? 2.6 : 1.9, 0, Math.PI * 2);
        ctx.fillStyle = lit ? '#eafeff' : 'rgba(150,180,210,0.5)';
        ctx.fill();

        // 呼吸圈
        if (isActive && animated) {
          var ph = (time * 0.0012) % 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8 + ph * 16, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(95,216,245,' + (0.4 * (1 - ph)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    function frame(time) {
      if (!visible) { raf = 0; return; }
      if (animated) scrollProgress();
      var dt = Math.min(48, time - (last || time));
      last = time;

      // 平滑逼近目标进度
      progress += (target - progress) * (animated ? Math.min(1, dt / 110) : 1);
      if (Math.abs(target - progress) < 0.0005) progress = target;

      ctx.clearRect(0, 0, W, H);
      if (bg.width) ctx.drawImage(bg, 0, 0, W, H);

      // 星点微闪
      if (animated) {
        for (var i = 0; i < stars.length; i += 5) {
          var s = stars[i];
          var a = s.a * (0.5 + 0.5 * Math.sin(time * 0.001 * s.sp + s.ph));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(220,240,255,' + a.toFixed(3) + ')';
          ctx.fill();
        }
      }

      // 完整路径的暗底
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y);
      ctx.strokeStyle = 'rgba(130,175,220,0.10)';
      ctx.lineWidth = 1;
      ctx.stroke();

      drawPath(progress);
      comets.forEach(function (c) { drawComet(c, time, dt); });
      drawDots(time);

      // 进度光头
      if (progress > 0.004 && progress < 0.999) {
        var hp = pointAt(progress);
        var hg = ctx.createRadialGradient(hp.x, hp.y, 0, hp.x, hp.y, 18);
        hg.addColorStop(0, 'rgba(230,252,255,0.9)');
        hg.addColorStop(0.25, 'rgba(120,225,255,0.45)');
        hg.addColorStop(1, 'rgba(120,225,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      updateActive();
      raf = requestAnimationFrame(frame);
    }

    function updateActive() {
      var idx = 0;
      for (var i = 0; i < nodeT.length; i++) {
        if (progress >= nodeT[i] - 0.008) idx = i;
      }
      // 末端补足
      if (progress > 0.985) idx = nodeT.length - 1;
      if (idx === activeIndex) {
        nodes.forEach(function (n, i) {
          n.classList.toggle('on', i === idx);
          n.classList.toggle('passed', i < idx);
        });
        return;
      }
      activeIndex = idx;
      nodes.forEach(function (n, i) {
        n.classList.toggle('on', i === idx);
        n.classList.toggle('passed', i < idx);
      });
      renderReader(idx);
    }

    var readerTimer = 0;
    function renderReader(idx) {
      var n = nodes[idx];
      if (!n) return;
      var panel = reader.querySelector('.tr-panel');
      var count = reader.querySelector('.tr-count b');
      var date = n.querySelector('.tr-year');
      var h3 = n.querySelector('h3');
      var p = n.querySelector('p');

      clearTimeout(readerTimer);
      panel.classList.add('swap');
      readerTimer = setTimeout(function () {
        if (count) count.textContent = ('0' + (idx + 1)).slice(-2);
        var dEl = reader.querySelector('.tr-date');
        var hEl = reader.querySelector('h3');
        var pEl = reader.querySelector('.tr-panel p');
        if (dEl && date) dEl.textContent = date.textContent;
        if (hEl && h3) hEl.textContent = h3.textContent;
        if (pEl && p) pEl.textContent = p.textContent;
        panel.classList.remove('swap');
      }, 140);
    }

    function scrollProgress() {
      var r = stage.getBoundingClientRect();
      var vh = window.innerHeight || 800;
      /* p=0 舞台顶部到 88% 视高；p=1 在舞台仍完整可见时（底部 28% 视高）就走完，
         让整条轨迹的形状一定被看完，而不是滑出去才勉强画完 */
      var startLine = vh * 0.88;
      var span = Math.max(300, r.height * 0.72 + vh * 0.26);
      target = clamp((startLine - r.top) / span, 0, 1);
      if (!animated) { progress = 1; target = 1; }
    }

    window.__onLangChange = function () { renderReader(activeIndex); };

    function boot() {
      if (mq.matches) {
        cancelAnimationFrame(raf); raf = 0;
        nodes.forEach(function (n) {
          n.classList.add('on');
          n.style.left = ''; n.style.top = '';
        });
        return;
      }
      layout();
      if (!animated) {
        progress = 1; target = 1;
        visible = true;
        frame(performance.now());
        cancelAnimationFrame(raf);
        return;
      }
      scrollProgress();
      progress = target;
      if (!visible) { visible = true; if (!raf) raf = requestAnimationFrame(frame); }
    }

    window.addEventListener('scroll', function () {
      if (mq.matches) return;
      scrollProgress();
      var r = stage.getBoundingClientRect();
      var near = r.bottom > -120 && r.top < (window.innerHeight || 800) + 120;
      if (near) {
        visible = true;
        if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
      }
    }, { passive: true });

    window.addEventListener('resize', function () {
      clearTimeout(boot._t);
      boot._t = setTimeout(boot, 160);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible && !raf && !mq.matches) {
            last = 0;
            raf = requestAnimationFrame(frame);
          }
        });
      }, { rootMargin: '80px' }).observe(stage);
    } else {
      visible = true;
    }

    boot();
  })();
})();
