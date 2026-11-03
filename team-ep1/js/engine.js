// ============================================================
//  engine.js — set cache, camera, shot sequencing, text layer
// ============================================================
'use strict';

// ---------- set cache ----------
const SETS = {
  storefront: { w: 1900, paint: paintStorefront },
  signwall: { w: 1080, paint: paintSignWall },
  classroom: { w: 1700, paint: paintClassroom },
  office: { w: 1300, paint: paintOffice },
  duplo: { w: 1300, paint: paintDuploRoom },
  room: { w: 1300, paint: paintRoom },
};
const _setCache = {};
function setImg(name) {
  if (!_setCache[name]) {
    const s = SETS[name]; const c = makeCanvas(Math.round(s.w * SR), Math.round(H * SR));
    const g = c.getContext('2d'); g.scale(SR, SR); s.paint(g); _setCache[name] = c;
  }
  return _setCache[name];
}
function drawSet(ctx, name) { const c = setImg(name); ctx.drawImage(c, 0, 0, c.width / SR, c.height / SR); }

// ---------- camera ----------
// camera: centre (cx,cy) in set space at zoom z; clamped so the view never leaves the set (setW x 1920)
let CAM = { cx: 540, cy: 960, z: 1 };
function cam(ctx, cx, cy, z, fn, setW = 1080) {
  z = Math.max(z, 1);
  const hw = W / 2 / z, hh = H / 2 / z;
  cx = clamp(cx, hw, setW - hw); cy = clamp(cy, hh, H - hh);
  CAM = { cx, cy, z };
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
// set-space → screen-space (uses the last camera)
function toScreen(x, y) { return [(x - CAM.cx) * CAM.z + W / 2, (y - CAM.cy) * CAM.z + H / 2]; }
// subtle hand-held drift (very small) to keep frames alive
function drift(t, amt = 6, seed = 0) { return [noise1(t * 0.35 + seed) * amt, noise1(t * 0.3 + seed + 50) * amt]; }

// ---------- grading overlays ----------
function gradeMorning(ctx, k = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = `rgba(255,236,200,${0.35 * k})`; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function gradeDaylight(ctx, k = 1) { // bright, slightly cool-clean classroom light from window
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = hgrad(ctx, 0, W, [[0, `rgba(255,250,235,${0.10 * k})`], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
}
function gradeAfternoon(ctx, k) { // k: 0 = midday, 1 = late afternoon/evening
  if (k <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(255,${Math.round(215 - 45 * k)},${Math.round(170 - 80 * k)},${0.55 * k})`; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rgrad(ctx, W * 0.05, H * 0.2, 50, 1400, [[0, `rgba(255,160,80,${0.42 * k})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function gradeNight(ctx, lampX, lampY, k = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = `rgba(70,70,120,${0.55 * k})`; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = rgrad(ctx, lampX, lampY, 20, 1100, [[0, `rgba(255,200,120,${0.55 * k})`], [0.45, `rgba(255,150,70,${0.18 * k})`], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function vignette(ctx, k = 0.35) {
  ctx.fillStyle = rgrad(ctx, W / 2, H / 2, H * 0.3, H * 0.75, [[0, 'rgba(0,0,0,0)'], [1, `rgba(10,10,20,${k})`]]); ctx.fillRect(0, 0, W, H);
}
// soft light rays (window light)
function lightRays(ctx, x, y, ang, k = 0.12) {
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y); ctx.rotate(ang);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(255,248,225,${k * (0.6 + hash(i) * 0.6)})`; ctx.beginPath(); ctx.moveTo(i * 120, 0); ctx.lineTo(i * 120 + 70, 0); ctx.lineTo(i * 160 + 420, 2400); ctx.lineTo(i * 160 + 240, 2400); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// floating dust motes in light
function motes(ctx, t, n = 26, col = 'rgba(255,250,230,0.5)') {
  for (let i = 0; i < n; i++) { const x = (hash(i * 3) * W + t * 12 * (hash(i) - 0.5)) % W, y = (hash(i * 7) * H - t * 8 * (0.3 + hash(i * 5))) % H; ell(ctx, (x + W) % W, (y + H) % H, 2 + hash(i * 9) * 2.5, 2 + hash(i * 9) * 2.5, col); }
}

// ============================================================
//  TEXT LAYER (drawn on its own canvas, screen space)
// ============================================================
const SUB_Y = 1488;         // subtitle block centre — keeps the bottom ~360px clear for phone UI
function txtShadow(ctx, on = true) { ctx.shadowColor = on ? 'rgba(0,0,0,0.55)' : 'transparent'; ctx.shadowBlur = on ? 12 : 0; ctx.shadowOffsetY = on ? 3 : 0; }
function drawSubtitle(ctx, text, alpha) {
  if (!text || alpha <= 0) return;
  const lines = text.split('\n').slice(0, 2);
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.font = `700 50px ${FONT_B}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = 50; const mw = Math.max(...lines.map(l => ctx.measureText(l).width));
  if (mw > 940) { fs = Math.floor(50 * 940 / mw); ctx.font = `700 ${fs}px ${FONT_B}`; }
  const lh = Math.round(fs * 1.48); const widths = lines.map(l => ctx.measureText(l).width);
  const bw = Math.min(1000, Math.max(...widths) + 64), bh = lines.length * lh + 26;
  const y0 = SUB_Y - bh / 2;
  ctx.fillStyle = 'rgba(16,18,28,0.58)'; rr(ctx, W / 2 - bw / 2, y0, bw, bh, 26); ctx.fill();
  lines.forEach((l, i) => {
    const y = y0 + 13 + lh * (i + 0.5) + 2;
    ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(10,10,18,0.55)'; ctx.lineJoin = 'round'; ctx.strokeText(l, W / 2, y);
    ctx.fillStyle = '#ffffff'; ctx.fillText(l, W / 2, y);
  });
  ctx.restore();
}
// time chip e.g. "09:00–10:00 น."
function drawTimeChip(ctx, text, k, sub = '') {
  if (k <= 0) return;
  const a = ease.o(clamp(k)); ctx.save(); ctx.globalAlpha = a;
  const x = 64, y = 170 - (1 - a) * 30;
  ctx.font = `600 50px ${FONT_T}`; const w = ctx.measureText(text).width + 130;
  txtShadow(ctx); fillRR(ctx, x, y, w, 96, 48, 'rgba(255,255,255,0.94)'); txtShadow(ctx, false);
  // clock icon
  ell(ctx, x + 50, y + 48, 26, 26, '#f2784b'); ell(ctx, x + 50, y + 48, 20, 20, '#fff');
  ctx.strokeStyle = '#f2784b'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + 50, y + 48); ctx.lineTo(x + 50, y + 34); ctx.moveTo(x + 50, y + 48); ctx.lineTo(x + 60, y + 54); ctx.stroke();
  ctx.fillStyle = '#28324a'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x + 92, y + 50);
  if (sub) { ctx.font = `500 34px ${FONT_T}`; txtShadow(ctx); ctx.fillStyle = '#ffffff'; ctx.fillText(sub, x + 8, y + 140); }
  ctx.restore();
}
// name tag pointing at a character position (screen coords)
function drawNameTag(ctx, name, role, x, y, k, side = 1) {
  if (k <= 0) return;
  const a = ease.o(clamp(k)); ctx.save(); ctx.globalAlpha = a;
  ctx.font = `600 46px ${FONT_T}`; const w1 = ctx.measureText(name).width;
  ctx.font = `500 30px ${FONT_T}`; const w2 = role ? ctx.measureText(role).width : 0;
  const w = Math.max(w1, w2) + 60, h = role ? 128 : 84;
  const bx = side > 0 ? x + 30 : x - 30 - w, by = y - h / 2 + (1 - a) * 20;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(side > 0 ? bx : bx + w, by + h / 2); ctx.stroke(); ell(ctx, x, y, 9, 9, '#fff');
  txtShadow(ctx); fillRR(ctx, bx, by, w, h, 22, 'rgba(255,255,255,0.95)'); txtShadow(ctx, false);
  ctx.fillStyle = '#f2784b'; rr(ctx, bx, by, 12, h, 6); ctx.fill();
  ctx.fillStyle = '#28324a'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `600 46px ${FONT_T}`; ctx.fillText(name, bx + 34, by + (role ? 44 : h / 2 + 2));
  if (role) { ctx.fillStyle = '#6b7389'; ctx.font = `500 30px ${FONT_T}`; ctx.fillText(role, bx + 34, by + 94); }
  ctx.restore();
}
// thought bubble with short text
function drawThought(ctx, text, x, y, k) {
  if (k <= 0) return;
  const a = ease.back(clamp(k)); ctx.save(); ctx.globalAlpha = clamp(k * 2);
  ctx.font = `500 48px ${FONT_T}`; const w = ctx.measureText(text).width + 90, h = 120;
  ctx.translate(x, y); ctx.scale(a, a);
  txtShadow(ctx);
  ctx.fillStyle = 'rgba(255,255,255,0.96)';
  ctx.beginPath(); const r = h / 2; ctx.ellipse(0, 0, w / 2 + 20, r + 6, 0, 0, Math.PI * 2); ctx.fill();
  ell(ctx, -w / 2 + 40, r + 40, 18, 18, 'rgba(255,255,255,0.96)'); ell(ctx, -w / 2 + 10, r + 80, 10, 10, 'rgba(255,255,255,0.96)');
  txtShadow(ctx, false);
  ctx.fillStyle = '#3a4560'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4);
  ctx.restore();
}
// lower third (character intro)
function drawLowerThird(ctx, title, sub, k) {
  if (k <= 0) return;
  const a = ease.o(clamp(k)); ctx.save(); ctx.globalAlpha = clamp(k * 1.5);
  const x = 64 - (1 - a) * 80, y = 1190;
  ctx.font = `600 64px ${FONT_T}`; const w1 = ctx.measureText(title).width;
  ctx.font = `500 38px ${FONT_T}`; const w2 = ctx.measureText(sub).width;
  txtShadow(ctx); fillRR(ctx, x, y, Math.max(w1, w2) + 90, 170, 26, 'rgba(255,255,255,0.95)'); txtShadow(ctx, false);
  ctx.fillStyle = '#5aa9e6'; rr(ctx, x, y, 14, 170, 7); ctx.fill();
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#1f2a44'; ctx.font = `600 64px ${FONT_T}`; ctx.fillText(title, x + 44, y + 58);
  ctx.fillStyle = '#5b6680'; ctx.font = `500 38px ${FONT_T}`; ctx.fillText(sub, x + 44, y + 126);
  ctx.restore();
}
// main title card
function drawTitle(ctx, k, kOut = 0) {
  const a = clamp(k) * (1 - clamp(kOut)); if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a;
  const y = 330 + (1 - ease.o(clamp(k))) * 40;
  ctx.fillStyle = vgrad(ctx, 0, 760, [[0, 'rgba(20,28,60,0.55)'], [0.7, 'rgba(20,28,60,0.35)'], [1, 'rgba(20,28,60,0)']]); ctx.fillRect(0, 0, W, 760);
  txtShadow(ctx);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 50px ${FONT_T}`; ctx.fillStyle = '#ffffff'; ctx.fillText('บันทึกฝึกงานของทีม', W / 2, y);
  ctx.font = `600 96px ${FONT_T}`; ctx.fillStyle = '#ffffff'; ctx.fillText('EP.1', W / 2, y + 100);
  ctx.font = `600 74px ${FONT_T}`; ctx.fillStyle = '#ffe9a8'; ctx.fillText('ค่อย ๆ กล้าทีละนิด', W / 2, y + 200);
  txtShadow(ctx, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(W / 2 - 160, y + 48); ctx.lineTo(W / 2 + 160, y + 48); ctx.stroke();
  ctx.restore();
}
function drawEndCard(ctx, k1, k2) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (k1 > 0) { ctx.globalAlpha = clamp(k1); txtShadow(ctx); ctx.font = `600 72px ${FONT_T}`; ctx.fillStyle = '#fff6dc'; ctx.fillText('ไม่ต้องกล้าทุกอย่าง', W / 2, 520 - (1 - ease.o(clamp(k1))) * 30); ctx.fillText('ในวันเดียว', W / 2, 615 - (1 - ease.o(clamp(k1))) * 30); }
  if (k2 > 0) { ctx.globalAlpha = clamp(k2); txtShadow(ctx); ctx.font = `600 46px ${FONT_T}`; ctx.fillStyle = '#ffffff'; ctx.fillText('บันทึกฝึกงานของทีม | EP.1', W / 2, 760); }
  ctx.restore();
}

// ============================================================
//  compositors
// ============================================================
let _buf = null;
function drawShot(ctx, s, T) { ctx.save(); s.draw(ctx, T, T - s.a, s); ctx.restore(); }
function renderScene(ctx, T) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  let i = SHOTS.findIndex(s => T >= s.a && T < s.b);
  if (i < 0) i = T < SHOTS[0].a ? 0 : SHOTS.length - 1;
  const s = SHOTS[i];
  if (s.fade > 0 && i > 0 && T < s.a + s.fade) {
    drawShot(ctx, SHOTS[i - 1], T);
    if (!_buf) _buf = makeCanvas(W, H);
    const b = _buf.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.clearRect(0, 0, W, H);
    drawShot(b, s, T);
    ctx.globalAlpha = ease.sine(clamp((T - s.a) / s.fade)); ctx.drawImage(_buf, 0, 0); ctx.globalAlpha = 1;
  } else drawShot(ctx, s, T);
}
function renderText(ctx, T) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
  for (const e of TEXTS) if (T >= e.a && T < e.b) { ctx.save(); e.draw(ctx, T - e.a, e.b - e.a, T); ctx.restore(); }
  for (const s of SUBS) if (T >= s[0] && T < s[1]) { const a = Math.min(1, (T - s[0]) / 0.12, (s[1] - T) / 0.12); drawSubtitle(ctx, s[2], a); }
}
