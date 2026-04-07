import http from 'http';
import fs from 'fs';
import { copyFileSync, existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SITE = './site';
const PORT = process.env.PORT || 8888;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

console.log('✅ Atelier AI starting...');

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];


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
      // Genera segnali deterministici dalla data
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
        date,
        simulated:true,
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
      execSync('node run-brain.mjs', { cwd: process.cwd() });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch(e) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
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
