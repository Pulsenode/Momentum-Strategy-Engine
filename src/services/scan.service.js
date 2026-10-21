// src/services/scan.services.js

const { fetchFromAPI }= require('../integrations/market.api'); // (../) mean go up one folder
const { calculateMomentumScore } = require('../core/strategy/momentum.strategy');
const { logInfo } = require('../utils/logger');


async function getSP500FromGitHub() {
  const url = 'https://raw.githubusercontent.com/datasets/s-and-p-500-companies/main/data/constituents.csv';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const companies = [];

    // Start at index 1 to skip the header line (Symbol, Security, etc.)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Basic CSV parser handling quotes for commas inside names
      const row = [];
      let inQuotes = false;
      let currentField = '';

      for (let char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          row.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      row.push(currentField.trim());

      const symbol = row[0];
      const name = row[1] ? row[1].replace(/^"|"$/g, '').trim() : '';

      if (symbol && name) {
        companies.push({ symbol, name });
      }
    }

    //console.log(JSON.stringify(companies, null, 2));
    return companies;
  } catch (error) {
    console.error('Error while fetching or parsing the S&P 500 CSV file:', error.message);
  }
}


async function runScan(fromDate) {
    //const sp500 = await fetchFromAPI("sp500_constituent");
    const sp500 = await getSP500FromGitHub();

    if (!sp500) return { results:[], top3: [] };

    const testStocks = sp500;//Scanning limit "sp500.slice(0, 10)" (e.g 10 first stocks) // sp500; alone to scan all stocks
       
    let results = [];

    for (const stock of testStocks) {
      const data = await fetchFromAPI("historical-price-full", stock.symbol,fromDate);
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