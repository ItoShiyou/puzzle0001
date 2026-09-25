// モック共通：9:16キャンバス / オリジナルマスコット描画 / 演出 / 効果音
const W = 360, H = 640;

// IP差し替え枠：各キャラ＝色＋アクセサリ（将来は版権キャラの立ち絵に置換）
const MASCOTS = [
  { name: 'ピピ', c: '#ff6f91', acc: 'ears' },
  { name: 'モコ', c: '#ffc145', acc: 'round' },
  { name: 'リーフ', c: '#5fd068', acc: 'sprout' },
  { name: 'ソラ', c: '#4fa3ff', acc: 'antenna' },
  { name: 'ユメ', c: '#b77dff', acc: 'horn' },
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
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---- マスコット ----
// expr: 'normal' | 'happy' | 'wow' | 'sleep'
function drawMascot(ctx, x, y, r, m, o = {}) {
  const t = performance.now() / 1000 + (o.seed || 0);
  const sq = o.squash != null ? o.squash : Math.sin(t * 4) * 0.04;
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  if (o.alpha != null) ctx.globalAlpha = o.alpha;
  ctx.scale((o.scale || 1) * (1 + sq), (o.scale || 1) * (1 - sq));
  const col = m.c, dark = shade(col, -0.35);
  // アクセサリ（体の後ろ）
  ctx.fillStyle = col; ctx.strokeStyle = dark; ctx.lineWidth = r * 0.08;
  if (m.acc === 'ears') for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * r * 0.75, -r * 0.35); ctx.lineTo(s * r * 0.55, -r * 1.15); ctx.lineTo(s * r * 0.1, -r * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (m.acc === 'round') for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 0.62, -r * 0.72, r * 0.32, 0, 7); ctx.fill(); ctx.stroke(); }
  if (m.acc === 'antenna') { ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.quadraticCurveTo(r * 0.3, -r * 1.3, r * 0.15, -r * 1.45); ctx.stroke(); ctx.fillStyle = '#fff36b'; ctx.beginPath(); ctx.arc(r * 0.15, -r * 1.45, r * 0.16, 0, 7); ctx.fill(); ctx.stroke(); }
  if (m.acc === 'sprout') { ctx.fillStyle = '#2f9e44'; ctx.beginPath(); ctx.ellipse(r * 0.22, -r * 1.12, r * 0.3, r * 0.13, -0.6, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-r * 0.2, -r * 1.08, r * 0.24, r * 0.11, 0.6, 0, 7); ctx.fill(); ctx.strokeStyle = '#2f9e44'; ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(0, -r * 1.1); ctx.stroke(); }
  if (m.acc === 'horn') { ctx.fillStyle = '#ffe66d'; ctx.beginPath(); star(ctx, 0, -r * 1.12, r * 0.32, r * 0.14, 5); ctx.fill(); ctx.strokeStyle = shade('#ffe66d', -0.4); ctx.stroke(); }
  // 体（しずく型のもち）
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
  g.addColorStop(0, shade(col, 0.45)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, -0.2));
  ctx.fillStyle = g; ctx.strokeStyle = dark; ctx.lineWidth = r * 0.09;
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.2);
  ctx.bezierCurveTo(-r, -r * 0.75, -r * 0.55, -r, 0, -r);
  ctx.bezierCurveTo(r * 0.55, -r, r, -r * 0.75, r, r * 0.2);
  ctx.bezierCurveTo(r, r * 0.85, r * 0.5, r * 0.9, 0, r * 0.9);
  ctx.bezierCurveTo(-r * 0.5, r * 0.9, -r, r * 0.85, -r, r * 0.2);
  ctx.fill(); ctx.stroke();
  // 顔
  const ex = r * 0.34, ey = -r * 0.08, lx = (o.look || 0) * r * 0.06;
  const blink = (Math.sin(t * 1.7) > 0.985);
  const expr = o.expr || 'normal';
  ctx.fillStyle = '#2b2140'; ctx.strokeStyle = '#2b2140'; ctx.lineWidth = r * 0.1; ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    if (expr === 'happy') { ctx.beginPath(); ctx.arc(s * ex, ey + r * 0.05, r * 0.13, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    else if (expr === 'sleep' || blink) { ctx.beginPath(); ctx.moveTo(s * ex - r * 0.12, ey); ctx.lineTo(s * ex + r * 0.12, ey); ctx.stroke(); }
    else {
      ctx.beginPath(); ctx.ellipse(s * ex + lx, ey, r * 0.12, r * (expr === 'wow' ? 0.2 : 0.16), 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * ex + lx - r * 0.04, ey - r * 0.06, r * 0.05, 0, 7); ctx.fill(); ctx.fillStyle = '#2b2140';
    }
  }
  ctx.fillStyle = 'rgba(255,120,150,0.55)';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * r * 0.58, r * 0.18, r * 0.14, r * 0.08, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#2b2140';
  if (expr === 'wow') { ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.1, r * 0.13, 0, 0, 7); ctx.fill(); }
  else { ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.arc(0, r * 0.18, r * 0.12, 0.2, Math.PI - 0.2); ctx.stroke(); }
  ctx.restore();
}
function star(ctx, x, y, R, r, n) {
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, d = i % 2 ? r : R;
    i ? ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = v => clamp(Math.round(v + (k < 0 ? v * k : (255 - v) * k)), 0, 255);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function rgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

// ---- 演出 ----
const FX = { parts: [], pops: [], banners: [], shake: 0, flash: 0, flashColor: '255,255,255' };
function burst(x, y, color, n = 12, speed = 220, grav = 300) {
  for (let i = 0; i < n; i++) {
    const a = rand(0, Math.PI * 2), s = rand(speed * 0.3, speed);
    FX.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.4, 0.9), max: 0.9, color, r: rand(2, 5), g: grav });
  }
}
function popText(x, y, text, color = '#fff', size = 20) { FX.pops.push({ x, y, text, color, size, life: 0.9 }); }
function banner(text, color = '#ffe14d', size = 46, sub) { FX.banners.push({ text, color, size, sub, life: 1.3 }); }
function shake(v) { FX.shake = Math.max(FX.shake, v); }
function flash(v = 0.5, rgb = '255,255,255') { FX.flash = Math.max(FX.flash, v); FX.flashColor = rgb; }
function updateFX(dt) {
  for (const p of FX.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.vx *= 0.98; p.life -= dt; }
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
    ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const p of FX.pops) { ctx.globalAlpha = Math.min(1, p.life * 2); outlineText(ctx, p.text, p.x, p.y, p.size, p.color); }
  ctx.globalAlpha = 1;
  const b = FX.banners[FX.banners.length - 1];
  if (b) {
    const t = 1.3 - b.life, s = t < 0.15 ? 0.4 + t / 0.15 * 0.8 : 1.2 - Math.min(0.2, t - 0.15);
    ctx.save(); ctx.translate(W / 2, H * 0.4); ctx.scale(s, s); ctx.rotate(-0.05); ctx.globalAlpha = Math.min(1, b.life * 3);
    outlineText(ctx, b.text, 0, 0, b.size, b.color, 8);
    if (b.sub) outlineText(ctx, b.sub, 0, b.size * 0.8, 16, '#fff', 4);
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (FX.flash > 0) { ctx.fillStyle = `rgba(${FX.flashColor},${FX.flash * 0.6})`; ctx.fillRect(0, 0, W, H); }
}
function applyShake(ctx) { if (FX.shake > 0) ctx.translate(rand(-FX.shake, FX.shake), rand(-FX.shake, FX.shake)); }
function outlineText(ctx, text, x, y, size, color, lw = 5, align = 'center') {
  ctx.font = `900 ${size}px system-ui, "Hiragino Maru Gothic ProN", "Hiragino Sans", "Noto Sans JP", sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = '#2b2140'; ctx.strokeText(text, x, y); }
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function hud(ctx, title, score, right, fg = '#fff') {
  outlineText(ctx, title, 14, 22, 13, fg, 4, 'left');
  outlineText(ctx, score.toLocaleString(), 14, 50, 28, '#ffe14d', 6, 'left');
  if (right) outlineText(ctx, right, W - 14, 50, 17, fg, 4, 'right');
}
function endPanel(ctx, title, score, sub = 'タップでもう一度') {
  ctx.fillStyle = 'rgba(25,15,45,0.72)'; ctx.fillRect(0, 0, W, H);
  outlineText(ctx, title, W / 2, H * 0.36, 44, '#ffe14d', 8);
  outlineText(ctx, score.toLocaleString() + ' pts', W / 2, H * 0.46, 32, '#fff');
  outlineText(ctx, sub, W / 2, H * 0.56, 16, '#fff', 4);
}

// ---- 効果音（WebAudio、初回タップで解禁） ----
let AC = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
addEventListener('pointerdown', audio, { once: false, passive: true });
function tone(freq, dur = 0.2, type = 'sine', vol = 0.15, when = 0) {
  const a = AC; if (!a || a.state !== 'running') return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const PENTA = [0, 2, 4, 7, 9];
const noteHz = i => 261.63 * Math.pow(2, (Math.floor(i / 5) * 12 + PENTA[((i % 5) + 5) % 5]) / 12);

function loop(update, draw) {
  let last = performance.now();
  (function f(t) {
    const dt = Math.min(0.033, (t - last) / 1000); last = t;
    update(dt); updateFX(dt); draw(); requestAnimationFrame(f);
  })(last);
}
