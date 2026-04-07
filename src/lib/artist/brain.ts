type NewsLike = {
  title?: string;
  summary?: string;
  tags?: string[];
};

function clamp(n: number) {
  return Math.max(0, Math.min(1, n));
}

function score(text: string, words: string[]) {
  let hits = 0;
  for (const w of words) {
    if (text.includes(w)) hits += 1;
  }
  return hits;
}

function analyzeHeadlines(items: NewsLike[]) {
  const text = items
    .map((item) =>
      [
        item.title || "",
        item.summary || "",
        Array.isArray(item.tags) ? item.tags.join(" ") : "",
      ].join(" ")
    )
    .join(" | ")
    .toLowerCase();

  const war = score(text, [
    "war", "missile", "drone", "strike", "army", "military",
    "attack", "bomb", "troops", "front", "invasion", "nato",
    "iran", "ukraine", "gaza", "russia", "defense"
  ]);

  const crisis = score(text, [
    "crisis", "collapse", "emergency", "panic", "fear", "chaos",
    "disaster", "catastrophe", "threat", "alarm", "violent",
    "death", "dead", "killed", "injured", "fire", "wildfire",
    "flood", "earthquake", "evacuation"
  ]);

  const economy = score(text, [
    "market", "stocks", "inflation", "tariff", "trade", "economy",
    "bank", "recession", "debt", "earnings", "ipo", "investor",
    "oil", "price", "supply", "shipping", "factory"
  ]);

  const politics = score(text, [
    "president", "prime minister", "minister", "government",
    "parliament", "election", "court", "policy", "sanction",
    "border", "law", "congress", "trump", "scotus", "vote"
  ]);

  const human = score(text, [
    "people", "children", "families", "refugees", "home",
    "captivity", "returns", "survivors", "victims", "mayor",
    "citizens", "humanitarian", "camp", "aid"
  ]);

  const tech = score(text, [
    "ai", "chip", "chips", "openai", "meta", "google", "x",
    "platform", "algorithm", "robot", "software", "surveillance",
    "facial recognition", "data center", "semiconductor"
  ]);

  return { war, crisis, economy, politics, human, tech };
}

export async function generateDailyState(news: NewsLike[] = []) {
  const s = analyzeHeadlines(news);

  const total = s.war + s.crisis + s.economy + s.politics + s.human + s.tech;

  const norm = (value: number, base = 0) =>
    clamp((value + base) / Math.max(total + base + 1, 1));

  const figuration = clamp(
    0.18 +
    norm(s.human, 1) * 0.55 +
    norm(s.politics, 0.5) * 0.18 -
    norm(s.tech, 0.5) * 0.12
  );

  const volumetricDensity = clamp(
    0.20 +
    norm(s.economy, 1) * 0.38 +
    norm(s.crisis, 1) * 0.28 +
    norm(s.war, 0.5) * 0.12
  );

  const instability = clamp(
    0.12 +
    norm(s.war, 1) * 0.45 +
    norm(s.crisis, 1) * 0.40 +
    norm(s.politics, 0.5) * 0.10
  );

  const painterlySkin = clamp(
    0.16 +
    norm(s.crisis, 1) * 0.32 +
    norm(s.human, 0.5) * 0.18 +
    norm(s.economy, 0.5) * 0.12
  );

  const motionAggression = clamp(
    0.14 +
    norm(s.war, 1) * 0.44 +
    norm(s.crisis, 1) * 0.26 +
    norm(s.politics, 0.5) * 0.12
  );

  return {
    state: {
      figuration,
      volumetricDensity,
      instability,
      painterlySkin,
      motionAggression,
    },
    signals: s,
    timestamp: Date.now(),
  };
}
