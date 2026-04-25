require('dotenv').config(); //Login info to database and API

const { logInfo, logError, logSuccess } = require('./utils/logger');
const { runScan } = require('./services/scan.service'); // (./ same folder)
const { hasSignalsThisWeek, insertSignals } = require('./repositories/signal.repo');
const { executeTrades } = require('./services/trade.service');
const { buildReport } = require('./services/report.service');
const { sendReportEmail } = require('./services/email.service');//sending Email

const { createDBConnection } = require('./config/db');
const { createResultTable, saveResult } = require('./repositories/result.repo');
const {
  createUserTable,
  createUser,
  getAllUsers
} = require('./repositories/user.repo');

const {
  createTradeTable,
  getOpenPositions
} = require('./repositories/trade.repo');

const BUDGET_PAR_ACTION = 10000; // Temporary 


async function startAnalysis() {
  logInfo(" Stock Analysis starting...");

  let connection; 

  //Coneection info for the DATABASE
  try {
    connection = await createDBConnection();

    logSuccess(`Successfully connected to MySQL! ID: ${connection.threadId}`);

    await createResultTable(connection);//from result.repo.js

    await createUserTable(connection);//from user.repo.js

    await createUser(connection, "dedieuclementpro@gmail.com");

    const openPositions = await getOpenPositions(connection);//From trade.repo.js

    logSuccess("Table TRADES_HISTORY + RESULTS + USERS ready");

    const { results, top3 } = await runScan();

    const now = new Date();
    const week = getWeekNumber(now);
    const year = now.getFullYear();


    if (!top3 || top3.length === 0) {
      logError("Scan failed → skipping trading step");
      return;
    }

    const alreadyDone = await hasSignalsThisWeek(connection, week, year);

    if (alreadyDone) {
      logInfo("Already executed this week → skipping trades");
      return;
    }

    await insertSignals(connection, top3, week, year);


    const today = new Date().toISOString().split('T')[0];

    const { ventesDuJour, achatsDuJour, erreursBudget } = await executeTrades({
      connection,
      openPositions,
      top3,
      results,
      budget: BUDGET_PAR_ACTION,
      today
    });

    const report = buildReport({
    ventes: ventesDuJour,
    achats: achatsDuJour,
    erreurs: erreursBudget
    });


    try {
      await saveResult(connection, report, today);
    } catch (err) {
      console.error("❌ Failed to save result:", err.message);
    }
    
    const users = await getAllUsers(connection);


    await sendReportEmail({
      top3,
      ventes: ventesDuJour,
      achats: achatsDuJour,
      erreurs: erreursBudget,
      report,
      users
    });
  logSuccess("Analysis and update successfully completed.");

    // 6. SENDING THE REPORT BY EMAIL

  } catch (error) {
    logError("Error occurred");
    logError(`Code: ${error.code}`);
    logError(`Message: ${error.message}`);

    // 🔥 FIX HERE
    const users = connection ? await getAllUsers(connection) : [];

    if (error.code && (error.code.includes('ER_') || error.code === 'ECONNREFUSED')) {
      logInfo("Sending error email...");

      await sendReportEmail({
        top3: [],
        ventes: [],
        achats: [],
        erreurs: [],
        report: {
        pnl: 0,
        score: 0,
        insight: "⚠️ System error",
        bestTrade: null,
        worstTrade: null,
        riskWarning: "System failure",
        totalAchats: 0,
        totalVentes: 0
        },
        users // ✅ NOW DEFINED
      });

      logError("Program terminated due to database error.");
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      logInfo("Connection closed.");
    }
  }
}

function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date - firstDay) / 86400000;
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

startAnalysis();

