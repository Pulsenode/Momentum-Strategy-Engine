const { isValidStock } = require('../utils/validation');


// GET OPEN POSITIONS
async function getOpenPositions(connection, userId) {
  const [rows] = await connection.execute(
    "SELECT * FROM POSITIONS WHERE status = 'OPEN' AND strategy_id = ?",
    [userId]
  );
  return rows;
}

// CLOSE POSITION (SELL)
async function closePosition(connection, sellPrice, today, id) {
  await connection.execute(
    `UPDATE POSITIONS 
     SET sell_price = ?, status = 'CLOSED', exit_date = ? 
     WHERE id = ?`,
    [sellPrice, today, id]
  );
}

// CREATE POSITION (BUY)
async function createPosition(connection, stock, quantity, today, userId) {
  await connection.execute(
    `INSERT INTO POSITIONS 
     (strategy_id, symbol, buy_price, quantity, status, entry_date, score_at_entry) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [stock.Symbol, stock.Price, quantity, 'OPEN', today, stock.rawScore, userId]
  );
}

// CHECK EXISTING POSITION
async function findOpenPositionBySymbol(connection, symbol, userId) {
  const [rows] = await connection.execute(
    `SELECT id FROM POSITIONS 
     WHERE symbol = ? AND status = 'OPEN' AND strategy_id = ?`,
    [symbol, userId]
  );
  return rows;
}

module.exports = {
  getOpenPositions,
  closePosition,
  createPosition,
  findOpenPositionBySymbol,
};