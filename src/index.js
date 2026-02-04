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

async function envoyerEmailRapport(top3, ventes, achats) {
 
const ventesHtml = ventes.length > 0 
    ? ventes.map(v => `<li style="color: #d9534f;">❌ <b>Vendu</b> : ${v.symbol} à ${v.price}$</li>`).join('')
    : "<li>Aucune vente effectuée.</li>";

  // 2. On crée le texte pour les achats
  const achatsHtml = achats.length > 0 
    ? achats.map(a => `<li style="color: #5cb85c;">✅ <b>Acheté</b> : ${a.symbol} à ${a.price}$</li>`).join('')
    : "<li>Aucun nouvel achat.</li>";

  // 3. Le tableau du Top 3
  const tableRows = top3.map(stock => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;"><b>${stock.Symbol}</b></td>
      <td style="border: 1px solid #ddd; padding: 8px;">${stock.Name}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${stock.Price}$</td>
      <td style="border: 1px solid #ddd; padding: 8px; color: green;">${stock.Momentum}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2>📊 Rapport d'Activité du Bot</h2>
      
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h3>🔄 Mouvements du jour :</h3>
        <ul style="list-style: none; padding-left: 0;">
          ${ventesHtml}
          ${achatsHtml}
        </ul>
      </div>

      <h3>🏆 Top 3 Momentum Actuel :</h3>
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
    </div>
  `;

  try {
    const data = await resend.emails.send({
      from: 'MomentumScanner <onboarding@resend.dev>',
      to: ['dedieuclementpro@gmail.com'], 
      subject: `📊 Bot : ${achats.length} achats / ${ventes.length} ventes`,
      html: htmlContent,
    });
    console.log("📧 Email détaillé envoyé avec succès !", data.id);
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

    // 2. S&P 500 RECOVERY
    const sp500 = await fetchFromAPI("sp500_constituent");
    if (!sp500) return;

    
    const testStocks = sp500.slice(0, 10);
       
    let results = [];
    console.log(`🔍 Launching momentum analysis on ${sp500.length} stocks...`);

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

    const BUDGET_TOTAL = 1500;
    const BUDGET_PAR_ACTION = 500;
    const today = new Date().toISOString().split('T')[0];
    let ventesDuJour = [];
    let achatsDuJour = [];

    //CHECKING OPEN POSITIONS TO SELL IF NEEDED

    const [openPositions] = await connection.execute(
    "SELECT * FROM TRADES_HISTORY WHERE status = 'OPEN'"
    );
    for (const position of openPositions) {
      const stillInTop3 = top3.find(s => s.Symbol === position.symbol);

      if (!stillInTop3) {
        const currentData = results.find(r => r.Symbol === position.symbol);
        const sellPrice = currentData ? currentData.Price : position.buy_price;

        await connection.execute(
          `UPDATE TRADES_HISTORY 
          SET sell_price = ?, status = 'CLOSED', exit_date = ? 
          WHERE id = ?`,
          [sellPrice, today, position.id]
        );

        ventesDuJour.push({ symbol: position.symbol, price: sellPrice });
        console.log(`⚠️ VENDU : ${position.symbol} (sorti du Top 3)`);
      }
    }


    // CHEKING STOCKS POSITION TO AVOID DUPLICATE PURCHASES

    for (const stock of top3) {
        const [existing] = await connection.execute(
          "SELECT id FROM TRADES_HISTORY WHERE symbol = ? AND status = 'OPEN'",
          [stock.Symbol]
        );
        if (existing.length > 0) {
          console.log(`⏭️  ${stock.Symbol} est déjà en portefeuille, on ne fait rien.`);
        } else {
          const quantity = BUDGET_PAR_ACTION / stock.Price;
          await connection.execute(
                `INSERT INTO TRADES_HISTORY (symbol, buy_price, quantity, status, entry_date, momentum_score) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [stock.Symbol, stock.Price, quantity, 'OPEN', today, stock.rawScore]
          );

          achatsDuJour.push({ symbol: stock.Symbol, price: stock.Price });

          console.log(`🛒 NOUVEL ACHAT : ${stock.Symbol}`);
        }
    }

    await envoyerEmailRapport(top3, ventesDuJour, achatsDuJour);

  console.log("Analysis and update successfully completed.");

    // 6. SENDING THE REPORT BY EMAIL

  } catch (error) {
    console.error("❌ Erreur :");
    console.error("Code :", error.code);
    console.error("Message :", error.message);

    // If the error comes from the database (Code ER_ACCESS_DENIED_ERROR, ECONNREFUSED, etc.)
    if (error.code && (error.code.includes('ER_') || error.code === 'ECONNREFUSED')) {
      console.log("📧 Envoi de l'alerte mail...");
      
      await resend.emails.send({
        from: 'MomentumScanner <onboarding@resend.dev>',
        to: ['dedieuclementpro@gmail.com'], 
        subject: '⚠️ ALERTE : Erreur de connexion Base de Données',
        html: `
          <h1>Problème sur ton Bot Momentum</h1>
          <p>Le programme s'est arrêté car il ne peut pas se connecter à MariaDB.</p>
          <p><b>Erreur :</b> ${error.message}</p>
          <p>Date : ${new Date().toLocaleString()}</p>
        `,
      });

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

