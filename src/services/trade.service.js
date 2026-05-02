   //CHECKING OPEN POSITIONS TO SELL IF NEEDED

const { closePosition, createPosition, findOpenPositionBySymbol } = require('../repositories/trade.repo');
const { isValidStock } = require('../utils/validation');
const { logTrade } = require('../utils/logger');

async function executeTrades({
    connection,
    openPositions,
    top3,
    results,
    budget,
    today,
    userId,
    userEmail,
    apiKey
}) {
  logTrade(`👤 Processing user=${userId} (${userEmail}) with budget=${budget}`);
    let ventesDuJour = [];
    let achatsDuJour = [];
    let erreursBudget = [];

    for (const position of openPositions) {
      const stillInTop3 = top3.some(s => s.Symbol === position.symbol);

      if (!stillInTop3) {
        const currentData = results.find(r => r.Symbol === position.symbol);
        const sellPrice = currentData ? currentData.Price : position.buy_price;

        await closePosition(connection, sellPrice, today, position.id, userId);

          ventesDuJour.push({ 
            userId,
            userEmail,
            symbol: position.symbol, 
            price: sellPrice, 
            qty: position.quantity // On récupère la quantité depuis la DB
  });

      if (apiKey) {
        logTrade(`📡 SignalStack SELL → ${position.symbol} (user ${userId})`);
      }
        logTrade(`[TRADE] SELL user=${userId} (${userEmail}) : ${position.symbol} exited Top 3`);
      }
    }


    // CHEKING STOCKS POSITION TO AVOID DUPLICATE PURCHASES

    for (const stock of top3) {
      if (!isValidStock(stock)) {
          continue;
        }

        const existing = await findOpenPositionBySymbol(connection, stock.Symbol, userId);

        if (existing.length > 0) {
          logTrade(`⏭️  ${stock.Symbol} is already in portfolio for user=${userId} (${userEmail}), skipping.`);
        } else {

          const quantity = Math.floor(budget / stock.Price);

         if (quantity > 0) {

            await createPosition(connection, stock, quantity, today, userId);

            achatsDuJour.push({ 
                userId,
                userEmail,
                symbol: stock.Symbol, 
                price: stock.Price, 
                qty: quantity 
            });
            if (apiKey) {
              logTrade(`📡 SignalStack BUY → ${stock.Symbol} (user ${userId})`);
            }
            logTrade(`📊 [TRADE] BUY user=${userId} (${userEmail}) : ${quantity} x ${stock.Symbol}`);
          } else {

            erreursBudget.push({
              userId,
              userEmail,
              symbol: stock.Symbol,
              price: stock.Price
            });

            erreursBudget.push({ symbol: stock.Symbol, price: stock.Price });
            logTrade(`[TRADE] Budget too low to buy ${stock.Symbol} (Prix: ${stock.Price}$, Budget: ${budget}$)`);
          }
        }
    }

    return { ventesDuJour, achatsDuJour, erreursBudget };
}

module.exports = { executeTrades };

