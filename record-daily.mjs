import puppeteer from 'puppeteer';
import {mkdirSync,writeFileSync,copyFileSync} from 'fs';
import {join} from 'path';
import {execSync,spawn} from 'child_process';

const now=new Date();
const mm=String(now.getMonth()+1).padStart(2,'0');
const dd=String(now.getDate()).padStart(2,'0');
const yyyy=now.getFullYear();
const dateStr=mm+dd+yyyy;
const isoDate=now.toISOString().split('T')[0];

const icloudBase=process.env.HOME+'/Library/Mobile Documents/com~apple~CloudDocs/atelier-archivio';
const archiveDir=icloudBase+'/'+isoDate;
mkdirSync(archiveDir,{recursive:true});

console.log('Archivio:', archiveDir);
console.log('Data:', dateStr);

// avvia server
const srv=spawn('node',['server.mjs'],{detached:true,stdio:'ignore'});
srv.unref();
await new Promise(r=>setTimeout(r,4000));

const browser=await puppeteer.launch({
  headless:true,
  args:['--no-sandbox','--disable-setuid-sandbox']
});

const page=await browser.newPage();
await page.setViewport({width:1920,height:1080});
await page.goto('http://localhost:8888',{waitUntil:'networkidle2',timeout:30000});

console.log('Attendo 10s...');
await new Promise(r=>setTimeout(r,10000));

// screenshot
await page.screenshot({path:join(archiveDir,dateStr+'-screenshot.jpg'),type:'jpeg',quality:95});
console.log('Screenshot salvato');

// state
copyFileSync('./site/daily-state.json',join(archiveDir,dateStr+'-state.json'));

// video — usa page.evaluate con callback esplicito
console.log('Registrazione 30s...');
const webmPath=join(archiveDir,dateStr+'.webm');

await page.exposeFunction('saveVideo',async(data)=>{
  const buf=Buffer.from(data);
  writeFileSync(webmPath,buf);
  console.log('Video salvato:',webmPath,'size:',buf.length);
});

await page.evaluate(()=>{
  const cv=document.querySelector('canvas');
  if(!cv){console.error('no canvas');return;}
  const stream=cv.captureStream(30);
  const rec=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:10000000});
  const chunks=[];
  rec.ondataavailable=e=>{if(e.data.size>0)chunks.push(e.data);};
  rec.onstop=async()=>{
    const blob=new Blob(chunks,{type:'video/webm'});
    const buf=await blob.arrayBuffer();
    window.saveVideo(Array.from(new Uint8Array(buf)));
  };
  rec.start();
  setTimeout(()=>rec.stop(),30000);
});

await new Promise(r=>setTimeout(r,33000));
await browser.close();

// MP4
try{
  const mp4Path=join(archiveDir,dateStr+'.mp4');
  execSync('ffmpeg -i "'+webmPath+'" -c:v libx264 -preset fast -crf 18 "'+mp4Path+'" -y 2>/dev/null');
  console.log('MP4 salvato:',mp4Path);
}catch(e){
  console.log('ffmpeg non disponibile - video come .webm');
}

console.log('Completato:', archiveDir);
