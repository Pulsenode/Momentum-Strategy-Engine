



async function createUserTable(connection) {
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS USERS (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ADD USER
async function createUser(connection, email) {
  try {
    await connection.execute(
      `INSERT INTO USERS (email) VALUES (?)`,
      [email]
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
    `SELECT email FROM USERS`
  );
  return rows.map(u => u.email);
}

module.exports = {
  createUserTable,
  createUser,
  getAllUsers
};