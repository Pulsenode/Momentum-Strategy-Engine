require('dotenv').config();

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendReportEmail(top3, ventes, achats, erreurs) {
 
    const ventesHtml = ventes.length > 0 
        ? ventes.map(v => `<li style="color: #d9534f;">❌ <b>Vendu</b> : ${v.qty} x ${v.symbol} à ${v.price}$</li>`).join('')
        : "<li>Aucune vente effectuée.</li>";

    const achatsHtml = achats.length > 0 
        ? achats.map(a => `<li style="color: #5cb85c;">✅ <b>Acheté</b> : ${a.qty} x ${a.symbol} à ${a.price}$</li>`).join('')
        : "<li>Aucun nouvel achat.</li>";

    const erreursHtml = erreurs.length > 0 
        ? erreurs.map(e => `<li style="color: #f0ad4e;">⚠️ <b>Budget insuffisant</b> : ${e.symbol} (Prix: ${e.price}$)</li>`).join('')
        : "";

    // 3. Top 3 Table HTML
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
            ${erreursHtml}  </ul>
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


module.exports = { sendReportEmail };



