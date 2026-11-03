const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('console',m=>console.log('console:',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+require('path').resolve(process.argv[2])+(process.argv[4]||''));await p.waitForTimeout(400);
await p.screenshot({path:process.argv[3]});await b.close();})();
