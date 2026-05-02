require('dotenv').config();

const { sendEmail } = require('../integrations/mailer');

async function sendReportEmail({
  top3,
  ventes,
  achats,
  erreurs,
  report,
  users,
}) {
  const pnl = report.pnl;
  const score = report.score;
  const insight = report.insight;
  const bestTrade = report.bestTrade;
  const worstTrade = report.worstTrade;
  const riskWarning = report.riskWarning;

  const pnlColor = pnl >= 0 ? "#16a34a" : "#dc2626";
  const pnlSign = pnl >= 0 ? "+" : "";
  const now = new Date().toLocaleString();

  const validUsers = users.filter(user => user.email);

  if (validUsers.length === 0) {
    throw new Error("No email recipients found in USERS table");
  }

  for (const user of validUsers) {
    const userAchats = achats.filter(a => a.userId === user.id);
    const userVentes = ventes.filter(v => v.userId === user.id);
    const userErreurs = erreurs.filter(e => e.userId === user.id);

    const ventesHtml = userVentes.length > 0 
      ? userVentes.map(v => `
          <li style="margin-bottom:6px;color:#dc2626;">
            SELL — ${v.qty} x ${v.symbol} @ ${v.price}$
          </li>`).join('')
      : "<li style='color:#6b7280;'>No sales</li>";

    const achatsHtml = userAchats.length > 0 
      ? userAchats.map(a => `
          <li style="margin-bottom:6px;color:#16a34a;">
            BUY — ${a.qty} x ${a.symbol} @ ${a.price}$
          </li>`).join('')
      : "<li style='color:#6b7280;'>No buys</li>";

    const erreursHtml = userErreurs.length > 0 
      ? userErreurs.map(e => `
          <li style="margin-bottom:6px;color:#f59e0b;">
            ERROR — ${e.symbol} (${e.price}$)
          </li>`).join('')
      : "";

    const tableRows = top3.map((stock, index) => {
      const trend = stock.rawScore >= 0 ? "I" : "D";
      const trendColor = stock.rawScore >= 0 ? "#16a34a" : "#dc2626";

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

    const htmlContent = `
      <div style="font-family:Arial;background:#f4f6f8;padding:20px;">
        <div style="max-width:620px;margin:auto;background:white;border-radius:12px;overflow:hidden;">

          <div style="background:#111827;color:white;padding:20px;text-align:center;">
            <h2>Momentum Bot</h2>
            <p>${now}</p>
            <p>User: ${user.email}</p>
          </div>

          <div style="text-align:center;padding:20px;">
            <h3>Bot Score: ${score}/100</h3>
          </div>

          <div style="text-align:center;">
            <p style="font-size:24px;color:${pnlColor};">
              ${pnlSign}${pnl.toFixed(2)} $
            </p>
            <p>${insight}</p>
          </div>

          ${riskWarning ? `
            <div style="background:#fff3cd;padding:15px;margin:20px;border-radius:8px;">
              ${riskWarning}
            </div>
          ` : ""}

          <div style="padding:20px;">
            <p><b>Best Trade:</b> ${bestTrade ? `${bestTrade.symbol} @ ${bestTrade.price}$` : "N/A"}</p>
            <p><b>Worst Buy:</b> ${worstTrade ? `${worstTrade.symbol} @ ${worstTrade.price}$` : "N/A"}</p>
          </div>

          <div style="padding:20px;">
            <h3>Your Activity</h3>
            <ul style="list-style:none;padding:0;">
              ${achatsHtml}
              ${ventesHtml}
              ${erreursHtml}
            </ul>
          </div>

          <div style="padding:20px;">
            <h3>Top Momentum</h3>
            <table style="width:100%;">
              ${tableRows}
            </table>
          </div>

          <div style="text-align:center;font-size:12px;padding:15px;">
            Generated automatically
          </div>

        </div>
      </div>
    `;

    try {
      const data = await sendEmail({
        to: user.email,
        subject: `Report | PnL ${pnlSign}${pnl.toFixed(2)}$ | Score ${score}/100`,
        html: htmlContent,
      });

      console.log(`Email sent to user=${user.id} (${user.email})`);
      console.log("Mailer response:", data);

    } catch (error) {
      console.error(`Email failed for user=${user.id} (${user.email}):`, error.message);
    }
  }
}

module.exports = { sendReportEmail };