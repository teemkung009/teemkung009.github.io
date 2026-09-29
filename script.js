// ==========================================
// 🎨 Auto Inject FX Styles (CSS Effects)
// ==========================================
(function injectFxStyles() {
  if (document.getElementById('fx-styles')) return;
  const style = document.createElement('style');
  style.id = 'fx-styles';
  style.textContent = `
    @keyframes ripple-fx {
      to { transform: scale(4); opacity: 0; }
    }
    .st, .card {
      transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease !important;
    }
    .st:hover, .card:hover {
      transform: translateY(-3px) !important;
      box-shadow: 0 6px 16px rgba(0,0,0,0.12) !important;
    }
    .av {
      overflow: hidden !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }
    .av img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    button {
      position: relative;
      overflow: hidden;
      transition: transform 0.1s ease, background-color 0.2s ease, box-shadow 0.2s ease !important;
    }
    button:active {
      transform: scale(0.95) !important;
    }
    #toast {
      transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    }
    .bw i {
      transition: height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
    }
  `;
  document.head.appendChild(style);
})();

// ==========================================
// ⚙️ State & Global Variables
// ==========================================
let isAdmin = true;
let canWrite = true;
let db = null;
let dl = null;
let C = {};
let A = {};
let cur = null;
let tab = 'check';
let date = today();
let month = today().slice(0, 7);
let q = '';
let edSt = null;
let tempImg = null;

const $ = id => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 9);
const LK = 'clickrobot-v2';

function today() {
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

const esc = s => String(s).replace(/[&<>"']/g, m => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[m]));

const say = t => {
  const toast = $('toast');
  if (!toast) return;
  toast.textContent = t;
  toast.style.transform = 'translateY(0) scale(1)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.textContent = '';
  }, 2800);
};

const fd = d => new Date(d + 'T00:00').toLocaleDateString('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: '2-digit'
});

const classes = () => Object.entries(C)
  .map(([id, v]) => ({ id, ...v }))
  .sort((a, b) => a.name.localeCompare(b.name, 'th'));

const cls = () => C[cur] ? { id: cur, ...C[cur] } : null;
const marks = () => (A[date + '_' + cur] || {}).marks || {};
const sessions = c => Object.values(A)
  .filter(a => a.classId === c && a.marks && Object.keys(a.marks).length)
  .sort((x, y) => y.date.localeCompare(x.date));

let lastPop = null;
let animKey = '';
let wasAll = false;

// 🖼️ Helper: Compress image to Base64
function compressImg(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const max = 180;
        let w = img.width, h = img.height;
        if (w > h) {
          if (w > max) { h = Math.round(h * max / w); w = max; }
        } else {
          if (h > max) { w = Math.round(w * max / h); h = max; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ==========================================
// 🎆 FX 1: Advanced Confetti System
// ==========================================
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas');
  cv.id = 'confetti';
  cv.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  document.body.appendChild(cv);

  const x = cv.getContext('2d');
  const W = cv.width = window.innerWidth;
  const H = cv.height = window.innerHeight;
  const cols = ['#FFC400', '#12B76A', '#7C5CFF', '#F04438', '#2E90FA', '#FF6B9D'];

  beep('p');
  setTimeout(() => beep('p'), 120);

  const ps = Array.from({ length: 130 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 180,
    y: H * 0.4,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 13 - 4,
    s: 6 + Math.random() * 7,
    c: cols[Math.floor(Math.random() * cols.length)],
    r: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.25,
    shape: Math.random() > 0.4 ? 'rect' : 'circle',
    opacity: 1
  }));

  let f = 0;
  (function animate() {
    x.clearRect(0, 0, W, H);
    ps.forEach(p => {
      p.vy += 0.26;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (f > 75) p.opacity -= 0.02;

      x.save();
      x.globalAlpha = Math.max(0, p.opacity);
      x.translate(p.x, p.y);
      x.rotate(p.r);
      x.fillStyle = p.c;

      if (p.shape === 'rect') {
        x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      } else {
        x.beginPath();
        x.arc(0, 0, p.s / 2, 0, Math.PI * 2);
        x.fill();
      }
      x.restore();
    });

    if (++f < 125) requestAnimationFrame(animate);
    else cv.remove();
  })();

  say('เยี่ยมเลย! มาครบทุกคนเลย 🎉');
}

// ==========================================
// 🔊 FX 2: Multi-tone Sound System
// ==========================================
let sound = true;
let accent = '#FFC400';
let AC = null;

function beep(k) {
  if (!sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const now = AC.currentTime;
    const o = AC.createOscillator();
    const g = AC.createGain();

    if (k === 'p') {
      o.type = 'sine';
      o.frequency.setValueAtTime(523.25, now);
      o.frequency.exponentialRampToValueAtTime(659.25, now + 0.08);
      g.gain.setValueAtTime(0.15, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    } else if (k === 'l') {
      o.type = 'triangle';
      o.frequency.setValueAtTime(440, now);
      g.gain.setValueAtTime(0.12, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else if (k === 'a') {
      o.type = 'sine';
      o.frequency.setValueAtTime(220, now);
      o.frequency.exponentialRampToValueAtTime(160, now + 0.12);
      g.gain.setValueAtTime(0.18, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    } else {
      o.type = 'sine';
      o.frequency.setValueAtTime(580, now);
      g.gain.setValueAtTime(0.06, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    }

    o.connect(g);
    g.connect(AC.destination);
    o.start(now);
    o.stop(now + 0.22);
  } catch (e) {}
}

// ==========================================
// 💧 FX 3: Ripple Click Effect
// ==========================================
function createRipple(e) {
  const btn = e.target.closest('button, .av');
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const circle = document.createElement('span');
  const diameter = Math.max(rect.width, rect.height);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - rect.left - radius}px`;
  circle.style.top = `${e.clientY - rect.top - radius}px`;
  circle.style.position = 'absolute';
  circle.style.borderRadius = '50%';
  circle.style.transform = 'scale(0)';
  circle.style.animation = 'ripple-fx 0.45s linear';
  circle.style.backgroundColor = 'rgba(255, 255, 255, 0.38)';
  circle.style.pointerEvents = 'none';

  const oldRipple = btn.querySelector('.ripple-fx');
  if (oldRipple) oldRipple.remove();

  if (getComputedStyle(btn).position === 'static') {
    btn.style.position = 'relative';
  }
  btn.style.overflow = 'hidden';
  circle.className = 'ripple-fx';
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 450);
}

document.addEventListener('click', createRipple);

// ==========================================
// ⚡ Logic & View Controller
// ==========================================
function fx(c) {
  const k = tab + cur + date + month;
  const fresh = k !== animKey;
  $('v').classList.toggle('anim', fresh);
  animKey = k;

  if (lastPop) {
    const b = document.querySelector(`.seg[data-id="${lastPop.id}"] .${lastPop.k}.on`);
    if (b) b.classList.add('pop');
    lastPop = null;
  }

  if (tab === 'dash' && fresh) {
    document.querySelectorAll('.kpi b').forEach(el => {
      const t = parseInt(el.textContent, 10);
      const suf = el.textContent.replace(/[0-9]/g, '');
      let n = 0;
      const step = Math.max(1, Math.ceil(t / 25));
      const iv = setInterval(() => {
        n = Math.min(t, n + step);
        el.textContent = n + suf;
        if (n >= t) clearInterval(iv);
      }, 25);
    });
  }

  if (tab === 'check') {
    const st = c.students || [];
    const m = marks();
    const all = st.length > 0 && st.every(s => m[s.id] === 'p');
    if (all && !wasAll && !fresh) confetti();
    wasAll = all;
  }
}

$('tg').onclick = () => {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  r.dataset.theme = dark ? 'light' : 'dark';
  $('tg').textContent = dark ? '🌙' : '☀️';
  beep('click');
};

function savePrefs() {
  try {
    localStorage.setItem('cr-prefs', JSON.stringify({ ac: accent, snd: sound }));
  } catch (e) {}
}

function setAccent(a) {
  accent = a;
  const r = document.documentElement.style;
  r.setProperty('--brand', a);
  r.setProperty('--onbrand', a === '#FFC400' ? '#1B2140' : '#fff');
}

try {
  const P = JSON.parse(localStorage.getItem('cr-prefs') || '{}');
  if (P.ac) setAccent(P.ac);
  if (P.snd === false) sound = false;
} catch (e) {}

function streak(cid, sid) {
  let n = 0;
  for (const a of sessions(cid)) {
    const k = a.marks[sid];
    if (k === 'p' || k === 'l') n++;
    else break;
  }
  return n;
}

async function saveFile(fn, data) {
  if (dl) {
    await dl.save({ filename: fn, data });
    return;
  }
  const u = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  const l = document.createElement('a');
  l.href = u;
  l.download = fn;
  document.body.appendChild(l);
  l.click();
  l.remove();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}

function restore(f) {
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || typeof d.C !== 'object' || typeof d.A !== 'object') throw new Error();
      C = d.C;
      A = d.A;
      cur = null;
      saveLocal();
      render();
      say('นำเข้าข้อมูลเรียบร้อยแล้ว ✅');
    } catch (e) {
      say('รูปแบบไฟล์ไม่ถูกต้อง');
    }
  };
  r.readAsText(f);
}

function edForm(c) {
  const s = (c.students || []).find(x => x.id === edSt);
  if (!s) {
    edSt = null;
    return '';
  }
  const imgSrc = tempImg !== null ? tempImg : s.img;

  return `<div class="edit">
    <div class="sub" style="margin:0">แก้ไขข้อมูลนักเรียน</div>
    <div style="display:flex;align-items:center;gap:12px;margin:8px 0;">
      <div class="av" id="imgPrev" style="width:52px;height:52px;font-size:22px;flex-shrink:0;cursor:pointer;background:var(--brand);color:var(--onbrand);" onclick="document.getElementById('eimg').click()">
        ${imgSrc ? `<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover;">` : esc([...s.name][0])}
      </div>
      <div>
        <button type="button" class="ghost" style="padding:6px 10px;font-size:12px;" onclick="document.getElementById('eimg').click()">📷 เปลี่ยนรูปถ่าย</button>
        <input type="file" id="eimg" accept="image/*" hidden>
      </div>
    </div>
    <input id="en" value="${esc(s.name)}" placeholder="ชื่อนักเรียน">
    <input id="ea" type="number" value="${esc(s.age || '')}" placeholder="อายุ (ขวบ)" inputmode="numeric">
    <input id="ep" value="${esc(s.phone || '')}" placeholder="เบอร์ผู้ปกครอง" inputmode="tel">
    <input id="eo" value="${esc(s.note || '')}" placeholder="หมายเหตุ เช่น แพ้อาหาร">
    <div class="row" style="margin:0">
      <button id="esv" style="flex:1">บันทึก</button>
      <button class="ghost" id="ecx" style="flex:1">ปิด</button>
    </div>
  </div>`;
}

function vDash(c) {
  const { ss, rows } = repData(c);
  const n = rows.length;
  const tot = ss.length * n;
  const ok = rows.reduce((a, r) => a + r.p + r.l, 0);
  const pct = tot ? Math.round((ok / tot) * 100) : 0;
  const ids = new Set((c.students || []).map(s => s.id));

  const last = sessions(c.id).slice(0, 8).reverse().map(a => {
    const v = Object.entries(a.marks).filter(([i]) => ids.has(i)).map(([, x]) => x);
    return {
      d: a.date.slice(5).split('-').reverse().join('/'),
      p: n ? Math.round((v.filter(x => x !== 'a').length / n) * 100) : 0
    };
  });

  const top = [...rows].filter(() => ss.length).sort((a, b) => b.pct - a.pct).slice(0, 3);
  const risk = rows.filter(r => ss.length && r.pct < 70);
  const med = ['🥇', '🥈', '🥉'];

  return `<div class="kpi">
    <div><b>${classes().length}</b>คลาส</div>
    <div><b>${n}</b>นักเรียน</div>
    <div><b>${ss.length}</b>ครั้ง/เดือน</div>
    <div><b>${pct}%</b>มาเรียน</div>
  </div>
  <div class="card">
    <h3>📈 การมาเรียน 8 ครั้งล่าสุด</h3>
    ${last.length ? `<div class="chart">${last.map((x, i) => `<div class="col"><span>${x.p}%</span><div class="bw"><i style="height:${Math.max(x.p, 4)}%;animation-delay:${i * 0.06}s;background:${x.p >= 80 ? 'var(--p)' : x.p >= 60 ? 'var(--l)' : 'var(--a)'}"></i></div><em>${x.d}</em></div>`).join('')}</div>` : '<div class="sub">ยังไม่มีข้อมูล</div>'}
  </div>
  <div class="card">
    <h3>🏆 มาเรียนดีเด่น (เดือนนี้)</h3>
    ${top.length ? top.map((r, i) => `<div class="li"><span>${med[i]} ${esc(r.name)}</span><b>${r.pct}%</b></div>`).join('') : '<div class="sub">ยังไม่มีข้อมูล</div>'}
  </div>
  <div class="card">
    <h3>⚠️ ควรติดตาม (ต่ำกว่า 70%)</h3>
    ${risk.length ? risk.map(r => `<div class="li"><span>${esc(r.name)}</span><b class="low">${r.pct}%</b></div>`).join('') : '<div class="sub">ไม่มีใครเลย เยี่ยมมาก 🎉</div>'}
  </div>`;
}

function saveLocal() {
  try {
    localStorage.setItem(LK, JSON.stringify({ C, A }));
  } catch (e) {}
}

async function put(col, id, obj) {
  if (db) {
    try {
      await db.doc(col + '/' + id).set(obj);
    } catch (e) {
      say('บันทึกไม่ได้ ต้องมีสิทธิ์แก้ไขหน้านี้');
      return;
    }
  } else {
    (col === 'classes' ? C : A)[id] = obj;
    saveLocal();
    render();
  }
}

async function del(col, id) {
  if (db) {
    try {
      await db.doc(col + '/' + id).delete();
    } catch (e) {
      say('ลบไม่ได้ ต้องมีสิทธิ์แก้ไขหน้านี้');
    }
  } else {
    delete (col === 'classes' ? C : A)[id];
    saveLocal();
    render();
  }
}

function render() {
  const list = classes();
  if (!C[cur]) cur = list[0]?.id || null;

  const selectEl = $('cls');
  if (selectEl) {
    selectEl.innerHTML = list.map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${esc(c.name)}</option>`).join('') || '<option>ยังไม่มีคลาส</option>';
  }

  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));

  const addBtn = $('addCls');
  const edBtn = $('edCls');
  if (addBtn) addBtn.hidden = !isAdmin;
  if (edBtn) edBtn.hidden = !isAdmin;

  const c = cls();
  if (!c) {
    $('v').innerHTML = `<div class="empty">${isAdmin ? 'กด "+ คลาส" เพื่อสร้างคลาสแรก เช่น "LEGO เสาร์ 10:00"' : 'ยังไม่มีคลาส ให้แอดมินสร้างก่อน'}</div>`;
    return;
  }

  $('v').innerHTML = tab === 'dash' ? vDash(c) : tab === 'check' ? vCheck(c) : tab === 'hist' ? vHist(c) : vRep(c);
  fx(c);
}

function vCheck(c) {
  const m = marks();
  const st = c.students || [];
  const v = st.map(s => m[s.id]).filter(Boolean);
  const n = k => v.filter(x => x === k).length;

  return `${edSt ? edForm(c) : ''}
  <div class="row"><input type="date" id="date" value="${date}" aria-label="วันที่"></div>
  <div class="sum">
    <div><b style="color:var(--p)">${n('p')}</b>มา</div>
    <div><b style="color:var(--l)">${n('l')}</b>สาย</div>
    <div><b style="color:var(--a)">${n('a')}</b>ขาด</div>
  </div>
  <div class="bar"><i style="width:${st.length ? Math.round((v.length / st.length) * 100) : 0}%"></i></div>
  ${st.length > 4 ? `<div class="row"><input id="q" value="${esc(q)}" placeholder="🔍 ค้นหาชื่อ" aria-label="ค้นหา"></div>` : ''}
  ${st.length ? st.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase())).map(s => `
    <div class="st ${m[s.id] ? 'm-' + m[s.id] : ''}">
      <div class="av" data-ed="${s.id}" title="แก้ไขข้อมูล" style="${s.img ? '' : `background:hsl(${[...s.name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7)} 70% 55% / .22)`}">
        ${s.img ? `<img src="${s.img}">` : esc([...s.name][0])}
      </div>
      <div class="n">
        ${esc(s.name)}${s.age ? `<span style="opacity:0.75;font-size:0.85em;font-weight:normal;">(${esc(s.age)} ขวบ)</span>` : ''}
        ${streak(c.id, s.id) >= 3 ? `<span class="fire">🔥${streak(c.id, s.id)}</span>` : ''}
        ${s.phone || s.note ? `<div class="meta">${s.phone ? '📞 ' + esc(s.phone) : ''} ${s.note ? '📝 ' + esc(s.note) : ''}</div>` : ''}
      </div>
      <div class="seg" data-id="${s.id}">
        ${[['p', 'มา'], ['l', 'สาย'], ['a', 'ขาด']].map(([k, t]) => `<button class="${k} ${m[s.id] === k ? 'on' : ''}" data-k="${k}">${t}</button>`).join('')}
      </div>
      ${isAdmin ? `<button class="x" data-del="${s.id}" aria-label="ลบ ${esc(s.name)}" ${pdel === s.id ? 'style="color:var(--a);font-weight:600"' : ''}>${pdel === s.id ? 'ลบ?' : '✕'}</button>` : ''}
    </div>
  `).join('') : `<div class="empty">${isAdmin ? 'เพิ่มชื่อนักเรียนด้านล่างได้เลย' : 'ยังไม่มีนักเรียน ให้แอดมินเพิ่มก่อน'}</div>`}
  ${isAdmin ? `<div class="row" style="margin-top:12px"><input id="nm" placeholder="ชื่อนักเรียนใหม่" aria-label="ชื่อนักเรียนใหม่"><button id="addSt" style="flex:0 0 auto">เพิ่ม</button></div>` : ''}
  <div class="row">
    ${canWrite ? '<button class="ghost" id="allP" style="flex:1">ทุกคนมา</button>' : ''}
    <button class="ghost" id="copy" style="flex:1">คัดลอกสรุป</button>
  </div>`;
}

function vHist(c) {
  const s = sessions(c.id);
  if (!s.length) return '<div class="empty">ยังไม่มีประวัติ เริ่มเช็คชื่อได้ที่แท็บ "เช็คชื่อ"</div>';
  return s.map(a => {
    const ids = new Set((c.students || []).map(st => st.id));
    const v = Object.entries(a.marks).filter(([i]) => ids.has(i)).map(([, x]) => x);
    const n = k => v.filter(x => x === k).length;
    return `<button class="h" data-d="${a.date}">
      <span>${fd(a.date)}</span>
      <span><span style="color:var(--p)">มา ${n('p')}</span> · <span style="color:var(--l)">สาย ${n('l')}</span> · <span style="color:var(--a)">ขาด ${n('a')}</span></span>
    </button>`;
  }).join('');
}

function repData(c) {
  const ids = new Set((c.students || []).map(s => s.id));
  const ss = sessions(c.id).filter(a => a.date.startsWith(month) && Object.keys(a.marks).some(i => ids.has(i)));
  const rows = (c.students || []).map(s => {
    let p = 0, l = 0, a = 0;
    ss.forEach(x => {
      const k = x.marks[s.id];
      if (k === 'p') p++;
      else if (k === 'l') l++;
      else if (k === 'a') a++;
    });
    return {
      name: s.name + (s.age ? ` (${s.age} ขวบ)` : ''),
      p,
      l,
      a,
      pct: ss.length ? Math.round(((p + l) / ss.length) * 100) : 0
    };
  });
  return { ss, rows };
}

function vRep(c) {
  const { ss, rows } = repData(c);
  return `<div class="row"><input type="month" id="month" value="${month}" aria-label="เดือน"></div>
  <div class="sub">เรียนไปแล้ว ${ss.length} ครั้งในเดือนนี้ · มาเรียน = มา + สาย</div>
  ${rows.length ? `<div class="wrap"><table><tr><th>ชื่อ</th><th>มา</th><th>สาย</th><th>ขาด</th><th>%</th></tr>
  ${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.p}</td><td>${r.l}</td><td>${r.a}</td><td class="${ss.length && r.pct < 70 ? 'low' : ''}">${ss.length ? r.pct + '%' : '-'}</td></tr>`).join('')}</table></div>` : '<div class="empty">ยังไม่มีนักเรียนในคลาสนี้</div>'}
  <div class="row" style="margin-top:12px">
    <button class="ghost" id="copyR" style="flex:1">คัดลอกรายงาน</button>
    <button id="csv" style="flex:1">ดาวน์โหลด CSV</button>
  </div>
  <div class="sub">ตัวเลขสีแดง = มาเรียนน้อยกว่า 70%</div>`;
}

$('cls').onchange = e => {
  cur = e.target.value;
  beep('click');
  render();
};

document.querySelector('.tabs').onclick = e => {
  const b = e.target.closest('button');
  if (b) {
    tab = b.dataset.t;
    beep('click');
    render();
  }
};

let panel = null;
let delCls = false;
let pdel = null;

function renderPanel(val) {
  const p = $('panel');
  const c = cls();
  if (!panel) {
    p.innerHTML = '';
    return;
  }
  const v = val !== undefined ? val : (panel === 'edit' && c ? c.name : '');
  p.innerHTML = `<div class="row">
    <input id="pn" value="${esc(v)}" placeholder="ชื่อคลาส เช่น LEGO เสาร์ 10:00" aria-label="ชื่อคลาส">
    <button id="pok" style="flex:0 0 auto">บันทึก</button>
    <button class="ghost" id="pcx" style="flex:0 0 auto">ยกเลิก</button>
  </div>` + (panel === 'edit' ? `<div class="row"><button class="ghost" id="pdel" style="flex:1;color:var(--a)">${delCls ? 'กดอีกครั้งเพื่อยืนยันลบคลาสและประวัติทั้งหมด' : 'ลบคลาสนี้'}</button></div>` : '');
  $('pn').focus();
}

$('addCls').onclick = () => {
  panel = 'add';
  delCls = false;
  beep('click');
  renderPanel('');
};

$('edCls').onclick = () => {
  if (!cls()) {
    say('สร้างคลาสก่อนนะ');
    return;
  }
  panel = 'edit';
  delCls = false;
  beep('click');
  renderPanel();
};

async function savePanel() {
  const n = $('pn').value.trim();
  if (!n) return;
  if (panel === 'add') {
    const id = uid();
    const o = { name: n, students: [] };
    cur = id;
    C[id] = o;
    panel = null;
    renderPanel();
    render();
    await put('classes', id, o);
  } else {
    const c = cls();
    if (!c) return;
    const o = { name: n, students: c.students || [] };
    C[c.id] = o;
    panel = null;
    renderPanel();
    render();
    await put('classes', c.id, o);
  }
}

$('panel').onkeydown = e => {
  if (e.key === 'Enter' && e.target.id === 'pn') savePanel();
};

$('panel').onclick = async e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.id === 'pcx') {
    panel = null;
    delCls = false;
    renderPanel();
    return;
  }
  if (b.id === 'pok') return savePanel();
  if (b.id === 'pdel') {
    if (!delCls) {
      delCls = true;
      renderPanel($('pn').value);
      return;
    }
    const c = cls();
    if (!c) return;
    for (const [k, a] of Object.entries(A)) {
      if (a.classId === c.id) {
        delete A[k];
        await del('att', k);
      }
    }
    delete C[c.id];
    cur = null;
    panel = null;
    delCls = false;
    renderPanel();
    render();
    await del('classes', c.id);
  }
};

const v = $('v');

v.oninput = e => {
  if (e.target.id === 'q') {
    q = e.target.value;
    render();
    const i = $('q');
    if (i) {
      i.focus();
      i.setSelectionRange(q.length, q.length);
    }
  }
};

v.onchange = async e => {
  if (e.target.id === 'eimg' && e.target.files[0]) {
    tempImg = await compressImg(e.target.files[0]);
    const prev = $('imgPrev');
    if (prev) prev.innerHTML = `<img src="${tempImg}" style="width:100%;height:100%;object-fit:cover;">`;
    return;
  }
  if (e.target.id === 'fi') {
    restore(e.target.files[0]);
    return;
  }
  if (e.target.id === 'date' && e.target.value) {
    date = e.target.value;
    render();
  }
  if (e.target.id === 'month' && e.target.value) {
    month = e.target.value;
    render();
  }
};

v.onkeydown = e => {
  if (e.key === 'Enter' && e.target.id === 'nm') addSt();
};

v.onclick = async e => {
  const av = e.target.closest('.av');
  if (av && av.dataset.ed) {
    edSt = av.dataset.ed;
    const c = cls();
    const s = (c?.students || []).find(x => x.id === edSt);
    tempImg = s ? (s.img || null) : null;
    beep('click');
    render();
    return;
  }

  const b = e.target.closest('button');
  if (!b) return;
  const c = cls();
  if (!c) return;

  if (b.dataset.ac) {
    setAccent(b.dataset.ac);
    savePrefs();
    beep('click');
    return;
  }
  if (b.id === 'snd') {
    sound = !sound;
    savePrefs();
    render();
    return;
  }
  if (b.id === 'bk') {
    await saveFile('clickrobot-backup-' + today() + '.json', JSON.stringify({ C, A }, null, 1));
    say('สำรองข้อมูลเรียบร้อย ✅');
    return;
  }
  if (b.id === 'rs') {
    $('fi').click();
    return;
  }
  if (b.id === 'ecx') {
    edSt = null;
    tempImg = null;
    render();
    return;
  }
  if (b.id === 'esv') {
    const st = (c.students || []).map(x => x.id === edSt ? {
      ...x,
      name: $('en').value.trim() || x.name,
      age: $('ea').value.trim(),
      phone: $('ep').value.trim(),
      note: $('eo').value.trim(),
      img: tempImg !== null ? tempImg : x.img
    } : x);
    edSt = null;
    tempImg = null;
    C[c.id] = { name: c.name, students: st };
    render();
    await put('classes', c.id, { name: c.name, students: st });
    return;
  }
  if (b.dataset.d) {
    date = b.dataset.d;
    tab = 'check';
    render();
    return;
  }
  if (b.dataset.del) {
    if (pdel === b.dataset.del) {
      pdel = null;
      const st = (c.students || []).filter(x => x.id !== b.dataset.del);
      C[c.id] = { name: c.name, students: st };
      render();
      await put('classes', c.id, { name: c.name, students: st });
    } else {
      pdel = b.dataset.del;
      render();
    }
    return;
  }
  if (b.dataset.k) {
    const id = b.parentElement.dataset.id;
    const m = { ...marks() };
    lastPop = { id, k: b.dataset.k };
    beep(b.dataset.k);
    if (m[id] === b.dataset.k) delete m[id];
    else m[id] = b.dataset.k;
    setMarks(c, m);
    return;
  }
  if (b.id === 'addSt') return addSt();
  if (b.id === 'allP') {
    const m = {};
    (c.students || []).forEach(s => m[s.id] = 'p');
    setMarks(c, m);
    return;
  }
  if (b.id === 'copy') return copyText(sumText(c));
  if (b.id === 'copyR') return copyText(repText(c));
  if (b.id === 'csv') return doCsv(c);
};

function setMarks(c, m) {
  const k = date + '_' + c.id;
  put('att', k, { date, classId: c.id, marks: m });
  if (db) {
    A[k] = { date, classId: c.id, marks: m };
    render();
  }
}

async function addSt() {
  const c = cls();
  const i = $('nm');
  if (!c || !i || !i.value.trim()) return;
  const st = [...(c.students || []), { id: uid(), name: i.value.trim() }];
  await put('classes', c.id, { name: c.name, students: st });
  if (db) {
    C[c.id] = { name: c.name, students: st };
    render();
  }
  if ($('nm'))$('nm').focus();
}

async function copyText(t) {
  try {
    await navigator.clipboard.writeText(t);
    say('คัดลอกลงคลิปบอร์ดแล้ว 📋');
  } catch (e) {
    $('toast').innerHTML = '<textarea readonly rows=6 style="width:100%" onfocus="this.select()">' + esc(t) + '</textarea>';
  }
}

function sumText(c) {
  const m = marks();
  const st = c.students || [];
  const g = k => st.filter(s => m[s.id] === k).map(s => s.name + (s.age ? ` (${s.age}ขวบ)` : ''));
  const un = st.filter(s => !m[s.id]).length;
  return `เช็คชื่อ ${c.name}\nวันที่ ${date}\nมา ${g('p').length}: ${g('p').join(', ') || '-'}\nสาย ${g('l').length}: ${g('l').join(', ') || '-'}\nขาด ${g('a').length}: ${g('a').join(', ') || '-'}\nยังไม่เช็ค ${un}`;
}

function repText(c) {
  const { ss, rows } = repData(c);
  return `รายงานการมาเรียน ${c.name}\nเดือน ${month} (เรียน ${ss.length} ครั้ง)\n` + rows.map(r => `${r.name}: มา ${r.p} สาย ${r.l} ขาด ${r.a} (${ss.length ? r.pct + '%' : '-'})`).join('\n');
}

async function doCsv(c) {
  const { ss, rows } = repData(c);
  const qStr = s => '"' + String(s).replace(/"/g, '""') + '"';
  const csv = '\ufeff' + ['ชื่อ,มา,สาย,ขาด,เปอร์เซ็นต์'].concat(rows.map(r => [qStr(r.name), r.p, r.l, r.a, ss.length ? r.pct : ''].join(','))).join('\n');
  const fn = `attendance-${month}.csv`;
  try {
    if (dl) {
      await dl.save({ filename: fn, data: csv });
    } else {
      const u = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const l = document.createElement('a');
      l.href = u;
      l.download = fn;
      document.body.appendChild(l);
      l.click();
      l.remove();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    }
    say('บันทึกไฟล์เรียบร้อยแล้ว 📁');
  } catch (e) {
    say('ไม่สามารถบันทึกไฟล์ได้');
  }
}

// ==========================================
// 🚀 Application Initialization
// ==========================================
(async () => {
  try {
    db = null;
    dl = window.claude ? await claude.use('downloads') : null;
  } catch (e) {}

  isAdmin = true;
  canWrite = true;

  if (db) {
    $('sub').textContent = 'เข้าสู่ระบบแล้ว';
    db.collection('classes').onSnapshot(s => {
      C = {};
      s.docs.forEach(d => C[d.id] = d.data());
      render();
    }, () => {});
    db.collection('att').onSnapshot(s => {
      A = {};
      s.docs.forEach(d => A[d.id] = d.data());
      render();
    }, () => {});
  } else {
    const banner = $('banner');
    if (banner) {
      banner.innerHTML = '<div class="banner">ไม่ต้องล็อกอิน · ข้อมูลเก็บในเบราว์เซอร์ของเครื่องนี้ (ล้างประวัติเบราว์เซอร์แล้วข้อมูลจะหาย)</div>';
    }
    try {
      const r = JSON.parse(localStorage.getItem(LK) || 'null');
      if (r) {
        C = r.C || {};
        A = r.A || {};
      }
    } catch (e) {}
  }
  render();
})();