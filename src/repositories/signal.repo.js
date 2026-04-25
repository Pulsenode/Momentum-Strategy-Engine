async function insertSignals(connection, top3, week, year) {
  try {
    for (let i = 0; i < top3.length; i++) {
      const stock = top3[i];

      await connection.execute(
        `INSERT INTO SIGNALS 
         (strategy_id, year, week, symbol, signal_rank, score)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [1, year, week, stock.Symbol, i + 1, stock.rawScore]
      );
    }

    console.log("📊 Signals saved for this week");

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log("⚠️ Signals already exist → DB prevented duplicate");
    } else {
      throw error;
    }
  }
}

async function hasSignalsThisWeek(connection, week, year) {
  const [rows] = await connection.execute(
    `SELECT id FROM SIGNALS 
     WHERE strategy_id = ? AND week = ? AND year = ? 
     LIMIT 1`,
    [1, week, year]
  );

  return rows.length > 0;
}

module.exports = {
  hasSignalsThisWeek,
  insertSignals
};