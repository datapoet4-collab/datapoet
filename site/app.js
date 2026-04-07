async function callGenerate() {
  document.getElementById("day-text").textContent = "Generazione in corso...";
  const resp = await fetch("/.netlify/functions/generate-today");
  const data = await resp.json();
  document.getElementById("day-text").textContent = data.text;

  // aggiorna i tre video
  ["vid1", "vid2", "vid3"].forEach((id, i) => {
    const vid = document.getElementById(id);
    vid.src = data.videos[i];
    vid.load();
  });
}

document.getElementById("generate").addEventListener("click", callGenerate);
document.getElementById("regenerate").addEventListener("click", callGenerate);
document.getElementById("archive").addEventListener("click", () => {
  alert("Opere archiviate!");
});
document.getElementById("download").addEventListener("click", () => {
  alert("Download 4K in preparazione...");
});
