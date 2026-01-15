require('dotenv').config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3/";

// 1. DATA RECOVERY
async function fetchFromAPI(endpoint, symbol = "") {
  try {
    const url = `${BASE_URL}${endpoint}${symbol ? `/${symbol}` : ''}?apikey=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error : ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[API ERROR] sur ${endpoint}:`, error.message);
    return null;
  }
}

// 2. CALCULUS
function calculateMomentumScore(history) {
  if (!history || history.length <= 126) return 0;
  try {
    const c0 = history[0].close;    
    const c21 = history[21].close;  
    const c63 = history[63].close;  
    const c126 = history[126].close;

    const m1 = (c0 - c21) / c21;
    const m3 = (c0 - c63) / c63;
    const m6 = (c0 - c126) / c126;

    return (m1 + m3 + m6) / 3;
  } catch (error) {
    return 0; 
  }
}

// 3. ANALYSIS
async function startAnalysis() {
  console.log("🚀 Stock Analysis starting...");

  const sp500 = await fetchFromAPI("sp500_constituent");
  if (!sp500) return;
     
  const allStocks = sp500;
  let results = [];

  console.log(`🔍 Launching momentum analysis on ${allStocks.length} stocks...`);

  for (const stock of allStocks) {
    const data = await fetchFromAPI("historical-price-full", stock.symbol);

    if (data && data.historical && data.historical.length > 0) {

      const score = calculateMomentumScore(data.historical); 
      const lastPrice = data.historical[0].close;            

      results.push({
        Symbol: stock.symbol,
        Name: stock.name,
        Price: `${lastPrice.toFixed(2)} $`,
        Momentum: `${(score * 100).toFixed(2)} %`,
        rawScore: score 
      });

      console.log(`[${results.length}/${allStocks.length}] Scanned: ${stock.symbol}`);
    }

    await new Promise(res => setTimeout(res, 200)); 
  }

  console.log("\n✅ Analysis complete!");

  // Sorting and displaying top 3 results
  results.sort((a, b) => b.rawScore - a.rawScore);
  
  const top3 = results.slice(0, 3);

  console.log("\n🏆 TOP 3 MOMENTUM RECOMMANDATIONS :");
  console.table(top3, ["Symbol", "Name", "Price", "Momentum"]);

}

startAnalysis();

