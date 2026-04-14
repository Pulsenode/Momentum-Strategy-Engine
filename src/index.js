require('dotenv').config();

const mysql = require('mysql2/promise');
const { sendReportEmail } = require('./services/email.service');
const {
  createTradeTable,
  getOpenPositions,
  closePosition,
  createPosition,
  findOpenPositionBySymbol
} = require('./repositories/trade.repo');

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3/";
const BUDGET_PAR_ACTION = 10000; // Temporary




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

    return (m1 + m3 + m6);
  } catch (error) {
    return 0; 
  }
}


// 3. ANALYSIS

async function startAnalysis() {
  console.log("🚀 Stock Analysis starting...");

  let connection; 

  //Coneection info for the DATABASE
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD, 
      database: process.env.DB_DATABASE,
    });

    console.log("🚀 Connexion réussie à MYSQL ! ID :", connection.threadId);

    await createTradeTable(connection);

    const openPositions = await getOpenPositions(connection);

    

    console.log("✅ Table TRADES_HISTORY ready");

    // 2. S&P 500 RECOVERY
    const sp500 = await fetchFromAPI("sp500_constituent");
    if (!sp500) return;

    
    const testStocks = sp500.slice(0, 10);
       
    let results = [];
    console.log(`Launching momentum analysis on ${testStocks.length} stocks...`);

    // 3. SCAN OF 503 STOCKS
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
        console.log(`[${results.length}/${sp500.length}] Scanned: ${stock.symbol}`);
      }
      // Short delay for the API
      await new Promise(res => setTimeout(res, 150)); 
    }

    // 4. SORTING AND TOP 3
    results.sort((a, b) => b.rawScore - a.rawScore);
    const top3 = results.slice(0, 3);
    console.log("\n🏆 TOP 3 MOMENTUM RECOMMANDATIONS :");
    console.table(top3);


    const today = new Date().toISOString().split('T')[0];
    let ventesDuJour = [];
    let achatsDuJour = [];
    let erreursBudget = [];

    //CHECKING OPEN POSITIONS TO SELL IF NEEDED

    for (const position of openPositions) {
      const stillInTop3 = top3.find(s => s.Symbol === position.symbol);

      if (!stillInTop3) {
        const currentData = results.find(r => r.Symbol === position.symbol);
        const sellPrice = currentData ? currentData.Price : position.buy_price;

        await closePosition(connection, sellPrice, today, position.id);

          ventesDuJour.push({ 
      symbol: position.symbol, 
      price: sellPrice, 
      qty: position.quantity // On récupère la quantité depuis la DB
  });
        console.log(`⚠️ VENDU : ${position.symbol} (sorti du Top 3)`);
      }
    }


    // CHEKING STOCKS POSITION TO AVOID DUPLICATE PURCHASES

    for (const stock of top3) {

        const existing = await findOpenPositionBySymbol(connection, stock.Symbol);

        if (existing.length > 0) {
          console.log(`⏭️  ${stock.Symbol} est déjà en portefeuille, on ne fait rien.`);
        } else {

          const quantity = Math.floor(BUDGET_PAR_ACTION / stock.Price);

         if (quantity > 0) {

            await createPosition(connection, stock, quantity, today);

            achatsDuJour.push({ 
                symbol: stock.Symbol, 
                price: stock.Price, 
                qty: quantity 
            });

            console.log(`🛒 NOUVEL ACHAT : ${quantity} x ${stock.Symbol}`);
          } else {

            erreursBudget.push({ symbol: stock.Symbol, price: stock.Price });
            console.log(`⚠️ Budget trop faible pour acheter ${stock.Symbol} (Prix: ${stock.Price}$, Budget: ${BUDGET_PAR_ACTION}$)`);
          }
        }
    }

    await sendReportEmail(top3, ventesDuJour, achatsDuJour, erreursBudget);
  console.log("Analysis and update successfully completed.");

    // 6. SENDING THE REPORT BY EMAIL

  } catch (error) {
    console.error("❌ Erreur :");
    console.error("Code :", error.code);
    console.error("Message :", error.message);

    // If the error comes from the database (Code ER_ACCESS_DENIED_ERROR, ECONNREFUSED, etc.)
    if (error.code && (error.code.includes('ER_') || error.code === 'ECONNREFUSED')) {
      console.log("📧 Envoi de l'alerte mail...");
      
      await sendReportEmail([], [], [], []);

      console.log("🛑 Programme stoppé suite à l'erreur DB.");
      process.exit(1);
    }


} finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Connexion fermée.");
    }
  }
}

startAnalysis();

