export async function fetchCnnNews() {
  try {
    const res = await fetch("[edition.cnn.com](https://edition.cnn.com/world)");
    const html = await res.text();
    const matches = Array.from(html.matchAll(/<h3.*?>(.*?)<\/h3>/g)).map((m) => m[1]);
    const items = matches.map((title) => ({
      title: title.replace(/<[^>]+>/g, ""),
      summary: "",
      tags: ["cnn", "world"]
    }));
    return items.slice(0, 10);
  } catch (err) {
    console.error("Errore fetch CNN:", err);
    return [];
  }
}
