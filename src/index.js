require('dotenv').config(); //Login info to database and API

const { logInfo, logError, logSuccess } = require('./utils/logger'); // custom logging fucntions

const { runScan } = require('./services/scan.service'); // run stock analysis
const { createSignalsTable, hasSignalsThisWeek, insertSignals } = require('./repositories/signal.repo'); //Manage SIGNALS (weekly memory
const { executeTrades } = require('./services/trade.service'); // executes BUY / SELL logic
const { buildReport } = require('./services/report.service'); // manage report calculus
const { sendReportEmail } = require('./services/email.service');//sending Email

const { createDBConnection } = require('./config/db'); // Central DB connection 
const { createResultTable, saveResult } = require('./repositories/result.repo'); // Manage RESULTS table 
const { createUserTable, getAllUsers } = require('./repositories/user.repo'); // Manage users 
const {  createPositionsTable, getOpenPositions } = require('./repositories/trade.repo'); // Get positions per user

// Main function
async function startAnalysis() { 
  logInfo(" Stock Analysis starting...");

  let connection; // declare variable here to ensure it's accesible in both "try" and "finally" blocks

  try {
    // 1. DATABASE connection through db.js file
    // Establishes a session with the MySQL server.
    connection = await createDBConnection();
    logSuccess(`Successfully connected to MySQL! ID: ${connection.threadId}`); 

    // 2. Schema validation
    // Ensure tables exists before using them
    await createResultTable(connection);
    await createUserTable(connection);
    await createSignalsTable(connection);
    await createPositionsTable(connection);

    logSuccess("Table POSITIONS + RESULTS + SIGNALS + USERS ready");


    // 3. Market Scanning
    // runScan() likely fetches external market data.
    // 'results' = full data; 'top3' = the specific assets the bot wants to buy this week.
    const { results, top3 } = await runScan();

    // 4. Time
    // calculating the current week number to ensure we don't trade multiple times in one week.
    const now = new Date(); // current date
    const week = getWeekNumber(now);// convert ot week number
    const year = now.getFullYear();


    // 5. SAFETY GATE (Empty Data)
    // If the scanner returns nothing, we stop. This prevents the bot from selling
    // everything just because it couldn't find new stocks to buy.
    if (!top3 || top3.length === 0) {
      logError("Scan failed → skipping trading step");
      return; //stop execution
    }

    // 6. Duplicate prevention
    // prevent duplicate execution
    const alreadyDone = await hasSignalsThisWeek(connection, week, year);
    if (alreadyDone) {
      logInfo("Already executed this week → skipping trades");
      return;
    }

    // 7. Recording the signal
    //save SIGNALS table (TOP3)
    await insertSignals(connection, top3, week, year);
    //format date to YYYY-MM-DD for daabase
    const today = new Date().toISOString().split('T')[0];
    //fetch all users to process their individual portfolios
    const users = await getAllUsers(connection);

    //8. ARRAYS to collect results
    // Holds the cumulative results for ALL users so a single summary report can be sent.
    let allVentes = []; // sells
    let allAchats = []; // buys
    let allErreurs = []; // errors


    //9. Multi user processis loop
    //Loop through each user
    for (const user of users) {
          const userId = user.id;
    if (!userId) {
      throw new Error(`Invalid user: missing id. User data: ${JSON.stringify(user)}`);
    }
    if (user.budget_per_trade === undefined || user.budget_per_trade === null) {
      throw new Error(`Invalid user: missing budget_per_trade. User data: ${JSON.stringify(user)}`);
    }
      //get positions specific to THIS user
      const openPositions = await getOpenPositions(connection, user.id);
      // 'executeTrades' performs the trade logic logic:
      // - If Owned but not in Top3 -> SELL. 
      // - If in Top3 but not Owned -> BUY.
      const { ventesDuJour, achatsDuJour, erreursBudget } = await executeTrades({
        connection,
        openPositions,
        top3,
        results,
        budget: user.budget_per_trade, // user-specific budget
        today,
        userId,
        userEmail: user.email,
        apiKey: user.signalstack_api_key // individual API key for the broker
      });

      // The '...' is the spread operator. It takes the elements out of the
      // 'ventesDuJour' array and pushes them individually into 'allVentes'.
      allVentes.push(...ventesDuJour); 
      allAchats.push(...achatsDuJour);
      allErreurs.push(...erreursBudget);
    }

    // 10. REPORTING
    // Generate a mathematical summary (Total P&L, Success rate, etc.).
    const report = buildReport({
      ventes: allVentes,
      achats: allAchats,
      erreurs: allErreurs
    });

    // Save this run's final stats to the 'results' table.
    try {
      await saveResult(connection, report, today);
    } catch (err) {
      console.error(" Failed to save result:", err.message);
    }

    // Send the final email summary to the users.
    await sendReportEmail({
      top3,
      ventes: allVentes,
      achats: allAchats,
      erreurs: allErreurs,
      report,
      users
    });
  logSuccess("Analysis and update successfully completed.");


    
  } catch (error) {
    // 11. ERROR HANDLING
    // If ANY 'await' in the 'try' block fails, the code jumps here.
    logError("Error occurred");
    logError(`Code: ${error.code}`);
    logError(`Message: ${error.message}`);

    // If DB connected, get users to notify them
    const users = connection ? await getAllUsers(connection) : [];
    // Specifically handle Database or Connection errors.
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
        users
      });

      logError("Program terminated due to database error.");
      process.exit(1);
    }
  } finally {
    // 12. close connection
    // This block runs no matter what (success or failure). 
    if (connection) {
      await connection.end();
      logInfo("Connection closed.");
    }
  }
}

//Helper function
// calculate the ISO week number for a given date.
function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = (date - firstDay) / 86400000;
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

startAnalysis();

