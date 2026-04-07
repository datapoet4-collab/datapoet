import { collectNews } from "../../src/fetch/collectNews.js";
import { generateDailyState } from "../../src/lib/artist/brain.js";
import { generateVideo } from "../../src/generator/videoEngine.js";
import path from "path";
import fs from "fs";

export async function handler() {
  const todayDir = path.join("public/archive", new Date().toISOString().split("T")[0]);
  fs.mkdirSync(todayDir, { recursive: true });

  // 1. Fetch delle notizie
  const news = await collectNews();
  // 2. Analisi emotiva
  const { state, signals } = await generateDailyState(news);

  const text = `Oggi il mondo vibra di ${signals.war} conflitti, ${signals.crisis} crisi, ${signals.economy} tensioni economiche, ${signals.human} scie umane.`;

  // 3. Generazione di 3 video unici
  const videos = [];
  for (let i = 0; i < 3; i++) {
    const out = path.join(todayDir, \`opera_\${i + 1}.webm\`);
    await generateVideo(state, out);
    videos.push("/" + out);
  }

  const result = { text, videos };

  fs.writeFileSync(path.join(todayDir, "meta.json"), JSON.stringify(result, null, 2));
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  };
}
