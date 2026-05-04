// src/services/position-pricing.service.js

const { getLatestClosePrice } = require('./market-price.service');

async function attachCurrentPricesToPositions(openPositions = []) {
  const positionsWithPrices = [];

  for (const position of openPositions) {
    const currentPrice = await getLatestClosePrice(position.symbol);

    if (currentPrice === null) {
      positionsWithPrices.push({
        ...position,
        current_price: null,
        price_error: `Could not fetch current price for ${position.symbol}`
      });

      continue;
    }

    positionsWithPrices.push({
      ...position,
      current_price: currentPrice,
      price_error: null
    });
  }

  return positionsWithPrices;
}

module.exports = {
  attachCurrentPricesToPositions
};