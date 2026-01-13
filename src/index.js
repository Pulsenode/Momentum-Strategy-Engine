require('dotenv').config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3/";

// 1. FONCTION DE RÉCUPÉRATION (Pure et simple)
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

// 2. FONCTION DE CALCUL (Dédiée aux mathématiques)
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

// 3. LE CHEF D'ORCHESTRE (Logique métier)
async function demarrerAnalyse() {
  console.log("🚀 Stock Analysis starting...");

  const sp500 = await fetchFromAPI("sp500_constituent");
  if (!sp500) return;
     
  const top100 = sp500.slice(0, 100);
  let results = [];

  console.log(`🔍 Launching momentum analysis on 100 stocks...`);

  for (const stock of top100) {
    const data = await fetchFromAPI("historical-price-full", stock.symbol);

    if (data && data.historical) {
      const score = calculateMomentumScore(data.historical);
      results.push({
        symbol: stock.symbol,
        name: stock.name,
        momentum: score
      });
      console.log(`[${results.length}/100] Scanned: ${stock.symbol}`);
    }
    // Pause pour respecter les limites de l'API
    await new Promise(res => setTimeout(res, 200)); 
  }

  console.log("✅ Analysis complete!");

  // --- PHASE FINALE : LE TRI (Placé ici, il s'exécutera enfin !) ---
  console.log("\n--- 🏆 TOP 3 MOMENTUM ---");
  
  results.sort((a, b) => b.momentum - a.momentum);

  const winners = results.slice(0, 3);
  winners.forEach((winner, index) => {
    console.log(`${index + 1}. ${winner.symbol} (${winner.name}) : ${(winner.momentum * 100).toFixed(2)}%`);
  });
}

demarrerAnalyse();