const { isValidStock } = require('../utils/validation');

// CREATE POSITIONS TABLE
async function createPositionsTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS POSITIONS (
      id INT AUTO_INCREMENT PRIMARY KEY,

      user_id INT NOT NULL,
      strategy_id INT NOT NULL DEFAULT 1,

      symbol VARCHAR(10) NOT NULL,
      buy_price DECIMAL(12, 4) NOT NULL,
      sell_price DECIMAL(12, 4),

      quantity INT NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'OPEN',

      entry_date DATE NOT NULL,
      exit_date DATE,

      score_at_entry DECIMAL(12, 6),

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_positions_user_status (user_id, status),
      INDEX idx_positions_user_strategy_status (user_id, strategy_id, status),
      INDEX idx_positions_symbol (symbol)
    )
  `);
}

// GET OPEN POSITIONS
async function getOpenPositions(connection, userId, strategyId = 1) {
  const [rows] = await connection.execute(
    `SELECT * FROM POSITIONS 
     WHERE status = 'OPEN' 
     AND user_id = ? 
     AND strategy_id = ?`,
    [userId, strategyId]
  );

  return rows;
}

// CLOSE POSITION (SELL)
async function closePosition(connection, sellPrice, today, id, userId) {
  await connection.execute(
    `UPDATE POSITIONS 
     SET sell_price = ?, status = 'CLOSED', exit_date = ? 
     WHERE id = ? AND user_id = ?`,
    [sellPrice, today, id, userId]
  );
}

// CREATE POSITION (BUY)
async function createPosition(connection, stock, quantity, today, userId, strategyId = 1) {
  if (!isValidStock(stock)) {
    throw new Error(`Invalid stock data: ${JSON.stringify(stock)}`);
  }

  await connection.execute(
    `INSERT INTO POSITIONS 
     (user_id, strategy_id, symbol, buy_price, quantity, status, entry_date, score_at_entry) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      strategyId,
      stock.Symbol,
      stock.Price,
      quantity,
      'OPEN',
      today,
      stock.rawScore
    ]
  );
}

// CHECK EXISTING POSITION
async function findOpenPositionBySymbol(connection, symbol, userId, strategyId = 1) {
  const [rows] = await connection.execute(
    `SELECT id FROM POSITIONS 
     WHERE symbol = ? 
     AND status = 'OPEN' 
     AND user_id = ? 
     AND strategy_id = ?`,
    [symbol, userId, strategyId]
  );

  return rows;
}

module.exports = {
  createPositionsTable,
  getOpenPositions,
  closePosition,
  createPosition,
  findOpenPositionBySymbol,
};