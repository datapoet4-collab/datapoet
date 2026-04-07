export async function fetchAnsaNews() {
  try {
    const res = await fetch("[ansa.it](https://www.ansa.it/sito/notizie/mondo/mondo_rss.xml)");
    const xml = await res.text();
    const items = Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).map((m) => {
      const item = m[1];
      const title = (item.match(/<title>(.*?)<\/title>/) || ["", ""])[1];
      const summary = (item.match(/<description>(.*?)<\/description>/) || ["", ""])[1];
      return { title, summary, tags: ["ansa", "mondo"] };
    });
    return items.slice(0, 10);
  } catch (err) {
    console.error("Errore fetch ANSA:", err);
    return [];
  }
}
