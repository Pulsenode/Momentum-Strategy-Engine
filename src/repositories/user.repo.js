async function createUserTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS USERS (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      budget_per_trade DECIMAL(12, 2) NOT NULL DEFAULT 1000,
      signalstack_api_key VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ADD USER
async function createUser(connection, email, budgetPerTrade = 10000, signalstackApiKey = null) {
  try {
    await connection.execute(
      `INSERT INTO USERS 
       (email, budget_per_trade, signalstack_api_key) 
       VALUES (?, ?, ?)`,
      [email, budgetPerTrade, signalstackApiKey]
    );
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') {
      throw err;
    }
  }
}

// GET ALL USERS
async function getAllUsers(connection) {
  const [rows] = await connection.execute(
    `SELECT 
      id,
      email,
      budget_per_trade,
      signalstack_api_key
     FROM USERS`
  );

  return rows;
}

module.exports = {
  createUserTable,
  createUser,
  getAllUsers
};