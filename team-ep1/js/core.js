// ============================================================
//  core.js — utilities, easing, character rig (articulated 2D)
//  "บันทึกฝึกงานของทีม | EP.1 — ค่อย ๆ กล้าทีละนิด"
// ============================================================
'use strict';
const W = 1080, H = 1920, FPS = 30;

// ---------- math / easing ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, v) => clamp((v - a) / (b - a));
const ease = {
  io: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  o: t => 1 - Math.pow(1 - t, 3),
  i: t => t * t * t,
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  back: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
const ss = (a, b, v) => ease.sine(inv(a, b, v));       // smooth step between times
const sio = (a, b, v) => ease.io(inv(a, b, v));
// key-frame track: keys = [[t, value], ...] (numbers or arrays), eased (sine) between
function track(keys, t, fn = ease.sine) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i], [t1, v1] = keys[i + 1];
    if (t <= t1) {
      const k = fn((t - t0) / (t1 - t0));
      if (Array.isArray(v0)) return v0.map((x, j) => lerp(x, v1[j], k));
      if (typeof v0 === 'object') { const o = {}; for (const key in v0) o[key] = lerp(v0[key], v1[key] ?? v0[key], k); return o; }
      return lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}
// deterministic hash noise
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; }
// natural blink: returns 0..1 eyelid closure
function blinkAt(t, seed = 0, period = 3.6) {
  const k = Math.floor((t + seed * 1.7) / period);
  const off = hash(k + seed * 13) * (period - 0.4);
  const local = (t + seed * 1.7) - k * period - off;
  if (local < 0 || local > 0.2) return 0;
  return Math.sin(local / 0.2 * Math.PI);
}

// ---------- drawing helpers ----------
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
  rr(ctx, x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function ell(ctx, x, y, rx, ry, fill, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } }
function line(ctx, pts, color, w, cap = 'round') {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap; ctx.lineJoin = 'round'; ctx.stroke();
}
function vgrad(ctx, y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function hgrad(ctx, x0, x1, stops) { const g = ctx.createLinearGradient(x0, 0, x1, 0); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function rgrad(ctx, x, y, r0, r1, stops) { const g = ctx.createRadialGradient(x, y, r0, x, y, r1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
function shade(hex, amt) { // amt -1..1 darken/lighten
  let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
  let r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
  return `rgb(${r},${g},${b})`;
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ============================================================
//  CHARACTER RIG
//  Units: an adult is ~100 units tall (feet at y=0). Pose angles in
//  radians measured from straight down; positive = toward facing dir.
// ============================================================
const OUT = '#2b2230';           // line colour (soft dark plum)
const CAST = {
  team: {
    name: 'ทีม', h: 1.0, skin: '#f1c6a0', skinD: '#d9a27c', hair: '#1f1a1c', hairStyle: 'team',
    shirt: '#8ec5ea', shirtD: '#5f9fcc', collar: '#ffffff', pants: '#2f3a56', pantsD: '#222a40', shoes: '#f4f4f2', sole: '#9aa3ad',
    bag: '#556b4f', bagD: '#3e5039', lanyard: '#e8783c', eye: '#3a2618', brow: '#2a1d18', lip: '#c47a6a', sleeve: 'short', build: 1.0,
  },
  pimai: {
    name: 'ครูปีใหม่', h: 0.93, skin: '#f3cfae', skinD: '#dcab88', hair: '#3a2420', hairStyle: 'ponytail',
    shirt: '#f2785c', shirtD: '#d45a42', collar: '#ffd9cf', pants: '#d8c39a', pantsD: '#b9a37a', shoes: '#ffffff', sole: '#bbb',
    eye: '#3b2516', brow: '#3a2420', lip: '#d9706b', sleeve: 'short', build: 0.9, earring: '#ffd34d',
  },
  pam: {
    name: 'ครูแพม', h: 0.91, skin: '#e9bc95', skinD: '#cf9c76', hair: '#2a1b18', hairStyle: 'bob',
    shirt: '#47b39a', shirtD: '#33907b', collar: '#d9f5ec', pants: '#3c4a63', pantsD: '#2c374b', shoes: '#f7d35a', sole: '#c9a63a',
    eye: '#2d1d14', brow: '#2a1b18', lip: '#cf6f6f', sleeve: 'short', build: 0.9, clip: '#ffcc33',
  },
  korn: {
    name: 'ครูกร', h: 1.02, skin: '#e7b892', skinD: '#c99670', hair: '#1c1718', hairStyle: 'neat',
    shirt: '#7a2f3a', shirtD: '#5c2029', collar: '#a54b58', pants: '#2b2b30', pantsD: '#1d1d22', shoes: '#4a3328', sole: '#2a1d16',
    eye: '#2a1c14', brow: '#1c1718', lip: '#b8746a', sleeve: 'short', build: 1.08, glasses: true,
  },
};
// kids (fictional) — child proportions use bigger head
const KIDS = [
  { skin: '#f2cba6', hair: '#231a1a', hairStyle: 'kidshort', shirt: '#ffd23f', pants: '#2f6fb3', shoes: '#ff6b6b' },
  { skin: '#e8b98f', hair: '#1d1515', hairStyle: 'pigtails', shirt: '#b38cf0', pants: '#4b5bb5', shoes: '#fff', clip: '#ff79b0' },
  { skin: '#f4d2b3', hair: '#2b1d16', hairStyle: 'kidbowl', shirt: '#ffffff', pants: '#36507a', shoes: '#333' },
  { skin: '#deae84', hair: '#1a1414', hairStyle: 'kidspiky', shirt: '#ff8a3d', pants: '#3a3a48', shoes: '#4ac1ff' },
  { skin: '#f0c49e', hair: '#2a1a12', hairStyle: 'kidbob', shirt: '#6ad19a', pants: '#e6e0d0', shoes: '#ff9ec7', clip: '#ffe066' },
  { skin: '#e6b48a', hair: '#151010', hairStyle: 'kidshort', shirt: '#4aa8ff', pants: '#22324d', shoes: '#fff' },
].map(k => Object.assign({
  h: 0.62, child: true, skinD: shade(k.skin, -0.12), shirtD: shade(k.shirt, -0.15), pantsD: shade(k.pants, -0.2), sole: '#999',
  eye: '#2a1b12', brow: k.hair, lip: '#d77a72', collar: shade(k.shirt, 0.3), sleeve: 'short', build: 0.85,
}, k));

// default pose
function P(o = {}) {
  return Object.assign({
    x: 0, y: 0, s: 5, face: 1, turn: 0.35, lean: 0, bob: 0, headTilt: 0, headNod: 0,
    lookX: 0.3, lookY: 0, blink: 0, brow: 'neutral', mouth: 'soft', mouthOpen: 0,
    armB: [0.08, 0.15], armF: [0.06, 0.2], legB: [0, 0], legF: [0, 0],
    hipY: 0, sit: false, bag: false, backView: false, breathe: 0, shoulderUp: 0, handB: 'open', handF: 'open',
    blush: 0, sweat: 0, eyesClosed: 0, squint: 0,
  }, o);
}

// forward kinematics for a 2-bone limb. dir = +1/-1 (screen direction of "forward")
function fk(ox, oy, a, e, l1, l2, dir) {
  const x1 = ox + Math.sin(a) * l1 * dir, y1 = oy + Math.cos(a) * l1;
  const x2 = x1 + Math.sin(a + e) * l2 * dir, y2 = y1 + Math.cos(a + e) * l2;
  return [x1, y1, x2, y2];
}
// inverse kinematics: returns [a, e]. elbowDown=true for arms (elbow below/behind), false for knees (forward)
function ik(ox, oy, tx, ty, l1, l2, dir, elbowDown = true) {
  const lx = (tx - ox) * dir, ly = ty - oy;
  let D = Math.hypot(lx, ly); D = clamp(D, Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
  const th = Math.atan2(lx, ly);
  const al = Math.acos(clamp((l1 * l1 + D * D - l2 * l2) / (2 * l1 * D), -1, 1));
  const be = Math.acos(clamp((l1 * l1 + l2 * l2 - D * D) / (2 * l1 * l2), -1, 1));
  return elbowDown ? [th - al, Math.PI - be] : [th + al, -(Math.PI - be)];
}

// skeleton layout (units) for given char
function skel(c) {
  const kid = !!c.child;
  return kid ? { hip: 30, sh: 50, neck: 52, headY: 64, headR: 13, l1: 11.5, l2: 10, t1: 14.5, t2: 14.5, shW: 9.5, hipW: 5.5, aw: 5.5, lw: 6.5, waist: 15, chest: 19 }
    : { hip: 48, sh: 78, neck: 80, headY: 92, headR: 11.2, l1: 17, l2: 15, t1: 24, t2: 23.5, shW: 12 * c.build, hipW: 6.2 * c.build, aw: 6.6 * c.build, lw: 8.4 * c.build, waist: 19 * c.build, chest: 25 * c.build };
}

// compute joint positions in local units (origin at feet centre, y up negative)
function joints(c, p) {
  const k = skel(c), d = p.face || 1;
  const sitDrop = p.sit ? 0 : 0;
  const hipY = -k.hip - p.hipY + p.bob - sitDrop;
  const lean = p.lean;
  const shY = hipY - (k.sh - k.hip) * Math.cos(lean) + p.breathe * 0.5 - p.shoulderUp;
  const shX = (k.sh - k.hip) * Math.sin(lean) * d;
  const wFac = 1 - Math.abs(p.turn) * 0.28;          // torso narrower in 3/4
  const J = { k, d, hipY, shY, shX, wFac };
  const hipOff = k.hipW * wFac;
  // legs
  const lb = p.legB, lf = p.legF;
  J.legB = fk(-hipOff * d * 0.6, hipY, lb[0], lb[1], k.t1, k.t2, d);
  J.legBo = [-hipOff * d * 0.6, hipY];
  J.legF = fk(hipOff * d * 0.6, hipY, lf[0], lf[1], k.t1, k.t2, d);
  J.legFo = [hipOff * d * 0.6, hipY];
  // arms
  const shOff = k.shW * wFac;
  const side = (p.turn === 0 || p.sideArms) && !p.forwardArms;
  J.armBo = side ? [shX - shOff, shY + 2.5] : [shX - shOff * d * (p.turn !== 0 ? 0.55 : 1), shY + 2.5];
  J.armFo = side ? [shX + shOff, shY + 2.5] : [shX + shOff * d * (p.turn !== 0 ? 0.75 : 1), shY + 2.5];
  const dirB = side ? -1 : d, dirF = side ? 1 : d;
  J.dirB = dirB; J.dirF = dirF;
  J.armB = fk(J.armBo[0], J.armBo[1], p.armB[0], p.armB[1], k.l1, k.l2, dirB);
  J.armF = fk(J.armFo[0], J.armFo[1], p.armF[0], p.armF[1], k.l1, k.l2, dirF);
  J.head = [shX + Math.sin(lean) * 10 * d + p.headNod * 1.5 * d, shY - (k.headY - k.sh) + Math.abs(p.headNod) * 1.2];
  return J;
}
// world position of a hand
function handPos(c, p, which = 'F') {
  const J = joints(c, p), a = J['arm' + which];
  return [p.x + a[2] * p.s, p.y + a[3] * p.s];
}
function shoulderPos(c, p, which = 'F') { const J = joints(c, p), o = J['arm' + which + 'o']; return [p.x + o[0] * p.s, p.y + o[1] * p.s]; }
// solve arm so the hand reaches world point (tx,ty)
function reach(c, p, which, tx, ty) {
  const J = joints(c, p); const k = J.k; const o = J['arm' + which + 'o']; const dir = which === 'F' ? J.dirF : J.dirB;
  const side = J.dirF !== J.dirB; // front-facing: elbows bend outward
  return ik(o[0], o[1], (tx - p.x) / p.s, (ty - p.y) / p.s, k.l1, k.l2, dir, !side);
}
function reachLeg(c, p, which, tx, ty) {
  const J = joints(c, p); const k = J.k; const o = J['leg' + which + 'o'];
  return ik(o[0], o[1], (tx - p.x) / p.s, (ty - p.y) / p.s, k.t1, k.t2, J.d, false);
}

// ---- limb drawing ----
function drawLimb(ctx, o, j, w1, w2, col1, col2, outline = OUT) {
  // outline pass
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = outline; ctx.lineWidth = w1 + 1.3; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(j[0], j[1]); ctx.stroke();
  ctx.lineWidth = w2 + 1.3; ctx.beginPath(); ctx.moveTo(j[0], j[1]); ctx.lineTo(j[2], j[3]); ctx.stroke();
  ctx.strokeStyle = col2; ctx.lineWidth = w2; ctx.beginPath(); ctx.moveTo(j[0], j[1]); ctx.lineTo(j[2], j[3]); ctx.stroke();
  ctx.strokeStyle = col1; ctx.lineWidth = w1; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(j[0], j[1]); ctx.stroke();
}
function drawArm(ctx, c, J, which, p, back) {
  const k = J.k, o = J['arm' + which + 'o'], j = J['arm' + which];
  const sk = back ? c.skinD : c.skin, sh = back ? c.shirtD : c.shirt;
  const aw = k.aw;
  // upper arm: sleeve covers ~60% of upper arm (short sleeve)
  const mx = lerp(o[0], j[0], 0.62), my = lerp(o[1], j[1], 0.62);
  ctx.lineCap = 'round';
  // skin parts with outline
  drawLimb(ctx, o, j, aw * 0.82, aw * 0.78, sk, sk);
  // sleeve
  ctx.strokeStyle = OUT; ctx.lineWidth = aw * 1.32 + 1.3; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(mx, my); ctx.stroke();
  ctx.strokeStyle = sh; ctx.lineWidth = aw * 1.32; ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(mx, my); ctx.stroke();
  // hand
  const hx = j[2], hy = j[3];
  const ang = Math.atan2(j[3] - j[1], j[2] - j[0]);
  const hs = aw * 0.62;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang);
  const mode = which === 'F' ? p.handF : p.handB;
  ctx.fillStyle = sk; ctx.strokeStyle = OUT; ctx.lineWidth = 0.9;
  if (mode === 'fist' || mode === 'grip') {
    ctx.beginPath(); ctx.ellipse(hs * 0.6, 0, hs * 1.05, hs * 0.95, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hs * 0.9, -hs * 0.5); ctx.lineTo(hs * 1.2, hs * 0.1); ctx.stroke();
  } else if (mode === 'point') {
    ctx.beginPath(); ctx.ellipse(hs * 0.5, 0, hs * 0.95, hs * 0.85, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineCap = 'round'; ctx.strokeStyle = OUT; ctx.lineWidth = hs * 0.62 + 0.9; ctx.beginPath(); ctx.moveTo(hs, 0); ctx.lineTo(hs * 2.6, 0); ctx.stroke();
    ctx.strokeStyle = sk; ctx.lineWidth = hs * 0.62; ctx.stroke();
  } else { // open hand: palm + fingers mitten
    ctx.beginPath(); ctx.ellipse(hs * 0.75, 0, hs * 1.25, hs * 0.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(hs * 0.35, -hs * 0.75, hs * 0.5, hs * 0.32, -0.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
function drawLeg(ctx, c, J, which, back) {
  const k = J.k, o = J['leg' + which + 'o'], j = J['leg' + which];
  const pc = back ? c.pantsD : c.pants;
  drawLimb(ctx, o, j, k.lw * 1.05, k.lw * 0.92, pc, pc);
  // shoe
  const d = J.d, fx = j[2], fy = j[3];
  const ang = Math.atan2(j[3] - j[1], j[2] - j[0]) - Math.PI / 2;
  ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang * 0.5);
  const sl = k.lw * 1.25;
  ctx.fillStyle = back ? shade(c.shoes, -0.12) : c.shoes; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-sl * 0.45 * d, -1.5); ctx.quadraticCurveTo(sl * 1.25 * d, -2.5, sl * 1.3 * d, 1.6); ctx.lineTo(-sl * 0.55 * d, 1.8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.sole; ctx.fillRect(Math.min(-sl * 0.55 * d, sl * 1.3 * d), 1.2, sl * 1.85, 1.1);
  ctx.restore();
}

// ---- head & face ----
function drawHair(ctx, c, layer, hr, turn) {
  const st = c.hairStyle; ctx.fillStyle = c.hair; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
  const tx = turn * hr * 0.25;
  if (layer === 'back') {
    if (st === 'ponytail') { // tail behind head
      ctx.beginPath(); ctx.moveTo(-hr * 0.5 - tx * 2, -hr * 0.6); ctx.bezierCurveTo(-hr * 1.9 - tx * 2, -hr * 0.2, -hr * 1.6, hr * 1.4, -hr * 0.9 - tx * 2, hr * 1.9);
      ctx.bezierCurveTo(-hr * 0.8, hr * 0.9, -hr * 0.6, hr * 0.2, -hr * 0.2, -hr * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ell(ctx, -hr * 0.62 - tx * 2, -hr * 0.55, hr * 0.22, hr * 0.18, '#ffd34d');
    } else if (st === 'bob' || st === 'kidbob') {
      ctx.beginPath(); ctx.moveTo(-hr * 1.12, -hr * 0.2); ctx.quadraticCurveTo(-hr * 1.25, hr * 0.95, -hr * 0.75, hr * 1.02); ctx.lineTo(hr * 0.75, hr * 1.02);
      ctx.quadraticCurveTo(hr * 1.25, hr * 0.95, hr * 1.12, -hr * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (st === 'pigtails') {
      [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(s * hr * 1.15, hr * 0.15, hr * 0.38, hr * 0.62, s * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ell(ctx, s * hr * 0.95, -hr * 0.3, hr * 0.15, hr * 0.15, c.clip || '#f6c'); });
    }
    return;
  }
  // front / top hair
  ctx.beginPath();
  if (st === 'team') { // short, soft fringe swept to the side, slight volume
    ctx.moveTo(-hr * 1.05, hr * 0.05);
    ctx.bezierCurveTo(-hr * 1.25, -hr * 1.05, -hr * 0.2, -hr * 1.5, hr * 0.55, -hr * 1.18);
    ctx.bezierCurveTo(hr * 1.15, -hr * 0.95, hr * 1.2, -hr * 0.3, hr * 1.06, hr * 0.05);
    ctx.quadraticCurveTo(hr * 0.98, -hr * 0.45, hr * 0.7 + tx, -hr * 0.52);
    ctx.quadraticCurveTo(hr * 0.35 + tx, -hr * 0.3, hr * 0.05 + tx, -hr * 0.42); // fringe tips
    ctx.quadraticCurveTo(-hr * 0.2 + tx, -hr * 0.18, -hr * 0.45 + tx, -hr * 0.38);
    ctx.quadraticCurveTo(-hr * 0.75 + tx, -hr * 0.2, -hr * 0.9, -hr * 0.42);
    ctx.quadraticCurveTo(-hr * 1.0, -hr * 0.2, -hr * 1.05, hr * 0.05);
  } else if (st === 'neat') {
    ctx.moveTo(-hr * 1.04, -hr * 0.05); ctx.bezierCurveTo(-hr * 1.15, -hr * 1.2, hr * 1.1, -hr * 1.35, hr * 1.05, -hr * 0.05);
    ctx.quadraticCurveTo(hr * 0.9, -hr * 0.62, hr * 0.2 + tx, -hr * 0.7); ctx.quadraticCurveTo(-hr * 0.5 + tx, -hr * 0.75, -hr * 0.9, -hr * 0.5); ctx.closePath();
  } else if (st === 'ponytail') {
    ctx.moveTo(-hr * 1.07, hr * 0.15); ctx.bezierCurveTo(-hr * 1.2, -hr * 1.25, hr * 1.2, -hr * 1.3, hr * 1.07, hr * 0.15);
    ctx.quadraticCurveTo(hr * 0.95, -hr * 0.45, hr * 0.45 + tx, -hr * 0.62); ctx.quadraticCurveTo(0 + tx, -hr * 0.35, -hr * 0.3 + tx, -hr * 0.6);
    ctx.quadraticCurveTo(-hr * 0.85, -hr * 0.5, -hr * 1.07, hr * 0.15);
  } else if (st === 'bob' || st === 'kidbob') { // straight bangs
    ctx.moveTo(-hr * 1.12, hr * 0.2); ctx.bezierCurveTo(-hr * 1.25, -hr * 1.3, hr * 1.25, -hr * 1.3, hr * 1.12, hr * 0.2);
    ctx.lineTo(hr * 0.95, -hr * 0.25); ctx.quadraticCurveTo(0 + tx, -hr * 0.42, -hr * 0.95, -hr * 0.25); ctx.closePath();
  } else if (st === 'pigtails') {
    ctx.moveTo(-hr * 1.08, hr * 0.1); ctx.bezierCurveTo(-hr * 1.2, -hr * 1.25, hr * 1.2, -hr * 1.25, hr * 1.08, hr * 0.1);
    ctx.quadraticCurveTo(hr * 0.6 + tx, -hr * 0.5, 0 + tx, -hr * 0.55); ctx.quadraticCurveTo(-hr * 0.6 + tx, -hr * 0.5, -hr * 1.08, hr * 0.1);
  } else if (st === 'kidbowl') {
    ctx.moveTo(-hr * 1.1, hr * 0.1); ctx.bezierCurveTo(-hr * 1.2, -hr * 1.3, hr * 1.2, -hr * 1.3, hr * 1.1, hr * 0.1);
    ctx.lineTo(hr * 1.0, -hr * 0.3); ctx.lineTo(-hr * 1.0, -hr * 0.3); ctx.closePath();
  } else if (st === 'kidspiky') {
    ctx.moveTo(-hr * 1.05, 0); ctx.lineTo(-hr * 1.1, -hr * 0.8); ctx.lineTo(-hr * 0.7, -hr * 1.05); ctx.lineTo(-hr * 0.5, -hr * 1.4); ctx.lineTo(-hr * 0.1, -hr * 1.15);
    ctx.lineTo(hr * 0.3, -hr * 1.45); ctx.lineTo(hr * 0.55, -hr * 1.1); ctx.lineTo(hr * 1.0, -hr * 1.15); ctx.lineTo(hr * 1.05, 0); ctx.quadraticCurveTo(hr * 0.3, -hr * 0.55, -hr * 1.05, 0);
  } else { // kidshort
    ctx.moveTo(-hr * 1.06, hr * 0.05); ctx.bezierCurveTo(-hr * 1.2, -hr * 1.3, hr * 1.2, -hr * 1.3, hr * 1.06, hr * 0.05);
    ctx.quadraticCurveTo(hr * 0.5 + tx, -hr * 0.5, -hr * 0.2 + tx, -hr * 0.45); ctx.quadraticCurveTo(-hr * 0.8, -hr * 0.4, -hr * 1.06, hr * 0.05);
  }
  ctx.fill(); ctx.stroke();
  // hair shine
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = hr * 0.08; ctx.beginPath(); ctx.arc(-hr * 0.1, -hr * 0.2, hr * 0.85, -2.5, -1.9); ctx.stroke();
  if (c.clip && st !== 'pigtails') { fillRR(ctx, hr * 0.45, -hr * 0.72, hr * 0.42, hr * 0.14, 2, c.clip, OUT, 0.6); }
}

function drawHead(ctx, c, p, J) {
  const k = J.k, hr = k.headR, d = J.d;
  const [hx, hy] = J.head;
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(p.headTilt * d);
  if (p.backView) { // seen from behind
    ctx.fillStyle = c.skin; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    ell(ctx, -hr * 1.0, hr * 0.15, hr * 0.18, hr * 0.28, c.skin); ell(ctx, hr * 1.0, hr * 0.15, hr * 0.18, hr * 0.28, c.skin);
    ctx.beginPath(); ctx.ellipse(0, 0, hr * 1.05, hr * 1.12, 0, 0, Math.PI * 2); ctx.fillStyle = c.hair; ctx.fill(); ctx.stroke();
    drawHair(ctx, c, 'back', hr, 0);
    ctx.restore(); return;
  }
  const turn = p.turn * d; // -1..1 screen
  drawHair(ctx, c, 'back', hr, turn);
  // neck
  ctx.fillStyle = c.skinD; ctx.fillRect(-hr * 0.32, hr * 0.6, hr * 0.64, hr * 0.75);
  // ears
  const earX = hr * 1.0;
  ctx.strokeStyle = OUT; ctx.lineWidth = 0.9;
  [-1, 1].forEach(s => {
    const vis = s * turn > 0.55 ? 0 : 1; if (!vis) return;
    const ex = s * earX - turn * hr * 0.25;
    ctx.beginPath(); ctx.ellipse(ex, hr * 0.12, hr * 0.2, hr * 0.27, 0, 0, Math.PI * 2); ctx.fillStyle = c.skin; ctx.fill(); ctx.stroke();
    if (c.earring) ell(ctx, ex, hr * 0.42, hr * 0.08, hr * 0.08, c.earring);
  });
  // face shape: rounded top, softer jaw towards chin, shifted by turn
  const cx = turn * hr * 0.06;
  ctx.beginPath();
  ctx.moveTo(-hr * 1.0, -hr * 0.1);
  ctx.bezierCurveTo(-hr * 1.02, -hr * 1.25, hr * 1.02, -hr * 1.25, hr * 1.0, -hr * 0.1);
  ctx.bezierCurveTo(hr * 0.98, hr * 0.62, hr * 0.42 + cx * 2, hr * 1.08, cx * 3, hr * 1.12);
  ctx.bezierCurveTo(-hr * 0.42 + cx * 2, hr * 1.08, -hr * 0.98, hr * 0.62, -hr * 1.0, -hr * 0.1);
  ctx.closePath();
  const fg = rgrad(ctx, -hr * 0.3 + cx * 4, -hr * 0.3, hr * 0.2, hr * 1.4, [[0, shade(c.skin, 0.06)], [1, c.skin]]);
  ctx.fillStyle = fg; ctx.fill(); ctx.lineWidth = 1.1; ctx.strokeStyle = OUT; ctx.stroke();
  // jaw shading
  ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(160,90,70,0.10)'; ctx.beginPath(); ctx.ellipse(hr * 0.95 - turn * hr * 1.9, hr * 0.3, hr * 0.5, hr * 1.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  // ---- features ----
  const fx = turn * hr * 0.32;           // feature shift with head turn
  const ey = hr * 0.08 + p.headNod * hr * 0.06;
  const esp = hr * 0.42 * (1 - Math.abs(turn) * 0.18);
  const eyeR = c.child ? hr * 0.2 : hr * 0.17;
  const closed = clamp(Math.max(p.blink, p.eyesClosed));
  const lx = clamp(p.lookX, -1, 1) * eyeR * 0.42, ly = clamp(p.lookY, -1, 1) * eyeR * 0.35;
  [-1, 1].forEach(s => {
    const ex = fx + s * esp * (1 + (s * turn > 0 ? -0.12 : 0.06) * Math.abs(turn)), eyw = eyeR * (s * turn > 0 ? 1 - Math.abs(turn) * 0.25 : 1);
    const eh = eyeR * 1.22 * (1 - p.squint * 0.35);
    // sclera
    ctx.save();
    ctx.beginPath(); ctx.ellipse(ex, ey, eyw, eh, 0, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.clip();
    // iris + pupil + highlight
    ell(ctx, ex + lx, ey + ly + eh * 0.08, eyw * 0.78, eh * 0.78, c.eye);
    ell(ctx, ex + lx, ey + ly + eh * 0.1, eyw * 0.42, eh * 0.42, '#120b08');
    ell(ctx, ex + lx - eyw * 0.28, ey + ly - eh * 0.28, eyw * 0.24, eh * 0.2, 'rgba(255,255,255,0.95)');
    ell(ctx, ex + lx + eyw * 0.3, ey + ly + eh * 0.32, eyw * 0.1, eh * 0.09, 'rgba(255,255,255,0.7)');
    // eyelid (blink / closed)
    if (closed > 0.02) { ctx.fillStyle = c.skin; ctx.fillRect(ex - eyw * 1.3, ey - eh * 1.3, eyw * 2.6, eh * 2.6 * closed); }
    ctx.restore();
    // upper lash line
    ctx.strokeStyle = OUT; ctx.lineWidth = hr * 0.075; ctx.lineCap = 'round';
    const lidY = ey - eh + eh * 2 * closed;
    ctx.beginPath();
    if (closed > 0.85) { ctx.moveTo(ex - eyw, ey + eh * 0.2); ctx.quadraticCurveTo(ex, ey + eh * 0.75, ex + eyw, ey + eh * 0.2); }
    else { ctx.ellipse(ex, closed > 0.02 ? lidY + eh * 0.0 : ey, eyw * 1.02, closed > 0.02 ? eh * 0.3 : eh * 1.02, 0, Math.PI * 1.08, Math.PI * 1.92); }
    ctx.stroke();
    if (c.hairStyle === 'ponytail' || c.hairStyle === 'bob' || c.hairStyle === 'pigtails' || c.hairStyle === 'kidbob') { // lash flick
      ctx.lineWidth = hr * 0.05; ctx.beginPath(); ctx.moveTo(ex + s * eyw * 0.95, ey - eh * 0.55 + (closed > 0.85 ? eh * 0.8 : 0)); ctx.lineTo(ex + s * eyw * 1.25, ey - eh * 0.8 + (closed > 0.85 ? eh * 0.8 : 0)); ctx.stroke();
    }
    // brows
    const bw = eyw * 1.15, by = ey - eh * 1.55;
    let inner = 0, outer = 0, arch = -eh * 0.2;
    if (p.brow === 'worry') { inner = -eh * 0.55; outer = eh * 0.15; arch = 0; }
    else if (p.brow === 'raise') { inner = -eh * 0.45; outer = -eh * 0.4; arch = -eh * 0.3; }
    else if (p.brow === 'soft') { inner = -eh * 0.15; outer = 0; }
    else if (p.brow === 'focus') { inner = eh * 0.18; outer = -eh * 0.1; }
    ctx.strokeStyle = c.brow; ctx.lineWidth = hr * 0.1;
    ctx.beginPath(); const ix = ex - s * bw * 0.85, ox = ex + s * bw * 0.95;
    ctx.moveTo(ix, by + inner); ctx.quadraticCurveTo(ex, by + arch + (inner + outer) / 2, ox, by + outer); ctx.stroke();
  });
  if (c.glasses) {
    ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = hr * 0.07;
    [-1, 1].forEach(s => { const ex = fx + s * esp; rr(ctx, ex - eyeR * 1.45, ey - eyeR * 1.3, eyeR * 2.9, eyeR * 2.5, eyeR * 0.8); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(fx - esp + eyeR * 1.45, ey - eyeR * 0.3); ctx.lineTo(fx + esp - eyeR * 1.45, ey - eyeR * 0.3); ctx.stroke();
  }
  // nose
  ctx.strokeStyle = shade(c.skinD, -0.1); ctx.lineWidth = hr * 0.07;
  ctx.beginPath(); ctx.moveTo(fx * 1.25 + hr * 0.02, ey + hr * 0.3); ctx.quadraticCurveTo(fx * 1.25 + turn * hr * 0.12 + hr * 0.06, ey + hr * 0.42, fx * 1.25 - hr * 0.04, ey + hr * 0.45); ctx.stroke();
  // blush
  const bl = 0.16 + p.blush * 0.35;
  [-1, 1].forEach(s => ell(ctx, fx + s * esp * 1.1, ey + hr * 0.42, hr * 0.2, hr * 0.11, `rgba(240,120,110,${bl})`));
  // mouth
  const mx = fx * 1.1, my = ey + hr * 0.66;
  const mw = hr * 0.24;
  ctx.strokeStyle = shade(c.lip, -0.35); ctx.lineWidth = hr * 0.075; ctx.lineCap = 'round';
  const m = p.mouth, op = p.mouthOpen;
  ctx.beginPath();
  if (op > 0.05) {
    ctx.moveTo(mx - mw, my); ctx.quadraticCurveTo(mx, my + hr * 0.04, mx + mw, my);
    ctx.quadraticCurveTo(mx, my + hr * 0.1 + op * hr * 0.25, mx - mw, my); ctx.fillStyle = '#7a2e2e'; ctx.fill(); ctx.stroke();
  } else if (m === 'smile') { ctx.moveTo(mx - mw * 1.2, my - hr * 0.04); ctx.quadraticCurveTo(mx, my + hr * 0.16, mx + mw * 1.2, my - hr * 0.04); ctx.stroke(); }
  else if (m === 'bigsmile') {
    ctx.moveTo(mx - mw * 1.4, my - hr * 0.05); ctx.quadraticCurveTo(mx, my + hr * 0.3, mx + mw * 1.4, my - hr * 0.05); ctx.closePath(); ctx.fillStyle = '#8a3434'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ell(ctx, mx, my + hr * 0.22, mw * 0.8, hr * 0.1, '#e98a8a'); ctx.restore();
  }
  else if (m === 'soft') { ctx.moveTo(mx - mw * 0.8, my); ctx.quadraticCurveTo(mx, my + hr * 0.06, mx + mw * 0.8, my); ctx.stroke(); }
  else if (m === 'flat') { ctx.moveTo(mx - mw * 0.75, my + hr * 0.02); ctx.lineTo(mx + mw * 0.7, my + hr * 0.01); ctx.stroke(); }
  else if (m === 'worry') { ctx.moveTo(mx - mw * 0.8, my + hr * 0.05); ctx.quadraticCurveTo(mx - mw * 0.2, my - hr * 0.03, mx + mw * 0.1, my + hr * 0.02); ctx.quadraticCurveTo(mx + mw * 0.5, my + hr * 0.06, mx + mw * 0.8, my + hr * 0.02); ctx.stroke(); }
  else if (m === 'press') { ctx.moveTo(mx - mw * 0.6, my + hr * 0.03); ctx.quadraticCurveTo(mx, my - hr * 0.01, mx + mw * 0.6, my + hr * 0.03); ctx.stroke(); }
  else if (m === 'o') { ell(ctx, mx, my + hr * 0.04, hr * 0.08, hr * 0.1, '#7a2e2e'); }
  else { ctx.moveTo(mx - mw * 0.7, my); ctx.quadraticCurveTo(mx, my + hr * 0.08, mx + mw * 0.7, my); ctx.stroke(); }
  // sweat drop (subtle nervousness)
  if (p.sweat > 0.02) {
    ctx.globalAlpha = p.sweat; ctx.fillStyle = '#bfe6ff'; ctx.strokeStyle = '#6aa9d6'; ctx.lineWidth = 0.7;
    const sx = hr * 0.95 - turn * hr * 1.6, sy = -hr * 0.35;
    ctx.beginPath(); ctx.moveTo(sx, sy - hr * 0.22); ctx.quadraticCurveTo(sx + hr * 0.16, sy + hr * 0.05, sx, sy + hr * 0.12); ctx.quadraticCurveTo(sx - hr * 0.16, sy + hr * 0.05, sx, sy - hr * 0.22); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  drawHair(ctx, c, 'front', hr, turn);
  ctx.restore();
}

function drawTorso(ctx, c, p, J) {
  const k = J.k, d = J.d;
  const hipY = J.hipY, shY = J.shY, shX = J.shX;
  const cw = k.chest * J.wFac, ww = k.waist * J.wFac;
  const lean = p.lean;
  // shirt body
  const g = hgrad(ctx, shX - cw / 2, shX + cw / 2, d > 0 ? [[0, c.shirtD], [0.35, c.shirt], [1, c.shirt]] : [[0, c.shirt], [0.65, c.shirt], [1, c.shirtD]]);
  ctx.beginPath();
  ctx.moveTo(shX - cw / 2, shY + 1);
  ctx.quadraticCurveTo(shX, shY - 2.5, shX + cw / 2, shY + 1);
  ctx.quadraticCurveTo(shX + cw / 2 + 1.5, (shY + hipY) / 2, ww / 2 + 1, hipY + 3);
  ctx.lineTo(-ww / 2 - 1, hipY + 3);
  ctx.quadraticCurveTo(shX - cw / 2 - 1.5, (shY + hipY) / 2, shX - cw / 2, shY + 1);
  ctx.closePath();
  ctx.fillStyle = p.backView ? c.shirtD : g; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; ctx.stroke();
  // fold lines
  ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(shX - cw * 0.15, shY + 10); ctx.quadraticCurveTo(-ww * 0.1, (shY + hipY) / 2 + 4, -ww * 0.2, hipY); ctx.stroke();
  if (!p.backView) {
    // collar
    const cx = shX + p.turn * d * 2.2;
    ctx.fillStyle = c.collar; ctx.strokeStyle = OUT; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(cx - 4.5, shY - 0.5); ctx.lineTo(cx, shY + 4.5); ctx.lineTo(cx - 1, shY - 1.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4.5, shY - 0.5); ctx.lineTo(cx, shY + 4.5); ctx.lineTo(cx + 1, shY - 1.6); ctx.closePath(); ctx.fill(); ctx.stroke();
    // placket buttons (adults)
    if (!c.child) { ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(cx, shY + 4.5); ctx.lineTo(cx, shY + 12); ctx.stroke(); ell(ctx, cx + 0.8, shY + 7, 0.6, 0.6, '#fff'); ell(ctx, cx + 0.8, shY + 10.5, 0.6, 0.6, '#fff'); }
    // staff logo (teachers) – little gear badge
    if (c === CAST.pimai || c === CAST.pam || c === CAST.korn) {
      const bx = shX + cw * 0.22 * (d || 1), by = shY + 9;
      ell(ctx, bx, by, 2.1, 2.1, '#ffffff'); ell(ctx, bx - 0.5, by - 0.4, 0.9, 0.9, '#e2433b'); ell(ctx, bx + 0.7, by + 0.5, 0.7, 0.7, '#2e9d4f'); ell(ctx, bx + 0.6, by - 0.8, 0.5, 0.5, '#3b54c4');
    }
    // lanyard + intern card for ทีม
    if (c === CAST.team) {
      ctx.strokeStyle = c.lanyard; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(cx - 3.2, shY); ctx.lineTo(cx - 0.8, shY + 15); ctx.moveTo(cx + 3.2, shY); ctx.lineTo(cx + 0.8, shY + 15); ctx.stroke();
      fillRR(ctx, cx - 3, shY + 14.5, 6, 7.5, 0.8, '#ffffff', OUT, 0.6);
      ctx.fillStyle = '#7fb3e0'; ctx.fillRect(cx - 2.2, shY + 15.5, 4.4, 2.2);
      ctx.fillStyle = '#c9ccd2'; ctx.fillRect(cx - 2.2, shY + 18.6, 4.4, 0.7); ctx.fillRect(cx - 2.2, shY + 20, 3, 0.7);
    }
  }
  // belt line / waist
  ctx.fillStyle = c.pants; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
  rr(ctx, -ww / 2 - 1.2, hipY - 0.5, ww + 2.4, 5.5, 2); ctx.fill(); ctx.stroke();
}

function drawBagStraps(ctx, c, p, J, front) {
  // backpack: body behind torso (front=false) or straps on front (front=true)
  const k = J.k, d = J.d, shX = J.shX, shY = J.shY;
  if (!front) {
    if (p.backView) return;
    const bx = shX - d * k.chest * 0.42, by = shY + 4;
    ctx.fillStyle = c.bagD; ctx.strokeStyle = OUT; ctx.lineWidth = 1;
    rr(ctx, bx - 9, by - 1, 18, 26, 6); ctx.fill(); ctx.stroke();
  } else {
    ctx.strokeStyle = OUT; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    const sx1 = shX - k.chest * 0.28 * J.wFac, sx2 = shX + k.chest * 0.28 * J.wFac;
    ctx.beginPath(); ctx.moveTo(sx1, shY + 0.5); ctx.quadraticCurveTo(sx1 - 1.5 * d, shY + 12, sx1 - 0.5, shY + 21); ctx.stroke();
    if (Math.abs(p.turn) < 0.6) { ctx.beginPath(); ctx.moveTo(sx2, shY + 0.5); ctx.quadraticCurveTo(sx2 + 1.5 * d, shY + 12, sx2 + 0.5, shY + 21); ctx.stroke(); }
    ctx.strokeStyle = c.bag; ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(sx1, shY + 0.5); ctx.quadraticCurveTo(sx1 - 1.5 * d, shY + 12, sx1 - 0.5, shY + 21); ctx.stroke();
    if (Math.abs(p.turn) < 0.6) { ctx.beginPath(); ctx.moveTo(sx2, shY + 0.5); ctx.quadraticCurveTo(sx2 + 1.5 * d, shY + 12, sx2 + 0.5, shY + 21); ctx.stroke(); }
  }
}
function drawBackpackBack(ctx, c, p, J) { // when seen from behind
  const shX = J.shX, shY = J.shY;
  ctx.fillStyle = c.bag; ctx.strokeStyle = OUT; ctx.lineWidth = 1.1; rr(ctx, shX - 10, shY + 2, 20, 27, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.bagD; rr(ctx, shX - 7, shY + 15, 14, 11, 4); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8783c'; ctx.fillRect(shX - 2, shY + 14, 4, 2);
}

// main person draw. extra = {before(ctx,J), after(ctx,J), holdF(ctx,x,y,ang), holdB}
function drawPerson(ctx, c, p, extra = {}) {
  if (p._clasp && typeof clasp === 'function') { p._clasp = false; clasp(c, p); }
  const J = joints(c, p);
  ctx.save();
  ctx.translate(p.x, p.y); ctx.scale(p.s, p.s);
  // ground shadow
  if (!p.noShadow) { ctx.fillStyle = 'rgba(40,25,20,0.18)'; ctx.beginPath(); ctx.ellipse(J.shX * 0.3, 0.5, 17 * (c.child ? 0.65 : 1), 3, 0, 0, Math.PI * 2); ctx.fill(); }
  if (extra.before) extra.before(ctx, J);
  if (p.backView) {
    drawLeg(ctx, c, J, 'B', true); drawLeg(ctx, c, J, 'F', false);
    drawArm(ctx, c, J, 'B', p, true); drawArm(ctx, c, J, 'F', p, false);
    drawTorso(ctx, c, p, J);
    drawHead(ctx, c, p, J);
    if (p.bag) drawBackpackBack(ctx, c, p, J);
    ctx.restore(); return J;
  }
  if (p.bag) drawBagStraps(ctx, c, p, J, false);
  drawArm(ctx, c, J, 'B', p, true);
  if (extra.holdB) { const a = J.armB; extra.holdB(ctx, a[2], a[3], Math.atan2(a[3] - a[1], a[2] - a[0]), J); }
  drawLeg(ctx, c, J, 'B', true);
  drawLeg(ctx, c, J, 'F', false);
  if (extra.mid) extra.mid(ctx, J);
  drawTorso(ctx, c, p, J);
  if (p.bag) drawBagStraps(ctx, c, p, J, true);
  drawHead(ctx, c, p, J);
  if (extra.preFront) extra.preFront(ctx, J);
  drawArm(ctx, c, J, 'F', p, false);
  if (extra.holdF) { const a = J.armF; extra.holdF(ctx, a[2], a[3], Math.atan2(a[3] - a[1], a[2] - a[0]), J); }
  if (extra.after) extra.after(ctx, J);
  ctx.restore();
  return J;
}

// ---- pose generators ----
function walkPose(phase, amt = 1) { // phase in cycles
  const a = phase * Math.PI * 2;
  const sw = Math.sin(a) * 0.42 * amt;
  return {
    legF: [sw, -Math.max(0, -Math.sin(a + 0.6)) * 0.75 * amt - 0.05],
    legB: [-sw, -Math.max(0, Math.sin(a + 0.6)) * 0.75 * amt - 0.05],
    armF: [-sw * 0.75 + 0.05, 0.25 + Math.max(0, -sw) * 0.4],
    armB: [sw * 0.75 + 0.05, 0.25 + Math.max(0, sw) * 0.4],
    bob: -Math.abs(Math.cos(a)) * 1.6 * amt + 0.8 * amt,
  };
}
function idle(t, seed = 0) { // subtle breathing & sway
  return { breathe: Math.sin(t * 1.6 + seed) * 0.8, lean: noise1(t * 0.25 + seed * 9) * 0.02, headTilt: noise1(t * 0.3 + seed * 5) * 0.03 };
}
function sitLegs(c) { // legs for sitting on a chair (hip ~ at seat height)
  return { legF: [1.45, -1.45], legB: [1.35, -1.38] };
}
