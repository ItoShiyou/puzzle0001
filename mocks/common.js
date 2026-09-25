// 5つのモック共通の描画・演出ヘルパー（論理解像度 360x640 / 9:16 縦画面）
const W = 360, H = 640;

// IP差し替え枠：ここの絵文字と色を版権キャラ画像に置き換える想定
const CHARS = [
  { e: '🐱', c: '#ff8fb1' },
  { e: '🐶', c: '#ffc36b' },
  { e: '🐸', c: '#7ddc7a' },
  { e: '🐧', c: '#7ab8ff' },
  { e: '🐙', c: '#c79bff' },
];

function setupCanvas() {
  const c = document.getElementById('c');
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  c.width = W * dpr; c.height = H * dpr;
  const ctx = c.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { c, ctx };
}

function toLocal(c, e) {
  const r = c.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}

const rand = (a, b) => a + Math.random() * (b - a);
const randi = n => Math.floor(Math.random() * n);

// ---- 演出（パーティクル・スコアポップ・画面揺れ・バナー） ----
const FX = { parts: [], pops: [], banners: [], shake: 0, flash: 0 };

function burst(x, y, color, n = 12, speed = 220) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(speed * 0.3, speed);
    FX.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.8), max: 0.8, color, r: rand(2, 5) });
  }
}
function popText(x, y, text, color = '#fff', size = 20) {
  FX.pops.push({ x, y, text, color, size, life: 0.9 });
}
function banner(text, color = '#ffe14d', size = 48) {
  FX.banners.push({ text, color, size, life: 1.2 });
}
function shake(v) { FX.shake = Math.max(FX.shake, v); }
function flash(v = 0.5) { FX.flash = Math.max(FX.flash, v); }

function updateFX(dt) {
  for (const p of FX.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 400 * dt; p.vx *= 0.98; p.life -= dt; }
  FX.parts = FX.parts.filter(p => p.life > 0);
  for (const p of FX.pops) { p.y -= 40 * dt; p.life -= dt; }
  FX.pops = FX.pops.filter(p => p.life > 0);
  for (const b of FX.banners) b.life -= dt;
  FX.banners = FX.banners.filter(b => b.life > 0);
  FX.shake = Math.max(0, FX.shake - dt * 30);
  FX.flash = Math.max(0, FX.flash - dt * 2);
}

function drawFX(ctx) {
  for (const p of FX.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const p of FX.pops) {
    ctx.globalAlpha = Math.min(1, p.life * 2);
    outlineText(ctx, p.text, p.x, p.y, p.size, p.color);
  }
  ctx.globalAlpha = 1;
  const b = FX.banners[FX.banners.length - 1];
  if (b) {
    const t = 1.2 - b.life;
    const s = t < 0.15 ? 0.5 + t / 0.15 * 0.7 : 1.2 - Math.min(0.2, (t - 0.15));
    ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.scale(s, s); ctx.rotate(-0.06);
    ctx.globalAlpha = Math.min(1, b.life * 3);
    outlineText(ctx, b.text, 0, 0, b.size, b.color, 8);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
}

function outlineText(ctx, text, x, y, size, color, lw = 5) {
  ctx.font = `900 ${size}px system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = lw; ctx.strokeStyle = '#2a1840';
  ctx.strokeText(text, x, y); ctx.fillStyle = color; ctx.fillText(text, x, y);
}

function applyShake(ctx) {
  if (FX.shake > 0) ctx.translate(rand(-FX.shake, FX.shake), rand(-FX.shake, FX.shake));
}

// キャラ駒（丸＋顔）の描画
function drawChar(ctx, x, y, r, ch, opt = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (opt.scale) ctx.scale(opt.scale, opt.scale);
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.25, ch.c); g.addColorStop(1, shade(ch.c, -0.25));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  if (opt.glow) { ctx.lineWidth = 3; ctx.strokeStyle = opt.glow; ctx.stroke(); }
  ctx.font = `${Math.round(r * 1.15)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch.e, 0, r * 0.08);
  ctx.restore();
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => Math.max(0, Math.min(255, Math.round(v + (k < 0 ? v * k : (255 - v) * k))));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

function bg(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

function hud(ctx, title, score, right) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, 64);
  ctx.textAlign = 'left'; outlineTextL(ctx, title, 12, 20, 14, '#fff');
  outlineTextL(ctx, 'SCORE ' + score.toLocaleString(), 12, 45, 22, '#ffe14d');
  if (right) { ctx.textAlign = 'right'; outlineTextR(ctx, right, W - 12, 45, 18, '#fff'); }
}
function outlineTextL(ctx, t, x, y, s, c) { ctx.save(); ctx.font = `900 ${s}px system-ui,sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2a1840'; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); ctx.restore(); }
function outlineTextR(ctx, t, x, y, s, c) { ctx.save(); ctx.font = `900 ${s}px system-ui,sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.strokeStyle = '#2a1840'; ctx.strokeText(t, x, y); ctx.fillStyle = c; ctx.fillText(t, x, y); ctx.restore(); }

function gameOverPanel(ctx, score, sub = 'タップでもう一度') {
  ctx.fillStyle = 'rgba(20,10,40,0.7)'; ctx.fillRect(0, 0, W, H);
  outlineText(ctx, 'FINISH!', W / 2, H * 0.38, 56, '#ffe14d', 8);
  outlineText(ctx, score.toLocaleString() + ' pts', W / 2, H * 0.48, 34, '#fff');
  outlineText(ctx, sub, W / 2, H * 0.58, 18, '#fff');
}

function loop(update, draw) {
  let last = performance.now();
  function f(t) {
    const dt = Math.min(0.033, (t - last) / 1000); last = t;
    update(dt); updateFX(dt); draw();
    requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}
