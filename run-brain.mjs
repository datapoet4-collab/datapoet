import { getDailyState, getMarketsData, getPreciousMetals, getETHData, getBTCData } from './daily-brain.mjs';
import { writeFileSync, mkdirSync } from 'fs';
const data = await getDailyState();
const markets = await getMarketsData();
const metals = await getPreciousMetals();
const eth = await getETHData();
const btc = await getBTCData();
data.markets = markets;
data.metals = metals;
data.eth = eth;
data.btc = btc;
writeFileSync('./site/daily-state.json', JSON.stringify(data, null, 2));
// Salva archivio giornaliero
const today=new Date().toISOString().split('T')[0];
mkdirSync('./daily-archive',{recursive:true});
writeFileSync(`./daily-archive/${today}.json`, JSON.stringify(data, null, 2));
console.log('Archived:', today);

console.log('Brain updated:', data.clima);
console.log('Markets:', markets.avgChange+'%', markets.isUp?'▲':'▼');
console.log('Gold:', metals[0].price, 'USD', metals[0].change+'%');
console.log('Silver:', metals[1].price, 'USD', metals[1].change+'%');
console.log('ETH:', eth.price, 'USD', eth.change24h+'%', eth.change24h>=0?'BULL':'BEAR');
console.log('BTC:', btc.price, 'USD', btc.change24h+'%', btc.change24h>=0?'BULL':'BEAR');
