// Offline renderer: draws every frame in headless Chromium, then muxes with the narration via ffmpeg.
// usage: node render/render.js [--workers 3] [--from 0] [--to 209.16] [--out output/team-ep1.mp4]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1]]]) : a), []));
const FPS = 30;
const AUDIO = path.join(ROOT, 'audio', 'narration.wav');
const dur = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', AUDIO]).toString());
const from = parseFloat(args.from || 0), to = Math.min(parseFloat(args.to || dur), dur);
const workers = parseInt(args.workers || 3);
const frames = Math.round((to - from) * FPS);
const tmp = path.resolve(args.tmp || path.join(ROOT, 'render', 'frames'));
const out = path.resolve(ROOT, args.out || 'output/team-ep1.mp4');
fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });

(async () => {
  console.log(`audio ${dur.toFixed(3)}s → rendering ${frames} frames (${from}s–${to}s) with ${workers} workers`);
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync'] });
  let done = 0; const t0 = Date.now();
  const job = async (w) => {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    page.on('pageerror', e => console.error('page error:', e.message));
    await page.goto('file://' + path.join(ROOT, 'index.html') + '?render=1');
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
    for (let f = w; f < frames; f += workers) {
      const file = path.join(tmp, `f${String(f).padStart(5, '0')}.jpg`);
      if (fs.existsSync(file) && !args.force) { done++; continue; }
      const T = from + f / FPS;
      const data = await page.evaluate(t => window.__frame(t, 0.94), T);
      fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
      if (++done % 150 === 0) { const el = (Date.now() - t0) / 1000; console.log(`${done}/${frames} frames  ${el.toFixed(0)}s elapsed, eta ${((frames - done) * el / done).toFixed(0)}s`); }
    }
    await page.close();
  };
  await Promise.all([...Array(workers).keys()].map(job));
  await browser.close();
  console.log('frames done, encoding…');
  const enc = ['-y', '-framerate', String(FPS), '-i', path.join(tmp, 'f%05d.jpg')];
  if (from === 0 && Math.abs(to - dur) < 0.01) enc.push('-i', AUDIO); else enc.push('-ss', String(from), '-t', String(to - from), '-i', AUDIO);
  enc.push('-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', '20', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out);
  execFileSync('ffmpeg', enc, { stdio: 'inherit' });
  console.log('wrote', out);
})();
