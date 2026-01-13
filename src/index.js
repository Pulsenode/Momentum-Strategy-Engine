require ('dotenv').config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3/";


async function fetchFromAPI(endpoint, symbol = "") {
  try {

    const url = `${BASE_URL}${endpoint}${symbol ? `/${symbol}` : ''}?apikey=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error : ${response.status}`)
    };

    return await response.json();
  } catch (error) {
    console.error(`[API ERROR] sur ${endpoint}:`, error.message);
    return null;
  }
}


async function demarrerAnalyse() {
  console.log("🚀 Stock Analysis starting...");

  const sp500 = await fetchFromAPI("sp500_constituent");
  
  if (!sp500 || sp500.length === 0) {
    console.error("❌ Failed to fetch S&P 500 list. Please check your API key.");
    return; 
  }
     
  const top100 = sp500.slice(0, 100);
  
  console.log(`✅ List successfully retrieved! ${sp500.length} stocks found.`);
  console.log(`🔍 Launching momentum analysis on the top 100...`);

  for (const stock of top100) {

  console.log(`Processing: ${stock.symbol}...`);

  const data = await fetchFromAPI("historical-price-full", stock.symbol);


    if (data && data.historical) {
      const score = calculateMomentumScore(data.historical);
      
      console.log(`📊 ${stock.symbol} | Score: ${(score * 100).toFixed(2)}%`);
    }

    await new Promise(res => setTimeout(res, 200)); 
  }

  console.log("✅ Analysis complete!");
}


demarrerAnalyse();

function calculateMomentumScore(history) {
  
  if (!history || history.length <= 126) {
    return 0;
  }

  try {
    const c0 = history[0].close;    // Price Today
    const c21 = history[21].close;  // Price 1 month ago
    const c63 = history[63].close;  // Price 3 months ago
    const c126 = history[126].close;// Price 6 months ago

    const m1 = (c0 - c21) / c21;
    const m3 = (c0 - c63) / c63;
    const m6 = (c0 - c126) / c126;

    return (m1 + m3 + m6) / 3;
  } catch (error) {
    return 0; 
  }
}