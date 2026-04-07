import puppeteer from 'puppeteer';
import { spawnSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import os from 'os';

const TODAY = new Date().toISOString().split('T')[0];
const OUT_DIR = `${process.env.HOME}/Desktop/atelier-ai/public/archive/${TODAY}`;
const TMP = path.join(os.tmpdir(), `atelier-${TODAY}`);
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(TMP, { recursive: true });

const W = 1920, H = 1280, FPS = 30, DURATION = 30;
const TOTAL_FRAMES = FPS * DURATION;

async function captureScene(sceneId, filename) {
  console.log(`\nRegistrando ${filename}...`);
  const frameDir = path.join(TMP, `scene${sceneId}`);
  mkdirSync(frameDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', `--window-size=${W},${H}`]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H });
  await page.goto(`http://localhost:8888/scene${sceneId}.html`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));

  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const framePath = path.join(frameDir, `frame${String(f).padStart(5,'0')}.png`);
    await page.screenshot({ path: framePath });
    if (f % 30 === 0) process.stdout.write(`\r  Frame ${f}/${TOTAL_FRAMES}`);
  }

  await browser.close();

  console.log(`\n  Encoding...`);
  const outPath = path.join(OUT_DIR, filename);
  spawnSync('ffmpeg', [
    '-y', '-framerate', String(FPS),
    '-i', path.join(frameDir, 'frame%05d.png'),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-crf', '18', '-preset', 'fast',
    '-movflags', '+faststart', outPath
  ], { stdio: 'inherit' });

  console.log(`✅ ${filename} salvato`);
}

const which = process.argv[2] || 'all';
if (which === '1' || which === 'all') await captureScene(1, `opera1-${TODAY}.mp4`);
if (which === '2' || which === 'all') await captureScene(2, `opera2-${TODAY}.mp4`);
if (which === '3' || which === 'all') await captureScene(3, `opera3-${TODAY}.mp4`);
console.log('\n🎨 Tutte le opere pronte!');
