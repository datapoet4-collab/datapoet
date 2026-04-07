import { execSync } from 'child_process';
import fs from 'fs';

const LOG = `${process.env.HOME}/Desktop/atelier-ai/scheduler.log`;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG, line + '\n');
}

async function runDaily() {
  log('Avvio generazione giornaliera...');
  try {
    execSync('node run-brain.mjs', { cwd: `${process.env.HOME}/Desktop/atelier-ai` });
    log('Notizie aggiornate.');
    // backup automatico
    const today = new Date().toISOString().split('T')[0];
    const archiveDir = `${process.env.HOME}/Desktop/atelier-ai/public/archive/${today}`;
    const backupDir = `${process.env.HOME}/Desktop/Atelier-Archivio/${today}`;
    fs.mkdirSync(backupDir, { recursive: true });
    if (fs.existsSync(archiveDir)) {
      execSync(`cp -r ${archiveDir}/* ${backupDir}/`);
      log(`Backup salvato in ${backupDir}`);
    }
    // salva stato del giorno
    execSync(`cp ${process.env.HOME}/Desktop/atelier-ai/site/daily-state.json ${backupDir}/stato-${today}.json`);
    log('Stato del giorno archiviato.');
  } catch(e) {
    log('Errore: ' + e.message);
  }
}

// gira subito
await runDaily();

// poi ogni 24 ore alle 7:00 di mattina
function msToNextRun() {
  const now = new Date();
  const next = new Date();
  next.setHours(7, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next - now;
}

setTimeout(async function tick() {
  await runDaily();
  setTimeout(tick, 24 * 60 * 60 * 1000);
}, msToNextRun());

log(`Scheduler attivo. Prossima generazione alle 07:00.`);
