// Export the subtitle track as SRT: node render/srt.js > output/team-ep1.th.srt
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/subtitles.js'), 'utf8') + ';this.SUBS = SUBS;', ctx);
const ts = s => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60, r = ms % 1000; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(r).padStart(3, '0')}`; };
process.stdout.write(ctx.SUBS.map((s, i) => `${i + 1}\n${ts(s[0])} --> ${ts(s[1])}\n${s[2]}\n`).join('\n'));
