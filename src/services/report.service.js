//src/services/report.service.js

function buildReport({ ventes, achats, erreurs }) {

    const totalAchats = achats.reduce((sum, a) => sum + (a.price * a.qty), 0);
    const totalVentes = ventes.reduce((sum, v) => sum + (v.price * v.qty), 0);
    const pnl = totalVentes - totalAchats;

    const pnlColor = pnl >= 0 ? "#16a34a" : "#dc2626";
    const pnlSign = pnl >= 0 ? "+" : "";

    // Insight
    let insight;
    if (pnl > 0 && achats.length > ventes.length) {
        insight = "📈 Aggressive buying paid off today.";
    } else if (pnl < 0 && ventes.length > achats.length) {
        insight = "📉 Selling pressure dominated, strategy needs review.";
    } else {
        insight = "⚖️ Mixed signals, market uncertain.";
    }

    // BEST / WORST TRADES
    const bestTrade = ventes.reduce((best, v) => 
        (!best || v.price > best.price ? v : best), null);
    const worstTrade = achats.reduce((worst, a) => 
        (!worst || a.price > worst.price ? a : worst), null);

    // RISK DETECTION
    let riskWarning = "";

    if (erreurs.length > 3) {
        riskWarning += "⚠️ High number of failed trades. ";
    }
    if (pnl < -50) {
        riskWarning += "🚨 Significant loss detected.";
    }

    // BOT SCORE 
    let score = 0;

    if (pnl > 0) score += 50;
    if (achats.length > 0) score += 10;
    if (ventes.length > 0) score += 10;
    if (erreurs.length === 0) score += 30;

    return {
        pnl,
        insight,
        score,
        bestTrade,
        worstTrade,
        riskWarning,
        totalAchats,
        totalVentes
    };
}

module.exports = { buildReport };