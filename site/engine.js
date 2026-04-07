// ATELIER AI — MOTORE VISIVO v2
// Pak + Asendorf + Sterling Ruby

export function createEngine(container, seed, state) {
  const W = container.clientWidth;
  const H = Math.round(W * 0.6667);
  container.style.height = H + 'px';

  const canvas = document.createElement('canvas');
  canvas.width = W * window.devicePixelRatio;
  canvas.height = H * window.devicePixelRatio;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const war = state.war || 0;
  const crisis = state.crisis || 0;
  const human = state.human || 0;
  const economy = state.economy || 0;
  const chaos = state.chaos || 0.5;
  const speed = state.speed || 0.012;
  const colorMode = state.colorMode || 0.3;
  const tension = Math.min(1, (war + crisis) / 30);

  // PALETTE — cambia con le notizie
  function getPalette() {
    if (tension > 0.6) return {
      // Sterling Ruby — rosso violento, nero bruciato, sangue
      bg: '#000000',
      primary: `hsl(${5 + seed*8}, 95%, 45%)`,
      secondary: `hsl(${20 + seed*5}, 80%, 30%)`,
      accent: `hsl(${350}, 100%, 60%)`,
      dark: '#0a0000',
    };
    if (tension > 0.3) return {
      // Pak — metallo, ruggine, ossido
      bg: '#020202',
      primary: `hsl(${25 + seed*10}, 70%, 40%)`,
      secondary: `hsl(${200 + seed*15}, 40%, 25%)`,
      accent: `hsl(${40}, 90%, 55%)`,
      dark: '#010101',
    };
    if (human > economy) return {
      // Asendorf — fluido, caldi, respiro
      bg: '#000508',
      primary: `hsl(${180 + seed*20}, 80%, 50%)`,
      secondary: `hsl(${220 + seed*10}, 70%, 40%)`,
      accent: `hsl(${160}, 90%, 60%)`,
      dark: '#000305',
    };
    return {
      // neutro — pietra, cenere
      bg: '#010101',
      primary: `hsl(${210 + seed*15}, 30%, 45%)`,
      secondary: `hsl(${220 + seed*8}, 20%, 30%)`,
      accent: `hsl(${200}, 50%, 60%)`,
      dark: '#010101',
    };
  }

  const P = getPalette();

  // PARTICELLE FLUSSO — Asendorf base
  const N = 25000;
  const px = new Float32Array(N), py = new Float32Array(N);
  const pvx = new Float32Array(N), pvy = new Float32Array(N);
  const plife = new Float32Array(N);
  const psize = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    px[i] = Math.random() * W;
    py[i] = Math.random() * H;
    plife[i] = Math.random();
    psize[i] = 0.5 + Math.random() * 1.5;
  }

  // GOCCE SPRAY — Sterling Ruby
  const SPRAY = tension > 0.4 ? 800 : 200;
  const sx = new Float32Array(SPRAY), sy = new Float32Array(SPRAY);
  const svx = new Float32Array(SPRAY), svy = new Float32Array(SPRAY);
  const slife = new Float32Array(SPRAY), ssize = new Float32Array(SPRAY);
  for (let i = 0; i < SPRAY; i++) {
    sx[i] = Math.random() * W;
    sy[i] = Math.random() * H;
    ssize[i] = 1 + Math.random() * (tension > 0.5 ? 8 : 3);
    slife[i] = Math.random();
  }

  // LINEE MATERIA — Pak
  const LINES = economy > 5 ? 60 : 30;
  const lx = new Float32Array(LINES), ly = new Float32Array(LINES);
  const langle = new Float32Array(LINES), llen = new Float32Array(LINES);
  for (let i = 0; i < LINES; i++) {
    lx[i] = Math.random() * W;
    ly[i] = Math.random() * H;
    langle[i] = Math.random() * Math.PI * 2;
    llen[i] = 20 + Math.random() * (economy * 3 + 40);
  }

  let t = seed * 100;
  let frame = 0;

  function draw() {
    requestAnimationFrame(draw);
    t += speed;
    frame++;

    // SFONDO — non pulisce tutto, lascia traccia (stile pittorico)
    const trailAlpha = tension > 0.5 ? 0.08 : 0.12;
    ctx.fillStyle = `rgba(0,0,0,${trailAlpha})`;
    ctx.fillRect(0, 0, W, H);

    // === PAK — LINEE MATERIA ===
    if (frame % 3 === 0) {
      for (let i = 0; i < LINES; i++) {
        const nx = lx[i] / W * 6 - 3;
        const ny = ly[i] / H * 6 - 3;
        const flow = Math.sin(nx * 0.8 + t * 0.3) + Math.cos(ny * 0.6 - t * 0.2);
        langle[i] += flow * 0.02 * chaos;
        lx[i] += Math.cos(langle[i]) * 0.8;
        ly[i] += Math.sin(langle[i]) * 0.8;
        if (lx[i] < 0) lx[i] = W; if (lx[i] > W) lx[i] = 0;
        if (ly[i] < 0) ly[i] = H; if (ly[i] > H) ly[i] = 0;

        const alpha = 0.15 + Math.sin(t + i) * 0.1;
        ctx.strokeStyle = i % 2 === 0 ? 
          `rgba(180,140,80,${alpha})` : 
          `rgba(120,100,60,${alpha * 0.6})`;
        ctx.lineWidth = 0.5 + (economy / 20);
        ctx.beginPath();
        ctx.moveTo(lx[i], ly[i]);
        ctx.lineTo(
          lx[i] + Math.cos(langle[i]) * llen[i],
          ly[i] + Math.sin(langle[i]) * llen[i]
        );
        ctx.stroke();
      }
    }

    // === ASENDORF — FLUSSO PARTICELLE ===
    for (let i = 0; i < N; i++) {
      const nx = px[i] / W * 8 - 4;
      const ny = py[i] / H * 8 - 4;
      const angle = (Math.sin(nx * 0.5 + t) + Math.cos(ny * 0.5 - t)) * chaos;
      pvx[i] = pvx[i] * 0.94 + Math.cos(angle) * speed * 80;
      pvy[i] = pvy[i] * 0.94 + Math.sin(angle) * speed * 80;
      px[i] += pvx[i]; py[i] += pvy[i];
      if (px[i] < 0) px[i] = W; if (px[i] > W) px[i] = 0;
      if (py[i] < 0) py[i] = H; if (py[i] > H) py[i] = 0;

      plife[i] += 0.002;
      if (plife[i] > 1) { plife[i] = 0; px[i] = Math.random() * W; py[i] = Math.random() * H; }

      const vel = Math.sqrt(pvx[i]*pvx[i] + pvy[i]*pvy[i]);
      const alpha = Math.min(0.9, vel * 0.08 + 0.1);
      ctx.fillStyle = i % 4 === 0 ? 
        `rgba(${tension>0.5?'255,60,0':'255,140,40'},${alpha})` :
        i % 4 === 1 ?
        `rgba(${tension>0.5?'200,20,0':'200,80,20'},${alpha*0.6})` :
        `rgba(${tension>0.5?'255,100,0':'255,180,60'},${alpha*0.4})` :
        `rgba(80,60,40,${alpha*0.3})`;
      ctx.fillRect(px[i], py[i], psize[i], psize[i]);
    }

    // === STERLING RUBY — SPRAY VIOLENTO ===
    if (tension > 0.3) {
      for (let i = 0; i < SPRAY; i++) {
        slife[i] += 0.008 + tension * 0.01;
        if (slife[i] > 1) {
          slife[i] = 0;
          // rinasce da un punto casuale — gesto spray
          sx[i] = Math.random() * W;
          sy[i] = Math.random() * H;
          svx[i] = (Math.random() - 0.5) * tension * 15;
          svy[i] = (Math.random() - 0.5) * tension * 15;
        }
        sx[i] += svx[i]; sy[i] += svy[i];
        svx[i] *= 0.96; svy[i] *= 0.96;

        const life = slife[i];
        const alpha = (1 - life) * 0.7 * tension;
        const size = ssize[i] * (1 - life * 0.5);
        ctx.fillStyle = life < 0.3 ?
          `rgba(255,${Math.round(20+life*100)},0,${alpha})` :
          `rgba(${Math.round(180-life*100)},0,0,${alpha*0.5})`;
        ctx.beginPath();
        ctx.arc(sx[i], sy[i], size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // VELO FINALE — strato pitttorico
    if (frame % 60 === 0 && tension > 0.4) {
      const grd = ctx.createRadialGradient(
        W/2 + (Math.random()-0.5)*W*0.5,
        H/2 + (Math.random()-0.5)*H*0.5,
        0,
        W/2, H/2, W * 0.6
      );
      grd.addColorStop(0, `rgba(${tension>0.6?'40,0,0':'20,10,0'},0.03)`);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }
  }

  draw();
  return canvas;
}
