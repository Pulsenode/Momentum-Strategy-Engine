const mysql = require('mysql2/promise');
const { logError, logSuccess } = require('../utils/logger');

async function createDBConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });

    logSuccess("✅ Connected to MySQL");

    return connection;

  } catch (error) {
    logError("❌ DB Connection Error:", error.message);
    throw error;
  }
}

module.exports = { createDBConnection };