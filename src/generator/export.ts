import { createWriteStream } from "fs";
import { spawn } from "child_process";

export async function exportWebm(canvas, frames, outPath) {
  return new Promise((resolve, reject) => {
    const encoder = spawn("ffmpeg", [
      "-y",
      "-f", "image2pipe",
      "-vcodec", "png",
      "-r", "24",
      "-i", "-",
      "-c:v", "libvpx-vp9",
      "-pix_fmt", "yuv420p",
      "-b:v", "4M",
      outPath,
    ]);

    encoder.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error("Errore export WebM"));
    });

    const stream = createWriteStream("/dev/null");
    for (let i = 0; i < frames; i++) {
      const buf = canvas.toBuffer("image/png");
      encoder.stdin.write(buf);
      stream.write(buf);
    }

    encoder.stdin.end();
  });
}
