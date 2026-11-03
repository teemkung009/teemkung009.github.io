// ============================================================
//  inserts.js — close-up shots (hands, devices, notebook, code)
//  All drawn in screen space 1080x1920.
// ============================================================
'use strict';

// big detailed hand. pose: 'grip' (curled around something vertical), 'flat', 'pinch', 'point', 'rest'
function bigHand(ctx, x, y, s, rot, skin, pose = 'flat', sleeve = null, curl = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const sd = shade(skin, -0.12);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // forearm
  ctx.fillStyle = skin; ctx.strokeStyle = OUT; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-260, -48); ctx.lineTo(-40, -52); ctx.lineTo(-40, 52); ctx.lineTo(-260, 50); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (sleeve) { ctx.fillStyle = sleeve; ctx.beginPath(); ctx.moveTo(-420, -70); ctx.lineTo(-230, -64); ctx.quadraticCurveTo(-215, 0, -230, 64); ctx.lineTo(-420, 70); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  // palm
  ctx.fillStyle = skin; ctx.beginPath(); ctx.moveTo(-50, -55); ctx.quadraticCurveTo(40, -66, 70, -40); ctx.quadraticCurveTo(84, 0, 70, 46); ctx.quadraticCurveTo(20, 66, -50, 55); ctx.closePath(); ctx.fill(); ctx.stroke();
  const finger = (fx, fy, len, ang, w, bend) => {
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang);
    const l1 = len * 0.55, l2 = len * 0.45;
    ctx.strokeStyle = OUT; ctx.lineWidth = w + 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(l1, 0); ctx.lineTo(l1 + Math.cos(bend) * l2, Math.sin(bend) * l2); ctx.stroke();
    ctx.strokeStyle = skin; ctx.lineWidth = w; ctx.stroke();
    // knuckle crease + nail
    ctx.strokeStyle = sd; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(l1 - 3, -w * 0.3); ctx.lineTo(l1 - 3, w * 0.3); ctx.stroke();
    const nx = l1 + Math.cos(bend) * l2 * 0.82, ny = Math.sin(bend) * l2 * 0.82;
    ctx.fillStyle = 'rgba(255,235,225,0.9)'; ctx.beginPath(); ctx.ellipse(nx, ny - w * 0.12, w * 0.28, w * 0.22, bend, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  if (pose === 'grip') { // fingers wrapped (curl 0..1 tightens)
    const b = 1.2 + curl * 0.5;
    [[-24, 26], [-8, 25], [8, 24], [24, 22]].forEach(([fy, w], i) => finger(62, fy * 1.4, 70 - i * 4, 0.15, w, b));
    finger(20, -50, 62, -0.9 - curl * 0.2, 26, 0.5);
  } else if (pose === 'pinch') {
    finger(60, -30, 80, -0.25, 24, 0.6); finger(60, -6, 72, 0.1, 23, 1.3); finger(55, 18, 64, 0.25, 22, 1.5); finger(48, 38, 54, 0.4, 20, 1.6);
    finger(10, -52, 70, -0.55, 26, 0.35);
  } else if (pose === 'point') {
    finger(62, -26, 100, -0.05, 25, 0.05); finger(60, -2, 62, 0.15, 24, 1.6); finger(55, 20, 56, 0.3, 22, 1.7); finger(48, 40, 48, 0.45, 20, 1.7);
    finger(10, -52, 60, -0.5, 26, 0.6);
  } else if (pose === 'rest') { // relaxed, slightly curled on a surface
    [[-30, 26], [-10, 25], [10, 24], [30, 21]].forEach(([fy, w], i) => finger(64, fy, 80 - Math.abs(i - 1.3) * 8, (fy / 120), w, 0.35 + i * 0.08 + curl * 0.6));
    finger(5, -54, 70, -0.6, 27, 0.25);
  } else { // flat (on cloth / table)
    [[-30, 26], [-10, 25], [10, 24], [30, 21]].forEach(([fy, w], i) => finger(64, fy, 92 - Math.abs(i - 1.3) * 9, fy / 140, w, 0.08));
    finger(5, -54, 74, -0.75, 27, 0.15);
  }
  ctx.restore();
}

// ---------- INSERT: hand gripping backpack strap ----------
function insStrap(ctx, t, tight = 0.5) {
  const c = CAST.team;
  // background: shirt torso fills frame
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, shade(c.shirt, 0.05)], [1, c.shirtD]]); ctx.fillRect(0, 0, W, H);
  // shirt folds
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 10;
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(100 + i * 220, 0); ctx.bezierCurveTo(140 + i * 200, 600, 60 + i * 230, 1200, 120 + i * 210, H); ctx.stroke(); }
  // lanyard + intern card
  ctx.strokeStyle = c.lanyard; ctx.lineWidth = 34; ctx.beginPath(); ctx.moveTo(740, -50); ctx.lineTo(820, 700); ctx.stroke();
  const br = Math.sin(t * 1.7) * 6;
  // strap (diagonal) – padded
  ctx.save(); ctx.translate(270, 0 + br);
  ctx.fillStyle = OUT; rr(ctx, -95, -100, 190, 2200, 40); ctx.fill();
  ctx.fillStyle = vgrad(ctx, 0, 2000, [[0, shade(c.bag, 0.1)], [1, c.bagD]]); rr(ctx, -88, -100, 176, 2200, 36); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.setLineDash([18, 14]); ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-70, -100); ctx.lineTo(-70, 2100); ctx.moveTo(70, -100); ctx.lineTo(70, 2100); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#2e3a2c'; rr(ctx, -100, 1300, 200, 70, 10); ctx.fill(); // buckle
  ctx.restore();
  // hand gripping strap
  const tightK = tight + Math.sin(t * 2.2) * 0.08;
  bigHand(ctx, -40, 1000 + br, 3.1, -0.04, c.skin, 'grip', c.shirt, tightK);
  // soft vignette
  ctx.fillStyle = rgrad(ctx, W / 2, H / 2, 300, 1200, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(20,30,50,0.35)']]); ctx.fillRect(0, 0, W, H);
}

// ---------- INSERT: wiping table ----------
function insWipe(ctx, t) {
  // yellow table top in perspective + white edge
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#f8d55a'], [1, '#efc232']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#fdfbf4'; ctx.fillRect(0, 1500, W, 30); ctx.fillStyle = '#d9a91c'; ctx.fillRect(0, 1530, W, 400);
  // dust specks that vanish where the cloth has passed
  const sweep = (t * 0.55) % 1;
  for (let i = 0; i < 80; i++) {
    const x = hash(i * 3.3) * W, y = 200 + hash(i * 7.7) * 1200;
    const cleaned = (x / W) < sweep * 1.2 ? 1 : 0;
    if (!cleaned) ell(ctx, x, y, 3 + hash(i) * 3, 2.5, 'rgba(120,90,40,0.35)');
  }
  // clean sheen trail
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath(); ctx.ellipse(W * sweep * 1.1, 820, 300, 120, -0.2, 0, Math.PI * 2); ctx.fill();
  // cloth + hand following a figure-8 wipe
  const a = t * 3.2;
  const cx = 540 + Math.sin(a) * 260, cy = 820 + Math.sin(a * 2) * 90;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(a) * 0.15);
  ctx.fillStyle = 'rgba(0,0,0,0.15)'; ell(ctx, 14, 26, 230, 140, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = '#58b8e8'; ctx.beginPath(); ctx.moveTo(-220, -120); ctx.quadraticCurveTo(0, -150, 220, -110); ctx.quadraticCurveTo(250, 0, 210, 130); ctx.quadraticCurveTo(0, 160, -210, 120); ctx.quadraticCurveTo(-250, 0, -220, -120); ctx.fill();
  ctx.strokeStyle = '#3c93c4'; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; for (let i = -200; i < 200; i += 22) { ctx.beginPath(); ctx.moveTo(i, -110); ctx.lineTo(i + 10, 120); ctx.stroke(); }
  ctx.restore();
  bigHand(ctx, cx - 60, cy - 10, 2.3, 0.35 + Math.sin(a) * 0.1, CAST.team.skin, 'flat', CAST.team.shirt);
  // sparkle when clean
  for (let i = 0; i < 4; i++) { const k = ((t * 0.9 + i * 0.25) % 1); if (k < 0.3) { const sx = 200 + i * 220, sy = 450 + hash(i) * 300; sparkle(ctx, sx, sy, 30 * Math.sin(k / 0.3 * Math.PI)); } }
}
function sparkle(ctx, x, y, r, col = '#ffffff') {
  if (r <= 0) return; ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rad = i % 2 ? r * 0.25 : r; ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------- INSERT: devices — iPad + hub battery check & charge ----------
// phase: 0..1 across the insert. Shows a hand tapping the iPad battery, then plugging cable.
function insDevices(ctx, t, opt = {}) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#2e6fb5'], [1, '#245a93']]); ctx.fillRect(0, 0, W, H); // blue table top
  ctx.fillStyle = '#fdfbf4'; ctx.fillRect(0, 1640, W, 26); ctx.fillStyle = '#1d4c7d'; ctx.fillRect(0, 1666, W, 300);
  // iPad
  const bat = opt.bat ?? 0.3, charging = opt.charging ?? 0;
  tablet(ctx, 520, 760, 820, 600, (c, x, y, w, h) => {
    c.fillStyle = vgrad(c, y, y + h, [[0, '#e9f1fb'], [1, '#d3e2f5']]); c.fillRect(x, y, w, h);
    c.fillStyle = '#1d1f24'; c.font = `500 26px ${FONT_L}`; c.textAlign = 'left'; c.fillText('09:12', x + 24, y + 38);
    // battery icon top-right
    const bx = x + w - 130, by = y + 14;
    c.strokeStyle = '#1d1f24'; c.lineWidth = 3; rr(c, bx, by, 80, 34, 8); c.stroke(); c.fillStyle = '#1d1f24'; c.fillRect(bx + 82, by + 10, 6, 14);
    c.fillStyle = bat < 0.25 ? '#e34b4b' : '#3ccf6e'; rr(c, bx + 5, by + 5, 70 * bat, 24, 5); c.fill();
    if (charging) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(bx + 44, by + 4); c.lineTo(bx + 32, by + 19); c.lineTo(bx + 41, by + 19); c.lineTo(bx + 36, by + 31); c.lineTo(bx + 50, by + 15); c.lineTo(bx + 41, by + 15); c.closePath(); c.fill(); }
    c.fillStyle = '#1d1f24'; c.font = `600 22px ${FONT_L}`; c.textAlign = 'right'; c.fillText(Math.round(bat * 100) + '%', bx - 10, by + 26);
    // app icons grid
    const ic = ['#f5c13d', '#4cb6f0', '#ec5aa0', '#8e6bf2', '#40c08a', '#ff8a3d', '#5a6ad9', '#e34b4b'];
    for (let i = 0; i < 8; i++) fillRR(c, x + 70 + (i % 4) * 170, y + 110 + Math.floor(i / 4) * 170, 110, 110, 26, ic[i]);
  }, -0.04);
  // SPIKE-style hub (light matrix) with battery LED
  const hx = 300, hy = 1350;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(0.06);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; rr(ctx, -150, -95, 320, 220, 26); ctx.fill();
  fillRR(ctx, -160, -110, 320, 220, 24, '#ffffff', '#c9ced4', 4); fillRR(ctx, -160, -110, 320, 44, 18, '#f7d23a');
  ctx.fillStyle = '#2b2b2f'; rr(ctx, -70, -58, 140, 140, 10); ctx.fill();
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) {
    // battery bar pattern on the matrix while charging
    const lvl = charging ? Math.floor(((t * 1.4) % 1) * 6) : 2;
    const on = (4 - j) < lvl && i > 0 && i < 4;
    ctx.fillStyle = on ? '#fff6c8' : '#4a4a52'; rr(ctx, -60 + i * 26, -48 + j * 26, 20, 20, 4); ctx.fill();
  }
  ell(ctx, 0, 100, 16, 16, charging ? (Math.sin(t * 6) > 0 ? '#4ad66d' : '#2b8c45') : '#f2b632'); // centre button LED
  ctx.restore();
  // charging cable
  const plug = opt.plug ?? 0; // 0..1 plug-in progress
  const px = lerp(980, 470, ease.o(plug)), py = 1420;
  ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(1200, 1700); ctx.bezierCurveTo(1050, 1600, px + 220, py + 40, px + 60, py); ctx.stroke();
  fillRR(ctx, px, py - 20, 90, 40, 8, '#f4f4f4', '#bbb', 3); ctx.fillStyle = '#999'; ctx.fillRect(px - 26, py - 9, 28, 18);
  if (opt.hand) bigHand(ctx, px + 210, py + 10, 1.7, Math.PI + 0.25, CAST.team.skin, 'pinch', CAST.team.shirt);
  if (opt.tap) { const k = opt.tap; bigHand(ctx, 900, 380 + (1 - k) * 60, 1.5, Math.PI * 0.62, CAST.team.skin, 'point', CAST.team.shirt); if (k > 0.8) { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(812, 488, 30 + (k - 0.8) * 160, 0, Math.PI * 2); ctx.stroke(); } }
}

// ---------- INSERT: kids' hands assembling bricks ----------
function insBuild(ctx, t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#f8d55a'], [1, '#efc232']]); ctx.fillRect(0, 0, W, H);
  // scattered parts
  const parts = [['#c9ced4', 140, 300, 0.4], ['#e34b4b', 860, 360, -0.3], ['#2ab7a9', 220, 1400, 0.2], ['#ec5aa0', 820, 1450, 0.6], ['#4b8ad9', 600, 1650, -0.2], ['#f4f4f4', 120, 900, 1.2]];
  parts.forEach(([c, x, y, r]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); fillRR(ctx, -90, -18, 180, 36, 18, c, 'rgba(0,0,0,0.2)', 2); for (let i = -72; i <= 72; i += 24) ell(ctx, i, 0, 7, 7, 'rgba(0,0,0,0.25)'); ctx.restore(); });
  // the model being built (beam + hub)
  ctx.save(); ctx.translate(540, 860);
  fillRR(ctx, -260, 40, 520, 70, 35, '#c9ced4', OUT, 3); for (let i = -220; i <= 220; i += 44) ell(ctx, i, 75, 13, 13, '#8a9199');
  fillRR(ctx, -170, -250, 340, 290, 26, '#ffffff', '#c9ced4', 5); fillRR(ctx, -170, -250, 340, 60, 20, '#f7d23a');
  ctx.fillStyle = '#2b2b2f'; rr(ctx, -80, -170, 160, 160, 10); ctx.fill();
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { ctx.fillStyle = (i === 2 || j === 2) ? '#fff6c8' : '#4a4a52'; rr(ctx, -68 + i * 28, -158 + j * 28, 22, 22, 4); ctx.fill(); }
  ctx.restore();
  // pin (peg) being pushed in by kid's fingers
  const k = (t * 0.7) % 1, push = ease.io(clamp(k * 1.6));
  const pinX = 540 + 132, pinY = 935 - (1 - push) * 120;
  fillRR(ctx, pinX - 16, pinY - 46, 32, 70, 8, '#2b2b2f'); fillRR(ctx, pinX - 22, pinY - 10, 44, 14, 4, '#3a3a40');
  bigHand(ctx, pinX + 40, pinY - 150, 1.4, Math.PI * 0.62, KIDS[0].skin, 'pinch', KIDS[0].shirt);
  bigHand(ctx, 120, 1150, 1.5, -0.35, KIDS[0].skin, 'rest', KIDS[0].shirt, 0.3);
  if (push > 0.95) { sparkle(ctx, pinX, pinY + 30, 26); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `600 40px ${FONT_L}`; ctx.textAlign = 'center'; ctx.fillText('คลิก!', pinX + 120, pinY - 40); }
}

// ---------- INSERT: tablet with block code (over a kid's shoulder) ----------
function insScreen(ctx, t, prog) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#f8d55a'], [1, '#e2b21c']]); ctx.fillRect(0, 0, W, H);
  tablet(ctx, 540, 900, 980, 740, (c, x, y, w, h) => blockCodeScreen(c, x, y, w, h, prog), 0.02);
  // play button tap + robot response hint
  bigHand(ctx, 860, 1480, 1.6, -Math.PI * 0.42, KIDS[2].skin, 'point', KIDS[2].shirt);
  spikeBot(ctx, 300, 1620, 1.4, '#f7d23a', t, true);
}

// ---------- INSERT: symbolic CS (code / computer) ----------
function insCode(ctx, t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#0f1626'], [1, '#18233b']]); ctx.fillRect(0, 0, W, H);
  // faint grid / circuit
  ctx.strokeStyle = 'rgba(90,140,255,0.08)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // editor window
  fillRR(ctx, 80, 420, 920, 900, 24, '#1e2638', 'rgba(120,160,255,0.3)', 3);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => ell(ctx, 130 + i * 36, 465, 11, 11, c));
  const lines = [
    [['def ', '#c792ea'], ['solve', '#82aaff'], ['(problem):', '#d6deeb']],
    [['    steps = ', '#d6deeb'], ['break_down', '#82aaff'], ['(problem)', '#d6deeb']],
    [['    for ', '#c792ea'], ['s ', '#d6deeb'], ['in ', '#c792ea'], ['steps:', '#d6deeb']],
    [['        result = ', '#d6deeb'], ['try_it', '#82aaff'], ['(s)', '#d6deeb']],
    [['        if ', '#c792ea'], ['result.ok:', '#d6deeb']],
    [['            ', '#d6deeb'], ['continue', '#c792ea']],
    [['    return ', '#c792ea'], ['"done"', '#c3e88d']],
  ];
  const shown = t * 22; let cnt = 0;
  ctx.font = `500 34px "Courier New", monospace`; ctx.textAlign = 'left';
  lines.forEach((ln, i) => {
    let x = 130; const y = 560 + i * 72;
    ctx.fillStyle = 'rgba(214,222,235,0.25)'; ctx.fillText(String(i + 1).padStart(2, ' '), 96 - 10, y);
    ln.forEach(([s, col]) => { for (const ch of s) { if (cnt++ < shown) { ctx.fillStyle = col; ctx.fillText(ch, x + 30, y); } x += 20.4; } });
  });
  if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = '#82aaff'; ctx.fillRect(160 + (Math.min(shown, 40) % 30) * 20, 1090, 18, 4); }
  // floating binary / brackets
  ctx.font = `600 40px "Courier New", monospace`;
  for (let i = 0; i < 18; i++) { const x = hash(i * 5) * W, y = ((hash(i * 9) * H) - t * 60 * (0.5 + hash(i))) % H; ctx.fillStyle = `rgba(130,170,255,${0.12 + hash(i * 2) * 0.2})`; ctx.fillText(['0', '1', '{ }', '</>', '01', '( )'][i % 6], x, (y + H) % H); }
  // monitor glow
  ctx.fillStyle = rgrad(ctx, 540, 860, 100, 900, [[0, 'rgba(110,150,255,0.15)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H);
}

// ---------- INSERT: notebook writing ----------
// lines = [{text, start, dur}] reveal by time; pen follows last char.
function insNotebook(ctx, t, lines, opt = {}) {
  // desk wood + warm lamp light
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#8a6342'], [1, '#6e4c31']]); ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 90) { ctx.strokeStyle = 'rgba(60,35,15,0.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y + hash(y) * 20); ctx.bezierCurveTo(300, y + 30, 700, y - 20, W, y + 10); ctx.stroke(); }
  // notebook
  ctx.save(); ctx.translate(540, 900); ctx.rotate(-0.05);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rr(ctx, -400, -560, 830, 1150, 20); ctx.fill();
  fillRR(ctx, -420, -580, 840, 1140, 16, '#fbf8f0', '#d9cfbd', 3);
  ctx.strokeStyle = '#b8d0e6'; ctx.lineWidth = 2; for (let y = -460; y < 540; y += 76) { ctx.beginPath(); ctx.moveTo(-380, y); ctx.lineTo(380, y); ctx.stroke(); }
  ctx.strokeStyle = '#f0a0a0'; ctx.beginPath(); ctx.moveTo(-300, -580); ctx.lineTo(-300, 560); ctx.stroke();
  ctx.fillStyle = '#9aa3ad'; for (let i = 0; i < 12; i++) ell(ctx, -420, -520 + i * 92, 14, 14, '#d0c8b8');
  // date header
  ctx.fillStyle = '#6b7c93'; ctx.font = `500 40px ${FONT_T}`; ctx.textAlign = 'left'; ctx.fillText(opt.header || 'บันทึกฝึกงาน วันที่ 1', -270, -486);
  // written lines
  let penX = 200, penY = 0, writing = false;
  ctx.font = `500 62px ${FONT_T}`;
  const lineY = i => -330 + i * 152 + (lines[i].dy || 0);
  lines.forEach((ln, i) => {
    const k = clamp((t - ln.start) / ln.dur);
    const nx = lines[i + 1];
    if (k <= 0) { // glide the pen from the previous line's end to this line's start
      if (i > 0 && t > ln.start - 0.45 && clamp((t - lines[i - 1].start) / lines[i - 1].dur) >= 1) {
        const g = ease.io(clamp((t - (ln.start - 0.45)) / 0.45)); penX = lerp(penX, -270, g); penY = lerp(penY, lineY(i), g);
      }
      return;
    }
    const y = lineY(i);
    const full = ln.text; const n = Math.ceil(full.length * k);
    const s = full.slice(0, n);
    ctx.fillStyle = ln.color || '#2a3550'; ctx.fillText(s, -270, y);
    const wdt = ctx.measureText(s).width;
    if (ln.underline && k >= 1) { ctx.strokeStyle = ln.underline; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-275, y + 22); ctx.quadraticCurveTo(-270 + wdt / 2, y + 30, -265 + wdt, y + 18); ctx.stroke(); }
    if (ln.check && k >= 1) { ctx.strokeStyle = '#3ca36a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-370, y - 20); ctx.lineTo(-350, y); ctx.lineTo(-320, y - 44); ctx.stroke(); }
    penX = -270 + wdt; penY = y; writing = k < 1;
  });
  ctx.restore();
  // pen + hand following
  if (opt.pen !== false) {
    const wob = writing ? Math.sin(t * 40) * 6 : 0;
    const rot = -0.05;
    const px = 540 + Math.cos(rot) * penX - Math.sin(rot) * penY, py = 900 + Math.sin(rot) * penX + Math.cos(rot) * penY;
    ctx.save(); ctx.translate(px + 4, py + wob - 10); ctx.rotate(-0.85);
    ctx.fillStyle = '#2b4f8c'; rr(ctx, 0, -10, 300, 20, 8); ctx.fill(); ctx.fillStyle = '#d9dde2'; ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(-30, 0); ctx.lineTo(0, 10); ctx.fill();
    ctx.restore();
    bigHand(ctx, px + 200, py + 170 + wob, 1.5, -2.2, CAST.team.skin, 'pinch', CAST.team.shirt);
  }
  // lamp light vignette
  ctx.fillStyle = rgrad(ctx, 760, 300, 100, 1400, [[0, 'rgba(255,210,140,0.25)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(10,5,0,0.45)']]); ctx.fillRect(0, 0, W, H);
}

// ---------- INSERT: lunch on the desk ----------
function insLunch(ctx, t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#5e4a3b'], [1, '#4a3a2f']]); ctx.fillRect(0, 0, W, H);
  // lunch box
  ctx.save(); ctx.translate(520, 980);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; rr(ctx, -360, -230, 740, 500, 40); ctx.fill();
  fillRR(ctx, -380, -260, 740, 500, 40, '#f2f2ee', '#cfcfc8', 4);
  fillRR(ctx, -350, -230, 380, 440, 24, '#ffffff'); // rice
  for (let i = 0; i < 90; i++) ell(ctx, -330 + hash(i) * 340, -210 + hash(i * 3) * 400, 9, 5, '#f4f1e6', hash(i * 7) * 3);
  fillRR(ctx, 50, -230, 290, 210, 20, '#e8f5e0'); // stir-fry greens
  for (let i = 0; i < 14; i++) ell(ctx, 80 + hash(i * 2) * 230, -200 + hash(i * 5) * 150, 30, 14, ['#4caf50', '#7cc36b', '#f2c94c', '#e86a4a'][i % 4], hash(i) * 3);
  fillRR(ctx, 50, 0, 290, 210, 20, '#fde8d2'); // egg
  ell(ctx, 195, 105, 110, 80, '#ffffff'); ell(ctx, 195, 105, 46, 40, '#ffb52e');
  ctx.restore();
  // spoon in hand moving
  const k = (Math.sin(t * 1.4) + 1) / 2;
  bigHand(ctx, 720 + k * 40, 1500 - k * 120, 1.6, -2.2, CAST.team.skin, 'pinch', CAST.team.shirt);
  ctx.save(); ctx.translate(560 + k * 40, 1310 - k * 120); ctx.rotate(-0.7); ctx.fillStyle = '#d9dde2'; rr(ctx, 0, -10, 260, 20, 10); ctx.fill(); ell(ctx, -30, 0, 50, 34, '#e6e9ec'); ctx.restore();
  // water bottle
  fillRR(ctx, 860, 300, 150, 420, 40, 'rgba(200,230,255,0.75)', '#9fc6e6', 4); fillRR(ctx, 890, 250, 90, 70, 14, '#4b8ad9');
  ctx.fillStyle = 'rgba(120,180,240,0.45)'; rr(ctx, 866, 420, 138, 294, 34); ctx.fill();
}

// ---------- INSERT: Team's hands turning a LEGO beam over (quiet self-doubt beat) ----------
function insPart(ctx, t) {
  ctx.fillStyle = vgrad(ctx, 0, H, [[0, '#3a74b8'], [1, '#2a5a93']]); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = rgrad(ctx, 540, 900, 50, 900, [[0, 'rgba(255,255,255,0.12)'], [1, 'rgba(0,0,0,0.25)']]); ctx.fillRect(0, 0, W, H);
  const rot = Math.sin(t * 0.9) * 0.35 - 0.2;
  ctx.save(); ctx.translate(540, 940); ctx.rotate(rot);
  fillRR(ctx, -330, -46, 660, 92, 46, '#c9ced4', OUT, 4); for (let i = -280; i <= 280; i += 56) { ell(ctx, i, 0, 20, 20, '#8a9199'); ell(ctx, i, 0, 12, 12, '#6d747b'); }
  ctx.restore();
  const ex = Math.cos(rot) * 330, ey = Math.sin(rot) * 330;
  bigHand(ctx, 540 - ex - 120, 940 - ey + 70, 2.1, rot - 0.35, CAST.team.skin, 'grip', CAST.team.shirt, 0.3);
  bigHand(ctx, 540 + ex + 130, 940 + ey + 80, 2.1, rot + Math.PI + 0.35, CAST.team.skin, 'grip', CAST.team.shirt, 0.3 + Math.sin(t * 2) * 0.1);
}
