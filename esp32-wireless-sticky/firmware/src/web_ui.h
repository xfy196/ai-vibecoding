/*
 * 手机端网页（整页塞进 PROGMEM，没有外部 CSS/JS/字体，断网也能打开）
 *
 * 设计取「桌面上的便利贴 + 一块小屏幕」：
 *   - 米色点阵背景、纸片卡片、顶部胶带
 *   - textarea 用 32px 行高的横线稿纸背景
 *   - 下方是一块 128×64 的像素预览，按和固件相同的宽度规则折行
 *
 * 通信协议（WebSocket，纯文本帧，第一个字符是命令）：
 *   服务端 -> 客户端
 *     T<正文>   当前 / 更新后的便签
 *     S<JSON>   连接时下发的设备状态
 *     N<数量>   在线设备数变化
 *   客户端 -> 服务端
 *     T<正文>   整篇替换
 *     C         清空
 */
#pragma once

#include <Arduino.h>

static const char INDEX_HTML[] PROGMEM = R"HTML(<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#efe7da">
<meta name="description" content="ESP32 无线便利贴：手机打字，OLED 实时显示。">
<title>无线便利贴</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>
:root{
  --bg:#efe7da;--paper:#fffdf8;--ink:#241f18;--muted:#8b7c66;
  --line:#e7dcc9;--line-strong:#d9cbb4;--accent:#b45309;--accent-soft:#fbefdd;
  --live:#15803d;--live-soft:#e7f3ea;--danger:#b91c1c;
  --shadow:0 18px 40px -26px rgba(73,52,22,.55);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{
  margin:0;min-height:100vh;color:var(--ink);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI",Roboto,sans-serif;
  background:
    radial-gradient(circle at 1px 1px, rgba(120,96,60,.16) 1px, transparent 1.7px) 0 0/23px 23px,
    radial-gradient(900px 520px at 50% -180px, #fbf4e7 0%, rgba(251,244,231,0) 70%),
    var(--bg);
  padding:calc(20px + env(safe-area-inset-top)) 16px calc(26px + env(safe-area-inset-bottom));
}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.wrap{max-width:560px;margin:0 auto}

/* ---------- 顶部 ---------- */
.hero{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.mark{
  flex:none;width:40px;height:40px;border-radius:12px;background:#241f18;
  display:grid;align-content:center;gap:3px;padding:0 9px;transform:rotate(-2deg);
  box-shadow:0 6px 14px -6px rgba(36,31,24,.8),inset 0 0 0 1px rgba(255,255,255,.08);
}
.mark i{display:block;height:2px;border-radius:2px;background:#f6ead6}
.mark i:nth-child(1){width:100%}
.mark i:nth-child(2){width:72%}
.mark i:nth-child(3){width:46%}
.titles h1{margin:0;font-size:19px;line-height:1.2;letter-spacing:.01em}
.titles p{margin:3px 0 0;font-size:11.5px;color:var(--muted);letter-spacing:.04em}
.pill{
  flex:none;display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;
  font-size:12px;font-weight:600;background:var(--paper);border:1px solid var(--line);color:var(--muted);
  box-shadow:0 1px 0 #fff inset;transition:background .2s ease,color .2s ease,border-color .2s ease;
}
.pill .dot{width:7px;height:7px;border-radius:50%;background:#c2b49e;box-shadow:0 0 0 3px rgba(194,180,158,.18)}
.pill.on{color:var(--live);border-color:#cfe5d6;background:var(--live-soft)}
.pill.on .dot{background:var(--live);box-shadow:0 0 0 3px rgba(21,128,61,.16);animation:breathe 2.4s ease-in-out infinite}
.pill.off{color:#a16207;border-color:#f0dcb4;background:#fdf6e7}
.pill.off .dot{background:#d97706;box-shadow:0 0 0 3px rgba(217,119,6,.14)}
@keyframes breathe{50%{box-shadow:0 0 0 5px rgba(21,128,61,.06)}}
@media (prefers-reduced-motion:reduce){.pill.on .dot{animation:none}}

.layout{display:flex;flex-direction:column;gap:14px}
.side{display:flex;flex-direction:column;gap:14px}
@media (min-width:860px){
  .wrap{max-width:940px}
  .layout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:18px;align-items:start}
  .titles h1{font-size:21px}
}

/* ---------- 便签纸 ---------- */
.paper{
  position:relative;background:var(--paper);border:1px solid var(--line);
  border-radius:20px;padding:16px 16px 13px;
  box-shadow:var(--shadow),0 1px 0 #fff inset;
  transition:border-color .2s ease,box-shadow .2s ease;
}
.paper:focus-within{border-color:#e2cca8;box-shadow:var(--shadow),0 0 0 3px rgba(180,83,9,.08)}
.paper::before{
  content:"";position:absolute;top:-10px;left:50%;width:82px;height:21px;
  transform:translateX(-50%) rotate(-2.2deg);
  background:linear-gradient(180deg,rgba(226,178,106,.38),rgba(226,178,106,.22));
  border:1px solid rgba(180,120,40,.18);border-radius:3px;
  box-shadow:0 2px 4px -2px rgba(120,80,20,.3);
}
.paper-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 2px 4px}
.paper-head h2{margin:0;font-size:10.5px;letter-spacing:.16em;font-weight:700;color:#a3937c;text-transform:uppercase}
.sync{font-size:11.5px;color:var(--muted);display:inline-flex;align-items:center;gap:6px}
.sync::before{content:"";width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.6}
.sync.ok{color:var(--live)}
.sync.busy{color:var(--accent)}

#note{
  display:block;width:100%;min-height:170px;max-height:360px;
  padding:6px 2px 8px;border:0;outline:0;resize:none;overflow-y:auto;
  background-color:transparent;
  background-image:repeating-linear-gradient(to bottom,transparent 0 31px,var(--line) 31px 32px);
  color:var(--ink);caret-color:var(--accent);
  font-family:inherit;font-size:21px;line-height:32px;font-weight:500;letter-spacing:.01em;
  -webkit-appearance:none;
}
#note::placeholder{color:#b7a992;font-weight:400}
.paper-foot{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding-top:10px;margin-top:2px;border-top:1px solid var(--line);
}
.count{font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums}
.actions{display:flex;gap:8px}
.btn{
  font-family:inherit;font-size:12.5px;font-weight:600;border-radius:999px;
  border:1px solid var(--line-strong);background:#fff;color:var(--ink);
  padding:8px 13px;cursor:pointer;touch-action:manipulation;
  transition:transform .12s ease,box-shadow .12s ease,background .12s ease;
}
.btn:hover{box-shadow:0 4px 10px -6px rgba(60,40,10,.5)}
.btn:active{transform:scale(.97)}
.btn:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.btn.ghost{background:var(--accent-soft);border-color:#eed7b6;color:#92400e}
.btn.danger{background:#fff7f7;border-color:#f0d4d4;color:var(--danger)}
.btn.armed{background:var(--danger);border-color:var(--danger);color:#fff;box-shadow:0 6px 14px -8px rgba(185,28,28,.8)}

/* ---------- OLED 预览 ---------- */
.screen-card{
  background:#171b22;border-radius:18px;padding:12px 12px 11px;
  box-shadow:0 20px 36px -28px #0b0d12,inset 0 1px 0 rgba(255,255,255,.06);
}
.screen-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding:2px 4px 10px;color:#94a3b8}
.screen-head h2{margin:0;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#cbd5e1;font-weight:700}
.screen-head span{font-size:10px;letter-spacing:.02em}
.screen{
  position:relative;background:#04070b;border-radius:10px;padding:10px;
  display:flex;justify-content:center;
  box-shadow:inset 0 0 0 1px #232b38,inset 0 0 34px rgba(0,0,0,.9);
}
.screen::after{
  content:"";position:absolute;inset:10px;border-radius:6px;pointer-events:none;
  background:repeating-linear-gradient(to bottom,rgba(255,255,255,.018) 0 1px,transparent 1px 2px);
}
#oled{display:block;width:100%;max-width:384px;height:auto;image-rendering:pixelated;image-rendering:crisp-edges}
.screen-note{margin:9px 4px 0;font-size:10.5px;line-height:1.5;color:#7d8b9d}

/* ---------- 设备状态 ---------- */
.device{
  background:rgba(255,253,248,.78);border:1px solid var(--line);border-radius:16px;
  padding:3px 14px;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);
}
.row{
  display:flex;align-items:center;justify-content:space-between;gap:10px;
  padding:9px 0;border-bottom:1px dashed var(--line);font-size:12.5px;
}
.row:last-child{border-bottom:0}
.row span{color:var(--muted);flex:none}
.row b{font-weight:600;font-variant-numeric:tabular-nums;word-break:break-all;text-align:right}

.foot{
  display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:9px;
  margin-top:16px;font-size:10.5px;color:#9b8c76;letter-spacing:.03em;
}
.sep{width:3px;height:3px;border-radius:50%;background:#c3b49c}
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div class="brand">
      <span class="mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <div class="titles">
        <h1>无线便利贴</h1>
        <p>手机输入 · OLED 实时显示</p>
      </div>
    </div>
    <div id="pill" class="pill" role="status" aria-live="polite">
      <span class="dot"></span><span id="pillText">连接中</span>
    </div>
  </header>

  <main class="layout">
    <section class="paper" aria-labelledby="paperTitle">
      <div class="paper-head">
        <h2 id="paperTitle">便签内容</h2>
        <span id="sync" class="sync">等待连接</span>
      </div>
      <label class="sr-only" for="note">便签内容</label>
      <textarea id="note" maxlength="200" rows="5" placeholder="写点什么，会立刻出现在桌上那块屏幕上…"
        spellcheck="false" autocomplete="off" autocapitalize="sentences"></textarea>
      <div class="paper-foot">
        <span id="count" class="count">0 / 200</span>
        <div class="actions">
          <button id="time" class="btn ghost" type="button">插入时间</button>
          <button id="clear" class="btn danger" type="button">清空</button>
        </div>
      </div>
    </section>

    <aside class="side">
      <section class="screen-card" aria-labelledby="screenTitle">
        <div class="screen-head">
          <h2 id="screenTitle">OLED 预览</h2>
          <span>128 × 64 · 近似排版</span>
        </div>
        <div class="screen"><canvas id="oled" width="128" height="64" aria-label="OLED 屏幕预览"></canvas></div>
        <p class="screen-note">超过 5 行会自动翻页；打字时先停在最新一页。</p>
      </section>

      <section class="device" aria-label="设备状态">
        <div class="row"><span>访问地址</span><b id="ip">—</b></div>
        <div class="row"><span>网络模式</span><b id="mode">—</b></div>
        <div class="row"><span>在线设备</span><b id="clients">—</b></div>
      </section>
    </aside>
  </main>

  <footer class="foot">
    <span>最后一张便签断电不丢</span>
    <span class="sep"></span>
    <span>中文 / 英文 / 数字</span>
  </footer>
</div>

<script>
(function () {
  'use strict';

  var ta = document.getElementById('note');
  var countEl = document.getElementById('count');
  var syncEl = document.getElementById('sync');
  var pill = document.getElementById('pill');
  var pillText = document.getElementById('pillText');
  var ipEl = document.getElementById('ip');
  var modeEl = document.getElementById('mode');
  var clientsEl = document.getElementById('clients');
  var canvas = document.getElementById('oled');
  var ctx = canvas.getContext('2d');

  var MAX = 200;
  var PAGE_LINES = 5;
  var PREVIEW_W = 120;
  var FONT = '12px "PingFang SC","Microsoft YaHei","Segoe UI",sans-serif';

  var ws = null;
  var online = false;
  var retry = 0;
  var sendTimer = 0;
  var reconnectTimer = 0;
  var dirtyOffline = false;
  var composing = false;     // 中文输入法正在组合拼音
  var lastSent = '';         // 最近一次发给板子的完整正文，用来忽略自己的回声
  var lastInputAt = 0;       // 最后一次本地输入时间

  function setPill(kind, text) {
    pill.className = 'pill' + (kind ? ' ' + kind : '');
    pillText.textContent = text;
  }

  function setSync(text, kind) {
    syncEl.textContent = text;
    syncEl.className = 'sync' + (kind ? ' ' + kind : '');
  }

  function charCount() {
    return Array.from(ta.value).length;
  }

  function updateCount() {
    countEl.textContent = charCount() + ' / ' + MAX;
  }

  function autoGrow() {
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 360) + 'px';
  }

  // 和固件相同的折行规则：一行最多 120 个设备像素
  function wrap(text) {
    var lines = [];
    var paragraphs = text.split('\n');
    ctx.font = FONT;
    for (var p = 0; p < paragraphs.length; p++) {
      var para = paragraphs[p];
      if (!para) { lines.push(''); continue; }
      var line = '';
      var chars = Array.from(para);
      for (var i = 0; i < chars.length; i++) {
        var test = line + chars[i];
        if (line && ctx.measureText(test).width > PREVIEW_W) {
          lines.push(line);
          line = chars[i];
        } else {
          line = test;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function drawPreview() {
    ctx.fillStyle = '#04070b';
    ctx.fillRect(0, 0, 128, 64);

    var text = ta.value;
    var lines = text ? wrap(text) : [];
    var pages = text ? Math.max(1, Math.ceil(lines.length / PAGE_LINES)) : 1;

    if (!text) {
      ctx.fillStyle = '#5f6d80';
      ctx.font = '11px "PingFang SC","Microsoft YaHei",sans-serif';
      ctx.fillText('在手机上输入…', 28, 30);
      ctx.font = '9px ui-monospace,Consolas,monospace';
      ctx.fillText('OLED 128 × 64', 30, 46);
    } else {
      ctx.font = FONT;
      ctx.fillStyle = '#e9f1ff';
      for (var i = 0; i < PAGE_LINES && i < lines.length; i++) {
        ctx.fillText(lines[i], 2, 10 + i * 12);
      }
      if (pages > 1) {
        ctx.fillStyle = '#7f90a6';
        ctx.font = '8px ui-monospace,Consolas,monospace';
        ctx.fillText('1/' + pages, 106, 61);
        var startY = 32 - Math.floor(pages * 5 / 2);
        for (var d = 0; d < pages; d++) {
          ctx.fillStyle = d === 0 ? '#c9d6e6' : '#3d4a5c';
          ctx.fillRect(124, startY + d * 5, 2, 2);
        }
      }
      // 只有一页时，在最后一个字后面画光标
      if (online && pages === 1) {
        ctx.font = FONT;
        var last = lines.length ? lines[lines.length - 1] : '';
        var x = 2 + ctx.measureText(last).width + 1;
        if (x < 122 && Math.floor(Date.now() / 530) % 2 === 0) {
          ctx.fillStyle = '#e9f1ff';
          ctx.fillRect(Math.round(x), 10 + (lines.length - 1) * 12 - 9, 1, 10);
        }
      }
    }

    // 右上角：有没有手机连着
    if (online) {
      ctx.fillStyle = '#86d9a5';
      ctx.fillRect(123, 2, 3, 3);
    } else {
      ctx.strokeStyle = '#445164';
      ctx.lineWidth = 1;
      ctx.strokeRect(123.5, 2.5, 2, 2);
    }
  }

  function refresh() {
    updateCount();
    // 手机上不要在输入过程中改高度：键盘可能因此收起
    if (document.activeElement !== ta) autoGrow();
    drawPreview();
  }

  function sendNow() {
    if (composing) return;
    if (!online || !ws || ws.readyState !== 1) return;
    clearTimeout(sendTimer);
    sendTimer = 0;
    lastSent = ta.value;
    ws.send('T' + lastSent);
    setSync('已同步', 'ok');
  }

  function scheduleSend() {
    if (!online) {
      dirtyOffline = true;
      setSync('离线编辑', 'busy');
      return;
    }
    setSync('输入中…', 'busy');
    clearTimeout(sendTimer);
    sendTimer = setTimeout(sendNow, 70);
  }

  function applyRemote(text) {
    if (text === ta.value) return;
    if (text === lastSent) return;        // 自己刚发出去的回声，别覆盖
    if (composing) return;                 // 输入法组合中，先别动
    var focused = document.activeElement === ta;
    // 正在打字时以本地为准；停手 1.5 秒后才接受别的设备的内容
    if (focused && Date.now() - lastInputAt < 1500) return;
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    ta.value = text;
    if (focused) {
      try {
        ta.setSelectionRange(Math.min(start, ta.value.length), Math.min(end, ta.value.length));
      } catch (e) {}
    }
    refresh();
  }

  function updateStatus(s) {
    if (s.ip) ipEl.textContent = 'http://' + s.ip;
    if (s.mode) modeEl.textContent = s.mode === 'ap' ? '热点直连 (AP)' : '局域网 (STA)';
    if (typeof s.clients === 'number') clientsEl.textContent = s.clients + ' 台';
    if (s.ssid) modeEl.title = 'WiFi: ' + s.ssid;
  }

  function scheduleReconnect() {
    var delay = Math.min(1000 * Math.pow(1.6, retry), 8000);
    retry += 1;
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connect, delay);
  }

  function connect() {
    clearTimeout(reconnectTimer);
    var proto = location.protocol === 'https:' ? 'wss' : 'ws';
    try {
      ws = new WebSocket(proto + '://' + location.host + '/ws');
    } catch (e) {
      scheduleReconnect();
      return;
    }

    ws.onopen = function () {
      online = true;
      retry = 0;
      setPill('on', '已连接');
      setSync('已同步', 'ok');
      // 服务端在连接事件里会主动推一份当前正文，这里不用再要
    };

    ws.onmessage = function (ev) {
      var data = ev.data;
      if (typeof data !== 'string' || !data) return;
      var cmd = data.charAt(0);
      var body = data.slice(1);
      if (cmd === 'T') {
        if (dirtyOffline) {
          // 断线期间本地改过：以本地为准，把本地内容推上去
          dirtyOffline = false;
          if (ws && ws.readyState === 1) {
            lastSent = ta.value;
            ws.send('T' + lastSent);
          }
          setSync('已同步', 'ok');
          return;
        }
        applyRemote(body);
      } else if (cmd === 'S') {
        try { updateStatus(JSON.parse(body)); } catch (e) {}
      } else if (cmd === 'N') {
        clientsEl.textContent = (parseInt(body, 10) || 0) + ' 台';
      }
    };

    ws.onclose = function () {
      online = false;
      setPill('off', '重连中');
      setSync('连接断开', 'busy');
      scheduleReconnect();
    };

    ws.onerror = function () {
      try { ws.close(); } catch (e) {}
    };
  }

  ta.addEventListener('input', function (e) {
    lastInputAt = Date.now();
    refresh();
    // 拼音/五笔还在组合时先不发，等 compositionend
    if (e.isComposing || composing) return;
    scheduleSend();
  });

  ta.addEventListener('compositionstart', function () {
    composing = true;
  });

  ta.addEventListener('compositionend', function () {
    composing = false;
    lastInputAt = Date.now();
    refresh();
    scheduleSend();
  });

  // 输入时不变高度，失焦后再按内容展开，避免手机键盘被布局变化顶掉
  ta.addEventListener('blur', function () {
    autoGrow();
  });

  // 清空用页面内两步确认：手机上 confirm() 常被浏览器拦掉，点了会像「没反应」
  var clearBtn = document.getElementById('clear');
  var clearArmTimer = 0;
  var clearArmed = false;

  function disarmClear() {
    clearArmed = false;
    clearTimeout(clearArmTimer);
    clearBtn.classList.remove('armed');
    clearBtn.textContent = '清空';
  }

  clearBtn.addEventListener('click', function () {
    if (!clearArmed) {
      clearArmed = true;
      clearBtn.classList.add('armed');
      clearBtn.textContent = '再点一次清空';
      clearTimeout(clearArmTimer);
      clearArmTimer = setTimeout(disarmClear, 3000);
      return;
    }

    disarmClear();
    ta.value = '';
    lastSent = '';
    dirtyOffline = false;
    clearTimeout(sendTimer);
    sendTimer = 0;
    refresh();

    if (online && ws && ws.readyState === 1) {
      ws.send('C');
      setSync('已清空', 'ok');
    } else {
      // 断线也先本地清空，重连后把空内容推给板子
      dirtyOffline = true;
      setSync('离线清空', 'busy');
    }
  });

  document.getElementById('time').addEventListener('click', function () {
    var d = new Date();
    var stamp = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ' ';
    var start = ta.selectionStart == null ? ta.value.length : ta.selectionStart;
    var end = ta.selectionEnd == null ? start : ta.selectionEnd;
    if (typeof ta.setRangeText === 'function') {
      ta.setRangeText(stamp, start, end, 'end');
    } else {
      ta.value = ta.value.slice(0, start) + stamp + ta.value.slice(end);
    }
    ta.focus();
    refresh();
    scheduleSend();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) sendNow();
  });

  window.addEventListener('pagehide', function () {
    if (online && ws && ws.readyState === 1) {
      clearTimeout(sendTimer);
      ws.send('T' + ta.value);
    }
  });

  // 预览里的光标闪烁
  setInterval(function () {
    if (online) drawPreview();
  }, 530);

  refresh();
  connect();
})();
</script>
</body>
</html>
)HTML";

static const char FAVICON_SVG[] PROGMEM = R"SVG(<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#241f18"/><rect x="7" y="8" width="18" height="16" rx="2" fill="#fdf3e3"/><g fill="#b45309"><rect x="10" y="12" width="12" height="1.6"/><rect x="10" y="16" width="9" height="1.6"/><rect x="10" y="20" width="6" height="1.6"/></g></svg>)SVG";
