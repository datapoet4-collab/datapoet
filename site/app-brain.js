async function loadDailyState() {
  const res = await fetch('/daily-state.json');
  return await res.json();
}

window.__DAILY_STATE__ = null;

fetch('/daily-state.json')
  .then(r => r.json())
  .then(data => {
    window.__DAILY_STATE__ = data;
    document.getElementById('day-text').textContent = data.clima;
    document.getElementById('opera1-nome').textContent = data.opere[0].nome;
    document.getElementById('opera2-nome').textContent = data.opere[1].nome;
    document.getElementById('opera3-nome').textContent = data.opere[2].nome;
    document.getElementById('opera1-desc').textContent = data.opere[0].desc;
    document.getElementById('opera2-desc').textContent = data.opere[1].desc;
    document.getElementById('opera3-desc').textContent = data.opere[2].desc;
  })
  .catch(() => {
    document.getElementById('day-text').textContent = 'Premi GENERA OGGI per caricare le notizie.';
  });
