function logInfo(message) {
  console.log(`ℹ️ ${message}`);
}

function logError(message) {
  console.error(`❌ ${message}`);
}

function logTrade(message) {
  console.log(`📊 ${message}`);
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

module.exports = {
  logInfo,
  logError,
  logTrade,
  logSuccess,
};