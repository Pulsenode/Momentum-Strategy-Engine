// src/services/scan.services.js

const { fetchFromAPI }= require('../integrations/market.api'); // (../) mean go up one folder
const { calculateMomentumScore } = require('../core/strategy/momentum.strategy');
const { logInfo } = require('../utils/logger');
    

async function runScan() {
    const sp500 = await fetchFromAPI("sp500_constituent");
    if (!sp500) return { results:[], top3: [] };

    const testStocks = sp500.slice(0, 15);//Scanning limit "sp500.slice(0, 10)" (e.g 10 first stocks) // sp500; alone to scan all stocks
       
    let results = [];

    for (const stock of testStocks) {
      const data = await fetchFromAPI("historical-price-full", stock.symbol);
      if (data && data.historical && data.historical.length > 0) {
        const score = calculateMomentumScore(data.historical); 
        const lastPrice = data.historical[0].close;            

        results.push({
          Symbol: stock.symbol,
          Name: stock.name,
          Price: lastPrice, // We keep the raw number for the DB
          Momentum: `${(score * 100).toFixed(2)} %`,
          rawScore: score 
        });
        logInfo(`[${results.length}/${sp500.length}] Scanned: ${stock.symbol}`);
      }
      // Short delay for the API
      const { sleep } = require('../utils/throttle');
      await sleep(150); 

    }

    results.sort((a, b) => b.rawScore - a.rawScore);
    const top3 = results.slice(0, 3);
    logInfo("\n🏆 TOP 3 MOMENTUM RECOMMANDATIONS :");
    console.table(top3);

    return {results, top3};
}

module.exports = {runScan}