// src/services/market-price.service.js

const { fetchFromAPI } = require('../integrations/market.api');

async function getLatestClosePrice(symbol) {
  const data = await fetchFromAPI("historical-price-full", symbol);

  if (!data || !data.historical || data.historical.length === 0) {
    return null;
  }

  return data.historical[0].close;
}

module.exports = {
  getLatestClosePrice
};