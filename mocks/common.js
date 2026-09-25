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

// =====================================================================
// v3 パズル共通基盤：盤面 / 60秒セッション / スキル・フィーバー / メタ（コイン・ガチャ・ミッション）
// =====================================================================

// ---- キャラ（＝スキル）定義。IPキャラ差し替え時はここにスキルを割り当てる ----
const SKILLS = [
  { name: 'なかまよび', desc: lv => `ランダムな${6 + lv * 2}個をピピに変える` },
  { name: 'どかんボム', desc: lv => `ランダムに${1 + lv}か所を3×3で消す` },
  { name: 'ひとやすみ', desc: lv => `時間+${2 + lv}秒 & フィーバー満タン` },
  { name: 'ながれぼし', desc: lv => `ランダムな横${1 + Math.floor(lv / 2)}列を消す` },
  { name: 'ゆめみごこち', desc: lv => `いちばん多い色を最大${8 + lv * 4}個消す` },
];

// ---- 保存データ（このブラウザ内だけ。無くても動く） ----
const Meta = {
  key: 'puzzle0001-meta-v3',
  s: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) { }
    this.s = Object.assign({ coins: 0, owned: { 0: 1 }, sel: 0, best: {}, missions: {} }, d || {});
    return this.s;
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.s)); } catch (e) { } },
};

const MISSION_POOL = [
  { k: 'score', n: 6000, t: n => `1回で${n.toLocaleString()}点とる` },
  { k: 'maxClear', n: 9, t: n => `1手で${n}個以上消す` },
  { k: 'skills', n: 2, t: n => `1回でスキルを${n}回つかう` },
  { k: 'fevers', n: 2, t: n => `1回でフィーバーを${n}回` },
  { k: 'bombs', n: 3, t: n => `1回でボムを${n}個つかう` },
  { k: 'plays', n: 3, t: n => `${n}回あそぶ`, sum: true },
  { k: 'cleared', n: 400, t: n => `合計${n}個消す`, sum: true },
];
function todaysMissions(gid) {
  const day = new Date().toISOString().slice(0, 10);
  const m = Meta.s.missions[gid];
  if (m && m.day === day) return m.list;
  let h = 0; for (const ch of day + gid) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = MISSION_POOL.slice(), list = [];
  while (list.length < 3) { const i = h % pool.length; h = (h * 1103515245 + 12345) >>> 0; list.push({ ...pool.splice(i, 1)[0], p: 0, done: false }); }
  Meta.s.missions[gid] = { day, list: list.map(({ k, n, sum }) => ({ k, n, sum: !!sum, p: 0, done: false })) };
  return Meta.s.missions[gid].list;
}
const missionText = m => MISSION_POOL.find(x => x.k === m.k).t(m.n);

// ---- 盤面 ----
class Board {
  constructor(o) {
    Object.assign(this, { types: 5, gravity: true }, o);
    this.grid = [...Array(this.rows)].map(() => [...Array(this.cols)].map(() => this.newPiece()));
    this.pops = [];
  }
  newPiece() { return Object.assign({ t: randi(this.types), ox: 0, oy: 0, s: 1 }, this.make ? this.make() : {}); }
  pos(r, c) { return { x: this.x0 + c * this.cell + this.cell / 2, y: this.y0 + r * this.cell + this.cell / 2 }; }
  cellAt(x, y) {
    const c = Math.floor((x - this.x0) / this.cell), r = Math.floor((y - this.y0) / this.cell);
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols ? { r, c } : null;
  }
  get(r, c) { return r >= 0 && r < this.rows && c >= 0 && c < this.cols ? this.grid[r][c] : null; }
  all() { const a = []; for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) if (this.grid[r][c]) a.push({ r, c, p: this.grid[r][c] }); return a; }
  // セルを消す（演出つき）。消した数を返す
  remove(cells, delayStep = 0.025) {
    let n = 0;
    cells.forEach(({ r, c }, i) => {
      const p = this.get(r, c); if (!p) return;
      this.grid[r][c] = null; n++;
      const { x, y } = this.pos(r, c);
      this.pops.push({ x, y, p, t: -i * delayStep });
    });
    return n;
  }
  collapse() {
    for (let c = 0; c < this.cols; c++) {
      if (!this.gravity) {
        for (let r = 0; r < this.rows; r++) if (!this.grid[r][c]) { const p = this.newPiece(); p.s = 0; this.grid[r][c] = p; }
        continue;
      }
      let w = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const p = this.grid[r][c]; if (!p) continue;
        if (w !== r) { p.oy += (r - w) * this.cell; this.grid[w][c] = p; this.grid[r][c] = null; }
        w--;
      }
      for (let k = 0; w >= 0; w--, k++) { const p = this.newPiece(); p.oy = -(w + 1 + k * 0.3) * this.cell - 20; this.grid[w][c] = p; }
    }
    this.needSettle = true;
  }
  busy() { return this.pops.length > 0 || this.grid.some(row => row.some(p => p && (p.ox || p.oy || p.s < 1))); }
  update(dt) {
    const sp = this.cell * 16 * dt;
    for (const row of this.grid) for (const p of row) {
      if (!p) continue;
      if (p.oy) p.oy = Math.abs(p.oy) <= sp ? 0 : p.oy - Math.sign(p.oy) * sp;
      if (p.ox) p.ox = Math.abs(p.ox) <= sp ? 0 : p.ox - Math.sign(p.ox) * sp;
      if (p.s < 1) p.s = Math.min(1, p.s + dt * 5);
    }
    for (const q of this.pops) {
      const before = q.t; q.t += dt;
      if (before < 0 && q.t >= 0) { burst(q.x, q.y, MASCOTS[q.p.t].c, 7, 160); tone(noteHz(5 + (this.popN = (this.popN || 0) + 1) % 10), 0.08, 'triangle', 0.035); }
    }
    this.pops = this.pops.filter(q => q.t < 0.25);
    if (!this.pops.length) this.popN = 0;
  }
  draw(ctx, drawPiece) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.roundRect(this.x0 - 6, this.y0 - 6, this.cols * this.cell + 12, this.rows * this.cell + 12, 16); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(this.x0 - 6, this.y0 - 6, this.cols * this.cell + 12, this.rows * this.cell + 12); ctx.clip();
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const p = this.grid[r][c]; if (!p) continue;
      const { x, y } = this.pos(r, c);
      drawPiece(ctx, x + p.ox, y + p.oy, p, r, c);
    }
    ctx.restore();
    for (const q of this.pops) {
      if (q.t < 0) { drawPiece(ctx, q.x, q.y, q.p, -1, -1, { glow: true }); continue; }
      const k = q.t / 0.25; drawPiece(ctx, q.x, q.y, q.p, -1, -1, { scale: 1 + k * 0.6, alpha: 1 - k });
    }
  }
  // ボム：3×3
  area(r, c, rad = 1) { const a = []; for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) if (this.get(r + dr, c + dc)) a.push({ r: r + dr, c: c + dc }); return a; }
}

function defaultPiece(board) {
  return (ctx, x, y, p, r, c, o = {}) => {
    const rad = board.cell * 0.42;
    if (p.sp === 'bomb') {
      ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha = o.alpha; ctx.scale((o.scale || 1) * p.s, (o.scale || 1) * p.s);
      const pul = 1 + Math.sin(performance.now() / 120) * 0.06; ctx.scale(pul, pul);
      ctx.fillStyle = '#3a2f55'; ctx.beginPath(); ctx.arc(0, 2, rad * 0.9, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffb347'; ctx.beginPath(); star(ctx, 0, 2, rad * 0.55, rad * 0.25, 8); ctx.fill();
      ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rad * 0.4, -rad * 0.6); ctx.quadraticCurveTo(rad * 0.7, -rad, rad * 0.5, -rad * 1.1); ctx.stroke();
      ctx.restore(); return;
    }
    drawMascot(ctx, x, y, rad, MASCOTS[p.t], { scale: (o.scale || 1) * p.s, alpha: o.alpha, expr: o.glow ? 'happy' : (p.sel ? 'wow' : 'normal'), seed: r * 7 + c });
  };
}

// ---- セッション（60秒）＋ HUD ＋ 画面遷移 ----
const S = { running: false };
const SKILL_BTN = { x: 52, y: 590, r: 30 };
let GAME = null;

const Game = {
  init(g) {
    GAME = g; Meta.load();
    const { c, ctx } = setupCanvas(); g.c = c; g.ctx = ctx;
    g.drawPiece = g.drawPiece || defaultPiece(g.board);
    c.addEventListener('pointerdown', e => this.down(e));
    c.addEventListener('pointermove', e => { if (S.running && !S.ending) g.onMove && g.onMove(toLocal(c, e)); });
    c.addEventListener('pointerup', e => { if (S.running && !S.ending) g.onUp && g.onUp(toLocal(c, e)); });
    c.addEventListener('pointercancel', e => { if (S.running && !S.ending) g.onUp && g.onUp(toLocal(c, e)); });
    Shell.build(); Shell.home();
    loop(dt => this.update(dt), () => this.draw());
  },
  start() {
    Object.assign(S, { running: true, ending: false, time: 60, score: 0, combo: 0, comboT: 0, fever: 0, feverT: 0, skill: 0,
      st: { maxClear: 0, skills: 0, fevers: 0, bombs: 0, cleared: 0 } });
    const lv = Meta.s.owned[Meta.s.sel] || 1;
    S.char = Meta.s.sel; S.lv = lv; S.skillCost = 22 - lv * 2;
    GAME.onStart && GAME.onStart();
    banner('START!', '#ffe14d', 56);
    [0, 4, 7].forEach((k, i) => tone(523 * Math.pow(2, k / 12), 0.2, 'triangle', 0.08, i * 0.08));
  },
  down(e) {
    const p = toLocal(GAME.c, e);
    if (!S.running || S.ending) return;
    if (Math.hypot(p.x - SKILL_BTN.x, p.y - SKILL_BTN.y) < SKILL_BTN.r + 6) { if (S.skill >= S.skillCost && !GAME.board.busy()) this.useSkill(); return; }
    const cl = GAME.board.cellAt(p.x, p.y);
    if (cl && !GAME.board.busy()) {
      const pc = GAME.board.get(cl.r, cl.c);
      if (pc && pc.sp === 'bomb') { this.bomb(cl.r, cl.c); return; }
    }
    GAME.onDown && GAME.onDown(p);
  },
  // 消去の得点処理（各ゲームから呼ぶ）
  scoreClear(n, x, y, mult = 1, label) {
    if (n <= 0) return 0;
    S.combo = S.comboT > 0 ? S.combo + 1 : 1; S.comboT = 2.5;
    let pts = Math.round((n * n * 8 + n * 30) * mult * (1 + (S.combo - 1) * 0.1) * (S.feverT > 0 ? 2 : 1));
    S.score += pts; S.st.cleared += n; S.st.maxClear = Math.max(S.st.maxClear, n);
    S.skill = Math.min(S.skillCost, S.skill + n);
    if (S.feverT <= 0) { S.fever += n * 2.2 + S.combo; if (S.fever >= 100) this.feverOn(); }
    popText(x, y - 10, (label ? label + ' ' : '') + '+' + pts, n >= 7 ? '#ffe14d' : '#fff', Math.min(26, 14 + n));
    if (S.combo >= 3 && S.combo % 2 === 1) popText(W / 2, GAME.board.y0 - 18, S.combo + ' COMBO', '#7ff5ff', 18);
    if (n >= 10) { banner(n + ' けし!', '#ff6f91', 44); shake(6); }
    return pts;
  },
  feverOn() { S.feverT = 8; S.fever = 0; S.st.fevers++; banner('FEVER!!', '#ff6bd6', 60, 'スコア×2'); flash(0.6, '255,200,240'); [0, 3, 7, 10, 12].forEach((k, i) => tone(392 * Math.pow(2, k / 12), 0.25, 'square', 0.04, i * 0.06)); },
  bomb(r, c) {
    const B = GAME.board, cells = B.area(r, c, 1), { x, y } = B.pos(r, c);
    S.st.bombs++; shake(8); flash(0.3, '255,220,160'); burst(x, y, '#ffb347', 30, 300);
    tone(90, 0.4, 'sawtooth', 0.1);
    const n = B.remove(cells, 0.01); this.scoreClear(n, x, y, 1.5, 'ボム'); B.collapse();
  },
  // ボム生成（大きく消したとき）
  maybeBomb(n, r, c) {
    if (n < 7) return false;
    const p = GAME.board.newPiece(); p.sp = 'bomb'; p.s = 0; GAME.board.grid[r][c] = p;
    return true;
  },
  useSkill() {
    const B = GAME.board, lv = S.lv, all = B.all().filter(q => q.p.sp !== 'bomb');
    S.skill = 0; S.st.skills++;
    const m = MASCOTS[S.char];
    banner(SKILLS[S.char].name + '!', m.c, 40, m.name + ' のスキル');
    flash(0.5); [0, 7, 12].forEach((k, i) => tone(660 * Math.pow(2, k / 12), 0.3, 'triangle', 0.08, i * 0.07));
    const pick = n => all.sort(() => Math.random() - 0.5).slice(0, n);
    if (S.char === 0) { for (const q of pick(6 + lv * 2)) { q.p.t = 0; q.p.s = 0.3; const { x, y } = B.pos(q.r, q.c); burst(x, y, m.c, 5, 100); } B.needSettle = true; return; }
    let cells = [];
    if (S.char === 1) for (const q of pick(1 + lv)) cells.push(...B.area(q.r, q.c, 1));
    if (S.char === 2) { S.time += 2 + lv; this.feverOn(); return; }
    if (S.char === 3) { const rows = [...Array(B.rows).keys()].sort(() => Math.random() - 0.5).slice(0, 1 + Math.floor(lv / 2)); for (const r of rows) for (let c = 0; c < B.cols; c++) cells.push({ r, c }); }
    if (S.char === 4) {
      const cnt = {}; all.forEach(q => cnt[q.p.t] = (cnt[q.p.t] || 0) + 1);
      const t = +Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
      cells = all.filter(q => q.p.t === t).slice(0, 8 + lv * 4);
    }
    const n = B.remove(cells, 0.02);
    this.scoreClear(n, W / 2, B.y0 + B.rows * B.cell / 2, 1, 'スキル'); shake(8); B.collapse();
  },
  update(dt) {
    const B = GAME.board;
    B.update(dt);
    if (B.needSettle && !B.busy()) { B.needSettle = false; GAME.onSettle && GAME.onSettle(); }
    GAME.onUpdate && GAME.onUpdate(dt);
    if (!S.running) return;
    if (S.comboT > 0) S.comboT -= dt; else S.combo = 0;
    if (S.feverT > 0) S.feverT -= dt;
    if (S.ending) { S.endT -= dt; if (S.endT <= 0 && !B.busy()) this.finish(); return; }
    S.time -= dt;
    if (S.time <= 0) { S.time = 0; S.ending = true; S.endT = 1.4; banner('TIME UP', '#ffe14d', 56); tone(330, 0.5, 'triangle', 0.1); GAME.onUp && GAME.onUp(null); }
  },
  finish() { S.running = false; Shell.result(); },
  draw() {
    const ctx = GAME.ctx;
    ctx.save(); applyShake(ctx);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const fv = S.running && S.feverT > 0;
    const [a, b] = fv ? ['#ff9ad5', '#ffd86b'] : GAME.bg || ['#bfe6ff', '#ffe3f1'];
    g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    if (fv) { ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(performance.now() / 90) * 0.1})`; ctx.fillRect(0, 0, W, H); }
    GAME.board.draw(ctx, GAME.drawPiece);
    GAME.drawExtra && GAME.drawExtra(ctx);
    drawFX(ctx);
    ctx.restore();
    if (S.running || S.ending) this.hud(ctx);
  },
  hud(ctx) {
    outlineText(ctx, S.score.toLocaleString(), 16, 34, 30, '#ffe14d', 6, 'left');
    outlineText(ctx, GAME.title, 16, 64, 12, '#fff', 3, 'left');
    // タイマー
    const tx = W - 40, ty = 42;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.arc(tx, ty, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = S.time < 10 ? '#ff5c8a' : '#fff'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(tx, ty, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * S.time / 60); ctx.stroke();
    outlineText(ctx, Math.ceil(S.time), tx, ty, 18, '#fff', 4);
    // スキルボタン
    const m = MASCOTS[S.char], ready = S.skill >= S.skillCost, k = S.skill / S.skillCost;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.arc(SKILL_BTN.x, SKILL_BTN.y, SKILL_BTN.r + 4, 0, 7); ctx.fill();
    ctx.strokeStyle = ready ? '#ffe14d' : m.c; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(SKILL_BTN.x, SKILL_BTN.y, SKILL_BTN.r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, k)); ctx.stroke();
    drawMascot(ctx, SKILL_BTN.x, SKILL_BTN.y + 3, 20, m, { expr: ready ? 'happy' : 'normal', scale: ready ? 1 + Math.sin(performance.now() / 150) * 0.08 : 1 });
    outlineText(ctx, ready ? 'スキル!' : 'スキル', SKILL_BTN.x, SKILL_BTN.y + 40, 11, ready ? '#ffe14d' : '#fff', 3);
    // フィーバーゲージ
    const fx = 100, fy = 588, fw = 240;
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.roundRect(fx, fy - 9, fw, 18, 9); ctx.fill();
    const fk = S.feverT > 0 ? S.feverT / 8 : Math.min(1, S.fever / 100);
    const fg = ctx.createLinearGradient(fx, 0, fx + fw, 0); fg.addColorStop(0, '#ff6bd6'); fg.addColorStop(1, '#ffe14d');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.roundRect(fx, fy - 9, Math.max(18, fw * fk), 18, 9); ctx.fill();
    outlineText(ctx, S.feverT > 0 ? 'FEVER ×2' : 'FEVER', fx + fw / 2, fy, 11, '#fff', 3);
    if (S.combo >= 2) outlineText(ctx, S.combo + ' COMBO', fx + fw / 2, fy + 26, 13, '#7ff5ff', 3);
  },
};

// ---- ホーム / リザルト / ガチャ（HTMLオーバーレイ） ----
const Shell = {
  build() {
    const el = document.createElement('div'); el.id = 'shell'; document.getElementById('app').appendChild(el); this.el = el;
  },
  charCard(i, big) {
    const m = MASCOTS[i], lv = Meta.s.owned[i];
    const cv = document.createElement('canvas'); const sz = big ? 84 : 48, dpr = 2;
    cv.width = sz * dpr; cv.height = sz * dpr; cv.style.width = cv.style.height = sz + 'px';
    const x = cv.getContext('2d'); x.scale(dpr, dpr); drawMascot(x, sz / 2, sz / 2 + sz * 0.08, sz * 0.32, m, { expr: lv ? 'happy' : 'sleep', alpha: lv ? 1 : 0.35, squash: 0 });
    return cv;
  },
  home() {
    const s = Meta.s, sel = s.sel, lv = s.owned[sel], ms = todaysMissions(GAME.id); Meta.save();
    this.el.className = 'show';
    this.el.innerHTML = `
      <div class="panel">
        <div class="top"><span class="coin">🪙 ${s.coins}</span><span class="best">BEST ${(s.best[GAME.id] || 0).toLocaleString()}</span></div>
        <h1>${GAME.title}</h1>
        <p class="howto">${GAME.howto}</p>
        <div class="sel"><div class="selcv"></div><div><b>${MASCOTS[sel].name}</b> Lv.${lv}<br><span class="sk">スキル「${SKILLS[sel].name}」</span><br><small>${SKILLS[sel].desc(lv)}</small></div></div>
        <div class="roster"></div>
        <div class="row">
          <button class="sub" id="lvup" ${lv >= 5 || s.coins < lv * 150 ? 'disabled' : ''}>レベルアップ<br><small>${lv >= 5 ? 'MAX' : '🪙' + lv * 150}</small></button>
          <button class="sub" id="gacha" ${s.coins < 300 ? 'disabled' : ''}>なかまガチャ<br><small>🪙300</small></button>
        </div>
        <div class="ms"><b>きょうのミッション</b>${ms.map(m => `<div class="${m.done ? 'done' : ''}">${m.done ? '✅' : '⬜'} ${missionText(m)} <small>${m.sum && !m.done ? `(${m.p}/${m.n})` : ''} 🪙100</small></div>`).join('')}</div>
        <button class="play" id="play">PLAY</button>
      </div>`;
    this.el.querySelector('.selcv').appendChild(this.charCard(sel, true));
    const ro = this.el.querySelector('.roster');
    MASCOTS.forEach((m, i) => {
      const b = document.createElement('button'); b.className = 'rc' + (i === sel ? ' on' : '') + (s.owned[i] ? '' : ' lock');
      b.appendChild(this.charCard(i)); const t = document.createElement('small'); t.textContent = s.owned[i] ? 'Lv.' + s.owned[i] : '???'; b.appendChild(t);
      b.onclick = () => { if (s.owned[i]) { s.sel = i; Meta.save(); this.home(); } };
      ro.appendChild(b);
    });
    this.el.querySelector('#play').onclick = () => { audio(); this.el.className = ''; Game.start(); };
    this.el.querySelector('#lvup').onclick = () => { s.coins -= lv * 150; s.owned[sel]++; Meta.save(); audio(); tone(880, 0.2, 'triangle', 0.1); this.home(); };
    this.el.querySelector('#gacha').onclick = () => this.gacha();
  },
  gacha() {
    const s = Meta.s; s.coins -= 300; audio();
    const i = randi(MASCOTS.length), isNew = !s.owned[i];
    if (isNew) s.owned[i] = 1; else s.owned[i] = Math.min(5, s.owned[i] + 1);
    Meta.save();
    this.el.innerHTML = `<div class="panel gacha"><h2>${isNew ? 'NEW!' : 'かぶり → レベルアップ!'}</h2><div class="gcv"></div>
      <h1>${MASCOTS[i].name}</h1><p>スキル「${SKILLS[i].name}」<br><small>${SKILLS[i].desc(s.owned[i])}</small></p>
      <button class="play" id="ok">OK</button></div>`;
    this.el.querySelector('.gcv').appendChild(this.charCard(i, true));
    [0, 4, 7, 12, 16].forEach((k, j) => tone(523 * Math.pow(2, k / 12), 0.3, 'triangle', 0.08, j * 0.09));
    this.el.querySelector('#ok').onclick = () => this.home();
  },
  result() {
    const s = Meta.s, ms = todaysMissions(GAME.id);
    const best = s.best[GAME.id] || 0, isBest = S.score > best;
    if (isBest) s.best[GAME.id] = S.score;
    let earned = Math.floor(S.score / 100), cleared = [];
    const val = { score: S.score, maxClear: S.st.maxClear, skills: S.st.skills, fevers: S.st.fevers, bombs: S.st.bombs, plays: 1, cleared: S.st.cleared };
    for (const m of ms) {
      if (m.done) continue;
      m.p = m.sum ? m.p + val[m.k] : Math.max(m.p, val[m.k]);
      if (m.p >= m.n) { m.done = true; earned += 100; cleared.push(missionText(m)); }
    }
    s.coins += earned; Meta.save();
    this.el.className = 'show';
    this.el.innerHTML = `<div class="panel">
      ${isBest ? '<div class="newbest">NEW BEST!</div>' : ''}
      <h2>RESULT</h2><div class="big">${S.score.toLocaleString()}</div>
      <p>1手最大 ${S.st.maxClear}個 ／ スキル ${S.st.skills}回 ／ フィーバー ${S.st.fevers}回</p>
      <div class="earn">🪙 +${earned} <small>(所持 ${s.coins})</small></div>
      ${cleared.map(t => `<div class="mclear">ミッション達成！ ${t} 🪙+100</div>`).join('')}
      <button class="play" id="again">もう1回</button><button class="sub wide" id="home">ホームへ（キャラ・ガチャ）</button></div>`;
    this.el.querySelector('#again').onclick = () => { this.el.className = ''; Game.start(); };
    this.el.querySelector('#home').onclick = () => this.home();
  },
};
