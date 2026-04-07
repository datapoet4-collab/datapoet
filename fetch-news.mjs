import https from 'https';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        get(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseRSS(xml) {
  const items = [];
  const matches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  for (const m of matches) {
    const block = m[1];
    const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/))?.[1] || '';
    const desc = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/))?.[1] || '';
    items.push({ title: title.trim(), summary: desc.replace(/<[^>]+>/g, '').trim().slice(0, 200) });
  }
  return items;
}

const FEEDS = [
  {name:"ANSA",url:"",skip:true},
  { name: 'BBC World',     url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  {name:"AlJazeera",url:"",skip:true},
  { name: 'Reuters World', url: 'https://feeds.reuters.com/reuters/worldNews' },
  { name: 'DW World',      url: 'https://rss.dw.com/xml/rss-en-world' },
];

export async function fetchNews() {
  const results = [];
  for (const feed of FEEDS) {
    try {
      const xml = await get(feed.url);
      const items = parseRSS(xml);
      results.push(...items);
      console.log(`✅ ${feed.name}: ${items.length} notizie`);
    } catch(e) {
      console.log(`❌ ${feed.name}: ${e.message}`);
    }
  }
  return results;
}

const news = await fetchNews();
console.log(`\nTOTALE: ${news.length} notizie`);
console.log('\n--- TITOLI ---');
news.slice(0, 15).forEach(n => console.log('•', n.title));
