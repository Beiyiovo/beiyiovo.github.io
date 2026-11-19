/* ============================================================
   lab.js — 模型路由互动（无依赖）
   ============================================================ */
(function () {
  'use strict';
  var d = document;
  var box = d.getElementById('routerBox');
  if (!box) return;

  var DATA = {
    code: {
      model: { zh: 'Claude Code', en: 'Claude Code' },
      zh: { why: '能读整个仓库、改完自己跑测试。SmartFridge 的 92 秒实录走的就是这条循环。', log: 'route --task=code --scope=repo  →  claude-code ✓ patched · tested', art: '产物：SmartFridge（可回放）' },
      en: { why: 'Reads the whole repo, patches it, then runs the tests itself. The 92-second SmartFridge recording is exactly this loop.', log: 'route --task=code --scope=repo  →  claude-code ✓ patched · tested', art: 'Artifact: SmartFridge (replayable)' }
    },
    long: {
      model: { zh: 'GPT · Gemini', en: 'GPT · Gemini' },
      zh: { why: '论文级长文交给长上下文模型：三轮复审加一次盲审检查，结论才落笔。', log: 'route --task=long-doc --tokens=128k  →  gpt / gemini ✓ cross-reviewed', art: '产物：毕设论文复审记录' },
      en: { why: 'Thesis-length text goes to long-context models: three review rounds plus a blind pass before anything is written down.', log: 'route --task=long-doc --tokens=128k  →  gpt / gemini ✓ cross-reviewed', art: 'Artifact: thesis review log' }
    },
    diag: {
      model: { zh: '通义千问 · DashScope', en: 'Tongyi Qianwen · DashScope' },
      zh: { why: '接进 iot-llm 平台做根因诊断；12 秒拿不到结果就降级本地规则，不阻塞链路。', log: 'route --task=diagnosis --timeout=12s  →  qwen ✓ fallback=local-rules', art: '产物：iot-llm-platform（可克隆）' },
      en: { why: 'Wired into iot-llm-platform for root-cause analysis; a 12-second timeout falls back to local rules so the pipeline never blocks.', log: 'route --task=diagnosis --timeout=12s  →  qwen ✓ fallback=local-rules', art: 'Artifact: iot-llm-platform (clonable)' }
    },
    check: {
      model: { zh: 'DeepSeek · Grok', en: 'DeepSeek · Grok' },
      zh: { why: '同一个问题丢给几个模型，能对上的结论才写进文档——对不上就继续查。', log: 'route --task=cross-check --n=3  →  deepseek / grok ✓ consensus', art: '产物：站内每个数字的出处' },
      en: { why: 'The same question goes to several models; only conclusions that survive the cross-check get written down.', log: 'route --task=cross-check --n=3  →  deepseek / grok ✓ consensus', art: 'Artifact: the source behind every number' }
    },
    gen: {
      model: { zh: 'Seedream · Seedance', en: 'Seedream · Seedance' },
      zh: { why: '底图与分镜交给生成模型，中文交给程序排版——所以成品里不会出现乱码。', log: 'route --task=image --review=human  →  seedream ✓ approved', art: '产物：萘斯 33 张物料 / 本站视觉' },
      en: { why: 'Base imagery and shots go to the generative models, Chinese type goes to code — that is why nothing ships garbled.', log: 'route --task=image --review=human  →  seedream ✓ approved', art: 'Artifacts: 33-piece Naisi set / this site' }
    }
  };

  var btns = Array.prototype.slice.call(box.querySelectorAll('.rt-btn'));
  var elModel = d.getElementById('roModel');
  var elWhy = d.getElementById('roWhy');
  var elLog = d.getElementById('roLog');
  var elArt = d.getElementById('roArt');
  var current = 'code';
  var typeTimer = 0;

  function lang() {
    return (window.SITE && window.SITE.lang && window.SITE.lang()) || 'zh';
  }

  function typeLog(text) {
    clearInterval(typeTimer);
    elLog.textContent = '';
    if (!window.SITE || !window.SITE.animated) { elLog.textContent = text; return; }
    var i = 0;
    typeTimer = setInterval(function () {
      i += 2;
      elLog.textContent = text.slice(0, i);
      if (i >= text.length) clearInterval(typeTimer);
    }, 22);
  }

  function render(key, withType) {
    var item = DATA[key] || DATA.code;
    var isEn = lang() === 'en';
    var l = isEn ? item.en : item.zh;
    current = key;
    elModel.textContent = isEn ? item.model.en : item.model.zh;
    elWhy.textContent = l.why;
    elArt.textContent = l.art;
    if (withType) typeLog(l.log); else elLog.textContent = l.log;

    btns.forEach(function (b) {
      var on = b.dataset.task === key;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  btns.forEach(function (b) {
    b.addEventListener('click', function () { render(b.dataset.task, true); });
  });

  window.__onLangChange = function () { render(current, false); };

  render('code', true);
})();
