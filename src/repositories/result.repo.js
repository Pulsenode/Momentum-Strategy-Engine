

async function createResultTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS RESULTS (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      pnl DECIMAL(10,2),
      score INT,
      total_achats DECIMAL(10,2),
      total_ventes DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function saveResult(connection, report, today) {
  await connection.execute(
    `INSERT INTO RESULTS 
    (strategy_id, date, pnl, score, total_achats, total_ventes)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [1, today, report.pnl, report.score, report.totalAchats, report.totalVentes]
  );
}

module.exports = {
  createResultTable,
  saveResult
};