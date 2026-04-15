require('dotenv').config();

const { sendEmail } = require('../integrations/mailer');

async function sendReportEmail(top3, ventes, achats, erreurs) {

    const now = new Date().toLocaleString();

    // 📊 CALCULATIONS
    const totalAchats = achats.reduce((sum, a) => sum + (a.price * a.qty), 0);
    const totalVentes = ventes.reduce((sum, v) => sum + (v.price * v.qty), 0);
    const pnl = totalVentes - totalAchats;

    const pnlColor = pnl >= 0 ? "#16a34a" : "#dc2626";
    const pnlSign = pnl >= 0 ? "+" : "";


    // 🧠 INSIGHT & SUMMARY
    let insight;
    if (pnl > 0 && achats.length > ventes.length) {
        insight = "📈 Aggressive buying paid off today.";
    } else if (pnl < 0 && ventes.length > achats.length) {
        insight = "📉 Selling pressure dominated, strategy needs review.";
    } else {
        insight = "⚖️ Mixed signals, market uncertain.";
    }


    // 🏆 BEST / WORST TRADES
    const bestTrade = ventes.reduce((best, v) => 
        (!best || v.price > best.price ? v : best), null);
    const worstTrade = achats.reduce((worst, a) => 
        (!worst || a.price > worst.price ? a : worst), null);


    // ⚠️ RISK DETECTION

    let riskWarning = "";

    if (erreurs.length > 3) {
        riskWarning += "⚠️ High number of failed trades. ";
    }

    if (pnl < -50) {
        riskWarning += "🚨 Significant loss detected.";
    }

    // =========================
    // 🎯 BOT SCORE
    // =========================
    let score = 0;

    if (pnl > 0) score += 50;
    if (achats.length > 0) score += 10;
    if (ventes.length > 0) score += 10;
    if (erreurs.length === 0) score += 30;

    // =========================
    // 🔄 MOVEMENTS
    // =========================
    const ventesHtml = ventes.length > 0 
        ? ventes.map(v => `
            <li style="margin-bottom:6px;color:#dc2626;">
                🔴 SELL — ${v.qty} x ${v.symbol} @ ${v.price}$
            </li>`).join('')
        : "<li style='color:#6b7280;'>No sales</li>";

    const achatsHtml = achats.length > 0 
        ? achats.map(a => `
            <li style="margin-bottom:6px;color:#16a34a;">
                🟢 BUY — ${a.qty} x ${a.symbol} @ ${a.price}$
            </li>`).join('')
        : "<li style='color:#6b7280;'>No buys</li>";

    const erreursHtml = erreurs.length > 0 
        ? erreurs.map(e => `
            <li style="margin-bottom:6px;color:#f59e0b;">
                🟠 ERROR — ${e.symbol} (${e.price}$)
            </li>`).join('')
        : "";

    // =========================
    // 📈 TABLE
    // =========================
    const tableRows = top3.map((stock, index) => {
        const trend = stock.Momentum >= 0 ? "🔼" : "🔽";
        const trendColor = stock.Momentum >= 0 ? "#16a34a" : "#dc2626";

        return `
        <tr style="background:${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
            <td style="padding:10px;"><b>${stock.Symbol}</b></td>
            <td style="padding:10px;">${stock.Name}</td>
            <td style="padding:10px;">${stock.Price}$</td>
            <td style="padding:10px;color:${trendColor};font-weight:bold;">
                ${trend} ${stock.Momentum}
            </td>
        </tr>`;
    }).join('');

    // =========================
    // 📧 EMAIL TEMPLATE
    // =========================
    const htmlContent = `
    <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
        <div style="max-width:620px;margin:auto;background:white;border-radius:12px;overflow:hidden;">

            <!-- HEADER -->
            <div style="background:#111827;color:white;padding:20px;text-align:center;">
                <h2>📊 Momentum Bot</h2>
                <p>${now}</p>
            </div>

            <!-- SCORE -->
            <div style="text-align:center;padding:20px;">
                <h3>Bot Score: ${score}/100</h3>
            </div>

            <!-- PNL -->
            <div style="text-align:center;">
                <p style="font-size:24px;color:${pnlColor};">
                    ${pnlSign}${pnl.toFixed(2)} $
                </p>
                <p>${insight}</p>
            </div>

            <!-- RISK -->
            ${riskWarning ? `
                <div style="background:#fff3cd;padding:15px;margin:20px;border-radius:8px;">
                    ${riskWarning}
                </div>
            ` : ""}

            <!-- BEST / WORST -->
            <div style="padding:20px;">
                <p><b>🏆 Best Trade:</b> ${bestTrade ? `${bestTrade.symbol} @ ${bestTrade.price}$` : "N/A"}</p>
                <p><b>❌ Worst Buy:</b> ${worstTrade ? `${worstTrade.symbol} @ ${worstTrade.price}$` : "N/A"}</p>
            </div>

            <!-- MOVEMENTS -->
            <div style="padding:20px;">
                <h3>Activity</h3>
                <ul style="list-style:none;padding:0;">
                    ${achatsHtml}
                    ${ventesHtml}
                    ${erreursHtml}
                </ul>
            </div>

            <!-- TABLE -->
            <div style="padding:20px;">
                <h3>Top Momentum</h3>
                <table style="width:100%;">
                    ${tableRows}
                </table>
            </div>

            <!-- FOOTER -->
            <div style="text-align:center;font-size:12px;padding:15px;">
                Generated automatically
            </div>

        </div>
    </div>
    `;

    // =========================
    // 📤 SEND EMAIL
    // =========================
    try {
        const data = await sendEmail({
            to: ['dedieuclementpro@gmail.com'],
            subject: `📊 Report | PnL ${pnlSign}${pnl.toFixed(2)}$ | Score ${score}/100`,
            html: htmlContent,
        });

        console.log("📧 Email sent!", data.id);

    } catch (error) {
        console.error("❌ Email error:", error);
    }
}

module.exports = { sendReportEmail };