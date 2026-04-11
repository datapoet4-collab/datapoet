import http from 'http';
import fs from 'fs';
import { copyFileSync, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SITE = './site';
const PORT = process.env.PORT || 8888;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

console.log('✅ Atelier AI starting...');

// Helper: legge body POST
function readBody(req) {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', d => b += d);
    req.on('end', () => resolve(b));
  });
}

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];

  // ── CORS preflight ──
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' });
    res.end(); return;
  }

  // ── /api/claude — ottimizza prompt testo ──
  if (url === '/api/claude' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const prompt = body.prompt || '';
      const r = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 300,
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const d = await r.json();
      const result = d.content?.[0]?.text || '';
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ result }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ── /api/claude-vision — analizza immagini e genera prompt ──
  if (url === "/api/claude-vision" && req.method === "POST") {
    try {
      const body = JSON.parse(await readBody(req));
      const images = body.images || [];
      const folder = body.folder || "";
      const imageData = images.slice(0,4).map(d => { const m = d.match(/^data:image\/[a-z]+;base64,(.+)$/); return m ? m[1] : null; }).filter(Boolean);
      const prompt = 'Analyze these images from folder "' + folder + '". Generate ONE Stable Diffusion prompt in English. Reply ONLY with the prompt.';
      const r = await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llava', prompt, images: imageData, stream: false }) });
      const d = await r.json();
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ result: d.response || '' }));
    } catch(e) { res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify({ error: e.message })); }
    return;
  }
  if (url === '/api/claude-vision-OLD' && req.method === 'POST') {
    try {
      const body = JSON.parse(await readBody(req));
      const images = body.images || [];   // array di dataUrl base64
      const folder = body.folder || '';
      const promptText = body.prompt || '';

      // Costruisce i content blocks: fino a 6 immagini + testo
      const content = [];
      images.slice(0, 6).forEach(dataUrl => {
        const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
        if (match) {
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: match[1], data: match[2] }
          });
        }
      });
      content.push({ type: 'text', text: promptText });

      const r = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llava', prompt: prompt, stream: false })
      });
      const d = await r.json();
      const result = d.response || '';
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ result }));
    } catch(e) {
      res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if(url.startsWith('/simulate-date/')){
    const date=url.replace('/simulate-date/','');
    const selDate=new Date(date);
    const minDate=new Date('2009-01-03');
    if(selDate<minDate){
      res.writeHead(400,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:false,error:'Date before 2009-01-03'}));
      return;
    }
    try{
      const seed=selDate.getTime();
      const rng=(s)=>{let x=Math.sin(s)*10000;return x-Math.floor(x);};
      const hasETH=selDate>=new Date('2015-07-30');
      const hasBTC=selDate>=new Date('2009-01-03');
      const war=Math.floor(rng(seed*1)*15);
      const crisis=Math.floor(rng(seed*2)*8);
      const economy=Math.floor(rng(seed*3)*10);
      const politics=Math.floor(rng(seed*4)*12);
      const human=Math.floor(rng(seed*5)*10);
      const tech=Math.floor(rng(seed*6)*8);
      const priceTable=[
        {ts:2009*12+1, gold:880,  silver:11,  btc:0.001,eth:0},
        {ts:2010*12+1, gold:1120, silver:17,  btc:0.05, eth:0},
        {ts:2011*12+4, gold:1500, silver:48,  btc:1,    eth:0},
        {ts:2011*12+12,gold:1560, silver:28,  btc:4,    eth:0},
        {ts:2013*12+1, gold:1680, silver:31,  btc:15,   eth:0},
        {ts:2013*12+12,gold:1200, silver:20,  btc:800,  eth:0},
        {ts:2015*12+8, gold:1100, silver:15,  btc:240,  eth:3},
        {ts:2016*12+12,gold:1160, silver:16,  btc:950,  eth:8},
        {ts:2017*12+12,gold:1300, silver:16,  btc:19000,eth:700},
        {ts:2018*12+12,gold:1280, silver:15,  btc:3700, eth:90},
        {ts:2020*12+12,gold:1900, silver:26,  btc:28000,eth:730},
        {ts:2021*12+11,gold:1850, silver:25,  btc:65000,eth:4600},
        {ts:2022*12+12,gold:1820, silver:24,  btc:16500,eth:1200},
        {ts:2023*12+12,gold:2060, silver:24,  btc:42000,eth:2200},
        {ts:2024*12+3, gold:2160, silver:25,  btc:70000,eth:3500},
        {ts:2024*12+12,gold:2650, silver:30,  btc:95000,eth:3400},
        {ts:2026*12+4, gold:4680, silver:73,  btc:69000,eth:2100},
      ];
      const selTs=selDate.getFullYear()*12+selDate.getMonth()+1;
      let prev=priceTable[0],next=priceTable[priceTable.length-1];
      for(let i=0;i<priceTable.length;i++){if(priceTable[i].ts<=selTs)prev=priceTable[i];if(priceTable[i].ts>=selTs){next=priceTable[i];break;}}
      const interp=(k)=>{if(prev.ts===next.ts)return prev[k];const t=(selTs-prev.ts)/(next.ts-prev.ts);return Math.round(prev[k]+(next[k]-prev[k])*t);};
      const goldPrice=interp('gold');
      const silverPrice=interp('silver');
      const btcPrice=hasBTC?interp('btc'):0;
      const ethPrice=hasETH?interp('eth'):0;
      const dominant=['war','crisis','economy','politics','human','tech'].reduce((a,b,i)=>{
        const vals={war,crisis,economy,politics,human,tech};
        return vals[b]>vals[a]?b:a;
      },'war');
      const climaMap={war:'High global tension. The world burns.',crisis:'Crisis signals detected.',economy:'Markets move. Economy dominates.',politics:'Political tension rises.',human:'Human voices emerge from the noise.',tech:'Technology shapes the signal.'};
      let wikiHeadlines=[`Historical data for ${date}`];
      try{
        const mm=String(selDate.getMonth()+1).padStart(2,'0');
        const dd=String(selDate.getDate()).padStart(2,'0');
        const wr=await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`,{headers:{'User-Agent':'DataPoet/1.0 (https://datapoet.onrender.com; datapoet4@gmail.com)','Accept':'application/json'}}).then(r=>r.json());
        if(wr.events?.length>0){
          const ty=selDate.getFullYear();
          const sorted=wr.events.sort((a,b)=>Math.abs((a.year||0)-ty)-Math.abs((b.year||0)-ty));
          wikiHeadlines=sorted.slice(0,10).map(e=>`${e.year}: ${e.text}`).filter(Boolean);
        }
      }catch(e){console.log('Wiki error:',e.message);}
      const state={
        date,simulated:true,
        signals:{war,crisis,economy,politics,human,tech},
        clima:climaMap[dominant],
        metals:[{name:'Gold',price:goldPrice,change:0},{name:'Silver',price:silverPrice,change:0}],
        eth:{price:ethPrice,change24h:0},
        btc:{price:btcPrice,change24h:0},
        headlines:wikiHeadlines,
        entities:[],
        opere:[{nome:'Simulated',desc:`Simulated work for ${date}`}]
      };
      fs.writeFileSync('./site/daily-state.json',JSON.stringify(state,null,2));
      execSync('node build-index.mjs',{cwd:process.cwd()});
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:true,date,simulated:true}));
    }catch(e){
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:false,error:e.message}));
    }
    return;
  }

  if(url.startsWith('/load-archive/')){
    const date=url.replace('/load-archive/','');
    const src=`./daily-archive/${date}.json`;
    if(!fs.existsSync(src)){
      res.writeHead(404,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:false,error:'No archive for '+date}));
      return;
    }
    try{
      fs.copyFileSync(src,'./site/daily-state.json');
      execSync('node build-index.mjs',{cwd:process.cwd()});
      res.writeHead(200,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:true,date}));
    }catch(e){
      res.writeHead(500,{'Content-Type':'application/json'});
      res.end(JSON.stringify({ok:false,error:e.message}));
    }
    return;
  }

  if (url === '/run-brain') {
    try {
      execSync('node run-brain.mjs && node build-index.mjs', { cwd: process.cwd() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch(e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  if(url.startsWith('/comfy/') || url === '/comfy'){
    const target=url.replace('/comfy','');
    const opts={hostname:'127.0.0.1',port:8188,path:target||'/',method:req.method,headers:{'Content-Type':'application/json'}};
    const pr=http.request(opts,(r2)=>{
      const h={...r2.headers,'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'};
      res.writeHead(r2.statusCode,h);
      r2.pipe(res);
    });
    pr.on('error',(e)=>{res.writeHead(502);res.end(JSON.stringify({error:e.message}));});
    if(req.method==='POST'){
      let b='';req.on('data',d=>b+=d);req.on('end',()=>{pr.write(b);pr.end();});
    } else { pr.end(); }
    return;
  }

  if(url === '/generate' && req.method === 'POST'){
    let body='';
    req.on('data',d=>body+=d);
    req.on('end',async()=>{
      try{
        const payload=JSON.parse(body);
        const r=await fetch('https://unsalably-winiest-ngoc.ngrok-free.dev/prompt',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        const d=await r.json();
        res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
        res.end(JSON.stringify(d));
      }catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));}
    });
    return;
  }

  if(url.startsWith('/history/') && req.method === 'GET'){
    try{
      const r=await fetch('https://unsalably-winiest-ngoc.ngrok-free.dev'+url);
      const d=await r.json();
      res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
      res.end(JSON.stringify(d));
    }catch(e){res.writeHead(500);res.end(JSON.stringify({error:e.message}));}
    return;
  }

  if(url.startsWith('/comfy-video/')){
    const fname=decodeURIComponent(url.replace('/comfy-video/',''));
    const fp='/Users/marcobonafe/Desktop/ComfyUI/output/'+fname;
    if(!fs.existsSync(fp)){res.writeHead(404);res.end('not found');return;}
    res.writeHead(200,{'Content-Type':'video/mp4','Access-Control-Allow-Origin':'*'});
    fs.createReadStream(fp).pipe(res);
    return;
  }

  if(url.startsWith('/comfy-img/')){
    const fname=decodeURIComponent(url.replace('/comfy-img/',''));
    const fp='/Users/marcobonafe/Desktop/ComfyUI/output/'+fname;
    console.log('CERCO:',fp,'EXISTS:',fs.existsSync(fp));
    if(!fs.existsSync(fp)){res.writeHead(404);res.end('not found');return;}
    res.writeHead(200,{'Content-Type':'image/png','Access-Control-Allow-Origin':'*'});
    fs.createReadStream(fp).pipe(res);
    return;
  }

  if(url.startsWith('/view')){
    try{
      const fullUrl='https://unsalably-winiest-ngoc.ngrok-free.dev'+url;
      const r=await fetch(fullUrl);
      if(!r.ok){res.writeHead(r.status);res.end('error '+r.status);return;}
      const ct=r.headers.get('content-type')||'image/png';
      const buf=await r.arrayBuffer();
      const b=Buffer.from(buf);
      res.writeHead(200,{'Content-Type':ct,'Content-Length':b.length,'Access-Control-Allow-Origin':'*'});
      res.end(b);
    }catch(e){res.writeHead(500);res.end(e.message);}
    return;
  }

  let filePath = path.join(SITE, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);

}).listen(PORT, () => console.log(`✅ Atelier AI → http://localhost:${PORT}`));
