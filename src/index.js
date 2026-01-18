require('dotenv').config();

const mysql = require('mysql2/promise');
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

    return (m1 + m3 + m6);
  } catch (error) {
    return 0; 
  }
}



// EMAIL TESTING WITH RESEND
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function envoyerEmailRapport(top3) {
 
  const tableRows = top3.map(stock => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>${stock.Symbol}</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">${stock.Name}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${stock.Price}</td>
      <td style="border: 1px solid #ddd; padding: 8px; color: green;">${stock.Momentum}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <h2>🏆 Top 3 Momentum - Rapport Hebdomadaire</h2>
    <p>Voici les meilleures opportunités détectées par ton scanner :</p>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Symbole</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nom</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Prix</th>
          <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Momentum</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <p><br><i>Ce rapport a été généré automatiquement par ton programme.</i></p>
  `;

  try {
    const data = await resend.emails.send({
      from: 'MomentumScanner <onboarding@resend.dev>',
      to: ['dedieuclementpro@gmail.com'], 
      subject: '📊 Ton Rapport Momentum Hebdomadaire',
      html: htmlContent,
    });
    console.log("📧 Email envoyé avec succès !", data.id);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
  }
}



// 3. ANALYSIS

async function startAnalysis() {
  console.log("🚀 Stock Analysis starting...");

  let connection; 

  try {
 
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASSWORD, 
      database: 'MSE'
    });

    console.log("🚀 Connexion réussie à MariaDB ! ID :", connection.threadId);

    const [rows] = await connection.execute('SELECT * FROM TRADES_HISTORY');

    if (rows.length === 0) {
      console.log("📋 La table TRADES_HISTORY est vide.");
    } else {
      console.log("✅ Données actuelles dans la table TRADES_HISTORY :");
      console.table(rows); 
    }

  } catch (error) {
    console.error("❌ Erreur :");
    console.error("Code :", error.code);
    console.error("Message :", error.message);
  } finally {

    if (connection) {
      await connection.end();
      console.log("🔌 Connexion fermée proprement.");
    }
  }




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

  await envoyerEmailRapport(top3);

}

startAnalysis();

