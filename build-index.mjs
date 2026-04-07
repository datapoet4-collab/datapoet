import {readFileSync,writeFileSync} from 'fs';

const state=JSON.parse(readFileSync('./site/daily-state.json','utf8'));
const eth=state.eth||{price:0,change24h:0};
const btc=state.btc||{price:0,change24h:0};
const nETH=state.nETH!==undefined?state.nETH:(eth.price<=0?0:Math.max(2,Math.min(40,Math.round(eth.price/200))));
const nBTC=state.nBTC!==undefined?state.nBTC:(btc.price<=1?0:Math.max(2,Math.min(50,Math.round(btc.price/2000))));
const ethBull=eth.change24h>=0;
const btcBull=btc.change24h>=0;
const metals=state.metals||[{name:'Gold',price:0,change:0},{name:'Silver',price:0,change:0}];
const headlines=state.headlines||[];
const entities=state.entities||[];
const sig=state.signals||{war:0,crisis:0,economy:0,politics:0,human:0,tech:0};
const clima=state.clima||'Moderate tension.';

const gold=metals[0]||{price:0,change:0};
const silver=metals[1]||{price:0,change:0};
const nGold=Math.max(3,Math.min(20,Math.round(gold.price/200)));
const nSilver=Math.max(3,Math.min(20,Math.round(silver.price/4)));

const palScores=[[0,sig.war||0],[1,sig.economy||0],[2,sig.tech||0],[3,sig.politics||0],[4,sig.crisis||0],[5,sig.human||0]];
const fixedPal=palScores.sort((a,b)=>b[1]-a[1])[0][0];

import {readdirSync} from 'fs';
const stables=readdirSync('./site').filter(f=>f.startsWith('index-STABLE-')).sort().reverse();
const baseFile='./site/'+(stables[0]||'index-STABLE-202604071016.html');
console.log('Base template:',baseFile);
let html=readFileSync(baseFile,'utf8');

const _war=state.signals?.war||0;
const _tech=state.signals?.tech||0;
const _human=state.signals?.human||0;
const _crisis=state.signals?.crisis||0;
html=html.replace(/const HAS_DRONE=[^;]+;/,`const HAS_DRONE=${_war>=3||_tech>=2};`);
html=html.replace(/const HAS_PLANE=[^;]+;/,`const HAS_PLANE=${_war>=4};`);
html=html.replace(/const HAS_TANK=[^;]+;/,`const HAS_TANK=${_war>=6};`);
html=html.replace(/const HAS_BOMB=[^;]+;/,`const HAS_BOMB=${_war>=8};`);
html=html.replace(/const HAS_SAT=[^;]+;/,`const HAS_SAT=${_tech>=1||_war>=5};`);
html=html.replace(/const HAS_SHIP=[^;]+;/,`const HAS_SHIP=${_war>=3||_crisis>=2};`);
html=html.replace(/const HAS_ROCKET=[^;]+;/,`const HAS_ROCKET=${_tech>=3};`);
html=html.replace(/const HAS_PHARMA=[^;]+;/,`const HAS_PHARMA=${_human>=4||_crisis>=3};`);


html=html.replace(/<div id="clima">.*?<\/div>/,`<div id="clima">${clima}</div>`);
html=html.replace(/Gold \$[\d.]+ [▲▼] [\d.]+%/,`Gold $${gold.price} ${(gold.change||0)>0?'▲':'▼'} ${Math.abs(gold.change||0).toFixed(2)}%`);
html=html.replace(/Silver \$[\d.]+ [▲▼] [\d.]+%/,`Silver $${silver.price} ${(silver.change||0)>0?'▲':'▼'} ${Math.abs(silver.change||0).toFixed(2)}%`);

const newsHtml=headlines.slice(0,5).map(h=>`<div class="news-item">\u2022 ${h}</div>`).join('');
html=html.replace(/<div class="news-item">[\s\S]*?(?=<\/div>\s*<div id="entities"|<\/div>\s*<div class="entity-bar")/, newsHtml+'</div><div _del="1">');

const entHtml=entities.map(e=>`<span class="entity">${e.label}</span>`).join('');
html=html.replace(/<span class="entity">[\s\S]*?(?=<\/div>)/, entHtml);

html=html.replace(/const ENTITIES=\[[\s\S]*?\];/,`const ENTITIES=${JSON.stringify(entities)};`);
html=html.replace(/const SIG=\{[\s\S]*?\};/,`const SIG={war:${sig.war||0},crisis:${sig.crisis||0},economy:${sig.economy||0},politics:${sig.politics||0},human:${sig.human||0},tech:${sig.tech||0}};`);
html=html.replace(/const METALS=\[[\s\S]*?\];/,`const METALS=${JSON.stringify(metals)};`);
html=html.replace(/const DAILY_DATE=[^;]+;/,`const DAILY_DATE='${state.date||new Date().toISOString().split('T')[0]}';`);
html=html.replace(/const N_GOLD=[^;]+;/,`const N_GOLD=${nGold};`);
html=html.replace(/const N_SILVER=[^;]+;/,`const N_SILVER=${nSilver};`);
html=html.replace(/const N_ETH=[^;]+;/,`const N_ETH=${nETH};`);
html=html.replace(/const N_BTC=[^;]+;/,`const N_BTC=${nBTC};`);
html=html.replace(/const ETH_BULL=[^;]+;/,`const ETH_BULL=${ethBull};`);
html=html.replace(/const BTC_BULL=[^;]+;/,`const BTC_BULL=${btcBull};`);
html=html.replace(/const ETH_PRICE=[^;]+;/,`const ETH_PRICE=${eth.price};`);
html=html.replace(/ETH_PRICE_VAL=[^;]+;/,`ETH_PRICE_VAL=${eth.price};`);
html=html.replace(/BTC_PRICE_VAL=[^;]+;/,`BTC_PRICE_VAL=${btc.price};`);
html=html.replace(/ETH_BULL_TEXT/g,eth.change24h>=0?'▲ BULL':'▼ BEAR');
html=html.replace(/BTC_BULL_TEXT/g,btc.change24h>=0?'▲ BULL':'▼ BEAR');
html=html.replace(/const BTC_PRICE=[^;]+;/,`const BTC_PRICE=${btc.price};`);
html=html.replace(/let palIdx=\d+;[^\n]*/,`let palIdx=${fixedPal};`);

writeFileSync('./site/index.html',html);
console.log('✅ build ok — pal:'+fixedPal+' war:'+sig.war+' headlines:'+headlines.length);
