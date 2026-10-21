//market.api.js

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;
const BUDGET_PAR_ACTION = 10000; // Temporary 

async function fetchFromAPI(endpoint, symbol = "", fromDate) {


  try {
    const url = `${BASE_URL}${endpoint}${symbol ? `/${symbol}` : ''}?from=${fromDate}&apikey=${API_KEY}`;
    console.log(url);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error : ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[API ERROR] sur ${endpoint}:`, error.message);
    return null;
  }
}

module.exports = { fetchFromAPI};
