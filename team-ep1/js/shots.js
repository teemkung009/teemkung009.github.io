// ============================================================
//  shots.js — the film. Timeline locked to the narration (209.16 s).
//  Each shot: [a, b) in seconds, draw(ctx, T, lt). Cross-dissolve via `fade`.
// ============================================================
'use strict';
const DURATION = 209.16;
const SHOTS = [];
function shot(a, b, draw, fade = 0) { SHOTS.push({ a, b, draw, fade }); }
const TEXTS = [];
function text(a, b, draw) { TEXTS.push({ a, b, draw }); }

// ---------- helpers ----------
const TM = CAST.team, PM = CAST.pimai, PAM = CAST.pam, KO = CAST.korn;
// walker: keys [[t,x],...] → x, facing, walk-cycle pose (feet planted when still)
function walker(T, keys, s, opt = {}) {
  const x = track(keys, T, opt.ease || ease.sine);
  const v = (track(keys, T + 0.04, opt.ease || ease.sine) - track(keys, T - 0.04, opt.ease || ease.sine)) / 0.08;
  const amt = clamp(Math.abs(v) / (s * 22));
  const stride = s * (opt.stride || 46);
  const ph = x / stride;
  const w = walkPose(ph, amt * (opt.amt || 1));
  return Object.assign({ x, face: opt.face || (v >= 0 ? 1 : -1) }, amt > 0.02 ? w : {}, { _amt: amt });
}
// mix of tracks for a pose: keyed object poses
function poseAt(T, keys) { return track(keys, T); }
// arms into a wai (palms together at chest)
function waiArms(c, p, k) {
  const J = joints(c, p); const k2 = J.k;
  const tx = p.x + (J.shX + 8 * J.d) * p.s, ty = p.y + (J.shY + 6) * p.s;
  const aF = reach(c, p, 'F', tx, ty), aB = reach(c, p, 'B', tx - 1 * p.s * J.d, ty + 1 * p.s);
  return { armF: [lerp(p.armF[0], aF[0], k), lerp(p.armF[1], aF[1], k)], armB: [lerp(p.armB[0], aB[0], k), lerp(p.armB[1], aB[1], k)] };
}
function B(T, seed) { return blinkAt(T, seed); }
function kneel(c) { const k = skel(c); return { hipY: -k.t2 + 1.5, legF: [0.25, -1.75], legB: [0.18, -1.8] }; }
// hands loosely clasped in front of the belly (IK)
function clasp(c, p) {
  const J = joints(c, p); const tx = p.x + (J.shX * 0.4 + 7 * J.d) * p.s, ty = p.y + (J.hipY - 3) * p.s;
  return Object.assign(p, { armF: reach(c, p, 'F', tx, ty), armB: reach(c, p, 'B', tx - 2 * J.d * p.s, ty + 1.5 * p.s), handF: 'open', handB: 'open' });
}
function sitFloor(c) { const k = skel(c); return { hipY: -k.hip + (c.child ? 5 : 8), legF: [1.5, -1.7], legB: [1.4, -1.65] }; }
function birds(ctx, t, y0) {
  for (let i = 0; i < 3; i++) {
    const x = ((t * 90 + i * 140) % 2400) - 200, y = y0 + i * 40 + Math.sin(t * 2 + i) * 14, f = Math.sin(t * 12 + i * 2) * 10;
    ctx.strokeStyle = '#4a5568'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 18, y - f); ctx.quadraticCurveTo(x - 8, y - 8, x, y); ctx.quadraticCurveTo(x + 8, y - 8, x + 18, y - f); ctx.stroke();
  }
}
function kidAt(ctx, T, k, x, y, s, o = {}, seed = 0) {
  const base = Object.assign(sitFloor(k), { x, y, s, face: 1, blink: B(T, seed), ...idle(T, seed) }, o);
  return drawPerson(ctx, k, P(base));
}

// =====================================================================
//  PART 1 — introduction & place (0.00 – 17.5)
// =====================================================================
// S1 storefront morning, Team walks in
shot(0, 5.55, (ctx, T) => {
  const cx = track([[0, 560], [5.55, 820]], T), z = track([[0, 1.0], [5.55, 1.06]], T);
  cam(ctx, cx, 1150, z, () => {
    drawSet(ctx, 'storefront');
    birds(ctx, T, 170);
    const w = walker(T, [[0, -120], [4.7, 780], [5.4, 820]], 6.5);
    const look = ss(4.6, 5.3, T);
    drawPerson(ctx, TM, P(Object.assign({ y: 1800, s: 6.5, turn: 0.4, bag: true, blink: B(T, 1), lookX: 0.5 - look * 0.2, lookY: -look * 0.9, mouth: 'soft', brow: look > 0.5 ? 'raise' : 'neutral', breathe: Math.sin(T * 2) }, w)));
  }, 1900);
  gradeMorning(ctx); lightRays(ctx, -200, -200, -0.35, 0.10); vignette(ctx, 0.25);
});
text(0.35, 4.9, (c, lt, d) => drawTitle(c, inv(0, 0.9, lt), inv(d - 0.6, d, lt)));
text(2.6, 8.4, (c, lt, d) => drawLowerThird(c, 'ทีม', 'นักศึกษาวิทยาการคอมพิวเตอร์', Math.min(inv(0, 0.6, lt), inv(d, d - 0.5, lt))));

// S2 low-angle look up at the sign
shot(5.55, 8.7, (ctx, T, lt) => {
  const z = track([[0, 1.0], [3.2, 1.07]], lt);
  cam(ctx, 540, 900, z, () => {
    drawSet(ctx, 'signwall');
    // light sweep over the acrylic logo
    ctx.save(); ctx.beginPath(); ctx.arc(540, 420, 235, 0, Math.PI * 2); ctx.clip();
    const sx = lerp(100, 1000, inv(0.6, 2.6, lt)); ctx.fillStyle = hgrad(ctx, sx - 80, sx + 80, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0.45)'], [1, 'rgba(255,255,255,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
    drawPerson(ctx, TM, P({ x: 560, y: 2240, s: 10, backView: true, bag: true, headTilt: -0.04 + Math.sin(lt * 0.8) * 0.02, breathe: Math.sin(lt * 2), armF: [0.1, 0.1], armB: [0.1, 0.1], noShadow: true }));
  });
  gradeMorning(ctx, 0.8); lightRays(ctx, 900, -300, 0.4, 0.08); vignette(ctx, 0.3);
}, 0.4);

// S3 close-up: hand on the strap
shot(8.7, 12.0, (ctx, T, lt) => {
  const z = track([[0, 1.0], [3.3, 1.08]], lt);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  insStrap(ctx, lt, 0.25 + ss(0.8, 2.2, lt) * 0.6);
  ctx.restore(); gradeMorning(ctx, 0.6);
}, 0.35);

// S4 face close-up at the shop front: glance up, breathe out
shot(12.0, 15.1, (ctx, T, lt) => {
  const z = track([[0, 2.35], [3.1, 2.5]], lt);
  const [dx, dy] = drift(lt, 4);
  cam(ctx, 700 + dx, 1215 + dy, z, () => {
    drawSet(ctx, 'storefront');
    const up = ss(0.2, 0.8, lt) * (1 - ss(1.4, 2.0, lt));
    const exhale = ss(2.0, 2.3, lt) * (1 - ss(2.6, 2.9, lt));
    drawPerson(ctx, TM, P({ x: 700, y: 1800, s: 6.4, face: -1, turn: 0.32, bag: true, blink: B(lt, 3), lookX: 0.2, lookY: -up * 0.95 + ss(1.8, 2.2, lt) * 0.35,
      brow: up > 0.3 ? 'raise' : 'worry', mouth: exhale > 0.3 ? 'o' : 'press', shoulderUp: exhale * 1.2 - ss(2.6, 3.0, lt) * 0.6, breathe: Math.sin(lt * 1.8) * 0.8, headTilt: -up * 0.04 }));
  }, 1900);
  gradeMorning(ctx); vignette(ctx, 0.4);
}, 0.3);

// S5 from inside: Team pushes the glass door and steps in
shot(15.1, 17.5, (ctx, T, lt) => {
  cam(ctx, 700, 1150, 1.0, () => {
    drawSet(ctx, 'office');
    const open = ss(0.35, 0.9, lt);
    const inK = ss(0.8, 2.4, lt);
    const s = lerp(4.5, 6.4, inK), y = lerp(1335, 1760, inK), x = lerp(745, 800, inK);
    const ph = lt * 1.6;
    const wp = inK > 0.02 && inK < 0.99 ? walkPose(ph, 0.35) : {};
    const p = P(Object.assign({ x, y, s, face: -1, turn: 0.15, bag: true, blink: B(lt, 4), mouth: 'press', brow: 'soft', lookY: 0.1 }, wp));
    if (lt < 0.95) { const tgt = [OFF_G.x + 3 * OFF_G.w / 6 + 14, OFF_G.y + 470]; const a = reach(TM, p, 'F', tgt[0], tgt[1]); p.armF = [lerp(p.armF[0], a[0], ss(0.1, 0.4, lt)), lerp(p.armF[1], a[1], ss(0.1, 0.4, lt))]; p.handF = 'grip'; }
    const outside = inK < 0.35;
    if (outside) { drawPerson(ctx, TM, p); officeGlassTint(ctx, open); officeMullions(ctx, open); }
    else { officeMullions(ctx, open); drawPerson(ctx, TM, p); }
  }, 1300);
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.3);

// =====================================================================
//  PART 2 — the quiet one (17.5 – 38.1)
// =====================================================================
// S6 greeting: Pam waves, Team gives a small wai
shot(17.5, 20.45, (ctx, T, lt) => {
  const [dx, dy] = drift(lt, 3);
  cam(ctx, 800 + dx, 1250 + dy, 1.1, () => {
    drawSet(ctx, 'office'); officeMullions(ctx, 0);
    drawPerson(ctx, KO, P({ x: 520, y: 1690, s: 6.0, face: -1, turn: 0.45, hipY: -10, ...sitLegs(KO), armF: [1.25, 0.55 + Math.sin(lt * 14) * 0.06], armB: [1.15, 0.65], lookX: 0.8, lookY: 0.3, blink: B(lt, 7), mouth: 'soft' }));
    officeDesk(ctx);
    // Pam turns from the cabinet and waves warmly
    const wave = ss(0.2, 0.6, lt) * (1 - ss(1.9, 2.4, lt));
    drawPerson(ctx, PAM, P({ x: 1110, y: 1770, s: 6.2, face: -1, turn: 0.35, blink: B(lt, 5), mouth: wave > 0.3 ? 'bigsmile' : 'smile', brow: 'soft', lookX: 0.7,
      armF: [lerp(0.1, 2.5, wave) + Math.sin(lt * 9) * 0.15 * wave, lerp(0.2, 0.6, wave)], handF: 'open', ...idle(lt, 2) }));
    // Team: wai + small bow
    const wk = ss(0.7, 1.2, lt) * (1 - ss(2.2, 2.7, lt));
    const p = P({ x: 760, y: 1790, s: 6.4, face: 1, turn: 0.35, bag: true, blink: B(lt, 6), lean: wk * 0.16, headNod: wk * 0.8, lookX: 0.6, lookY: wk * 0.3, mouth: wk > 0.5 ? 'smile' : 'press', brow: 'soft', blush: wk * 0.6, ...idle(lt, 3) });
    Object.assign(p, waiArms(TM, p, wk)); p.handF = 'open'; p.handB = 'open';
    drawPerson(ctx, TM, p);
  }, 1300);
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.25);

// S7 new place, new people: teachers chat warmly, Team stands a little apart, fiddling with his card
shot(20.45, 26.5, (ctx, T, lt) => {
  const z = track([[0, 1.0], [6, 1.1]], lt), cx = track([[0, 700], [6, 600]], lt);
  cam(ctx, cx, 1230, z, () => {
    drawSet(ctx, 'office'); officeMullions(ctx, 0);
    // Korn typing at the desk (sitting left of the monitor)
    drawPerson(ctx, KO, P({ x: 520, y: 1690, s: 6.0, face: -1, turn: 0.45, hipY: -10, ...sitLegs(KO), armF: [1.25, 0.55 + Math.sin(lt * 14) * 0.06], armB: [1.15, 0.65 + Math.sin(lt * 13 + 1) * 0.06], lookX: 0.8, lookY: 0.3, blink: B(lt, 7), mouth: 'soft' }));
    officeDesk(ctx);
    // Pimai & Pam chatting with a tablet (friendly, laughing)
    const laugh = ss(1.2, 1.5, lt) * (1 - ss(2.6, 3.0, lt));
    drawPerson(ctx, PM, P({ x: 880, y: 1770, s: 6.1, face: 1, turn: 0.4, blink: B(lt, 8), mouth: laugh > 0.3 ? 'bigsmile' : 'talk', mouthOpen: laugh > 0.3 ? 0 : Math.max(0, Math.sin(lt * 9)) * 0.35 * (1 - ss(3.2, 3.4, lt)), brow: 'soft', lookX: 0.8, lean: laugh * 0.05, armF: [0.9, 1.0], armB: [0.7, 1.2], ...idle(lt, 4) }), {
      holdF: (c, x, y, a) => { c.save(); c.translate(x + 4, y - 2); c.rotate(-0.25); fillRR(c, -10, -7, 20, 14, 2, '#2a2c31'); fillRR(c, -9, -6, 18, 12, 1.5, '#cfe3fb'); c.restore(); } });
    const pamLook = ss(3.4, 3.8, lt) * (1 - ss(5.0, 5.4, lt)); // Pam glances at Team and smiles
    drawPerson(ctx, PAM, P({ x: 1100, y: 1790, s: 6.2, face: -1, turn: 0.4 - pamLook * 0.25, blink: B(lt, 9), mouth: laugh > 0.3 ? 'bigsmile' : 'smile', brow: 'soft', lookX: 0.7 + pamLook * 0.3, ...idle(lt, 5), armF: [0.15, 0.3] }));
    // Team near the left glass wall
    const fid = Math.sin(lt * 3) * 0.08;
    const glance = ss(0.8, 1.2, lt) * (1 - ss(2.2, 2.6, lt)) + pamLook;
    const p = P({ x: 420, y: 1850, s: 6.6, face: 1, turn: 0.3, bag: true, blink: B(lt, 10), lookX: lerp(-0.3, 0.9, clamp(glance)), lookY: lerp(0.45, 0, clamp(glance)), brow: 'worry', mouth: pamLook > 0.5 ? 'smile' : 'press', blush: pamLook * 0.5, ...idle(lt, 6) });
    const card = [p.x + 3 * p.s, p.y + (joints(TM, p).shY + 18) * p.s];
    const a = reach(TM, p, 'F', card[0], card[1] + fid * p.s * 10); p.armF = a; p.handF = 'pinch';
    p.headNod = pamLook > 0.5 ? -0.2 + Math.sin(lt * 3) * 0.1 : 0;
    drawPerson(ctx, TM, p);
  }, 1300);
  gradeDaylight(ctx); vignette(ctx, 0.28);
}, 0.4);

// S8 wants to ask… hesitates… goes back to observing (ครูปีใหม่ is busy filing kits — friendly, just busy)
shot(26.5, 31.9, (ctx, T, lt) => {
  const [dx, dy] = drift(lt, 3, 2);
  cam(ctx, 820 + dx, 1270 + dy, 1.12, () => {
    drawSet(ctx, 'office'); officeMullions(ctx, 0);
    drawPerson(ctx, KO, P({ x: 520, y: 1690, s: 6.0, face: -1, turn: 0.45, hipY: -10, ...sitLegs(KO), armF: [1.25, 0.55 + Math.sin(lt * 14) * 0.06], armB: [1.15, 0.65 + Math.sin(lt * 13 + 1) * 0.06], lookX: 0.8, lookY: 0.3, blink: B(lt, 7), mouth: 'soft' }));
    officeDesk(ctx);
    // Pimai placing kit boxes on the cabinet shelf
    const sortK = Math.sin(lt * 2.0);
    const pm = P({ x: 1150, y: 1760, s: 6.1, face: 1, turn: 0.55, blink: B(lt, 11), lookY: -0.3, lookX: 0.6, mouth: 'soft', brow: 'focus', ...idle(lt, 7) });
    const sh = [1190 + sortK * 10, 1000 + Math.abs(sortK) * 20];
    pm.armF = reach(PM, pm, 'F', sh[0], sh[1]); pm.armB = reach(PM, pm, 'B', sh[0] - 28, sh[1] + 8);
    drawPerson(ctx, PM, pm, { holdF: (c, x, y) => { c.save(); c.translate(x - 2, y); fillRR(c, -7, -6, 14, 10, 2, '#f7c928', 'rgba(0,0,0,0.3)', 0.5); c.restore(); } });
    // Team: step in → hand half raised, mouth opens → pause → lower, step back, rub neck
    const step = ss(0.6, 1.3, lt) * (1 - ss(3.4, 4.2, lt));
    const raise = ss(1.2, 1.8, lt) * (1 - ss(2.8, 3.5, lt));
    const open = ss(1.6, 1.9, lt) * (1 - ss(2.3, 2.6, lt));
    const moving = (lt > 0.6 && lt < 1.3) || (lt > 3.4 && lt < 4.2);
    const p = P({ x: lerp(760, 880, step), y: 1830, s: 6.5, face: 1, turn: 0.35, bag: true, blink: B(lt, 12), lean: step * 0.05,
      lookX: 0.9 - ss(3.0, 3.4, lt) * 0.7, lookY: -0.1 + ss(3.0, 3.4, lt) * 0.45, brow: raise > 0.3 ? 'raise' : 'worry', mouth: open > 0.2 ? 'talk' : 'press', mouthOpen: open * 0.4,
      armF: [lerp(0.1, 1.7, raise), lerp(0.2, 1.3, raise)], handF: 'open', ...(moving ? walkPose(lt * 1.4, 0.25) : {}), ...idle(lt, 8) });
    const rub = ss(3.6, 4.0, lt) * (1 - ss(4.7, 5.1, lt));
    if (rub > 0) { const J = joints(TM, p); const tgt = [p.x + (J.head[0] - 5 * J.d) * p.s, p.y + (J.head[1] + 10) * p.s + Math.sin(lt * 10) * 4]; const a = reach(TM, p, 'B', tgt[0], tgt[1]); p.armB = [lerp(p.armB[0], a[0], rub), lerp(p.armB[1], a[1], rub)]; }
    drawPerson(ctx, TM, p);
  }, 1300);
  gradeDaylight(ctx); vignette(ctx, 0.3);
}, 0.3);

// S9 ครูกร — head of the institute, looks up from the monitor and smiles
shot(31.9, 34.5, (ctx, T, lt) => {
  cam(ctx, 560, 1240, 1.3, () => {
    drawSet(ctx, 'office'); officeMullions(ctx, 0);
    const up = ss(0.4, 0.9, lt);
    drawPerson(ctx, KO, P({ x: 520, y: 1690, s: 6.0, face: -1, turn: lerp(0.45, 0.12, up), hipY: -10, ...sitLegs(KO), armF: [lerp(1.25, 1.1, up), 0.55 + (1 - up) * Math.sin(lt * 14) * 0.06], armB: [1.15, 0.65],
      lookX: lerp(0.8, -0.1, up), lookY: lerp(0.3, 0, up), blink: B(lt, 13), mouth: up > 0.5 ? 'smile' : 'soft', brow: 'soft', headNod: Math.sin(clamp((lt - 1.2) / 0.6) * Math.PI) * 0.5, ...idle(lt, 9) }));
    officeDesk(ctx);
  }, 1300);
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.3);
text(32.4, 34.5, (c, lt, d) => drawNameTag(c, 'ครูกร', 'หัวหน้าสถาบัน', 600, 640, Math.min(inv(0, 0.4, lt), inv(d, d - 0.3, lt)), 1));

// ---------- classroom staging helpers ----------
// mid-floor low tables (kids sit behind them)
const CT = { a: { x: 250, y: 1400, w: 400, top: '#f5c637', side: '#e2b21c', legs: '#f5c637' }, b: { x: 760, y: 1410, w: 400, top: '#2e6fb5', side: '#255c97', legs: '#2e6fb5' } };
function classBase(ctx, T, o = {}) {
  drawSet(ctx, 'classroom'); classTablesBack(ctx);
  if (o.floorMat !== false) { ctx.save(); ctx.translate(380, 1700); ctx.scale(0.72, 0.72); classMat(ctx, 0, 0); ctx.restore(); }
  if (o.behind) o.behind(ctx);
  lowTable(ctx, CT.a.x, CT.a.y, CT.a.w, 150, CT.a.top, CT.a.side, CT.a.legs);
  lowTable(ctx, CT.b.x, CT.b.y, CT.b.w, 150, CT.b.top, CT.b.side, CT.b.legs);
  if (o.onTables) o.onTables(ctx);
}
function broom(ctx, x0, y0, x1, y1) { // handle from (x0,y0) to bristles at (x1,y1)
  line(ctx, [x0, y0, x1, y1], '#7a5a3a', 9);
  const a = Math.atan2(y1 - y0, x1 - x0);
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(a - Math.PI / 2);
  ctx.fillStyle = '#d24b4b'; rr(ctx, -34, -6, 68, 18, 5); ctx.fill();
  ctx.fillStyle = '#e9c46a'; ctx.beginPath(); ctx.moveTo(-34, 10); ctx.lineTo(34, 10); ctx.lineTo(48, 50); ctx.lineTo(-48, 50); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,20,0.4)'; ctx.lineWidth = 2; for (let i = -40; i <= 40; i += 8) { ctx.beginPath(); ctx.moveTo(i * 0.75, 12); ctx.lineTo(i, 48); ctx.stroke(); }
  ctx.restore();
}
function tabletsOnTable(ctx, x, y, n = 3, lit = [], charge = []) {
  for (let i = 0; i < n; i++) {
    const tx = x + i * 92; ctx.save(); ctx.translate(tx, y); ctx.rotate(-0.08);
    fillRR(ctx, -36, -96, 72, 96, 7, '#2a2c31'); fillRR(ctx, -32, -92, 64, 88, 4, lit[i] ? '#cfe3fb' : '#3a3f48');
    if (charge[i]) { ctx.fillStyle = '#4ad66d'; ctx.beginPath(); ctx.moveTo(4, -70); ctx.lineTo(-8, -48); ctx.lineTo(0, -48); ctx.lineTo(-4, -30); ctx.lineTo(10, -54); ctx.lineTo(2, -54); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    if (charge[i]) { ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, y); ctx.quadraticCurveTo(tx + 10, y + 26, x + n * 92 + 10, y + 18); ctx.stroke(); }
  }
  // power strip
  fillRR(ctx, x + n * 92 - 10, y + 6, 110, 26, 6, '#f4f4f4', '#bbb', 2); for (let i = 0; i < 3; i++) ell(ctx, x + n * 92 + 14 + i * 30, y + 19, 6, 6, '#666');
  ell(ctx, x + n * 92 + 88, y + 19, 5, 5, '#e34b4b');
}
function hubOnTable(ctx, x, y, s = 0.6, t = 0, on = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  fillRR(ctx, -60, -80, 120, 84, 10, '#ffffff', '#c9ced4', 3); fillRR(ctx, -60, -80, 120, 18, 8, '#f7d23a');
  ctx.fillStyle = '#2b2b2f'; rr(ctx, -26, -58, 52, 52, 4); ctx.fill();
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { ctx.fillStyle = on && (i + j + Math.floor(t * 2)) % 3 === 0 ? '#fff6c8' : '#4a4a52'; ctx.fillRect(-22 + i * 9.5, -54 + j * 9.5, 7, 7); }
  ctx.restore();
}

// S10 "…ครูปีใหม่กับครูแพม" — the two teachers in the classroom, warm welcome
shot(34.5, 38.05, (ctx, T, lt) => {
  const z = track([[0, 1.25], [3.5, 1.32]], lt);
  cam(ctx, 880, 1200, z, () => {
    classBase(ctx, T, {});
    // Pimai beckons kindly holding a kit bin; Pam with tablets
    const beck = ss(0.5, 0.9, lt) * (1 - ss(1.9, 2.3, lt));
    const pm = P({ x: 720, y: 1560, s: 6.2, face: 1, turn: 0.2, blink: B(lt, 14), mouth: 'smile', brow: 'soft', lookX: 0.2, ...idle(lt, 10),
      armF: [lerp(0.5, 1.6, beck), lerp(1.4, 1.9, beck) + Math.sin(lt * 8) * 0.25 * beck], armB: [0.75, 1.35], handF: 'open' });
    drawPerson(ctx, PM, pm, { holdB: (c, x, y) => { c.save(); c.translate(x + 6, y + 2); fillRR(c, -10, -6, 22, 12, 2, '#f7c928', 'rgba(0,0,0,0.3)', 0.6); fillRR(c, -11, -7, 24, 3, 1, '#f2f4f5'); c.restore(); } });
    const pamTurn = ss(1.4, 1.9, lt);
    drawPerson(ctx, PAM, P({ x: 1050, y: 1580, s: 6.1, face: -1, turn: lerp(0.5, 0.2, pamTurn), blink: B(lt, 15), mouth: pamTurn > 0.5 ? 'bigsmile' : 'smile', brow: 'soft', lookX: lerp(0.6, 0.1, pamTurn), ...idle(lt, 11),
      armF: [0.9, 1.25], armB: [0.8, 1.35] }), { holdF: (c, x, y) => { c.save(); c.translate(x - 4, y - 2); c.rotate(0.15); fillRR(c, -9, -12, 18, 24, 2, '#2a2c31'); fillRR(c, -8, -11, 16, 22, 1.5, '#3a3f48'); c.restore(); } });
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.08); vignette(ctx, 0.25);
}, 0.35);
text(35.85, 38.0, (c, lt, d) => drawNameTag(c, 'ครูปีใหม่', '', 330, 560, Math.min(inv(0, 0.35, lt), inv(d, d - 0.3, lt)), -1 * -1));
text(36.55, 38.0, (c, lt, d) => drawNameTag(c, 'ครูแพม', '', 820, 700, Math.min(inv(0, 0.35, lt), inv(d, d - 0.3, lt)), -1));

// =====================================================================
//  PART 3 — morning prep 09:00–10:00 (38.05 – 61)
// =====================================================================
// S11 wide empty classroom, Team sweeps the floor
shot(38.05, 41.9, (ctx, T, lt) => {
  const cx = track([[0, 760], [3.85, 900]], lt);
  cam(ctx, cx, 1080, 1.0, () => {
    classBase(ctx, T, {});
    const x = track([[0, 520], [3.85, 900]], lt, t => t);
    const sw = Math.sin(lt * 4.2);
    const p = P({ x, y: 1840, s: 6.6, face: 1, turn: 0.35, lean: 0.12, blink: B(lt, 16), lookY: 0.75, lookX: 0.6, mouth: 'soft', brow: 'focus', ...walkPose(lt * 0.7, 0.18), ...idle(lt, 12) });
    const bx1 = x + 150 + sw * 60, by1 = 1830;            // bristles on the floor
    const hx = x + 25 + sw * 18, hy = 1840 - 50 * 6.6;    // grip points along handle
    const t1 = [lerp(hx, bx1, 0.05), lerp(hy, by1, 0.05)], t2 = [lerp(hx, bx1, 0.32), lerp(hy, by1, 0.32)];
    p.armB = reach(TM, p, 'B', t1[0], t1[1]); p.armF = reach(TM, p, 'F', t2[0], t2[1]); p.handF = 'grip'; p.handB = 'grip';
    drawPerson(ctx, TM, p, { holdB: (c) => { c.restore(); c.save(); broom(c, hx, hy - 30, bx1, by1); c.restore(); c.save(); c.translate(p.x, p.y); c.scale(p.s, p.s); } });
    // dust puffs
    for (let i = 0; i < 4; i++) { const k = ((lt * 1.3 + i * 0.25) % 1); ell(ctx, bx1 + 40 + k * 60, by1 + 10 - k * 40, 10 + k * 18, 6 + k * 10, `rgba(200,180,150,${0.3 * (1 - k)})`); }
  }, 1700);
  gradeMorning(ctx, 0.7); gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.12); motes(ctx, T); vignette(ctx, 0.22);
}, 0.4);
text(38.25, 50.6, (c, lt, d) => drawTimeChip(c, '09:00–10:00 น.', Math.min(inv(0, 0.5, lt), inv(d, d - 0.5, lt))));

// S12 close-up: wiping the table
shot(41.9, 43.3, (ctx, T, lt) => { insWipe(ctx, lt + 0.4); gradeDaylight(ctx); }, 0.25);

// S13 placing the kit bins on the table (kneeling behind the low table)
shot(43.3, 44.45, (ctx, T, lt) => {
  cam(ctx, 470, 1250, 1.45, () => {
    const k = ss(0.05, 0.75, lt);
    const bx = lerp(520, 470, k), by = lerp(1250, 1372, k);
    const p = P({ x: 560, y: 1385, s: 6.0, face: -1, turn: 0.3, ...kneel(TM), lean: lerp(0.05, 0.25, k), blink: B(lt, 17), lookY: 0.7, lookX: 0.4, mouth: 'soft', brow: 'focus', ...idle(lt, 13) });
    p.armF = reach(TM, p, 'F', bx - 55, by - 10); p.armB = reach(TM, p, 'B', bx + 55, by - 10); p.handF = 'grip'; p.handB = 'grip';
    classBase(ctx, T, { behind: (c) => drawPerson(c, TM, p), onTables: (c) => { yellowBin(c, 290, 1316, 120, 56); yellowBin(c, bx - 70, by - 60, 140, 66); } });
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.1); vignette(ctx, 0.25);
}, 0.2);

// S14 close-up: hub light matrix + iPad, check battery
shot(44.45, 46.5, (ctx, T, lt) => {
  insDevices(ctx, lt, { bat: 0.18, charging: 0, tap: ss(0.9, 1.4, lt) });
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.2);

// S15 medium: lining tablets up at the charging strip (kneeling behind the table)
shot(46.5, 49.0, (ctx, T, lt) => {
  cam(ctx, 960, 1220, 1.6, () => {
    const reachX = track([[0, 820], [0.7, 820], [1.0, 912], [1.5, 912], [1.8, 1004], [2.5, 1004]], lt);
    const p = P({ x: 960, y: 1392, s: 6.0, face: -1, turn: 0.2, ...kneel(TM), lean: 0.22, blink: B(lt, 18), lookY: 0.8, lookX: 0.2, mouth: 'soft', brow: 'focus', ...idle(lt, 14) });
    p.armF = reach(TM, p, 'F', reachX, 1340 + Math.sin(lt * 6) * 4); p.handF = 'pinch';
    p.armB = reach(TM, p, 'B', 1080, 1395); p.handB = 'open';
    classBase(ctx, T, { behind: (c) => drawPerson(c, TM, p), onTables: (c) => { tabletsOnTable(c, 820, 1395, 3, [1, 1, 0], [lt > 0.7, lt > 1.5, lt > 2.2]); hubOnTable(c, 1120, 1395, 0.7, T, true); } });
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.2);

// S16 close-up: plug in → charging
shot(49.0, 50.6, (ctx, T, lt) => {
  insDevices(ctx, lt, { bat: 0.2 + ss(0.6, 1.6, lt) * 0.02, charging: lt > 0.75 ? 1 : 0, plug: ss(0.05, 0.75, lt), hand: 1 });
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.2);

// S17 wide: room ready — Team looks around, checks everything, small nod
shot(50.6, 52.45, (ctx, T, lt) => {
  const z = track([[0, 1.05], [1.85, 1.0]], lt);
  cam(ctx, 850, 1000, z, () => {
    classBase(ctx, T, { onTables: (c) => { yellowBin(c, 300, 1310, 140, 66); yellowBin(c, 470, 1310, 140, 66); tabletsOnTable(c, 820, 1395, 3, [0, 0, 0], [1, 1, 1]); } });
    const look = track([[0, -0.6], [0.7, 0.8], [1.3, 0.8], [1.8, 0.2]], lt);
    drawPerson(ctx, TM, P({ x: 700, y: 1880, s: 7.2, face: 1, turn: 0.2, blink: B(lt, 19), lookX: look, lookY: 0.2, mouth: 'soft', brow: 'soft', headNod: Math.sin(clamp((lt - 1.3) / 0.45) * Math.PI) * 0.6, ...idle(lt, 15) }));
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.12); motes(ctx, T); vignette(ctx, 0.22);
}, 0.3);

// S18 arranging tablets… hands slow down, a thought arrives
shot(52.45, 55.45, (ctx, T, lt) => {
  const z = track([[0, 1.7], [3, 2.1]], lt);
  cam(ctx, 940, 1150, z, () => {
    const slow = ss(1.2, 2.2, lt);
    const p = P({ x: 960, y: 1392, s: 6.0, face: -1, turn: 0.2, ...kneel(TM), lean: lerp(0.22, 0.08, slow), blink: B(lt, 20), lookY: lerp(0.8, 0.5, slow), lookX: lerp(0.2, -0.25, slow), mouth: slow > 0.5 ? 'press' : 'soft', brow: slow > 0.5 ? 'worry' : 'focus', ...idle(lt, 16) });
    p.armF = reach(TM, p, 'F', 912 + Math.sin(lt * 3) * 10 * (1 - slow), lerp(1345, 1385, slow)); p.handF = slow > 0.5 ? 'rest' : 'pinch';
    p.armB = reach(TM, p, 'B', 1040, lerp(1385, 1400, slow));
    classBase(ctx, T, { behind: (c) => drawPerson(c, TM, p), onTables: (c) => { tabletsOnTable(c, 820, 1395, 3, [0, 0, 0], [1, 1, 1]); } });
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.3 + ss(1.5, 3, lt) * 0.12);
}, 0.3);

// S19 close-up: the worry — "เราจะทำได้ดีไหม" (thought only; nothing happens around him)
shot(55.45, 60.95, (ctx, T, lt) => {
  const z = track([[0, 2.5], [5.5, 2.75]], lt);
  const [dx, dy] = drift(lt, 3, 5);
  cam(ctx, 960 + dx, 1000 + dy, z, () => {
    const p = P({ x: 960, y: 1392, s: 6.0, face: -1, turn: 0.15, ...kneel(TM), lean: 0.06, blink: B(lt, 21), lookY: track([[0, 0.5], [1.5, 0.2], [3, 0.6], [4.5, 0.35]], lt), lookX: track([[0, -0.25], [2, 0.3], [3.5, -0.4], [5, 0]], lt),
      mouth: 'worry', brow: 'worry', breathe: Math.sin(lt * 1.5) * 1.2, shoulderUp: ss(3.6, 4.0, lt) * 1.0 * (1 - ss(4.6, 5.2, lt)), ...idle(lt, 17) });
    p.armF = reach(TM, p, 'F', 905, 1388); p.handF = 'rest'; p.armB = reach(TM, p, 'B', 1040, 1398);
    classBase(ctx, T, { behind: (c) => drawPerson(c, TM, p), onTables: (c) => { tabletsOnTable(c, 820, 1395, 3, [0, 0, 0], [1, 1, 1]); } });
  }, 1700);
  gradeDaylight(ctx); ctx.fillStyle = 'rgba(60,70,110,0.10)'; ctx.fillRect(0, 0, W, H); vignette(ctx, 0.45);
}, 0.35);
text(55.75, 60.4, (c, lt, d) => drawThought(c, 'เราจะทำได้ดีไหม', 560, 330, Math.min(inv(0, 0.5, lt), inv(d, d - 0.4, lt))));

// S20 "…นี่เป็นความกังวลของผมเอง" — normal, friendly work atmosphere
shot(60.95, 67.55, (ctx, T, lt) => {
  const cx = track([[0, 820], [6.6, 900]], lt), z = track([[0, 1.12], [6.6, 1.2]], lt);
  cam(ctx, cx, 1150, z, () => {
    // Pam sets a robot on the floor mat (background right)
    const pamK = ss(0.5, 1.6, lt);
    const pamP = P({ x: 1240, y: 1640, s: 6.0, face: -1, turn: 0.35, lean: 0.35 * (1 - ss(3.0, 3.6, lt)) + 0.05, blink: B(lt, 22), mouth: 'smile', brow: 'soft', lookY: 0.6 * (1 - ss(3.0, 3.6, lt)), lookX: 0.5, ...idle(lt, 18) });
    pamP.armF = reach(PAM, pamP, 'F', 1150, lerp(1500, 1560, pamK)); pamP.armB = reach(PAM, pamP, 'B', 1180, lerp(1500, 1560, pamK));
    // Pimai walks in with a stack of activity cards, smiles and hands some to Team
    const w = walker(lt, [[0, 1500], [2.2, 960], [6.6, 960]], 6.2);
    const give = ss(2.4, 3.1, lt) * (1 - ss(4.0, 4.5, lt));
    const pm = P(Object.assign({ y: 1700, s: 6.2, turn: 0.3, blink: B(lt, 23), mouth: lt > 2.2 ? 'bigsmile' : 'smile', brow: 'soft', lookX: 0.7, ...idle(lt, 19) }, w));
    if (lt > 2.2) pm.face = -1;
    const tm = P({ x: 680, y: 1760, s: 6.5, face: 1, turn: 0.3, blink: B(lt, 24), lookX: 0.8, lookY: track([[0, 0.3], [2.0, 0.0]], lt), mouth: give > 0.4 ? 'smile' : 'soft', brow: give > 0.3 ? 'soft' : 'neutral', blush: give * 0.4, headNod: Math.sin(clamp((lt - 3.1) / 0.5) * Math.PI) * 0.6, ...idle(lt, 20) });
    const meet = [lerp(pm.x, tm.x, 0.5), 1430];
    const pmHand = lt > 2.2 ? [lerp(pm.x - 60, meet[0] + 20, give), lerp(1440, meet[1], give)] : null;
    if (pmHand) { pm.armF = reach(PM, pm, 'F', pmHand[0], pmHand[1]); }
    else { pm.armF = [0.9, 1.15]; }
    pm.armB = [0.7, 1.3];
    const tmTake = ss(2.6, 3.0, lt);
    const tmHand = [lerp(tm.x + 40, meet[0] - 20, tmTake * (1 - ss(4.0, 4.5, lt))), lerp(1460, meet[1] + 6, tmTake * (1 - ss(4.0, 4.5, lt)))];
    tm.armF = reach(TM, tm, 'F', tmHand[0], tmHand[1]); tm.armB = reach(TM, tm, 'B', tmHand[0] - 20, tmHand[1] + 10); tm.handF = 'grip';
    const cards = (c, x, y, n) => { for (let i = 0; i < n; i++) fillRR(c, x - 34 + i * 2, y - 24 - i * 3, 68, 46, 4, ['#ffffff', '#ffe9a8', '#d6ecff'][i % 3], 'rgba(0,0,0,0.25)', 1.5); };
    classBase(ctx, T, {
      behind: (c) => { drawPerson(c, PAM, pamP); spikeBot(c, 1150, lerp(1500, 1565, pamK), 0.55, '#f7d23a', T, pamK > 0.9); },
      onTables: (c) => {
        tabletsOnTable(c, 820, 1395, 3, [0, 0, 0], [1, 1, 1]);
        drawPerson(c, PM, pm, { after: () => { } });
        const ph = handPos(PM, pm, 'F'); cards(c, ph[0], ph[1], lt > 3.0 ? 2 : 4);
        drawPerson(c, TM, tm);
        if (lt > 3.0) { const th = handPos(TM, tm, 'F'); cards(c, th[0], th[1], 2); }
      }
    });
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.12); motes(ctx, T); vignette(ctx, 0.22);
}, 0.5);

// ---------- kids at the low tables ----------
// seats behind table a (x 250–650, y 1400) and table b (x 760–1160, y 1410)
const SEATS = [
  { k: 0, x: 340, y: 1388, face: 1 }, { k: 1, x: 550, y: 1388, face: -1 },
  { k: 2, x: 850, y: 1398, face: 1 }, { k: 3, x: 1060, y: 1398, face: -1 },
];
function kidPose(T, seat, act, seed, focus) {
  const kd = KIDS[seat.k];
  const p = P(Object.assign(sitFloor(kd), { x: seat.x, y: seat.y, s: 5.4, face: seat.face, turn: 0.35, blink: B(T, seed), mouth: 'smile', brow: 'neutral', ...idle(T, seed) }));
  const tx = seat.x + seat.face * 70, ty = seat.y - 4;
  if (act === 'build') {
    const a = Math.sin(T * 3.1 + seed), b = Math.sin(T * 2.7 + seed * 2);
    p.armF = reach(kd, p, 'F', tx + a * 14, ty + b * 5); p.armB = reach(kd, p, 'B', tx - 26 * seat.face + b * 10, ty + 4); p.handF = 'pinch'; p.handB = 'grip';
    p.lookY = 0.8; p.lookX = 0.4; p.mouth = Math.sin(T * 0.7 + seed) > 0.6 ? 'o' : 'soft'; p.brow = 'focus'; p.lean = 0.12;
  } else if (act === 'listen') {
    p.armF = reach(kd, p, 'F', tx - 10 * seat.face, ty + 2); p.armB = reach(kd, p, 'B', tx - 40 * seat.face, ty + 4);
    p.lookX = focus != null ? clamp((focus - seat.x) / 300 * seat.face) : 0.5; p.lookY = -0.2; p.mouth = 'smile';
  } else if (act === 'stuck') {
    p.armF = reach(kd, p, 'F', tx, ty); const J = joints(kd, p); p.armB = reach(kd, p, 'B', p.x + (J.head[0] - 4 * J.d) * p.s, p.y + (J.head[1] - 6) * p.s);
    p.lookY = 0.7; p.brow = 'worry'; p.mouth = 'worry'; p.headTilt = 0.08;
  } else if (act === 'cheer') {
    const u = Math.sin(T * 7 + seed) * 0.15; p.armF = [2.7 + u, 0.3]; p.armB = [2.6 - u, 0.4]; p.mouth = 'bigsmile'; p.brow = 'raise'; p.bob = -Math.abs(Math.sin(T * 7 + seed)) * 2; p.handF = 'open'; p.handB = 'open';
  } else if (act === 'point') {
    p.armF = [1.9, 0.1]; p.handF = 'point'; p.mouth = 'talk'; p.mouthOpen = Math.max(0, Math.sin(T * 9)) * 0.4; p.lookX = 0.8;
  }
  return p;
}
function drawKids(ctx, T, acts, focus, skip = []) {
  SEATS.forEach((seat, i) => { if (skip.includes(i)) return; drawPerson(ctx, KIDS[seat.k], kidPose(T, seat, acts[i] || 'build', 30 + i * 7, focus)); });
}
function tableModels(ctx, T, prog = 1, moving = false) {
  // half-built robots on the tables in front of each pair
  spikeBot(ctx, 450, 1385, 0.62 * (0.7 + 0.3 * prog), '#f7d23a', moving ? T : 0, prog > 0.6);
  spikeBot(ctx, 960, 1395, 0.62 * (0.7 + 0.3 * prog), '#ec5aa0', moving ? T : 0, prog > 0.6);
  tablet(ctx, 330, 1388, 70, 50, (c, x, y, w, h) => blockCodeScreen(c, x, y, w, h, prog), -0.1);
  tablet(ctx, 1110, 1398, 70, 50, (c, x, y, w, h) => blockCodeScreen(c, x, y, w, h, prog), 0.1);
  // loose parts
  [[560, 1392, '#c9ced4'], [380, 1398, '#e34b4b'], [860, 1405, '#2ab7a9'], [1040, 1404, '#c9ced4']].forEach(([x, y, c]) => fillRR(ctx, x - 22, y - 5, 44, 9, 4, c, 'rgba(0,0,0,0.2)', 1));
}

// S21 "ผมแค่ยังไม่คุ้น… ใช้เวลาปรับตัวอีกหน่อย" — a breath, shoulders loosen, back to work
shot(67.55, 72.25, (ctx, T, lt) => {
  const z = track([[0, 1.9], [4.7, 1.75]], lt);
  cam(ctx, 300, 1120, z, () => {
    classBase(ctx, T, { onTables: (c) => { yellowBin(c, 290, 1316, 120, 56); } });
    const br = ss(0.8, 1.6, lt) * (1 - ss(2.0, 2.9, lt));
    const p = P({ x: 200, y: 1760, s: 6.5, face: 1, turn: 0.35, blink: B(lt, 25), lookX: track([[0, -0.2], [1.6, 0.0], [3.2, 0.8]], lt), lookY: track([[0, 0.3], [1.0, -0.4], [2.6, -0.2], [3.4, 0.3]], lt),
      eyesClosed: br > 0.7 ? 0.9 : 0, shoulderUp: br * 1.6, breathe: Math.sin(lt * 1.4) * 1.0, mouth: lt > 3.0 ? 'smile' : 'soft', brow: lt > 3.0 ? 'soft' : 'neutral', ...idle(lt, 21) });
    // adjusts the lanyard, then picks up a kit box at 3.4s
    const adj = ss(2.8, 3.1, lt) * (1 - ss(3.6, 3.9, lt));
    const J = joints(TM, p); const card = [p.x + (J.shX + 2) * p.s, p.y + (J.shY + 4) * p.s];
    const a = reach(TM, p, 'F', card[0], card[1]); p.armF = [lerp(0.1, a[0], adj), lerp(0.2, a[1], adj)]; p.handF = 'pinch';
    drawPerson(ctx, TM, p);
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.14); motes(ctx, T); vignette(ctx, 0.25);
}, 0.4);

// =====================================================================
//  PART 4 — morning class 10:00–12:00 with ครูปีใหม่ (72.25 – 100.6)
// =====================================================================
// S22 kids arrive
shot(72.25, 75.3, (ctx, T, lt) => {
  cam(ctx, 900, 1080, 1.0, () => {
    classBase(ctx, T, { onTables: (c) => tableModels(c, T, 0) });
    [0, 1, 2, 3].forEach(i => {
      const kd = KIDS[i];
      const w = walker(lt, [[0, 1320 + i * 130], [2.4 + i * 0.15, 1080 - i * 130]], 5.2);
      const bag = (c, J) => { c.fillStyle = shade(kd.shirt, -0.35); rr(c, J.shX + 4, J.shY + 2, 10, 15, 4); c.fill(); };
      drawPerson(ctx, kd, P(Object.assign({ y: 1640 + (i % 2) * 120, s: 5.2, turn: 0.35, blink: B(lt, 40 + i), mouth: 'bigsmile', brow: 'raise', lookX: 0.6, ...idle(lt, 40 + i) }, w)), { before: bag });
    });
    // Team at the side gives a small shy wave
    const wv = ss(0.8, 1.2, lt) * (1 - ss(2.3, 2.7, lt));
    drawPerson(ctx, TM, P({ x: 560, y: 1820, s: 6.6, face: 1, turn: 0.3, blink: B(lt, 26), lookX: 0.9, mouth: wv > 0.3 ? 'smile' : 'soft', brow: 'soft', blush: wv * 0.4, armF: [lerp(0.1, 2.2, wv) + Math.sin(lt * 8) * 0.1 * wv, lerp(0.2, 0.9, wv)], handF: 'open', ...idle(lt, 22) }));
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.12); vignette(ctx, 0.22);
}, 0.4);
text(72.45, 100.4, (c, lt, d) => drawTimeChip(c, '10:00–12:00 น.', Math.min(inv(0, 0.5, lt), inv(d, d - 0.5, lt))));

// S23 ครูปีใหม่ starts the lesson
shot(75.3, 77.05, (ctx, T, lt) => {
  cam(ctx, 820, 1180, 1.25, () => {
    const pm = P({ x: 760, y: 1250, s: 5.8, face: 1, turn: 0.15, blink: B(lt, 27), mouth: 'talk', mouthOpen: Math.max(0, Math.sin(lt * 10)) * 0.45, brow: 'raise', lookX: 0.2, ...idle(lt, 23),
      armF: [lerp(0.6, 2.0, ss(0.2, 0.6, lt)), 0.5], handF: 'open', armB: [0.9, 1.2] });
    classBase(ctx, T, { behind: (c) => { drawPerson(c, PM, pm, { holdB: (cc, x, y) => { cc.save(); cc.translate(x, y); cc.rotate(0.2); fillRR(cc, -9, -12, 18, 24, 2, '#2a2c31'); fillRR(cc, -8, -11, 16, 22, 1.5, '#cfe3fb'); cc.restore(); } }); drawKids(c, T, ['listen', 'listen', 'listen', 'listen'], 760); }, onTables: (c) => tableModels(c, T, 0) });
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.22);
}, 0.3);

// S24 kids build; Team walks between the tables keeping an eye on them
shot(77.05, 80.0, (ctx, T, lt) => {
  cam(ctx, 760, 1180, 1.12, () => {
    const w = walker(lt, [[0, 1180], [2.9, 760]], 6.4);
    classBase(ctx, T, { behind: (c) => drawKids(c, T, ['build', 'build', 'build', 'listen']), onTables: (c) => {
      tableModels(c, T, 0.4);
      drawPerson(c, TM, P(Object.assign({ y: 1720, s: 6.4, turn: 0.35, blink: B(lt, 28), lookX: 0.5, lookY: 0.55, mouth: 'soft', brow: 'focus', ...idle(lt, 24) }, w, { armB: [0.4, 1.4], armF: [0.35, 1.3] })));
    } });
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.1); vignette(ctx, 0.22);
}, 0.3);

// S25 close-ups: hands building, then the tablet code
shot(80.0, 81.85, (ctx, T, lt) => { insBuild(ctx, lt + 0.2); gradeDaylight(ctx); }, 0.25);
shot(81.85, 83.6, (ctx, T, lt) => { insScreen(ctx, lt, 0.3 + ss(0, 1.6, lt) * 0.7); gradeDaylight(ctx); }, 0.25);

// S26 over ครูปีใหม่'s shoulder: she explains; Team (background) watches how she does it
shot(83.6, 86.1, (ctx, T, lt) => {
  cam(ctx, 760, 1150, 1.3, () => {
    classBase(ctx, T, { behind: (c) => {
      drawKids(c, T, ['listen', 'listen', 'point', 'listen'], 600);
      drawPerson(c, TM, P({ x: 1190, y: 1330, s: 5.4, face: -1, turn: 0.3, blink: B(lt, 29), lookX: 0.9, lookY: 0.1, mouth: 'soft', brow: 'focus', headNod: Math.sin(clamp((lt - 1.2) / 0.5) * Math.PI) * 0.4, ...idle(lt, 25), _clasp: true }));
    }, onTables: (c) => tableModels(c, T, 0.5) });
    // Pimai in the foreground (seen from behind), gesturing with a robot
    const g = Math.sin(lt * 3);
    drawPerson(ctx, PM, P({ x: 470, y: 2350, s: 10.5, backView: true, armF: [1.2 + g * 0.15, 0.9], armB: [0.7, 0.6], headTilt: Math.sin(lt * 1.5) * 0.05, noShadow: true, ...idle(lt, 26) }));
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.3);
}, 0.3);

// S27 a child is stuck — ครูปีใหม่ kneels and shows step by step; Team watches nearby
shot(86.1, 89.45, (ctx, T, lt) => {
  cam(ctx, 560, 1220, 1.45, () => {
    const solved = ss(2.2, 2.6, lt);
    const pm = P({ x: 640, y: 1392, s: 5.8, face: -1, turn: 0.3, ...kneel(PM), lean: 0.12, blink: B(lt, 30), mouth: 'talk', mouthOpen: Math.max(0, Math.sin(lt * 9)) * 0.35, brow: 'soft', lookY: 0.5, lookX: 0.5, ...idle(lt, 27) });
    pm.armF = reach(PM, pm, 'F', 470 + Math.sin(lt * 2.4) * 18, 1370); pm.handF = 'point'; pm.armB = [0.6, 1.4];
    classBase(ctx, T, { behind: (c) => {
      const kp = kidPose(T, SEATS[1], solved > 0.5 ? 'cheer' : 'stuck', 37);
      if (solved > 0.5) { kp.armF = [1.4, 0.4]; kp.armB = [1.3, 0.5]; kp.mouth = 'bigsmile'; kp.brow = 'raise'; kp.bob = 0; }
      drawPerson(c, KIDS[SEATS[1].k], Object.assign(kp, { x: 520 }));
      drawPerson(c, PM, pm);
    }, onTables: (c) => { tableModels(c, T, 0.5); if (solved > 0.5) sparkle(c, 455, 1330, 18 * Math.sin(clamp((lt - 2.3) / 0.5) * Math.PI)); } });
    // Team standing just behind, attentive
    drawPerson(ctx, TM, P({ x: 830, y: 1800, s: 6.6, face: -1, turn: 0.3, blink: B(lt, 31), lookX: 0.8, lookY: 0.55, mouth: solved > 0.5 ? 'smile' : 'soft', brow: 'focus', headNod: Math.sin(clamp((lt - 2.5) / 0.5) * Math.PI) * 0.5, _clasp: true, ...idle(lt, 28) }));
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.3);

// S28a Team close-up, thinking it over (understanding vs. explaining)
shot(89.45, 92.6, (ctx, T, lt) => {
  const z = track([[0, 2.3], [3.1, 2.45]], lt);
  cam(ctx, 900, 1240, z, () => {
    classBase(ctx, T, { onTables: (c) => tableModels(c, T, 0.6) });
    drawPerson(ctx, TM, P({ x: 900, y: 1780, s: 6.6, face: -1, turn: 0.25, blink: B(lt, 32), lookX: track([[0, 0.8], [1.4, 0.8], [2.0, 0.1]], lt), lookY: track([[0, 0.5], [1.4, 0.5], [2.0, 0.05]], lt), mouth: 'press', brow: 'focus', ...idle(lt, 29), _clasp: true }));
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.3);
}, 0.3);

// S28b Team tries explaining to a child — hands search for words, then points to the part; the child gets it
shot(92.6, 95.65, (ctx, T, lt) => {
  cam(ctx, 520, 1200, 1.55, () => {
    const got = ss(1.9, 2.3, lt);
    const tp = P({ x: 650, y: 1392, s: 5.9, face: -1, turn: 0.3, ...kneel(TM), lean: 0.1, blink: B(lt, 33), lookX: 0.6, lookY: track([[0, 0.1], [1.1, 0.6], [2.0, 0.1]], lt), mouth: got > 0.5 ? 'smile' : 'talk', mouthOpen: got > 0.5 ? 0 : Math.max(0, Math.sin(lt * 8)) * 0.3, brow: got > 0.5 ? 'soft' : 'worry', ...idle(lt, 30) });
    const search = 1 - ss(0.9, 1.2, lt);
    tp.armF = search > 0.5 ? [1.4 + Math.sin(lt * 5) * 0.25, 0.9 + Math.sin(lt * 4) * 0.2] : reach(TM, tp, 'F', 470, 1362); tp.handF = search > 0.5 ? 'open' : 'point';
    tp.armB = search > 0.5 ? [1.1 + Math.sin(lt * 5 + 1) * 0.2, 1.1] : [0.4, 1.3];
    classBase(ctx, T, { behind: (c) => {
      const kp = kidPose(T, SEATS[1], got > 0.5 ? 'listen' : 'stuck', 37); kp.x = 520; kp.lookX = 0.7;
      if (got > 0.5) { kp.mouth = 'bigsmile'; kp.brow = 'raise'; kp.headNod = Math.sin(clamp((lt - 2.2) / 0.5) * Math.PI) * 0.6; }
      drawPerson(c, KIDS[SEATS[1].k], kp); drawPerson(c, TM, tp);
    }, onTables: (c) => tableModels(c, T, 0.6) });
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.25);
}, 0.3);

// S29 "คนที่นี่ส่วนใหญ่มีพื้นฐานด้านครู…" — ครูปีใหม่ leads the whole class with ease
shot(95.65, 98.45, (ctx, T, lt) => {
  cam(ctx, 820, 1100, 1.1, () => {
    const pm = P({ x: 700, y: 1250, s: 5.8, face: 1, turn: 0.1, blink: B(lt, 34), mouth: 'talk', mouthOpen: Math.max(0, Math.sin(lt * 10)) * 0.45, brow: 'raise', lookX: 0.1, ...idle(lt, 31), armF: [1.6 + Math.sin(lt * 2) * 0.3, 0.6], armB: [1.2, 0.8], handF: 'open', handB: 'open' });
    classBase(ctx, T, { behind: (c) => { drawPerson(c, PM, pm); drawKids(c, T, ['listen', 'cheer', 'listen', 'listen'], 700); }, onTables: (c) => tableModels(c, T, 0.7) });
    drawPerson(ctx, TM, P({ x: 1170, y: 1820, s: 6.6, face: -1, turn: 0.3, blink: B(lt, 35), lookX: 0.8, lookY: 0.1, mouth: 'soft', brow: 'neutral', _clasp: true, ...idle(lt, 32) }));
  }, 1700);
  gradeDaylight(ctx); lightRays(ctx, -300, -200, -0.3, 0.1); vignette(ctx, 0.22);
}, 0.3);

// S30 "ส่วนผมเรียนวิทยาการคอมพิวเตอร์" — symbolic code insert
shot(98.45, 100.6, (ctx, T, lt) => { insCode(ctx, lt + 0.5); vignette(ctx, 0.3); }, 0.4);

// S31 "บางครั้งผมก็เลยเผลอเปรียบเทียบตัวเอง" — ครูปีใหม่ teaches with ease (left); Team watches, then looks at his own hands
shot(100.6, 103.7, (ctx, T, lt) => {
  const cx = track([[0, 800], [3.1, 980]], lt);
  cam(ctx, cx, 1150, 1.35, () => {
    const pm = P({ x: 700, y: 1250, s: 5.8, face: 1, turn: 0.15, blink: B(lt, 36), mouth: 'talk', mouthOpen: Math.max(0, Math.sin(lt * 10)) * 0.4, brow: 'raise', ...idle(lt, 33), armF: [1.5 + Math.sin(lt * 2.2) * 0.3, 0.6], handF: 'open', armB: [0.8, 1.2] });
    classBase(ctx, T, { behind: (c) => { drawPerson(c, PM, pm); drawKids(c, T, ['listen', 'listen', 'cheer', 'listen'], 700); }, onTables: (c) => tableModels(c, T, 0.75) });
    const down = ss(1.6, 2.3, lt);
    const tp = P({ x: 1170, y: 1820, s: 6.6, face: -1, turn: 0.3, blink: B(lt, 37), lookX: lerp(0.85, 0.1, down), lookY: lerp(0.1, 0.9, down), mouth: 'press', brow: down > 0.5 ? 'worry' : 'neutral', ...idle(lt, 34) });
    clasp(TM, tp); const J = joints(TM, tp); const hx = tp.x + (J.shX + 9 * J.d) * tp.s, hy = tp.y + (J.hipY - 8) * tp.s;
    if (down > 0) { const a = reach(TM, tp, 'F', hx, hy), b = reach(TM, tp, 'B', hx - 3 * tp.s * J.d, hy + 2 * tp.s); tp.armF = [lerp(tp.armF[0], a[0], down), lerp(tp.armF[1], a[1], down)]; tp.armB = [lerp(tp.armB[0], b[0], down), lerp(tp.armB[1], b[1], down)]; }
    drawPerson(ctx, TM, tp);
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.28);
}, 0.4);

// S32 "เราจะสอนเด็กได้ไหม เราจะอธิบายรู้เรื่องหรือเปล่า" — Team watching the kids, slow push in
shot(103.7, 107.45, (ctx, T, lt) => {
  const z = track([[0, 1.6], [3.75, 2.05]], lt);
  cam(ctx, 760, 1180, z, () => {
    classBase(ctx, T, { behind: (c) => drawKids(c, T, ['build', 'build', 'stuck', 'build']), onTables: (c) => {
      tableModels(c, T, 0.75);
    } });
    drawPerson(ctx, TM, P({ x: 760, y: 1900, s: 7.6, face: 1, turn: 0.15, blink: B(lt, 38), lookX: track([[0, -0.5], [1.5, 0.4], [3, 0.1]], lt), lookY: 0.55, mouth: 'worry', brow: 'worry', backView: false, breathe: Math.sin(lt * 1.5), ...idle(lt, 35), _clasp: true }));
  }, 1700);
  gradeDaylight(ctx); ctx.fillStyle = 'rgba(60,70,110,0.08)'; ctx.fillRect(0, 0, W, H); vignette(ctx, 0.4);
}, 0.3);

// S33 "หรือจริง ๆ แล้วเรายังสอนไม่เก่ง" — hands turning a beam over
shot(107.45, 110.2, (ctx, T, lt) => { insPart(ctx, lt); vignette(ctx, 0.45); }, 0.35);

// faint question marks drifting near a head (inner questions, outside quiet)
function qMarks(ctx, x, y, t, k) {
  if (k <= 0) return; ctx.save(); ctx.font = `600 70px ${FONT_T}`; ctx.textAlign = 'center';
  for (let i = 0; i < 4; i++) { const ph = (t * 0.35 + i * 0.25) % 1; const a = Math.sin(ph * Math.PI) * k * 0.75;
    ctx.globalAlpha = a; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = 'rgba(60,80,130,0.6)'; ctx.lineWidth = 6;
    const qx = x + Math.sin(i * 2.1 + t) * 90 + (i - 1.5) * 50, qy = y - ph * 160; ctx.strokeText('?', qx, qy); ctx.fillText('?', qx, qy); }
  ctx.restore();
}
function officeChair(ctx, x, y) { // y = floor
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ell(ctx, x, y + 4, 70, 12, 'rgba(0,0,0,0.2)');
  ctx.strokeStyle = '#2b2b30'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(x - 60, y); ctx.lineTo(x + 60, y); ctx.moveTo(x, y); ctx.lineTo(x, y - 130); ctx.stroke();
  fillRR(ctx, x - 70, y - 160, 140, 30, 10, '#33333a'); fillRR(ctx, x + 20, y - 400, 60, 250, 18, '#2b2b30');
}
function lunchBox(ctx, x, y) { fillRR(ctx, x - 50, y - 26, 100, 30, 6, '#f2f2ee', '#cfcfc8', 2); fillRR(ctx, x - 44, y - 22, 50, 22, 4, '#ffffff'); fillRR(ctx, x + 10, y - 22, 34, 10, 3, '#7cc36b'); fillRR(ctx, x + 10, y - 10, 34, 10, 3, '#ffd27a'); }

// S34 "คำถามพวกนี้อยู่ในหัว… ข้างนอกดูเงียบ ๆ" — calm outside, questions inside
shot(110.2, 115.6, (ctx, T, lt) => {
  const z = track([[0, 1.25], [5.4, 1.45]], lt);
  cam(ctx, 1000, 1180, z, () => {
    classBase(ctx, T, { behind: (c) => drawKids(c, T, ['build', 'point', 'build', 'build']), onTables: (c) => tableModels(c, T, 0.8) });
    drawPerson(ctx, TM, P({ x: 1240, y: 1830, s: 6.8, face: -1, turn: 0.3, blink: B(lt, 39), lookX: 0.7, lookY: 0.4, mouth: 'flat', brow: 'neutral', breathe: Math.sin(lt * 1.5), ...idle(lt, 36), _clasp: true }));
    const [hx, hy] = [1240 - 10, 1830 - 6.8 * 104];
    ctx.save(); qMarks(ctx, hx, hy, lt, ss(0.4, 1.2, lt) * (1 - ss(4.6, 5.3, lt))); ctx.restore();
  }, 1700);
  gradeDaylight(ctx); vignette(ctx, 0.3);
}, 0.35);

// =====================================================================
//  PART 5 — lunch 12:00–13:00 (115.6 – 120.35)
// =====================================================================
shot(115.6, 117.75, (ctx, T, lt) => { insLunch(ctx, lt); gradeDaylight(ctx); vignette(ctx, 0.25); }, 0.5);
shot(117.75, 120.35, (ctx, T, lt) => {
  cam(ctx, 520, 1260, 1.35, () => {
    drawSet(ctx, 'office'); officeMullions(ctx, 0);
    const drink = ss(0.1, 0.5, lt) * (1 - ss(1.1, 1.5, lt)), rest = ss(1.5, 1.9, lt);
    const p = P({ x: 560, y: 1690, s: 6.0, face: -1, turn: 0.2, hipY: -10, ...sitLegs(TM), blink: B(lt, 40), eyesClosed: rest * 0.95, lookY: -drink * 0.4, headTilt: -drink * 0.12 + rest * 0.04, mouth: rest > 0.5 ? 'smile' : 'soft', brow: 'soft', lean: -rest * 0.06, breathe: Math.sin(lt * 1.2) * 1.4, ...idle(lt, 37) });
    const J = joints(TM, p); const mouth = [p.x + (J.head[0] - 3) * p.s, p.y + (J.head[1] + 7) * p.s];
    const bottle = [lerp(470, mouth[0] - 10, drink), lerp(1405, mouth[1] + 20, drink)];
    p.armF = reach(TM, p, 'F', bottle[0], bottle[1]); p.handF = 'grip'; p.armB = reach(TM, p, 'B', 600, 1412);
    officeChair(ctx, 600, 1690); drawPerson(ctx, TM, p);
    officeDesk(ctx); lunchBox(ctx, 360, 1416);
    ctx.save(); ctx.translate(bottle[0], bottle[1] - 18); ctx.rotate(-drink * 1.6); fillRR(ctx, -14, -40, 28, 70, 8, 'rgba(200,230,255,0.85)', '#9fc6e6', 2); fillRR(ctx, -9, -50, 18, 12, 3, '#4b8ad9'); ctx.restore();
  }, 1300);
  gradeDaylight(ctx); motes(ctx, T, 18); vignette(ctx, 0.25);
}, 0.3);
text(115.8, 120.2, (c, lt, d) => drawTimeChip(c, '12:00–13:00 น.', Math.min(inv(0, 0.5, lt), inv(d, d - 0.5, lt))));

// =====================================================================
//  PART 6 — busy afternoon 13:00–18:00 (120.35 – ~147)
// =====================================================================
// afternoon light: 0 at 120s → 1 at ~146s
const AFT = T => ss(121, 147, T);
function floorBot(ctx, T, x0, x1, t0, dur) { const k = clamp((T - t0) / dur); spikeBot(ctx, lerp(x0, x1, ease.io(k)), 1789, 0.55, '#f7d23a', T, true); }

// S36 many kids, both tables + floor mat group
shot(120.35, 122.75, (ctx, T, lt) => {
  cam(ctx, 820, 1060, 1.0, () => {
    classBase(ctx, T, { behind: (c) => drawKids(c, T, ['build', 'build', 'cheer', 'build']), onTables: (c) => {
      tableModels(c, T, 0.5);
      floorBot(c, T, 440, 760, 120.6, 2.0);
      drawPerson(c, KIDS[4], P({ x: 860, y: 1840, s: 5.2, face: -1, turn: 0.3, ...sitFloor(KIDS[4]), blink: B(lt, 50), mouth: 'bigsmile', brow: 'raise', lookY: 0.4, armF: [2.4 + Math.sin(lt * 6) * 0.2, 0.3], armB: [1.0, 1.0], ...idle(lt, 50) }));
      drawPerson(c, KIDS[5], P({ x: 300, y: 1860, s: 5.2, face: 1, turn: 0.3, ...sitFloor(KIDS[5]), blink: B(lt, 51), mouth: 'o', brow: 'raise', lookX: 0.8, lookY: 0.3, armF: [1.3, 0.6], armB: [1.1, 0.8], ...idle(lt, 51) }));
    } });
  }, 1700);
  gradeDaylight(ctx); gradeAfternoon(ctx, AFT(T) * 0.5); vignette(ctx, 0.22);
}, 0.4);
text(120.55, 137.45, (c, lt, d) => drawTimeChip(c, '13:00–18:00 น.', Math.min(inv(0, 0.5, lt), inv(d, d - 0.6, lt))));

// S37 ครูแพม & ครูปีใหม่ teach together (one table each)
shot(122.75, 125.15, (ctx, T, lt) => {
  cam(ctx, 760, 1150, 1.2, () => {
    const pam = P({ x: 450, y: 1260, s: 5.8, face: 1, turn: 0.2, blink: B(lt, 52), mouth: 'talk', mouthOpen: Math.max(0, Math.sin(lt * 9)) * 0.4, brow: 'soft', lookY: 0.4, ...idle(lt, 52), armF: [1.3, 0.9 + Math.sin(lt * 3) * 0.2], armB: [0.6, 1.2], handF: 'point' });
    const pm = P({ x: 960, y: 1265, s: 5.8, face: -1, turn: 0.25, blink: B(lt, 53), mouth: 'smile', brow: 'raise', lookY: 0.45, lean: 0.12, ...idle(lt, 53), armF: [1.1, 0.8], armB: [0.9, 1.0], handF: 'open' });
    classBase(ctx, T, { behind: (c) => { drawPerson(c, PAM, pam); drawPerson(c, PM, pm); drawKids(c, T, ['listen', 'build', 'build', 'listen'], 700); }, onTables: (c) => tableModels(c, T, 0.6) });
  }, 1700);
  gradeDaylight(ctx); gradeAfternoon(ctx, AFT(T) * 0.5); vignette(ctx, 0.22);
}, 0.3);

// S38 a child raises a hand — Team notices, goes over, kneels down to look
shot(125.15, 129.05, (ctx, T, lt) => {
  const cx = track([[0, 1000], [3.9, 880]], lt);
  cam(ctx, cx, 1180, 1.3, () => {
    const arrive = ss(0.6, 2.3, lt), down = ss(2.2, 2.8, lt);
    const w = walker(lt, [[0, 1300], [0.6, 1300], [2.3, 1180]], 6.4);
    const tp = down > 0 ? P({ x: 1180, y: lerp(1720, 1500, down), s: lerp(6.4, 6.1, down), face: -1, turn: 0.3, ...kneel(TM), lean: 0.1, blink: B(lt, 54), lookX: 0.7, lookY: 0.6, mouth: 'press', brow: 'focus', ...idle(lt, 54) })
      : P(Object.assign({ y: 1720, s: 6.4, turn: 0.3, blink: B(lt, 54), lookX: 0.8, lookY: 0.2, mouth: 'press', brow: 'raise', ...idle(lt, 54) }, w));
    if (down > 0) { const kn = kneel(TM); tp.hipY = lerp(0, kn.hipY, down); tp.legF = [lerp(0, kn.legF[0], down), lerp(0, kn.legF[1], down)]; tp.legB = [lerp(0, kn.legB[0], down), lerp(0, kn.legB[1], down)]; }
    const kidHand = 1 - ss(2.0, 2.6, lt);
    classBase(ctx, T, { behind: (c) => {
      const ps = SEATS.map((st, i) => kidPose(T, st, ['build', 'build', 'listen', 'stuck'][i], 30 + i * 7));
      ps[3].armF = [lerp(1.0, 2.8, kidHand), 0.3]; ps[3].handF = 'open'; ps[3].lookX = 0.2; ps[3].mouth = kidHand > 0.5 ? 'o' : 'worry';
      SEATS.forEach((st, i) => drawPerson(c, KIDS[st.k], ps[i]));
    }, onTables: (c) => { tableModels(c, T, 0.6); drawPerson(c, TM, Object.assign(tp, { _clasp: down < 0.01 && arrive > 0.98 })); } });
  }, 1700);
  gradeDaylight(ctx); gradeAfternoon(ctx, AFT(T) * 0.6); vignette(ctx, 0.22);
}, 0.3);

// S39 "ถึงจะยังไม่ค่อยมั่นใจ ผมก็พยายามทำหน้าที่ของตัวเอง" — hand hovers, then points the fix; the child clicks it in
shot(129.05, 132.85, (ctx, T, lt) => {
  cam(ctx, 1120, 1250, 1.7, () => {
    const hover = 1 - ss(1.3, 1.7, lt), fixed = ss(2.3, 2.7, lt);
    const tp = P({ x: 1290, y: 1500, s: 6.1, face: -1, turn: 0.3, ...kneel(TM), lean: 0.18, blink: B(lt, 55), lookX: 0.6, lookY: 0.65, mouth: fixed > 0.5 ? 'smile' : 'press', brow: hover > 0.5 ? 'worry' : 'focus', ...idle(lt, 55) });
    const target = [1000, 1365];
    const hv = [1090 + Math.sin(lt * 5) * 14, 1300 + Math.sin(lt * 3.5) * 10];
    tp.armF = reach(TM, tp, 'F', lerp(target[0], hv[0], hover), lerp(target[1], hv[1], hover)); tp.handF = hover > 0.5 ? 'open' : 'point'; tp.armB = [0.5, 1.3];
    classBase(ctx, T, { behind: (c) => {
      const kp = kidPose(T, SEATS[3], fixed > 0.5 ? 'cheer' : 'build', 51);
      if (fixed > 0.5) { kp.armF = [1.5, 0.3]; kp.armB = [1.4, 0.4]; kp.bob = 0; }
      drawPerson(c, KIDS[SEATS[3].k], kp);
    }, onTables: (c) => { tableModels(c, T, 0.6 + fixed * 0.4, fixed > 0.5); drawPerson(c, TM, tp); if (fixed > 0) sparkle(c, 980, 1340, 16 * Math.sin(clamp((lt - 2.4) / 0.6) * Math.PI)); } });
  }, 1700);
  gradeDaylight(ctx); gradeAfternoon(ctx, AFT(T) * 0.6); vignette(ctx, 0.25);
}, 0.3);

// ---------- evening room helpers ----------
const LAMP = { x: 990, y: 935 };   // lamp bulb (set space) for glow
function woodChair(ctx, x, y, back = true) {
  ctx.fillStyle = '#6e4a2e'; ctx.fillRect(x - 70, y - 150, 140, 18); ctx.fillRect(x - 64, y - 132, 12, 132); ctx.fillRect(x + 52, y - 132, 12, 132);
  if (back) { ctx.fillRect(x - 64, y - 400, 12, 260); ctx.fillRect(x + 52, y - 400, 12, 260); ctx.fillRect(x - 64, y - 400, 128, 40); ctx.fillRect(x - 64, y - 300, 128, 16); }
}
// Team sitting behind the desk facing camera. o: pose overrides; hands: fn(p) to set arms
function roomScene(ctx, T, lt, o = {}) {
  drawSet(ctx, 'room');
  if (o.bagOnFloor !== false) backpackProp(ctx, o.bagX || 300, 1560, 1.3, o.bagOpen || 0);
  woodChair(ctx, 640, 1500);
  const p = P(Object.assign({ x: 640, y: 1500, s: 6.4, face: 1, turn: 0.12, sideArms: true, hipY: -10, ...sitLegs(TM), blink: B(lt, 60), lookY: 0.3, mouth: 'soft', brow: 'soft', breathe: Math.sin(lt * 1.3), ...idle(lt, 60) }, o.pose || {}));
  if (o.arms) o.arms(p);
  else { p.armF = reach(TM, p, 'F', 700, 1205); p.armB = reach(TM, p, 'B', 590, 1210); p.handF = 'rest'; p.handB = 'rest'; }
  drawPerson(ctx, TM, p);
  const on = o.lampOn ?? 1;
  roomDesk(ctx, 420, 1180); deskLamp(ctx, 920, 1160, on > 0.5);
  if (o.onDesk) o.onDesk(ctx, p);
  else { phoneProp(ctx, 840, 1170, 1.0, o.phoneLit || 0, 1.45); }
  lampGlow(ctx, LAMP.x, LAMP.y, on, 700);
  return p;
}
// memory flashback: replays an earlier moment, softened (no new events are invented)
let _mem = null;
function memory(ctx, Tsrc, k = 1, label = true) {
  if (!_mem) _mem = makeCanvas(W, H);
  const m = _mem.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.clearRect(0, 0, W, H);
  const s = SHOTS.find(sh => Tsrc >= sh.a && Tsrc < sh.b) || SHOTS[0];
  m.save(); s.draw(m, Tsrc, Tsrc - s.a, s); m.restore();
  ctx.save(); ctx.globalAlpha = k;
  ctx.filter = 'saturate(0.55) sepia(0.25) brightness(1.05) contrast(0.92)';
  ctx.drawImage(_mem, 0, 0); ctx.filter = 'none';
  // soft dreamy edges
  ctx.fillStyle = rgrad(ctx, W / 2, H / 2, H * 0.28, H * 0.72, [[0, 'rgba(255,240,215,0)'], [1, 'rgba(255,236,205,0.75)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
function gradeRoom(ctx, on = 1) { gradeNight(ctx, 760, 620, 1); if (on < 1) { ctx.fillStyle = `rgba(10,12,30,${0.45 * (1 - on)})`; ctx.fillRect(0, 0, W, H); } }

// S40 "คอยมองว่าตรงไหนต้องการความช่วยเหลือ" — Team scans the busy room
shot(132.85, 135.1, (ctx, T, lt) => {
  cam(ctx, 820, 1100, 1.05, () => {
    classBase(ctx, T, { behind: (c) => drawKids(c, T, ['build', 'cheer', 'build', 'point']), onTables: (c) => {
      tableModels(c, T, 0.8, true); floorBot(c, T, 440, 980, 132.9, 2.4);
      drawPerson(c, KIDS[4], P({ x: 560, y: 1860, s: 5.2, face: 1, turn: 0.3, ...sitFloor(KIDS[4]), blink: B(lt, 61), mouth: 'bigsmile', lookY: 0.5, lookX: 0.8, armF: [1.2, 0.6], armB: [1.0, 0.8], ...idle(lt, 61) }));
      drawPerson(c, TM, P({ x: 1260, y: 1800, s: 6.6, face: -1, turn: 0.3, blink: B(lt, 62), lookX: track([[0, 0.9], [0.8, -0.2], [1.6, 0.6]], lt), lookY: 0.35, headTilt: track([[0, 0.03], [0.8, -0.04], [1.6, 0.02]], lt), mouth: 'soft', brow: 'focus', ...idle(lt, 62), _clasp: true }));
    } });
  }, 1700);
  gradeDaylight(ctx); gradeAfternoon(ctx, AFT(T) * 0.7); vignette(ctx, 0.22);
}, 0.3);

// S41 "แล้วเรียนรู้จากสิ่งที่คุณครูทำไปด้วย" — ครูแพม with the little ones (Duplo room); Team watches & learns
shot(135.1, 137.4, (ctx, T, lt) => {
  cam(ctx, 700, 1330, 1.25, () => {
    drawSet(ctx, 'duplo'); foamMat(ctx, 200, 1460, 900, 460);
    const kid = KIDS[4];
    const kp = P({ x: 560, y: 1660, s: 4.4, face: 1, turn: 0.3, ...sitFloor(kid), blink: B(lt, 63), mouth: 'bigsmile', brow: 'raise', lookY: 0.6, lookX: 0.6, ...idle(lt, 63) });
    const bk = ss(0.6, 1.4, lt);
    kp.armF = reach(kid, kp, 'F', lerp(600, 650, bk), lerp(1610, 1640, bk)); kp.handF = 'grip';
    const pp = P({ x: 760, y: 1700, s: 5.8, face: -1, turn: 0.3, ...kneel(PAM), lean: 0.15, blink: B(lt, 64), mouth: 'talk', mouthOpen: Math.max(0, Math.sin(lt * 8)) * 0.35, brow: 'soft', lookY: 0.6, lookX: 0.5, ...idle(lt, 64) });
    pp.armF = reach(PAM, pp, 'F', 660, 1640); pp.handF = 'point'; pp.armB = [0.6, 1.3];
    drawPerson(ctx, kid, kp); fillRR(ctx, lerp(585, 635, bk), lerp(1595, 1625, bk), 40, 26, 4, '#e34b4b', 'rgba(0,0,0,0.25)', 2);
    fillRR(ctx, 620, 1640, 60, 30, 4, '#4b8ad9', 'rgba(0,0,0,0.25)', 2); fillRR(ctx, 660, 1660, 50, 28, 4, '#ffd23f', 'rgba(0,0,0,0.25)', 2);
    drawPerson(ctx, PAM, pp);
    drawPerson(ctx, TM, P({ x: 1060, y: 1880, s: 6.8, face: -1, turn: 0.3, blink: B(lt, 65), lookX: 0.8, lookY: 0.6, mouth: 'smile', brow: 'soft', headNod: Math.sin(clamp((lt - 1.3) / 0.5) * Math.PI) * 0.5, ...idle(lt, 65), _clasp: true }));
  }, 1300);
  gradeDaylight(ctx); gradeAfternoon(ctx, AFT(T) * 0.8); vignette(ctx, 0.22);
}, 0.35);

// S42 "จนถึงเวลา 6 โมงเย็นครับ" — golden light; robot finishes its run, kids cheer & wave goodbye
shot(137.4, 140.0, (ctx, T, lt) => {
  cam(ctx, 820, 1100, 1.05, () => {
    const bye = ss(1.4, 1.8, lt);
    classBase(ctx, T, { behind: (c) => drawKids(c, T, bye > 0.5 ? ['cheer', 'cheer', 'cheer', 'cheer'] : ['listen', 'cheer', 'listen', 'cheer']), onTables: (c) => {
      tableModels(c, T, 1); floorBot(c, T, 700, 990, 137.4, 1.2);
      const wv = bye * (1 - ss(2.3, 2.6, lt));
      drawPerson(c, TM, P({ x: 1260, y: 1800, s: 6.6, face: -1, turn: 0.3, blink: B(lt, 66), lookX: 0.8, lookY: 0.2, mouth: 'smile', brow: 'soft', armF: [lerp(0.1, 2.4, wv) + Math.sin(lt * 8) * 0.12 * wv, lerp(0.2, 0.8, wv)], handF: 'open', ...idle(lt, 66) }));
    } });
  }, 1700);
  gradeDaylight(ctx); gradeAfternoon(ctx, Math.max(AFT(T), ss(137.4, 139.5, T))); vignette(ctx, 0.25);
}, 0.3);
text(137.6, 140.0, (c, lt, d) => drawTimeChip(c, '18:00 น.', Math.min(inv(0, 0.4, lt), inv(d, d - 0.4, lt))));

// =====================================================================
//  PART 7 — back in the room, replaying the day (140.0 – ~172)
// =====================================================================
// S43a dusk at the shop front — Team heads home
shot(140.0, 141.55, (ctx, T, lt) => {
  cam(ctx, 760, 1150, 1.0, () => {
    drawSet(ctx, 'storefront');
    const w = walker(lt, [[0, 820], [1.55, 380]], 6.5);
    drawPerson(ctx, TM, P(Object.assign({ y: 1800, s: 6.5, turn: 0.35, bag: true, blink: B(lt, 67), mouth: 'soft', brow: 'soft', lookX: 0.5 }, w)));
  }, 1900);
  gradeAfternoon(ctx, 1); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(120,100,170,0.35)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  // shop window lights glowing at dusk
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgrad(ctx, 900, 1200, 50, 600, [[0, 'rgba(255,220,150,0.35)'], [1, 'rgba(0,0,0,0)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
  vignette(ctx, 0.35);
}, 0.5);

// S43b the room: bag down, sit, switch on the lamp
shot(141.55, 144.0, (ctx, T, lt) => {
  const on = ss(1.55, 1.75, lt);
  cam(ctx, 720, 1180, 1.15, () => {
    const sit = ss(0.3, 1.2, lt);
    roomScene(ctx, T, lt, { lampOn: on, bagX: lerp(560, 300, ss(0, 0.6, lt)), pose: { hipY: lerp(0, -10, sit), legF: [lerp(0, 1.45, sit), lerp(0, -1.45, sit)], legB: [lerp(0, 1.35, sit), lerp(0, -1.38, sit)], lookX: 0.6, lookY: 0.2, brow: 'soft', mouth: 'flat' },
      arms: (p) => { if (lt < 1.4) { p.armF = [0.1, 0.3]; p.armB = [0.1, 0.3]; } else { const sw = reach(TM, p, 'F', 905, 1150); p.armF = [lerp(0.1, sw[0], ss(1.3, 1.55, lt) * (1 - ss(1.9, 2.2, lt))), lerp(0.3, sw[1], ss(1.3, 1.55, lt) * (1 - ss(1.9, 2.2, lt)))]; p.handF = 'point'; p.armB = reach(TM, p, 'B', 590, 1210); } } });
  }, 1300);
  gradeRoom(ctx, on); vignette(ctx, 0.35);
}, 0.6);

// S44 lamp-lit close-up: "วันนี้เราช่วยงานดี ๆ หรือยัง"
shot(144.0, 147.35, (ctx, T, lt) => {
  const z = track([[0, 2.2], [3.35, 2.35]], lt);
  cam(ctx, 650, 1020, z, () => {
    roomScene(ctx, T, lt, { pose: { lookY: track([[0, 0.5], [1.6, 0.6], [2.4, 0.1]], lt), lookX: track([[0, -0.2], [2.4, 0.3]], lt), brow: 'worry', mouth: 'press', turn: 0.1 } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.4);
}, 0.35);

// S45 memory: the moment he almost asked (from 28.4 s) — "เราเงียบเกินไปไหม"
shot(147.35, 149.05, (ctx, T, lt) => { memory(ctx, 28.2 + lt * 0.9, 1); }, 0.35);
// S46 memory: standing apart while the teachers chatted (from 23.6 s) — "ทำงานร่วมกับคนอื่นได้ไม่ดีหรือเปล่า"
shot(149.05, 151.75, (ctx, T, lt) => { memory(ctx, 23.4 + lt * 0.9, 1); }, 0.35);

// S47 mirror: "บางทีก็ไม่แน่ใจว่าเป็นเพราะเราไม่กล้าแสดงออก"
shot(151.75, 155.05, (ctx, T, lt) => {
  const z = track([[0, 1.55], [3.3, 1.7]], lt);
  cam(ctx, 1080, 860, z, () => {
    drawSet(ctx, 'room');
    // reflection inside the mirror (1050..1250 x 310..850)
    ctx.save(); rr(ctx, 1050, 310, 200, 540, 6); ctx.clip();
    drawPerson(ctx, TM, P({ x: 1150, y: 1300, s: 5.6, face: -1, turn: 0.12, blink: B(lt, 68), lookX: 0.15, lookY: track([[0, 0.1], [1.6, 0.4], [2.6, 0.0]], lt), brow: 'worry', mouth: 'press', breathe: Math.sin(lt * 1.3), ...idle(lt, 68) }));
    ctx.fillStyle = 'rgba(150,175,200,0.25)'; ctx.fillRect(1050, 310, 200, 540);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.moveTo(1070, 330); ctx.lineTo(1130, 330); ctx.lineTo(1070, 470); ctx.closePath(); ctx.fill();
    ctx.restore();
    lampGlow(ctx, LAMP.x, LAMP.y, 0.8, 700);
    drawPerson(ctx, TM, P({ x: 930, y: 1560, s: 7.6, backView: true, headTilt: -0.03, breathe: Math.sin(lt * 1.3), noShadow: true, armF: [0.1, 0.15], armB: [0.1, 0.15] }));
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.45);
}, 0.4);

// S48 memory: the shy wai at the door (18.6 s) — "หรือแค่ยังไม่สนิทกับใคร เลยทำตัวไม่ค่อยถูก"
shot(155.05, 158.3, (ctx, T, lt) => { memory(ctx, 17.9 + lt * 0.8, 1); }, 0.4);

// S49 hands on the desk — fingers tap slowly, then rest
shot(158.3, 160.45, (ctx, T, lt) => {
  cam(ctx, 650, 1160, 3.0, () => {
    roomScene(ctx, T, lt, { pose: { lookY: 0.8, brow: 'soft', mouth: 'flat' }, arms: (p) => {
      const tap = (1 - ss(1.2, 1.8, lt)) * Math.max(0, Math.sin(lt * 7)) * 8;
      p.armF = reach(TM, p, 'F', 700, 1203 - tap); p.armB = reach(TM, p, 'B', 600, 1208); p.handF = 'rest'; p.handB = 'rest';
    } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.45);
}, 0.4);

// S50 "แต่ก็อยากลองให้เวลากับตัวเอง" — leans back, long breath out, looks to the window
shot(160.45, 162.75, (ctx, T, lt) => {
  const z = track([[0, 1.9], [2.3, 1.8]], lt);
  cam(ctx, 600, 1020, z, () => {
    const back = ss(0.2, 1.0, lt);
    roomScene(ctx, T, lt, { pose: { lean: -back * 0.12, lookX: lerp(0, -0.9, back), lookY: lerp(0.4, -0.35, back), shoulderUp: Math.sin(clamp((lt - 0.3) / 1.4) * Math.PI) * 1.6, eyesClosed: ss(0.9, 1.1, lt) * (1 - ss(1.5, 1.7, lt)), mouth: back > 0.6 ? 'soft' : 'o', brow: 'soft', turn: -0.15 },
      arms: (p) => { p.armF = reach(TM, p, 'F', 690, 1210); p.armB = reach(TM, p, 'B', 590, 1215); p.handF = 'rest'; p.handB = 'rest'; } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.4);
}, 0.4);

// S51 wide room — new place, so much to learn (calm, slow drift)
shot(162.75, 167.0, (ctx, T, lt) => {
  const cx = track([[0, 560], [4.25, 680]], lt);
  cam(ctx, cx, 1060, 1.05, () => {
    roomScene(ctx, T, lt, { pose: { lookX: -0.6, lookY: -0.2, brow: 'soft', mouth: 'soft', turn: -0.1 } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.35);
}, 0.5);

// S52 memory: ครูปีใหม่ helping the stuck child (87.4 s) — "โดยเฉพาะเรื่องการสอน และการทำงานร่วมกับคนอื่น"
shot(167.0, 170.1, (ctx, T, lt) => { memory(ctx, 86.9 + lt * 0.8, 1); }, 0.4);

// S53 close-up: "วันนี้ผมอาจยังพูดน้อย ยังกลัวทำผิด และก็ยังกลับมาคิดมากอยู่"
shot(170.1, 175.3, (ctx, T, lt) => {
  const z = track([[0, 2.2], [5.2, 2.5]], lt);
  cam(ctx, 650, 1010, z, () => {
    roomScene(ctx, T, lt, { pose: { lookY: track([[0, 0.3], [2.0, 0.6], [3.4, 0.6], [4.6, 0.0]], lt), lookX: track([[0, 0.2], [3, -0.2], [4.6, 0.1]], lt), eyesClosed: ss(2.6, 2.9, lt) * (1 - ss(3.5, 3.9, lt)), brow: lt > 4.2 ? 'soft' : 'worry', mouth: lt > 4.4 ? 'soft' : 'press', shoulderUp: Math.sin(clamp((lt - 4.0) / 1.2) * Math.PI) * 1.5, turn: 0.08 } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.42);
}, 0.4);

// warm memory (things he DID do) — brighter, gentle frame
function memoryWarm(ctx, Tsrc, k = 1) {
  if (!_mem) _mem = makeCanvas(W, H);
  const m = _mem.getContext('2d'); m.setTransform(1, 0, 0, 1, 0, 0); m.globalAlpha = 1; m.clearRect(0, 0, W, H);
  const s = SHOTS.find(sh => Tsrc >= sh.a && Tsrc < sh.b) || SHOTS[0];
  m.save(); s.draw(m, Tsrc, Tsrc - s.a, s); m.restore();
  ctx.save(); ctx.fillStyle = '#2a1c14'; ctx.fillRect(0, 0, W, H);
  ctx.filter = 'saturate(0.95) brightness(1.06)'; ctx.drawImage(_mem, 0, 0); ctx.filter = 'none';
  ctx.fillStyle = rgrad(ctx, W / 2, H / 2, H * 0.32, H * 0.75, [[0, 'rgba(255,220,160,0)'], [1, 'rgba(255,205,140,0.55)']]); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
// S54 montage of what he did today
shot(175.3, 176.45, (ctx, T, lt) => { memoryWarm(ctx, 16.3 + lt * 0.8); }, 0.45);     // ได้ไปทำงาน
shot(176.45, 177.6, (ctx, T, lt) => { memoryWarm(ctx, 39.4 + lt); }, 0.25);            // ได้ช่วยเตรียมห้อง
shot(177.6, 178.65, (ctx, T, lt) => { memoryWarm(ctx, 131.0 + lt); }, 0.25);           // ช่วยดูแลเด็ก
shot(178.65, 179.85, (ctx, T, lt) => { memoryWarm(ctx, 87.4 + lt); }, 0.25);           // เรียนรู้จากครูปีใหม่
shot(179.85, 181.1, (ctx, T, lt) => { memoryWarm(ctx, 135.9 + lt); }, 0.25);           // …กับครูแพม

// S55 "สิ่งเหล่านี้ก็เป็นประสบการณ์ของผมเหมือนกัน" — the face softens, a small smile
shot(181.1, 183.75, (ctx, T, lt) => {
  const z = track([[0, 2.3], [2.65, 2.2]], lt);
  cam(ctx, 650, 1010, z, () => {
    const sm = ss(0.6, 1.4, lt);
    roomScene(ctx, T, lt, { pose: { lookY: lerp(0.4, 0.05, sm), lookX: 0.1, brow: 'soft', mouth: sm > 0.5 ? 'smile' : 'soft', blush: sm * 0.3, turn: 0.08, headNod: Math.sin(clamp((lt - 1.5) / 0.6) * Math.PI) * 0.4 } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.35);
}, 0.45);

// S56 "วันต่อไป ผมอยากลองเริ่มจากเรื่องเล็ก ๆ" — opens the notebook, picks up a pen
shot(183.75, 187.05, (ctx, T, lt) => {
  cam(ctx, 690, 1080, 1.9, () => {
    const open = ss(0.6, 1.5, lt), pen = ss(1.8, 2.5, lt);
    roomScene(ctx, T, lt, { pose: { lookY: 0.75, lookX: 0.2, brow: 'focus', mouth: 'soft', lean: 0.05 },
      arms: (p) => { p.armB = reach(TM, p, 'B', lerp(600, 560, open), 1200); p.armF = reach(TM, p, 'F', lerp(700, 760, pen), lerp(1205, 1195, pen)); p.handF = pen > 0.5 ? 'pinch' : 'rest'; p.handB = 'rest'; },
      onDesk: (c, p) => {
        phoneProp(c, 880, 1170, 1.0, 0, 1.45);
        // notebook opening (cover swings)
        c.save(); c.translate(650, 1185); fillRR(c, -70, -18, 140, 30, 4, '#fbf8f0', '#d9cfbd', 2);
        const cw = 70 * (1 - open * 2); c.fillStyle = '#4b6fa8'; c.fillRect(open < 0.5 ? 0 : -70, -18, open < 0.5 ? 70 * (1 - open * 2) : 70 * (open * 2 - 1), 30); c.restore();
        if (pen > 0.5) { const hp = handPos(TM, p, 'F'); c.save(); c.translate(hp[0], hp[1]); c.rotate(-0.8); c.fillStyle = '#2b4f8c'; c.fillRect(-4, -36, 8, 44); c.restore(); }
        else { c.save(); c.translate(760, 1192); c.rotate(0.3); c.fillStyle = '#2b4f8c'; c.fillRect(-22, -3, 44, 6); c.restore(); }
      } });
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.35);
}, 0.4);

// =====================================================================
//  PART 8 — small steps for tomorrow (187 – end)
// =====================================================================
// S57 notebook: intentions for the next day (not yet done)
shot(187.05, 194.95, (ctx, T, lt) => {
  const z = track([[0, 1.0], [7.9, 1.1]], lt);
  ctx.save(); ctx.translate(W / 2, H * 0.45); ctx.scale(z, z); ctx.translate(-W / 2, -H * 0.45);
  insNotebook(ctx, lt, [
    { text: 'ไม่เข้าใจ ลองถาม', start: 0.15, dur: 1.4, underline: '#f2784b' },
    { text: 'ค่อย ๆ กล้าทีละนิด', start: 4.35, dur: 2.0, underline: '#5aa9e6', dy: 30 },
  ], { header: 'สำหรับวันพรุ่งนี้' });
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,225,190,0.25)'; ctx.fillRect(0, 0, W, H); ctx.restore();
  vignette(ctx, 0.35);
}, 0.4);

// S58 packing the bag for tomorrow — notebook in, zip, bag set by the chair; face a little lighter
shot(194.95, 201.25, (ctx, T, lt) => {
  const cx = track([[0, 520], [6.3, 600]], lt), z = track([[0, 1.45], [6.3, 1.35]], lt);
  cam(ctx, cx, 1180, z, () => {
    drawSet(ctx, 'room');
    roomDesk(ctx, 420, 1180); deskLamp(ctx, 920, 1160, 1); phoneProp(ctx, 880, 1170, 1.0, ss(4.6, 4.8, lt) * (1 - ss(5.6, 5.9, lt)), 1.45);
    // kneeling by the backpack on the floor
    const put = ss(0.4, 1.5, lt), zip = ss(1.8, 3.0, lt), stand = ss(3.6, 4.4, lt);
    const bagX = 330, bagY = 1600;
    const p = P({ x: 470, y: lerp(1610, 1640, stand), s: 6.6, face: -1, turn: 0.3, ...(stand < 1 ? kneel(TM) : {}), blink: B(lt, 70), lookX: stand > 0.5 ? 0.6 : 0.5, lookY: stand > 0.5 ? 0.3 : 0.7, mouth: stand > 0.5 ? 'smile' : 'soft', brow: 'soft', lean: 0.1 * (1 - stand), ...idle(lt, 70) });
    if (stand > 0) { const kn = kneel(TM); p.hipY = lerp(kn.hipY, 0, stand); p.legF = [lerp(kn.legF[0], 0, stand), lerp(kn.legF[1], 0, stand)]; p.legB = [lerp(kn.legB[0], 0, stand), lerp(kn.legB[1], 0, stand)]; }
    if (stand < 0.5) {
      const nb = [lerp(470, bagX, put), lerp(1420, 1460, put)];
      const zx = bagX + Math.sin(zip * Math.PI) * 40 - 40 * (1 - zip);
      p.armF = reach(TM, p, 'F', zip > 0 ? zx : nb[0], zip > 0 ? 1468 : nb[1]); p.handF = 'pinch';
      p.armB = reach(TM, p, 'B', bagX + 50, 1500); p.handB = 'grip';
    } else { p._clasp = true; }
    backpackProp(ctx, bagX, bagY, 1.3, (1 - zip) * (put > 0 ? 1 : 0.4));
    if (put < 1) { ctx.save(); const nb = [lerp(470, bagX, put), lerp(1420, 1460, put)]; ctx.translate(nb[0], nb[1]); ctx.rotate(-0.4 - put * 0.6); fillRR(ctx, -26, -34, 52, 68, 4, '#4b6fa8', '#2f4a78', 2); ctx.restore(); }
    drawPerson(ctx, TM, p);
    lampGlow(ctx, LAMP.x, LAMP.y, 1, 700);
  }, 1300);
  gradeRoom(ctx); vignette(ctx, 0.35);
}, 0.45);

// S59 ending — by the window, relaxed; camera eases back; end titles
shot(201.25, DURATION + 0.5, (ctx, T, lt) => {
  const z = track([[0, 1.7], [7.9, 1.25]], lt, ease.sine), cy = track([[0, 820], [7.9, 900]], lt);
  cam(ctx, 380, cy, z, () => {
    drawSet(ctx, 'room');
    // a few window lights twinkle
    for (let i = 0; i < 6; i++) { const on = Math.sin(T * 0.8 + i * 1.7) > 0.3; if (on) ell(ctx, 160 + i * 60, 720 - (i % 3) * 30, 5, 5, 'rgba(255,220,140,0.9)'); }
    roomDesk(ctx, 420, 1180); deskLamp(ctx, 920, 1160, 1);
    backpackProp(ctx, 760, 1600, 1.3, 0);
    const turn = ss(2.2, 3.4, lt);
    drawPerson(ctx, TM, P({ x: 380, y: 1640, s: 6.8, face: -1, turn: lerp(0.6, 0.2, turn), blink: B(lt, 71), lookX: lerp(0.9, 0.2, turn), lookY: lerp(-0.6, -0.1, turn), mouth: turn > 0.5 ? 'smile' : 'soft', brow: 'soft', breathe: Math.sin(lt * 1.2) * 1.2, shoulderUp: Math.sin(clamp((lt - 0.4) / 1.6) * Math.PI) * 1.4, ...idle(lt, 71), _clasp: true }));
    lampGlow(ctx, LAMP.x, LAMP.y, 1, 700);
  }, 1300);
  gradeRoom(ctx); ctx.fillStyle = 'rgba(10,10,25,0.25)'; ctx.fillRect(0, 0, W, 900); vignette(ctx, 0.4);
  // final fade
  const f = ss(DURATION - 0.55, DURATION, T); if (f > 0) { ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); }
}, 0.6);
text(202.9, DURATION + 1, (c, lt, d, T) => { const out = ss(DURATION - 0.55, DURATION, T); c.globalAlpha = 1 - out; drawEndCard(c, inv(0, 0.9, lt), inv(3.4, 4.3, lt)); });
