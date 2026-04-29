// Checking stocks data type

function isValidStock(stock) {
  return (
    stock &&
    typeof stock.Symbol === 'string' &&
    typeof stock.Price === 'number' &&
    !isNaN(stock.Price)
  );
}

module.exports = { isValidStock };