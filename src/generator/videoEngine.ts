import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import { getRenderParams, State } from "./renderer.js";
import { exportWebm } from "./export.js";

export async function generateVideo(state: State, outPath: string) {
  const { colorShift, noiseScale, particleCount, velocity, blur } = getRenderParams(state);
  const width = 1920;
  const height = 1080;
  const frames = 240; // ~10 secondi a 24fps
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  for (let f = 0; f < frames; f++) {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.sin(f * noiseScale * i + i) * 0.5 + 0.5) * width;
      const y = (Math.cos(f * noiseScale * i * 1.3) * 0.5 + 0.5) * height;
      const r = 90 + Math.sin(i * 0.1) * colorShift[0];
      const g = 50 + Math.cos(i * 0.1) * colorShift[1];
      const b = 180 + Math.sin(i * 0.05) * colorShift[2];
      ctx.fillStyle = \`rgba(\${r % 255},\${g % 255},\${b % 255},0.4)\`;
      ctx.beginPath();
      ctx.arc(x, y, blur * (Math.sin(f * 0.02 + i) + 1.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const buf = canvas.toBuffer("image/png");
  fs.writeFileSync(outPath.replace(".webm", ".png"), buf);
  await exportWebm(canvas, frames, outPath);

  console.log("Video generato:", outPath);
}
