// ============================================================
//  sets.js — painted backgrounds (re-drawn from the location photos)
//  Each set is pre-rendered once to an offscreen canvas at SR scale.
// ============================================================
'use strict';
const SR = 1.5; // supersample factor for sets (camera can push in ~1.5x crisp)
const FONT_T = '"Mitr", "Kanit", sans-serif';
const FONT_B = '"Sarabun", "Mitr", sans-serif';
const FONT_L = '"Kanit", "Mitr", sans-serif';

// ---- shared bits ----
function gearShape(ctx, x, y, r, teeth, col, hole = 0.38) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  const n = teeth, ri = r * 0.78;
  for (let i = 0; i < n * 2; i++) {
    const a0 = (i / (n * 2)) * Math.PI * 2, a1 = ((i + 1) / (n * 2)) * Math.PI * 2;
    const rad = i % 2 === 0 ? r : ri;
    ctx.lineTo(Math.cos(a0 + 0.04) * rad, Math.sin(a0 + 0.04) * rad); ctx.lineTo(Math.cos(a1 - 0.04) * rad, Math.sin(a1 - 0.04) * rad);
  }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r * hole, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
  ctx.restore();
}
// ClickRobot gear logo (three gears in a ring) — re-drawn from the signage in the photos
function logoGears(ctx, x, y, r, ring = true, rot = 0) {
  if (ring) { ctx.strokeStyle = '#e8792f'; ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.02; ctx.beginPath(); ctx.arc(x, y, r * 0.95, 0, Math.PI * 2); ctx.stroke(); }
  ctx.save(); ctx.translate(x, y);
  ctx.save(); ctx.translate(-r * 0.33, -r * 0.18); ctx.rotate(rot); gearShape(ctx, 0, 0, r * 0.33, 10, '#2e9d4f'); ctx.restore();
  ctx.save(); ctx.translate(r * 0.12, -r * 0.48); ctx.rotate(-rot * 1.4); gearShape(ctx, 0, 0, r * 0.25, 9, '#3a4fc0'); ctx.restore();
  ctx.save(); ctx.translate(r * 0.3, r * 0.22); ctx.rotate(-rot * 0.8); gearShape(ctx, 0, 0, r * 0.46, 12, '#e2433b', 0.3); ctx.restore();
  ctx.restore();
}
function clickRobotText(ctx, x, y, size, align = 'center', dark = '#1d1d1f') {
  ctx.font = `500 ${size}px "Courier New", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  const parts = [['C', '#e2433b'], ['lick', dark], ['R', '#e2433b'], ['obot', dark]];
  const spacing = size * 0.12;
  let total = 0; parts.forEach(([s]) => { for (const ch of s) total += ctx.measureText(ch).width + spacing; });
  let cx = align === 'center' ? x - total / 2 : x;
  parts.forEach(([s, col]) => { ctx.fillStyle = col; for (const ch of s) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; } });
  return total;
}
function woodFloor(ctx, x0, y0, w, h, base = '#c99a63') {
  ctx.fillStyle = base; ctx.fillRect(x0, y0, w, h);
  let y = y0, row = 0, ph = 26;
  while (y < y0 + h) {
    const rh = ph * (1 + (y - y0) / h * 1.6);
    let x = x0 - hash(row * 7.1) * 300;
    while (x < x0 + w) {
      const pw = 260 + hash(row * 13 + x) * 260;
      const tone = hash(row * 31.7 + Math.floor(x));
      ctx.fillStyle = `hsl(${30 + tone * 6},${42 + tone * 10}%,${52 + tone * 9 - (y - y0) / h * 4}%)`;
      ctx.fillRect(x, y, pw, rh);
      // grain
      ctx.strokeStyle = 'rgba(110,70,35,0.13)'; ctx.lineWidth = 1.2;
      for (let g = 0; g < 3; g++) { const gy = y + rh * (0.25 + g * 0.25); ctx.beginPath(); ctx.moveTo(x + 10, gy); ctx.bezierCurveTo(x + pw * 0.3, gy - 3, x + pw * 0.6, gy + 3, x + pw - 10, gy); ctx.stroke(); }
      ctx.fillStyle = 'rgba(80,50,25,0.35)'; ctx.fillRect(x, y, 2, rh);
      x += pw;
    }
    ctx.fillStyle = 'rgba(80,50,25,0.28)'; ctx.fillRect(x0, y, w, 1.5);
    y += rh; row++;
  }
  // sheen from window light
  ctx.fillStyle = hgrad(ctx, x0, x0 + w, [[0, 'rgba(255,255,255,0.0)'], [0.45, 'rgba(255,250,235,0.16)'], [1, 'rgba(255,255,255,0)']]);
  ctx.fillRect(x0, y0, w, h);
}
// grey robot field tiles with black grid lines (like the mat in the classroom)
function robotMat(ctx, x, y, cells, cs, skew = 0.0) {
  // cells: array of [cx, cy] occupied grid cells
  ctx.save();
  cells.forEach(([i, j]) => {
    const px = x + i * cs, py = y + j * cs * 0.55;
    ctx.fillStyle = '#dfe3e6'; ctx.fillRect(px, py, cs, cs * 0.55);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let k = 0; k < 4; k++) ctx.fillRect(px + 6 + k * cs / 4, py + 6, cs / 6, 4);
    ctx.strokeStyle = '#c4c9cd'; ctx.lineWidth = 2; ctx.strokeRect(px, py, cs, cs * 0.55);
  });
  // black lines across centre of each cell
  ctx.strokeStyle = '#1b1b1d'; ctx.lineWidth = 7;
  cells.forEach(([i, j]) => {
    const px = x + i * cs, py = y + j * cs * 0.55;
    ctx.beginPath(); ctx.moveTo(px, py + cs * 0.275); ctx.lineTo(px + cs, py + cs * 0.275); ctx.moveTo(px + cs / 2, py); ctx.lineTo(px + cs / 2, py + cs * 0.55); ctx.stroke();
  });
  ctx.restore();
}
// low kids' table (coloured top + coloured legs as in the photo)
function lowTable(ctx, x, y, w, h, top, side, legs = top) {
  // y = top surface front edge
  const th = 16, depth = 46;
  ctx.fillStyle = 'rgba(40,25,10,0.22)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h + 6, w * 0.55, 16, 0, 0, Math.PI * 2); ctx.fill();
  // legs (panel style)
  ctx.fillStyle = shade(legs, -0.08); ctx.fillRect(x + 8, y + th, 26, h - th); ctx.fillRect(x + w - 34, y + th, 26, h - th);
  ctx.fillStyle = shade(legs, -0.25); ctx.fillRect(x + 8, y + th, 6, h - th); ctx.fillRect(x + w - 34, y + th, 6, h - th);
  // apron
  ctx.fillStyle = side; ctx.fillRect(x + 4, y + th, w - 8, 26);
  // top
  ctx.fillStyle = shade(top, 0.08); ctx.beginPath(); ctx.moveTo(x + 18, y - depth); ctx.lineTo(x + w - 18, y - depth); ctx.lineTo(x + w, y); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(x + 30, y - depth + 6); ctx.lineTo(x + w * 0.45, y - depth + 6); ctx.lineTo(x + w * 0.4, y - 4); ctx.lineTo(x + 20, y - 4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(top, -0.12); ctx.fillRect(x, y, w, th);
  ctx.fillStyle = '#fdfbf4'; ctx.fillRect(x, y, w, 3); // white edge band (like the photo)
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, th);
}
function yellowBin(ctx, x, y, w = 150, h = 70, lid = true) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 6, y + h - 4, w, 10);
  ctx.fillStyle = '#f7c928'; rr(ctx, x, y + 10, w, h - 10, 8); ctx.fill();
  ctx.fillStyle = '#e3b11c'; ctx.fillRect(x, y + h - 22, w, 12);
  if (lid) { ctx.fillStyle = '#f2f4f5'; rr(ctx, x - 4, y, w + 8, 18, 5); ctx.fill(); ctx.strokeStyle = '#c9cdd0'; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + w * 0.1, y + 28, w * 0.28, 22); ctx.fillStyle = '#e2433b'; ctx.fillRect(x + w * 0.12, y + 31, 10, 8);
}
function acUnit(ctx, x, y, w = 330, h = 90) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)'; rr(ctx, x + 4, y + 6, w, h, 14); ctx.fill();
  ctx.fillStyle = vgrad(ctx, y, y + h, [[0, '#fbfaf6'], [1, '#e7e3d8']]); rr(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = '#cfc9bb'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#bdb6a6'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + 14, y + h - 30 + i * 8); ctx.lineTo(x + w - 14, y + h - 30 + i * 8); ctx.stroke(); }
  ell(ctx, x + w - 26, y + 22, 4, 4, '#7bd17a');
}

// SPIKE-style robot model (generic LEGO-like build): hub + wheels + beams
function spikeBot(ctx, x, y, s = 1, col = '#f7d23a', t = 0, light = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 28, 70, 10, 0, 0, Math.PI * 2); ctx.fill();
  // wheels
  [-46, 46].forEach(wx => { ell(ctx, wx, 10, 22, 22, '#2a2a2e'); ell(ctx, wx, 10, 12, 12, '#d9dde2'); ctx.save(); ctx.translate(wx, 10); ctx.rotate(t * 4); ctx.fillStyle = '#9aa3ad'; for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.fillRect(-1.5, 3, 3, 7); } ctx.restore(); });
  // beams (light grey with holes)
  ctx.fillStyle = '#c9ced4'; rr(ctx, -62, -6, 124, 14, 7); ctx.fill(); ctx.fillStyle = '#9aa1a8'; for (let i = -54; i <= 54; i += 12) ell(ctx, i, 1, 2.5, 2.5, '#8a9199');
  // hub (white/yellow)
  ctx.fillStyle = '#ffffff'; rr(ctx, -34, -52, 68, 50, 7); ctx.fill(); ctx.strokeStyle = '#c9ced4'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = col; rr(ctx, -34, -52, 68, 12, 5); ctx.fill();
  // 5x5 light matrix
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const on = light && ((i === j) || (i + j === 4) || (Math.floor(t * 3) + i + j) % 7 === 0); ctx.fillStyle = on ? '#ffffff' : '#3a3a40'; ctx.fillRect(-14 + i * 6, -36 + j * 6, 4.5, 4.5); }
  ctx.fillStyle = '#2b2b2f'; ctx.fillRect(-16, -38, 32, 32); for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const on = light && ((i === j) || (i + j === 4)); ctx.fillStyle = on ? '#fff6c8' : '#4a4a52'; ctx.fillRect(-14 + i * 6, -36 + j * 6, 4.5, 4.5); }
  // sensor
  fillRR(ctx, 38, -26, 22, 18, 4, '#ffffff', '#c9ced4', 2); ell(ctx, 49, -17, 5, 5, '#222'); ell(ctx, 49, -17, 2, 2, '#e2433b');
  // pink/teal accents
  ctx.fillStyle = '#ec5aa0'; rr(ctx, -60, -20, 20, 10, 3); ctx.fill(); ctx.fillStyle = '#2ab7a9'; rr(ctx, 40, -4, 20, 10, 3); ctx.fill();
  ctx.restore();
}
function tablet(ctx, x, y, w, h, screenFn, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  fillRR(ctx, -w / 2, -h / 2, w, h, w * 0.06, '#2a2c31'); fillRR(ctx, -w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08, w * 0.03, '#f4f6fb');
  if (screenFn) { ctx.save(); rr(ctx, -w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08, w * 0.03); ctx.clip(); screenFn(ctx, -w / 2 + w * 0.04, -h / 2 + w * 0.04, w * 0.92, h - w * 0.08); ctx.restore(); }
  ctx.restore();
}
// generic block-coding screen (word blocks – colours only, no product UI copy)
function blockCodeScreen(ctx, x, y, w, h, prog = 1) {
  ctx.fillStyle = '#f5f7fb'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#e9edf5'; ctx.fillRect(x, y, w * 0.18, h);
  const cols = ['#f5c13d', '#4cb6f0', '#ec5aa0', '#8e6bf2', '#40c08a'];
  for (let i = 0; i < 6; i++) ell(ctx, x + w * 0.09, y + h * 0.1 + i * h * 0.14, w * 0.035, w * 0.035, cols[i % 5]);
  const n = Math.floor(prog * 7 + 0.001);
  const bw = w * 0.5, bh = h * 0.085;
  for (let i = 0; i < 7; i++) {
    if (i >= n) break;
    const bx = x + w * 0.28 + (i > 1 && i < 5 ? w * 0.05 : 0), by = y + h * 0.12 + i * bh * 1.02;
    ctx.fillStyle = cols[[0, 3, 1, 1, 2, 4, 0][i]]; rr(ctx, bx, by, bw * (0.7 + hash(i) * 0.4), bh, bh * 0.25); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; rr(ctx, bx + bw * 0.12, by + bh * 0.28, bw * 0.3, bh * 0.44, bh * 0.2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; rr(ctx, bx + bw * 0.5, by + bh * 0.3, bw * 0.15, bh * 0.4, bh * 0.2); ctx.fill();
  }
}

// ============================================================
//  SET: storefront exterior (world 1900 x 1920)
// ============================================================
function paintStorefront(ctx) {
  const WW = 1900;
  // sky + upper facade
  ctx.fillStyle = vgrad(ctx, 0, 420, [[0, '#8fcdf2'], [1, '#d7eefa']]); ctx.fillRect(0, 0, WW, 420);
  for (let i = 0; i < 6; i++) { const cx = hash(i * 3) * WW, cy = 80 + hash(i * 5) * 140; ctx.fillStyle = 'rgba(255,255,255,0.9)'; ell(ctx, cx, cy, 90, 26); ell(ctx, cx + 50, cy - 16, 60, 30); ell(ctx, cx - 50, cy - 8, 50, 22); }
  ctx.fillStyle = '#efe5d2'; ctx.fillRect(0, 300, WW, 260);
  for (let x = 60; x < WW; x += 420) { ctx.fillStyle = '#c9d8e2'; ctx.fillRect(x, 330, 300, 150); ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.strokeRect(x, 330, 300, 150); ctx.beginPath(); ctx.moveTo(x + 150, 330); ctx.lineTo(x + 150, 480); ctx.stroke(); }
  // awning ceiling (beige corrugated slats)
  ctx.fillStyle = vgrad(ctx, 540, 820, [[0, '#d9c49a'], [1, '#c2a874']]); ctx.fillRect(0, 540, WW, 280);
  for (let y = 548; y < 820; y += 22) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(0, y, WW, 4); ctx.fillStyle = 'rgba(90,60,20,0.15)'; ctx.fillRect(0, y + 10, WW, 2); }
  ctx.fillStyle = '#efe7d6'; ctx.fillRect(0, 780, WW, 60);
  for (let x = 160; x < WW; x += 330) { ell(ctx, x, 810, 22, 8, '#cfc6b2'); ell(ctx, x, 810, 13, 5, '#fff8de'); }
  // granite lintel band
  const granite = (x, y, w, h) => { ctx.fillStyle = '#c9a98f'; ctx.fillRect(x, y, w, h); for (let i = 0; i < w * h / 160; i++) { const px = x + hash(i * 1.7 + x) * w, py = y + hash(i * 2.3 + y) * h; ctx.fillStyle = ['#a07f6a', '#e6d3c4', '#8c6c58', '#d8bfae'][i % 4]; ctx.fillRect(px, py, 2.4, 2.4); } };
  granite(0, 840, WW, 120);
  // storefront back wall
  ctx.fillStyle = '#3a3f46'; ctx.fillRect(0, 960, WW, 560);
  // pillars
  const pillar = (x) => {
    granite(x, 940, 150, 590);
    ctx.fillStyle = '#9b3b26'; ctx.fillRect(x, 940, 150, 34); ctx.fillRect(x, 1250, 150, 26); ctx.fillRect(x, 1490, 150, 40);
    [1060, 1380].forEach(dy => { ctx.save(); ctx.translate(x + 75, dy); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#9b3b26'; ctx.fillRect(-20, -20, 40, 40); ctx.restore(); });
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + 140, 940, 10, 590);
  };
  // glass door section (white grid frame)
  const gx = 250, gw = 790, gy = 975, gh = 545;
  ctx.fillStyle = vgrad(ctx, gy, gy + gh, [[0, '#9fb8c8'], [0.5, '#7f97a8'], [1, '#5f7280']]); ctx.fillRect(gx, gy, gw, gh);
  // interior glimpse: blue banner + light
  ctx.fillStyle = 'rgba(80,140,220,0.45)'; ctx.fillRect(gx + 40, gy + 200, 300, 200);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(gx + 60, gy); ctx.lineTo(gx + 260, gy); ctx.lineTo(gx + 80, gy + gh); ctx.lineTo(gx - 120, gy + gh); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(gx + 420, gy); ctx.lineTo(gx + 500, gy); ctx.lineTo(gx + 360, gy + gh); ctx.lineTo(gx + 280, gy + gh); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#f7f7f4'; ctx.lineWidth = 16; ctx.strokeRect(gx, gy, gw, gh);
  ctx.lineWidth = 10; [gy + 120].forEach(y => { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke(); });
  const cols = [gx, gx + 180, gx + 395, gx + 610, gx + gw];
  ctx.lineWidth = 12; cols.forEach(x => { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy + gh); ctx.stroke(); });
  ctx.lineWidth = 6; for (let r = 1; r < 4; r++) { const y = gy + 120 + r * (gh - 120) / 4; ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); ctx.stroke(); }
  for (let i = 0; i < 4; i++) { const x = (cols[i] + cols[i + 1]) / 2; ctx.beginPath(); ctx.moveTo(x, gy + 120); ctx.lineTo(x, gy + gh); ctx.stroke(); }
  // door handles (pink tape)
  ctx.fillStyle = '#cfd4d8'; ctx.fillRect(gx + 380, gy + 260, 8, 120); ctx.fillRect(gx + 404, gy + 260, 8, 120);
  ctx.fillStyle = '#f48fb8'; ctx.fillRect(gx + 378, gy + 290, 12, 30); ctx.fillRect(gx + 402, gy + 290, 12, 30);
  ctx.fillStyle = '#f2c94c'; ctx.fillRect(gx + 520, gy + 20, 22, 60); // little yellow tag on transom
  pillar(100); pillar(1040);
  // house number plate
  fillRR(ctx, 1062, 990, 106, 34, 4, '#8b2d21'); ctx.fillStyle = '#fff'; ctx.font = `600 22px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillText('162/1-2', 1115, 1015);
  // notice
  fillRR(ctx, 1065, 1290, 100, 60, 4, '#ffffff', '#c33', 3); ctx.fillStyle = '#c33'; ctx.font = `600 15px ${FONT_T}`; ctx.fillText('กรุณา', 1115, 1312); ctx.fillText('อย่าจอดรถ', 1115, 1335);
  // shop window (right)
  const wx = 1190, ww = 680, wy = 975, wh = 545;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(wx, wy, ww, wh);
  ctx.fillStyle = '#f7f7f7'; ctx.fillRect(wx, wy, ww, 150);
  logoGears(ctx, wx + 140, wy + 78, 52, true);
  clickRobotText(ctx, wx + 420, wy + 90, 52);
  ctx.fillStyle = '#333'; ctx.font = `400 21px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.fillText('E n g i n e e r   L e a r n i n g   C e n t e r', wx + 420, wy + 125);
  // graphic panel
  const py = wy + 160, ph = 300;
  ctx.fillStyle = vgrad(ctx, py, py + ph, [[0, '#cfe4f7'], [0.7, '#b9cdf0'], [1, '#6f6fd0']]); ctx.fillRect(wx + 10, py, ww - 20, ph);
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(wx + 10, py, ww - 20, 40);
  ctx.font = `italic 700 40px "Comic Sans MS", ${FONT_L}`; ctx.textAlign = 'left';
  ctx.lineWidth = 7; ctx.strokeStyle = '#ffffff'; ctx.strokeText('Robots for Education', wx + 24, py + 52); ctx.fillStyle = '#3b55c6'; ctx.fillText('Robots for Education', wx + 24, py + 52);
  ctx.font = `italic 600 26px "Comic Sans MS", ${FONT_L}`; ctx.strokeText('Benefits of STEM...', wx + 452, py + 50); ctx.fillStyle = '#d33a3a'; ctx.fillText('Benefits of STEM...', wx + 452, py + 50);
  ctx.font = `700 56px ${FONT_L}`; ctx.lineWidth = 9; ctx.strokeText("LET'S BUILD...", wx + 170, py + 132); ctx.fillStyle = '#e02b2b'; ctx.fillText("LET'S BUILD...", wx + 170, py + 132);
  const items = [['ROBOT', 0, 0], ['PLAY', 1, 0], ['CODING', 0, 1], ['FUN', 1, 1], ['HAPPY', 0, 2], ['ACTIVITY', 1, 2]];
  ctx.font = `700 22px ${FONT_L}`;
  items.forEach(([s, c, r]) => { const ix = wx + 430 + c * 120, iy = py + 175 + r * 34; ctx.fillStyle = '#d33a3a'; ell(ctx, ix - 10, iy - 8, 4, 4, '#d33a3a'); ctx.lineWidth = 5; ctx.strokeText(s, ix, iy); ctx.fillStyle = '#d33a3a'; ctx.fillText(s, ix, iy); });
  // light-bulb of gears
  const bx = wx + 90, by = py + 160;
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx, by, 58, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(bx + 24, by + 74); ctx.lineTo(bx - 24, by + 74); ctx.closePath(); ctx.fill();
  const gc = ['#e2433b', '#2e9d4f', '#3a4fc0', '#f2b632', '#ec5aa0', '#2ab7a9'];
  for (let i = 0; i < 12; i++) { const a = hash(i * 9) * Math.PI * 2, r = hash(i * 4) * 40; gearShape(ctx, bx + Math.cos(a) * r, by + Math.sin(a) * r * 0.9, 9 + hash(i) * 8, 8, gc[i % 6]); }
  ctx.fillStyle = '#9aa3ad'; ctx.fillRect(bx - 22, by + 74, 44, 26); ctx.fillStyle = '#6c757d'; ctx.fillRect(bx - 22, by + 82, 44, 4); ctx.fillRect(bx - 22, by + 92, 44, 4);
  // small robot builds on the window graphic
  spikeBot(ctx, wx + 230, py + 250, 0.5, '#f7d23a', 0, false); spikeBot(ctx, wx + 560, py + 255, 0.45, '#ec5aa0', 0, false);
  ctx.fillStyle = '#e8e8f0'; ctx.fillRect(wx, wy + wh - 70, ww, 70);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(wx + 300, wy + 150); ctx.lineTo(wx + 360, wy + 150); ctx.lineTo(wx + 260, wy + wh); ctx.lineTo(wx + 200, wy + wh); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d7d7d2'; ctx.lineWidth = 10; ctx.strokeRect(wx, wy, ww, wh);
  pillar(1860);
  // step / base
  granite(0, 1520, WW, 40); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(0, 1555, WW, 8);
  // sidewalk: terrazzo-ish beige with green/navy diamond tiles
  ctx.fillStyle = '#d8c3a0'; ctx.fillRect(0, 1560, WW, 360);
  for (let i = 0; i < 2600; i++) { ctx.fillStyle = ['#c8b08a', '#e6d6bb', '#bba27c'][i % 3]; ctx.fillRect(hash(i * 3.1) * WW, 1560 + hash(i * 7.7) * 360, 2.5, 2.5); }
  const dia = (x, y, s) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.42); ctx.rotate(Math.PI / 4);
    const q = s / 2;
    ctx.fillStyle = '#5cb54a'; ctx.fillRect(-s, -s, q * 2 - 3, q * 2 - 3); ctx.fillStyle = '#1f3a66'; ctx.fillRect(3, -s, q * 2 - 3, q * 2 - 3);
    ctx.fillStyle = '#1f3a66'; ctx.fillRect(-s, 3, q * 2 - 3, q * 2 - 3); ctx.fillStyle = '#5cb54a'; ctx.fillRect(3, 3, q * 2 - 3, q * 2 - 3);
    ctx.restore();
  };
  for (let r = 0; r < 4; r++) for (let x = -100 + (r % 2) * 150; x < WW + 100; x += 300) dia(x, 1620 + r * 80, 34 + r * 10);
  ctx.fillStyle = '#1f3a66'; for (let x = 0; x < WW; x += 70) ctx.fillRect(x, 1890, 42, 12);
  // standee banner (purple) beside the door + shoe rack
  standee(ctx, 870, 1170, 1.0);
  ctx.fillStyle = '#f2f2f2'; ctx.fillRect(820, 1440, 190, 8); ctx.fillRect(820, 1480, 190, 8); ctx.fillRect(824, 1440, 6, 80); ctx.fillRect(1000, 1440, 6, 80);
  ['#6aaa8c', '#7ec4a6', '#3a6e5c', '#9fd3bd', '#5a8a7a'].forEach((c, i) => { ell(ctx, 845 + i * 36, 1434, 15, 7, c); ell(ctx, 845 + i * 36, 1474, 15, 7, c); });
}
function standee(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = vgrad(ctx, 0, 330, [[0, '#26214f'], [1, '#3a2f7a']]); ctx.fillRect(-60, 0, 120, 330);
  ctx.fillStyle = '#e2433b'; ctx.fillRect(-52, 10, 16, 30); ctx.fillStyle = '#fff'; ctx.font = `700 12px ${FONT_L}`; ctx.textAlign = 'left'; ctx.fillText('LICKROBOT', -34, 22); ctx.font = `700 15px ${FONT_L}`; ctx.fillText('HAIYAPHUM', -34, 40);
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; for (let i = 0; i < 5; i++) ctx.fillRect(-48, 56 + i * 10, 96 - i * 8, 4);
  for (let i = 0; i < 4; i++) fillRR(ctx, -50 + i * 25, 112, 21, 21, 4, '#ffffff');
  fillRR(ctx, -46, 146, 34, 34, 4, '#ffffff'); ctx.fillStyle = '#222'; for (let i = 0; i < 16; i++) if (hash(i * 3) > 0.45) ctx.fillRect(-43 + (i % 4) * 7, 149 + Math.floor(i / 4) * 7, 6, 6);
  ctx.fillStyle = '#fff'; ctx.fillRect(-4, 150, 50, 5); ctx.fillRect(-4, 162, 40, 5);
  const hc = ['#3e7cd1', '#5aa0e6', '#2d5fb0', '#76b8f0'];
  for (let i = 0; i < 9; i++) { ctx.fillStyle = hc[i % 4]; ctx.beginPath(); const hx = -40 + (i % 3) * 40, hy = 210 + Math.floor(i / 3) * 38; for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ctx.lineTo(hx + Math.cos(a) * 18, hy + Math.sin(a) * 18); } ctx.fill(); }
  ctx.fillStyle = '#888'; ctx.fillRect(-4, 330, 8, 20); ctx.fillRect(-40, 346, 80, 6);
  ctx.restore();
}

// ============================================================
//  SET: sign wall (brown slats + big gear logo) — low angle
// ============================================================
function paintSignWall(ctx) {
  const WW = 1080;
  ctx.fillStyle = vgrad(ctx, 0, 1920, [[0, '#f5f3ef'], [1, '#e9e5dd']]); ctx.fillRect(0, 0, WW, 1920);
  // slat wall panel (slightly trapezoid for low angle)
  ctx.save(); ctx.beginPath(); ctx.moveTo(-40, 140); ctx.lineTo(WW + 40, 60); ctx.lineTo(WW + 40, 1180); ctx.lineTo(-40, 1240); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#8a5a3c'; ctx.fillRect(-40, 0, WW + 80, 1300);
  for (let x = -40; x < WW + 40; x += 26) { ctx.fillStyle = hash(x) > 0.5 ? '#94643f' : '#7e5034'; ctx.fillRect(x, 0, 18, 1300); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 18, 0, 8, 1300); ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x + 2, 0, 3, 1300); }
  ctx.restore();
  ctx.fillStyle = '#6b4128'; ctx.beginPath(); ctx.moveTo(-40, 1240); ctx.lineTo(WW + 40, 1180); ctx.lineTo(WW + 40, 1210); ctx.lineTo(-40, 1272); ctx.closePath(); ctx.fill();
  // acrylic backing + logo
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(540, 420, 250, 0, Math.PI * 2); ctx.fill();
  logoGears(ctx, 540, 420, 230, true);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; rr(ctx, 120, 680, 840, 270, 40); ctx.fill();
  clickRobotText(ctx, 540, 800, 120, 'center', '#151515');
  ctx.font = `800 92px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillStyle = '#2a6fcf'; ctx.fillText('CHAIYAPHUM', 548, 918); ctx.fillStyle = '#5db3f5'; ctx.fillText('CHAIYAPHUM', 540, 910);
  // ceiling soffit + downlights
  ctx.fillStyle = vgrad(ctx, 1270, 1700, [[0, '#ffffff'], [1, '#eeeae3']]); ctx.beginPath(); ctx.moveTo(-40, 1272); ctx.lineTo(WW + 40, 1210); ctx.lineTo(WW + 40, 1920); ctx.lineTo(-40, 1920); ctx.closePath(); ctx.fill();
  ell(ctx, 300, 1500, 26, 10, '#d6d2c8'); ell(ctx, 300, 1500, 16, 6, '#fffbe8'); ell(ctx, 760, 1460, 26, 10, '#d6d2c8'); ell(ctx, 760, 1460, 16, 6, '#fffbe8');
  // wall fan right
  ctx.save(); ctx.translate(930, 1560); ell(ctx, 0, 0, 120, 120, 'rgba(40,40,45,0.15)'); ctx.strokeStyle = '#3a3a40'; ctx.lineWidth = 3; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i / 12 * 6.28) * 115, Math.sin(i / 12 * 6.28) * 115); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, 0, 115, 0, 6.28); ctx.stroke(); ell(ctx, 0, 0, 22, 22, '#2b5fb0'); ctx.restore();
}

// ============================================================
//  SET: SPIKE classroom (world 1700 x 1920)
// ============================================================
const CLASS = { W: 1700, floorY: 1080 };
function paintClassroom(ctx) {
  const WW = CLASS.W, fy = CLASS.floorY;
  // walls
  ctx.fillStyle = vgrad(ctx, 0, fy, [[0, '#f7f8f8'], [1, '#e9ecec']]); ctx.fillRect(0, 0, WW, fy);
  // right wall in perspective
  ctx.fillStyle = '#eef0f0'; ctx.beginPath(); ctx.moveTo(1480, 120); ctx.lineTo(WW, 0); ctx.lineTo(WW, fy + 160); ctx.lineTo(1480, fy); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(1470, 120, 12, fy - 120);
  // ceiling line & AC
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1480, 120); ctx.fillStyle = '#e1e4e4'; ctx.fillRect(0, 118, 1480, 4);
  acUnit(ctx, 600, 128, 360, 96);
  // left window shelf (wood frame w/ shelves like photo)
  ctx.fillStyle = '#7a3b2b'; ctx.fillRect(40, 280, 150, 420); ctx.fillStyle = '#e9e2d8'; ctx.fillRect(56, 296, 118, 388);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = '#7a3b2b'; ctx.fillRect(56, 330 + i * 46, 118, 6); for (let j = 0; j < 4; j++) { ctx.fillStyle = ['#d94b4b', '#4b8ad9', '#f2c94c', '#9ad94b'][(i + j) % 4]; ctx.fillRect(64 + j * 27, 312 + i * 46, 18, 18); } }
  // big blue banner
  const bx = 250, by = 200, bw = 1180, bh = 880;
  ctx.fillStyle = vgrad(ctx, by, by + bh, [[0, '#6aa7ec'], [0.6, '#79b2ef'], [1, '#5e9be3']]); ctx.fillRect(bx, by, bw, bh);
  // subtle gear watermarks
  ctx.globalAlpha = 0.12; for (let i = 0; i < 10; i++) gearShape(ctx, bx + hash(i * 4) * bw, by + hash(i * 6) * bh, 40 + hash(i) * 30, 10, '#ffffff', 0.5); ctx.globalAlpha = 1;
  // LET'S BUILD text block
  ctx.textAlign = 'left'; ctx.font = `700 64px ${FONT_L}`; ctx.lineWidth = 8; ctx.strokeStyle = '#ffffff'; ctx.strokeText("LET'S BUILD...", bx + 90, by + 120); ctx.fillStyle = '#e34b4b'; ctx.fillText("LET'S BUILD...", bx + 90, by + 120);
  ctx.font = `700 26px ${FONT_L}`; ctx.lineWidth = 5;
  [['ROBOT', 170, 170], ['CODING', 110, 205], ['HAPPY', 210, 240], ['PLAY', 100, 270], ['FUN', 200, 300], ['ACTIVITY', 120, 335]].forEach(([s, x, y]) => { ctx.strokeText(s, bx + x, by + y); ctx.fillStyle = '#e34b4b'; ctx.fillText(s, bx + x, by + y); });
  // welcome bubble
  fillRR(ctx, bx + 140, by + 410, 230, 70, 35, '#ffffff', '#e34b4b', 4); ctx.fillStyle = '#e34b4b'; ctx.font = `600 32px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillText('Welcome to', bx + 255, by + 457);
  // centre logo + name
  logoGears(ctx, bx + 600, by + 220, 140, true);
  clickRobotText(ctx, bx + 600, by + 420, 58, 'center', '#2b2b2b');
  ctx.fillStyle = '#2b2b2b'; ctx.font = `400 17px "Courier New", monospace`; ctx.fillText('Engineer Learning Center', bx + 600, by + 448);
  ctx.font = `700 40px ${FONT_L}`; ctx.lineWidth = 6; ctx.strokeStyle = '#fff'; ctx.strokeText('Lego Education Spike Prime', bx + 640, by + 520); ctx.fillStyle = '#e0457a'; ctx.fillText('Lego Education Spike Prime', bx + 640, by + 520);
  // robot illustration on banner (big humanoid build, left) — generic LEGO-like robot
  const rx = bx + 210, ry = by + 520;
  ctx.fillStyle = '#ffffff'; fillRR(ctx, rx - 40, ry, 80, 70, 10, '#ffffff', '#9fb0c4', 3); fillRR(ctx, rx - 20, ry + 18, 40, 30, 8, '#2b2b2f'); ell(ctx, rx, ry + 33, 9, 9, '#ffffff');
  ctx.strokeStyle = '#2b2b2f'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(rx, ry + 70); ctx.lineTo(rx, ry + 200); ctx.moveTo(rx - 70, ry + 100); ctx.lineTo(rx + 70, ry + 100); ctx.moveTo(rx, ry + 200); ctx.lineTo(rx - 50, ry + 320); ctx.moveTo(rx, ry + 200); ctx.lineTo(rx + 50, ry + 320); ctx.stroke();
  fillRR(ctx, rx - 115, ry + 70, 60, 34, 6, '#f2d34a'); fillRR(ctx, rx + 60, ry + 60, 60, 34, 6, '#f2d34a'); fillRR(ctx, rx - 30, ry + 150, 60, 50, 6, '#5fc9e8');
  // bricks & kit along bottom of banner
  const brickC = ['#f2c94c', '#e34b4b', '#4b8ad9', '#ffffff', '#9a6fd9', '#2ab7a9'];
  for (let i = 0; i < 26; i++) { const x = bx + 20 + i * 45, y = by + bh - 70 + (hash(i) * 30); fillRR(ctx, x, y, 44, 36, 4, brickC[i % 6]); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ell(ctx, x + 12, y + 6, 6, 3); ell(ctx, x + 30, y + 6, 6, 3); }
  // right-side robots on banner
  spikeBot(ctx, bx + 980, by + 300, 0.9, '#f7d23a', 0, false);
  spikeBot(ctx, bx + 900, by + 680, 0.8, '#ec5aa0', 0, false);
  tablet(ctx, bx + 1060, by + 690, 140, 100, (c, x, y, w, h) => blockCodeScreen(c, x, y, w, h, 1));
  // skirting board + floor
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, fy - 8, 1480, 14);
  woodFloor(ctx, 0, fy, WW, 1920 - fy);
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, fy, WW, 10);
}
// classroom foreground pieces are drawn per frame (so characters can be between them)
function classTablesBack(ctx) {
  // back row against banner
  lowTable(ctx, 520, 1060, 300, 130, '#8e3d8a', '#7a2f78', '#b12d2d');
  lowTable(ctx, 800, 1060, 330, 130, '#f5c637', '#e2b21c', '#f5c637');
  lowTable(ctx, 1150, 1050, 290, 140, '#f5c637', '#e2b21c', '#f5c637');
  // mat on back tables
  robotMat(ctx, 620, 990, [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [3, 1]], 110);
  yellowBin(ctx, 120, 1000, 160, 76);
  lowTable(ctx, 80, 1080, 280, 150, '#2e6fb5', '#255c97', '#2e6fb5');
}
function classMat(ctx, x = 520, y = 1440) {
  // floor robot mat (tiles) in perspective strip
  ctx.save(); ctx.translate(x, y);
  const cells = [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [1, 0], [2, 0], [3, 0], [4, 0], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3]];
  robotMat(ctx, 0, 0, cells, 150);
  ctx.restore();
}
function classTableFront(ctx, x, y, w, top, side, legs) { lowTable(ctx, x, y, w, 150, top, side, legs); }

// ============================================================
//  SET: front office / reception (world 1080 x 1920)
// ============================================================
function paintOffice(ctx) { // desk is drawn per-frame (officeDesk)
  const WW = 1300;
  ctx.fillStyle = '#e4e2dd'; ctx.fillRect(0, 0, WW, 1920);
  // high glass-block windows
  const gb = (x, y, c, r) => { for (let i = 0; i < c; i++) for (let j = 0; j < r; j++) { ctx.fillStyle = vgrad(ctx, y + j * 38, y + j * 38 + 36, [[0, '#ffffff'], [1, '#cfd8de']]); ctx.fillRect(x + i * 42, y + j * 38, 38, 34); ctx.strokeStyle = 'rgba(120,130,140,0.4)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(x + i * 42 + 4, y + j * 38 + 6 + k * 7); ctx.lineTo(x + i * 42 + 34, y + j * 38 + 6 + k * 7); } ctx.stroke(); } };
  gb(380, 140, 11, 5); gb(40, 220, 7, 4);
  ctx.fillStyle = '#5d5953'; ctx.fillRect(330, 360, 680, 210);
  // big window-door grid with street view
  const gx = 330, gy = 570, gw = 680, gh = 760;
  ctx.fillStyle = vgrad(ctx, gy, gy + 250, [[0, '#9fd2f2'], [1, '#e2f2fb']]); ctx.fillRect(gx, gy, gw, gh);
  ctx.fillStyle = '#fff'; ell(ctx, gx + 420, gy + 230, 60, 20); ell(ctx, gx + 460, gy + 215, 40, 22);
  ctx.fillStyle = '#d7c7a8'; ctx.fillRect(gx, gy, gw, 120); ctx.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = gy; y < gy + 120; y += 14) ctx.fillRect(gx, y, gw, 3);
  // trees & buildings across the road
  ctx.fillStyle = '#e8e2d8'; ctx.fillRect(gx + 470, gy + 140, 210, 260); ctx.fillStyle = '#c1d6e4'; for (let i = 0; i < 6; i++) ctx.fillRect(gx + 490 + (i % 3) * 60, gy + 170 + Math.floor(i / 3) * 80, 40, 50);
  ctx.fillStyle = '#3b6fd0'; ctx.fillRect(gx + 480, gy + 330, 70, 30); ctx.fillStyle = '#f2d200'; ctx.fillRect(gx + 560, gy + 320, 100, 30);
  for (let i = 0; i < 7; i++) { const tx = gx + 30 + i * 70; ctx.fillStyle = ['#5f9e4a', '#4c8a3c', '#6fae55'][i % 3]; ell(ctx, tx, gy + 300 - hash(i) * 40, 60, 55); }
  ctx.fillStyle = '#3d4b38'; ctx.fillRect(gx, gy + 360, gw, 50);
  ctx.fillStyle = '#7ec26a'; ctx.fillRect(gx, gy + 410, gw, 24);
  ctx.fillStyle = '#a9adb1'; ctx.fillRect(gx, gy + 434, gw, 140); ctx.fillStyle = '#f2f2f2'; for (let x = gx; x < gx + gw; x += 120) ctx.fillRect(x, gy + 500, 60, 6);
  ctx.fillStyle = '#d9c9a9'; ctx.fillRect(gx, gy + 574, gw, 186);
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy + 170); ctx.quadraticCurveTo(gx + 300, gy + 190, gx + gw, gy + 165); ctx.moveTo(gx, gy + 185); ctx.quadraticCurveTo(gx + 300, gy + 205, gx + gw, gy + 180); ctx.stroke();
  ctx.fillStyle = '#8a8f94'; ctx.fillRect(gx + 400, gy + 120, 10, 300);
  officeMullions(ctx, 0);
  // left glass wall with decal (ClickRobot reversed hint) and dark slat
  ctx.fillStyle = 'rgba(180,210,230,0.55)'; ctx.fillRect(0, 650, 330, 680);
  ctx.fillStyle = '#7a5a40'; ctx.fillRect(0, 560, 330, 60); for (let x = 0; x < 330; x += 18) { ctx.fillStyle = '#5e432f'; ctx.fillRect(x, 560, 6, 60); }
  ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 10; ctx.strokeRect(10, 650, 300, 680);
  ctx.globalAlpha = 0.6; logoGears(ctx, 210, 760, 50, true); ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = `700 46px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillText('LET\'S BUILD', 165, 1000);
  // right display cabinet (dark wood)
  ctx.fillStyle = '#4a2f24'; ctx.fillRect(1010, 450, 290, 1000); ctx.fillStyle = 'rgba(160,190,200,0.45)'; ctx.fillRect(1035, 520, 240, 700);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#4a2f24'; ctx.fillRect(1035, 640 + i * 150, 240, 8); for (let j = 0; j < 4; j++) { ctx.fillStyle = ['#f2c94c', '#e34b4b', '#4b8ad9', '#9ad94b'][(i + j) % 4]; ctx.fillRect(1050 + j * 55, 600 + i * 150, 34, 38); } }
  // floor
  woodFloor(ctx, 0, 1330, WW, 590, '#b98c5a');
}
// glass front (mullions + doors). open: 0..1 swing of the right door leaf (centre doors = columns 2..3)
const OFF_G = { x: 330, y: 570, w: 680, h: 760 };
function officeGlassTint(ctx, open = 0) {
  const { x: gx, y: gy, w: gw, h: gh } = OFF_G;
  ctx.save(); ctx.fillStyle = 'rgba(190,220,240,0.22)'; ctx.beginPath(); ctx.rect(gx, gy + 120, gw, gh - 120);
  if (open > 0) { const dx = gx + 3 * gw / 6; ctx.rect(dx + gw / 6, gy + 120, -(gw / 6) * open * 0.85, gh - 120); }
  ctx.fill('evenodd'); ctx.restore();
}
function officeMullions(ctx, open = 0) {
  const { x: gx, y: gy, w: gw, h: gh } = OFF_G;
  ctx.strokeStyle = '#f4f2ee'; ctx.lineWidth = 14; ctx.strokeRect(gx, gy, gw, gh);
  ctx.lineWidth = 10;
  const leafX0 = gx + 3 * gw / 6, leafW = gw / 6;
  for (let i = 1; i < 6; i++) { if (open > 0 && i === 4) continue; ctx.beginPath(); ctx.moveTo(gx + i * gw / 6, gy + 120); ctx.lineTo(gx + i * gw / 6, gy + gh); ctx.stroke(); }
  for (let j = 0; j < 5; j++) {
    const y = gy + 120 + j * (gh - 120) / 5; ctx.beginPath();
    if (open > 0) { ctx.moveTo(gx, y); ctx.lineTo(leafX0, y); ctx.moveTo(leafX0 + leafW, y); ctx.lineTo(gx + gw, y); } else { ctx.moveTo(gx, y); ctx.lineTo(gx + gw, y); }
    ctx.stroke();
  }
  if (open > 0) { // swung leaf seen edge-on, opening inward toward camera
    const lw = leafW * (1 - open * 0.85), lx = leafX0;
    ctx.fillStyle = 'rgba(200,225,240,0.35)'; ctx.fillRect(lx, gy + 120, lw, gh - 120);
    ctx.strokeStyle = '#f4f2ee'; ctx.lineWidth = 10; ctx.strokeRect(lx, gy + 120, lw, gh - 120);
    for (let j = 1; j < 5; j++) { const y = gy + 120 + j * (gh - 120) / 5; ctx.beginPath(); ctx.moveTo(lx, y); ctx.lineTo(lx + lw, y); ctx.stroke(); }
    ctx.fillStyle = '#cfd4d8'; ctx.fillRect(lx + lw - 16, gy + 420, 7, 110);
  }
  // door handles
  ctx.fillStyle = '#cfd4d8'; if (!open) ctx.fillRect(leafX0 + 12, gy + 420, 7, 110); ctx.fillRect(leafX0 - 19, gy + 420, 7, 110);
}
function officeDesk(ctx, x = -160, y = 1420) {
  // L desk, dark wood top
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(x + 10, y + 270, 760, 20);
  ctx.fillStyle = '#3b3a3c'; ctx.fillRect(x + 20, y + 40, 16, 240); ctx.fillRect(x + 720, y + 40, 16, 240);
  ctx.fillStyle = '#4a3a2f'; ctx.fillRect(x + 40, y + 50, 220, 200); ctx.fillStyle = '#5a4637'; ctx.fillRect(x + 50, y + 70, 200, 70); ctx.fillRect(x + 50, y + 150, 200, 70);
  ctx.fillStyle = '#d8d8d8'; ctx.fillRect(x + 130, y + 100, 40, 6); ctx.fillRect(x + 130, y + 180, 40, 6);
  ctx.fillStyle = '#5e4a3b'; ctx.beginPath(); ctx.moveTo(x + 30, y); ctx.lineTo(x + 760, y); ctx.lineTo(x + 780, y + 40); ctx.lineTo(x, y + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#463629'; ctx.fillRect(x, y + 40, 780, 12);
  // monitor + pink keyboard + mouse + cup + printer
  ctx.fillStyle = '#d6d8db'; ctx.fillRect(x + 455, y - 40, 14, 44); ctx.fillRect(x + 420, y + 2, 90, 8);
  fillRR(ctx, x + 350, y - 230, 230, 190, 8, '#1f2328'); fillRR(ctx, x + 360, y - 222, 210, 172, 4, '#2f6fa8');
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(x + 370, y - 210, 100, 14); ctx.fillRect(x + 370, y - 186, 160, 8);
  fillRR(ctx, x + 330, y + 12, 160, 22, 6, '#f6a6b4'); ctx.fillStyle = '#fdd7de'; for (let i = 0; i < 9; i++) ell(ctx, x + 345 + i * 16, y + 22, 5, 4);
  ell(ctx, x + 540, y + 22, 14, 9, '#f1f1f1');
  fillRR(ctx, x + 40, y - 100, 120, 100, 6, '#e9e9e9', '#c9c9c9', 2);
  fillRR(ctx, x + 250, y - 80, 44, 80, 8, 'rgba(255,255,255,0.85)', '#bbb', 2);
}

// ============================================================
//  SET: Duplo / little-kids room (world 1300 x 1920)
// ============================================================
function paintDuploRoom(ctx) {
  const WW = 1300, fy = 1060;
  ctx.fillStyle = '#f4f5f5'; ctx.fillRect(0, 0, WW, fy);
  acUnit(ctx, 300, 90, 280, 80);
  // banner with clouds
  ctx.fillStyle = vgrad(ctx, 160, 760, [[0, '#4b86d6'], [1, '#76a9e6']]); ctx.fillRect(0, 170, 560, 590);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = '#ffffff'; ell(ctx, i * 110, 180, 80, 40); }
  ctx.fillStyle = '#ffffff'; ell(ctx, 300, 430, 220, 170); ell(ctx, 170, 470, 120, 100); ell(ctx, 430, 480, 130, 100);
  // rainbow
  ['#ff6b6b', '#ffb84d', '#ffe066', '#7ed957', '#5ab0ff', '#9b7bff'].forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(420, 340, 70 - i * 9, Math.PI, Math.PI * 2); ctx.stroke(); });
  logoGears(ctx, 210, 330, 50, true);
  ctx.font = `800 54px "Comic Sans MS", ${FONT_L}`; ctx.textAlign = 'center'; ctx.lineWidth = 8; ctx.strokeStyle = '#2a4fa8';
  ctx.strokeText('Lego Duplo', 300, 470); ctx.fillStyle = '#ffd23f'; ctx.fillText('Lego Duplo', 300, 470);
  ctx.font = `800 38px "Comic Sans MS", ${FONT_L}`; ctx.strokeText('Matata Coding', 300, 520); ctx.fillStyle = '#ff9ec7'; ctx.fillText('Matata Coding', 300, 520);
  // three cute bot faces
  [[200, 600, '#f2a65a'], [300, 610, '#5a6ad9'], [400, 600, '#ff9ec7']].forEach(([x, y, c]) => { ell(ctx, x, y, 42, 38, c); ell(ctx, x - 14, y - 4, 13, 13, '#fff'); ell(ctx, x + 14, y - 4, 13, 13, '#fff'); ell(ctx, x - 14, y - 2, 7, 7, '#222'); ell(ctx, x + 14, y - 2, 7, 7, '#222'); });
  // big window with reversed decals (seen from inside)
  ctx.fillStyle = vgrad(ctx, 150, 850, [[0, '#d4ecfa'], [0.55, '#e9f4f8'], [0.56, '#86b56e'], [0.7, '#9ccf82'], [0.71, '#b5b9bd'], [1, '#c5c8cb']]); ctx.fillRect(620, 150, 660, 700);
  ctx.fillStyle = '#fafafa'; ctx.fillRect(620, 150, 660, 120);
  ctx.save(); ctx.translate(950, 230); ctx.scale(-1, 1); ctx.globalAlpha = 0.55; clickRobotText(ctx, 0, 10, 52); ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.35; ctx.translate(950, 420); ctx.scale(-1, 1); ctx.font = `700 50px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillStyle = '#e34b4b'; ctx.fillText("LET'S BUILD...", 0, 0); ctx.restore();
  ctx.strokeStyle = '#dcdcdc'; ctx.lineWidth = 10; ctx.strokeRect(620, 150, 660, 700);
  // white shelves
  ctx.fillStyle = '#ffffff'; ctx.fillRect(600, 850, 700, 30); ctx.fillRect(0, 760, 600, 30);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = '#f0f0f0'; ctx.fillRect(620 + i * 170, 880, 160, 170); ctx.fillStyle = ['#ffb3c7', '#b3e5ff', '#c9f2b3', '#ffe6a3'][i]; ctx.fillRect(640 + i * 170, 960, 120, 60); }
  for (let i = 0; i < 3; i++) { fillRR(ctx, 40 + i * 170, 660, 120, 100, 8, '#ffffff', '#bcd3ea', 3); ctx.fillStyle = '#4b9be6'; ctx.font = `700 22px ${FONT_L}`; ctx.fillText('Activity', 100 + i * 170, 720); }
  woodFloor(ctx, 0, fy, WW, 1920 - fy, '#c9965d');
  // play mats (three printed city/forest/sea boards with duplo bricks)
  const mat = (x, y, w, h, base) => {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
    ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
    for (let i = 0; i < 16; i++) { const bx = x + hash(i * 7 + x) * (w - 40), by = y + hash(i * 3 + y) * (h - 30); fillRR(ctx, bx, by, 36, 22, 3, ['#e34b4b', '#ffd23f', '#4b8ad9', '#7ed957', '#ffffff'][i % 5]); }
  };
  mat(80, 1180, 330, 200, '#7fae6f'); mat(470, 1180, 330, 200, '#5a8fd0'); mat(860, 1180, 330, 200, '#6aa364');
}
function foamMat(ctx, x, y, w, h) {
  const s = 120; for (let i = 0; i * s < w; i++) for (let j = 0; j * s < h; j++) { ctx.fillStyle = (i + j) % 2 ? '#a9dbe6' : '#ecd9bf'; ctx.fillRect(x + i * s, y + j * s * 0.6, s, s * 0.6); }
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 2; for (let i = 0; i * s < w; i++) for (let j = 0; j * s < h; j++) ctx.strokeRect(x + i * s, y + j * s * 0.6, s, s * 0.6);
}

// ============================================================
//  SET: Team's rented room (fictional) — evening / night
// ============================================================
function paintRoom(ctx) {
  const WW = 1300, fy = 1250;
  ctx.fillStyle = vgrad(ctx, 0, fy, [[0, '#d9cbb7'], [1, '#cdbda6']]); ctx.fillRect(0, 0, WW, fy);
  // window with night sky
  const wx = 120, wy = 260, ww = 420, wh = 520;
  ctx.fillStyle = vgrad(ctx, wy, wy + wh, [[0, '#1b2350'], [0.7, '#33407a'], [1, '#5a5f8c']]); ctx.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 30; i++) ell(ctx, wx + hash(i * 3) * ww, wy + hash(i * 5) * wh * 0.6, 1.5, 1.5, 'rgba(255,255,255,0.8)');
  ell(ctx, wx + 320, wy + 110, 34, 34, '#fff3c4'); ell(ctx, wx + 334, wy + 100, 30, 30, '#2a3466');
  for (let i = 0; i < 7; i++) { const bh = 80 + hash(i * 7) * 140; ctx.fillStyle = '#141a38'; ctx.fillRect(wx + i * 62, wy + wh - bh, 56, bh); for (let k = 0; k < 6; k++) if (hash(i * 10 + k) > 0.5) { ctx.fillStyle = '#ffd98a'; ctx.fillRect(wx + i * 62 + 8 + (k % 2) * 24, wy + wh - bh + 14 + Math.floor(k / 2) * 26, 12, 12); } }
  ctx.strokeStyle = '#f2ece2'; ctx.lineWidth = 16; ctx.strokeRect(wx, wy, ww, wh); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke();
  // curtains
  ctx.fillStyle = '#7d9c8a'; ctx.beginPath(); ctx.moveTo(wx - 70, wy - 40); ctx.lineTo(wx + 40, wy - 40); ctx.quadraticCurveTo(wx + 10, wy + 300, wx + 30, wy + wh + 60); ctx.lineTo(wx - 70, wy + wh + 60); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(wx + ww + 70, wy - 40); ctx.lineTo(wx + ww - 40, wy - 40); ctx.quadraticCurveTo(wx + ww - 10, wy + 300, wx + ww - 30, wy + wh + 60); ctx.lineTo(wx + ww + 70, wy + wh + 60); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6a8775'; ctx.fillRect(wx - 90, wy - 50, ww + 180, 16);
  // wall: cork board with notes + calendar
  fillRR(ctx, 640, 300, 300, 220, 8, '#c49a6c', '#8a6a48', 6);
  [['#fff5a8', 660, 320], ['#bfe6ff', 760, 330], ['#ffd1dc', 850, 318], ['#d6f5c4', 690, 420], ['#ffffff', 800, 410]].forEach(([c, x, y]) => { ctx.save(); ctx.translate(x + 35, y + 35); ctx.rotate((hash(x) - 0.5) * 0.2); ctx.fillStyle = c; ctx.fillRect(-35, -35, 70, 70); ctx.fillStyle = '#e34b4b'; ell(ctx, 0, -28, 5, 5, '#e34b4b'); ctx.fillStyle = 'rgba(0,0,0,0.25)'; for (let k = 0; k < 3; k++) ctx.fillRect(-25, -12 + k * 12, 50 - k * 10, 3); ctx.restore(); });
  // mirror on wardrobe (right)
  ctx.fillStyle = '#a77b54'; ctx.fillRect(1000, 160, 300, 1090); ctx.fillStyle = '#8e6644'; ctx.fillRect(1000, 160, 12, 1090);
  fillRR(ctx, 1040, 300, 220, 560, 10, '#8e6644'); ctx.fillStyle = vgrad(ctx, 310, 850, [[0, '#c7d3da'], [1, '#9fb0ba']]); rr(ctx, 1050, 310, 200, 540, 6); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.moveTo(1070, 330); ctx.lineTo(1120, 330); ctx.lineTo(1070, 450); ctx.closePath(); ctx.fill();
  ell(ctx, 1030, 700, 8, 8, '#d9b24a');
  // floor
  ctx.fillStyle = '#a07a58'; ctx.fillRect(0, fy, WW, 1920 - fy);
  for (let y = fy; y < 1920; y += 60) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, y, WW, 3); }
  ctx.fillStyle = '#efe6d8'; ctx.fillRect(0, fy - 18, WW, 20);
  // rug
  ctx.fillStyle = '#c96f5a'; ell(ctx, 520, 1640, 420, 120); ctx.fillStyle = '#e39a7f'; ell(ctx, 520, 1640, 360, 90);
  // bed edge (left)
  ctx.fillStyle = '#e8e2f2'; ctx.fillRect(-20, 1080, 240, 280); ctx.fillStyle = '#b9c7e6'; ctx.fillRect(-20, 1080, 240, 60); ctx.fillStyle = '#8e6644'; ctx.fillRect(-20, 1360, 250, 60);
}
// desk with lamp — drawn per frame so lamp glow can animate
function roomDesk(ctx, x, y, lampOn = 1) {
  // desk top at y
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x + 20, y + 330, 600, 24);
  ctx.fillStyle = '#7b5636'; ctx.fillRect(x + 20, y + 30, 22, 320); ctx.fillRect(x + 580, y + 30, 22, 320);
  ctx.fillStyle = '#8c6440'; ctx.fillRect(x + 380, y + 40, 200, 160); ctx.fillStyle = '#9a7049'; ctx.fillRect(x + 392, y + 52, 176, 64); ctx.fillRect(x + 392, y + 126, 176, 64);
  ell(ctx, x + 480, y + 84, 14, 5, '#d9b24a'); ell(ctx, x + 480, y + 158, 14, 5, '#d9b24a');
  ctx.fillStyle = '#a57a4e'; ctx.beginPath(); ctx.moveTo(x + 20, y - 20); ctx.lineTo(x + 600, y - 20); ctx.lineTo(x + 625, y + 20); ctx.lineTo(x, y + 20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7f5a37'; ctx.fillRect(x, y + 20, 625, 18);
}
function deskLamp(ctx, x, y, on = 1) {
  // base at (x,y) on desk; arm up to shade
  ctx.fillStyle = '#2f3b4a'; ell(ctx, x, y, 46, 12, '#2f3b4a');
  ctx.strokeStyle = '#3a4a5c'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x - 30, y - 170); ctx.lineTo(x + 60, y - 250); ctx.stroke();
  ell(ctx, x - 30, y - 170, 8, 8, '#55657a');
  ctx.save(); ctx.translate(x + 70, y - 250); ctx.rotate(0.55);
  ctx.fillStyle = '#e8b04a'; ctx.beginPath(); ctx.moveTo(-28, -20); ctx.lineTo(28, -20); ctx.lineTo(56, 40); ctx.lineTo(-56, 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = on ? '#fff3c2' : '#ccc'; ell(ctx, 0, 40, 50, 9, on ? '#fff3c2' : '#ccc');
  ctx.restore();
}
function lampGlow(ctx, x, y, on, r = 900) {
  if (on <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgrad(ctx, x, y, 10, r, [[0, `rgba(255,214,140,${0.55 * on})`], [0.35, `rgba(255,170,90,${0.18 * on})`], [1, 'rgba(0,0,0,0)']]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function backpackProp(ctx, x, y, s = 1, open = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ell(ctx, 0, 4, 70, 12, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = CAST.team.bag; ctx.strokeStyle = OUT; ctx.lineWidth = 3; rr(ctx, -60, -150, 120, 152, 34); ctx.fill(); ctx.stroke();
  ctx.fillStyle = CAST.team.bagD; rr(ctx, -44, -70, 88, 62, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8783c'; ctx.fillRect(-12, -76, 24, 8);
  ctx.strokeStyle = '#2e3b2b'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-40, -120); ctx.quadraticCurveTo(0, -136 - open * 30, 40, -120); ctx.stroke();
  if (open > 0) { ctx.fillStyle = '#2c3528'; ctx.beginPath(); ctx.ellipse(0, -128, 46, 10 + open * 10, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function phoneProp(ctx, x, y, s = 1, lit = 0, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  fillRR(ctx, -22, -40, 44, 80, 8, '#1d1f24'); fillRR(ctx, -19, -36, 38, 72, 5, lit ? `rgba(150,200,255,${0.4 + lit * 0.6})` : '#2b2f36');
  if (lit) { ctx.fillStyle = `rgba(255,255,255,${lit})`; ctx.font = `600 13px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillText('07:00', 0, -10); ctx.fillRect(-12, 4, 24, 3); }
  ctx.restore();
}
