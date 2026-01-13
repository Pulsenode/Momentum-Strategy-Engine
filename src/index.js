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

  console.log(`Processing: ${stock.symbol} (${stock.name})`);
  const history = await fetchFromAPI("historical-price-full", stock.symbol);
  console.log(history);

}

 if (history) {
      console.log(`📊 Data received for ${stock.symbol}`);
    }
}

demarrerAnalyse();
