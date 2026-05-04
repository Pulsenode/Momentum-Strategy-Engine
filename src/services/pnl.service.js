// src/services/pnl.service.js

function calculateRealizedPnl(closedPositions = []) {
  let realizedPnl = 0;

  for (const position of closedPositions) {
    const buyPrice = Number(position.buy_price);
    const sellPrice = Number(position.sell_price);
    const quantity = Number(position.quantity);

    if (!sellPrice) continue;

    const tradePnl = (sellPrice - buyPrice) * quantity;
    realizedPnl += tradePnl;
  }

  return realizedPnl;
}

function calculateUnrealizedPnl(openPositions = []) {
  let unrealizedPnl = 0;

  for (const position of openPositions) {
    const buyPrice = Number(position.buy_price);
    const currentPrice = Number(position.current_price);
    const quantity = Number(position.quantity);

    if (!currentPrice) continue;

    const positionPnl = (currentPrice - buyPrice) * quantity;
    unrealizedPnl += positionPnl;
  }

  return unrealizedPnl;
}

function calculateTotalPnl(realizedPnl, unrealizedPnl) {
  return realizedPnl + unrealizedPnl;
}

module.exports = {
  calculateRealizedPnl,
  calculateUnrealizedPnl,
  calculateTotalPnl
};