import { fetchNews } from './fetch-news.mjs';

function clamp(n) { return Math.max(0, Math.min(1, n)); }

function score(text, words) {
  let hits = 0;
  for (const w of words) { if (text.includes(w)) hits++; }
  return hits;
}


// ESTRAI ENTITA' PRINCIPALI dalle notizie
function extractEntities(news){
  const entities=[];
  const titleText=news.slice(0,20).map(n=>n.title).join(' ');
  
  // PERSONE — politici e figure note
  const people=[
    {name:'Trump',keys:['trump'],type:'face',label:'Trump'},
    {name:'Putin',keys:['putin'],type:'face',label:'Putin'},
    {name:'Zelensky',keys:['zelensky'],type:'face',label:'Zelensky'},
    {name:'Biden',keys:['biden'],type:'face',label:'Biden'},
    {name:'Meloni',keys:['meloni'],type:'face',label:'Meloni'},
    {name:'Macron',keys:['macron'],type:'face',label:'Macron'},
    {name:'Netanyahu',keys:['netanyahu'],type:'face',label:'Netanyahu'},
    {name:'Xi',keys:['xi jinping','china president'],type:'face',label:'Xi Jinping'},
  ];
  
  // OGGETTI DI GUERRA
  const weapons=[
    {name:'missile',keys:['missile','rocket','ballistic'],type:'missile',label:'Missile'},
    {name:'drone',keys:['drone','uav','unmanned'],type:'drone',label:'Drone'},
    {name:'nave',keys:['ship','naval','warship','destroyer','carrier'],type:'ship',label:'Warship'},
    {name:'tank',keys:['tank','armored','panzer'],type:'tank',label:'Tank'},
    {name:'mitra',keys:['gun','rifle','weapon','armed','firearm','shooting'],type:'gun',label:'Weapons'},
    {name:'bomba',keys:['bomb','explosion','blast','explosive'],type:'bomb',label:'Bomb'},
    {name:'aereo',keys:['aircraft','fighter','jet','f-16','f-35','airforce'],type:'plane',label:'Fighter Jet'},
  ];
  
  // LUOGHI
  const places=[
    {name:'Gaza',keys:['gaza'],type:'place',label:'Gaza'},
    {name:'Ukraine',keys:['ukraine','ukrainian'],type:'place',label:'Ukraine'},
    {name:'Russia',keys:['russia','russian','moscow','kremlin'],type:'place',label:'Russia'},
    {name:'Cina',keys:['china','chinese','beijing'],type:'place',label:'China'},
    {name:'Iran',keys:['iran','iranian','tehran'],type:'place',label:'Iran'},
    {name:'Medio Oriente',keys:['middle east','israel','lebanon'],type:'place',label:'Middle East'},
  ];
  
  // ECONOMIA
  const economy=[
    {name:'Borsa',keys:['stocks','market crash','wall street','nasdaq'],type:'chart',label:'Stock Market'},
    {name:'Petrolio',keys:['oil','crude','opec'],type:'oil',label:'Oil'},
    {name:'Tariff',keys:['tariff','trade war','customs'],type:'tariff',label:'Tariffs'},
    {name:'Crypto',keys:['bitcoin','crypto','blockchain'],type:'crypto',label:'Crypto'},
  ];
  
  const t=titleText.toLowerCase();
  
  [...people,...places,...weapons,...economy].forEach(e=>{
    if(e.keys.some(k=>t.includes(k))){
      entities.push({name:e.name,type:e.type,label:e.label});
    }
  });
  
  
  // ORO e ARGENTO
  const goldKeys=['gold','oro','xau'];
  const silverKeys=['silver','argento','xag'];
  if(goldKeys.some(k=>t.includes(k))||true){ // sempre presente
    entities.push({name:'gold',type:'gold',label:'Gold'});
  }
  if(silverKeys.some(k=>t.includes(k))||true){ // sempre presente
    entities.push({name:'silver',type:'silver',label:'Silver'});
  }
  
  // CYBER / FULMINE
  const cyberKeys=['cyber','hack','blackout','attack on','ransomware','breach','malware','ddos','infrastructure attack'];
  if(cyberKeys.some(k=>t.includes(k))){
    entities.push({name:'cyber',type:'cyber',label:'Cyber Attack'});
  }

  // FARMACEUTICA
  const pharmaKeys=['vaccine','drug','fda','trial','cancer','treatment','breakthrough','clinical','pharma','medicine','antibiotic','therapy'];
  const pharmaFound=pharmaKeys.filter(k=>t.includes(k));
  if(pharmaFound.length>0){
    entities.push({name:'pharma',type:'pharma',label:'Medical Breakthrough'});
  }

  // max 5 entità — le più rilevanti
  return entities.slice(0,15);
}

// TITOLI PRINCIPALI
function getTopHeadlines(news){
  return news.slice(0,8).map(n=>n.title).filter(Boolean);
}

export async function getDailyState() {
  const news = await fetchNews();
  const text = news.map(n => `${n.title} ${n.summary}`).join(' | ').toLowerCase();

  const war = score(text, ['war','missile','drone','strike','army','military','attack','bomb','troops','invasion','nato','ukraine','gaza','russia','defense','conflict','shooting','killed','dead']);
  const crisis = score(text, ['crisis','collapse','emergency','panic','fear','chaos','disaster','catastrophe','threat','alarm','violent','fire','wildfire','flood','earthquake','evacuation','accident']);
  const economy = score(text, ['market','stocks','inflation','tariff','trade','economy','bank','recession','debt','earnings','oil','price','supply','factory','dollar','euro','gdp','unemployment']);
  const politics = score(text, ['president','prime minister','minister','government','parliament','election','court','policy','sanction','border','law','congress','trump','vote','summit','diplomat']);
  const human = score(text, ['people','children','families','refugees','home','survivors','victims','citizens','humanitarian','aid','hospital','rescue','hope','peace','protest','rights']);
  const tech = score(text, ['ai','chip','openai','meta','google','algorithm','robot','software','surveillance','data','cyber','hack','satellite','space','nuclear']);

  const total = war + crisis + economy + politics + human + tech || 1;
  const norm = (v, b=0) => clamp((v + b) / (total + b + 1));

  // PARAMETRI VISIVI
  const state = {
    // velocità particelle — guerra/crisis = più veloce
    speed: clamp(0.01 + norm(war,1)*0.06 + norm(crisis,1)*0.04),
    // caos del flusso — guerra = molto caotico
    chaos: clamp(0.3 + norm(war,1)*1.8 + norm(crisis,0.5)*1.2),
    // densità punti — economy = denso e pesante
    density: clamp(0.2 + norm(economy,1)*0.5 + norm(politics,0.5)*0.3),
    // colore dominante — 0=rosso guerra, 0.5=blu economy, 1=verde speranza
    colorMode: clamp(norm(human,1)*0.8 - norm(war,1)*0.6 + 0.3),
    // dimensione punti — crisis = più grandi e visibili
    pointSize: clamp(0.008 + norm(crisis,1)*0.02 + norm(war,0.5)*0.015),
    // trasparenza — giorni calmi = più trasparente e eterico
    opacity: clamp(0.4 + norm(war,1)*0.4 + norm(crisis,0.5)*0.2),
  };

  // TESTO CLIMA DEL GIORNO
  const tension = (war + crisis) / total;
  const economic = economy / total;
  const humanity = human / total;

  let clima = '';
  if (tension > 0.4) clima = 'High global tension. The world burns.';
  else if (tension > 0.25) clima = 'Moderate tension. Unstable equilibrium.';
  else if (economic > 0.3) clima = 'Money dominates. Markets and power.';
  else if (humanity > 0.3) clima = 'Human voices emerge from the noise.';
  else clima = 'Neutral day. The world breathes.';

  // NOMI OPERE generati dal clima
  const warNames = ['Fracture','Impact','Detonation','Line of Fire','Collapse'];
  const crisisNames = ['Drift','Threshold','Pressure','Lateral Tension','Before the Crash'];
  const econNames = ['Value','Peso Specifico','Massa Critica','Density','Gravity'];
  const humanNames = ['Resistance','Silenzio Prima','Return','Trace','Presence'];
  const neutralNames = ['State','Flow','Equilibrium','Field','Matter'];

  function pickName(arr, seed) {
    return arr[Math.floor((seed * 7 + war + crisis) % arr.length)];
  }

  const names = tension > 0.35 ? warNames : tension > 0.2 ? crisisNames : economic > 0.3 ? econNames : humanity > 0.3 ? humanNames : neutralNames;

  const opere = [
    { nome: pickName(names, 1), desc: `Work one. ${clima} Signals: conflict ${war}, crisis ${crisis}, economy ${economy}.` },
    { nome: pickName(names, 2), desc: `Work two. Matter reacts. Politics ${politics}, humanity ${human}.` },
    { nome: pickName(names, 3), desc: `Work three. Variation. Tech ${tech}, total tension ${Math.round(tension*100)}%.` },
  ];

  const entities=extractEntities(news);
  const headlines=getTopHeadlines(news);
  return {
    entities,
    headlines, state, clima, opere, signals: { war, crisis, economy, politics, human, tech } };
}

// TEST
const { state, clima, opere, signals } = await getDailyState();
console.log('\n=== CLIMA DEL GIORNO ===');
console.log(clima);
console.log('\n=== SEGNALI ===');
console.log(signals);
console.log('\n=== PARAMETRI VISIVI ===');
console.log(state);
console.log('\n=== OPERE ===');
opere.forEach((o,i) => console.log(`\nOpera ${i+1}: "${o.nome}"\n${o.desc}`));

export async function getBTCData(){
  try{
    const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    const d=await r.json();
    return {price:Math.round(d.bitcoin.usd), change24h:parseFloat(d.bitcoin.usd_24h_change.toFixed(2))};
  }catch(e){return {price:0,change24h:0};}
}

export async function getETHData(){
  try{
    const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true');
    const d=await r.json();
    return {price:Math.round(d.ethereum.usd), change24h:parseFloat(d.ethereum.usd_24h_change.toFixed(2))};
  }catch(e){return {price:0,change24h:0};}
}

export async function getPreciousMetals(){
  try{
    const symbols=['GC=F','SI=F']; // Gold, Silver futures
    const names=['Gold','Silver'];
    const results=[];
    for(let i=0;i<symbols.length;i++){
      try{
        const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbols[i]}?interval=1d&range=2d`);
        const d=await r.json();
        const closes=d.chart.result[0].indicators.quote[0].close;
        const prev=closes[closes.length-2];
        const last=closes[closes.length-1];
        const change=((last-prev)/prev*100);
        results.push({name:names[i],price:Math.round(last*100)/100,change:parseFloat(change.toFixed(2))});
      }catch(e){results.push({name:names[i],price:0,change:0});}
    }
    return results;
  }catch(e){return [{name:'Gold',price:0,change:0},{name:'Silver',price:0,change:0}];}
}

export async function getMarketsData(){
  try{
    const symbols=['%5EGSPC','%5EN225','%5EFTSE'];
    const names=['S&P 500','Nikkei','FTSE'];
    const results=[];
    for(let i=0;i<symbols.length;i++){
      try{
        const r=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbols[i]}?interval=1d&range=2d`);
        const d=await r.json();
        const closes=d.chart.result[0].indicators.quote[0].close;
        const prev=closes[closes.length-2];
        const last=closes[closes.length-1];
        const change=((last-prev)/prev*100);
        results.push({name:names[i],price:Math.round(last),change:parseFloat(change.toFixed(2))});
      }catch(e){results.push({name:names[i],price:0,change:0});}
    }
    const valid=results.filter(r=>r.price>0&&Math.abs(r.change)<20);
    const avgChange=valid.length>0?valid.reduce((a,b)=>a+b.change,0)/valid.length:0;
    return {markets:results,avgChange:parseFloat(avgChange.toFixed(2)),isUp:avgChange>=0};
  }catch(e){return {markets:[],avgChange:0,isUp:true};}
}
