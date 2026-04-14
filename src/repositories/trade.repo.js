// CREATE TABLE
async function createTradeTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS TRADES_HISTORY (
      id INT AUTO_INCREMENT PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL,
      buy_price DECIMAL(10,2) NOT NULL,
      sell_price DECIMAL(10,2),
      quantity INT NOT NULL,
      status VARCHAR(10) NOT NULL,
      entry_date DATE,
      exit_date DATE,
      momentum_score FLOAT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// GET OPEN POSITIONS
async function getOpenPositions(connection) {
  const [rows] = await connection.execute(
    "SELECT * FROM TRADES_HISTORY WHERE status = 'OPEN'"
  );
  return rows;
}

// CLOSE POSITION (SELL)
async function closePosition(connection, sellPrice, today, id) {
  await connection.execute(
    `UPDATE TRADES_HISTORY 
     SET sell_price = ?, status = 'CLOSED', exit_date = ? 
     WHERE id = ?`,
    [sellPrice, today, id]
  );
}

// CREATE POSITION (BUY)
async function createPosition(connection, stock, quantity, today) {
  await connection.execute(
    `INSERT INTO TRADES_HISTORY 
     (symbol, buy_price, quantity, status, entry_date, momentum_score) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [stock.Symbol, stock.Price, quantity, 'OPEN', today, stock.rawScore]
  );
}

// CHECK EXISTING POSITION
async function findOpenPositionBySymbol(connection, symbol) {
  const [rows] = await connection.execute(
    "SELECT id FROM TRADES_HISTORY WHERE symbol = ? AND status = 'OPEN'",
    [symbol]
  );
  return rows;
}

module.exports = {
  createTradeTable,
  getOpenPositions,
  closePosition,
  createPosition,
  findOpenPositionBySymbol,
};