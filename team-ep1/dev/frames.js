// render a contact sheet of given times: node dev/frames.js out.png t1 t2 ...
const { chromium } = require('playwright'); const path=require('path');
(async()=>{const out=process.argv[2], ts=process.argv.slice(3).map(Number);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('console:',m.text())});
await p.goto('file://'+path.resolve(__dirname,'../index.html')+'?render=1');await p.waitForFunction(()=>window.__ready===true);
const imgs=[];for(const t of ts){imgs.push(await p.evaluate(t=>window.__frame(t,0.8),t));}
const cols=Math.min(ts.length,4),rows=Math.ceil(ts.length/cols);
await p.setContent(`<body style="margin:0;background:#222">${imgs.map((d,i)=>`<div style="display:inline-block;position:relative;width:270px;height:480px"><img src="${d}" style="width:270px;height:480px"><span style="position:absolute;left:4px;top:2px;color:#ff0;font:bold 16px monospace;text-shadow:0 0 3px #000">${ts[i]}</span></div>`).join('')}</body>`);
await p.setViewportSize({width:270*cols,height:480*rows});await p.screenshot({path:out});await b.close();})();
