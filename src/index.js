//https://financialmodelingprep.com/stable/search-symbol?query=AAPL&apikey=RX4VBBM2yKP35M35NbHPNqkdwBADjd4e

require ('dotenv').config();

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://financialmodelingprep.com/api/v3/";


async function demarrerAnalyse() {
console.log("Stock Analysis starting");

const sp500 = await API_GET("sp500_constituent", "");
  
  if (sp500) {
    const top100 = sp500.slice(0, 100);
    
    console.log(`Liste récupérée ! Nombre d'actions : ${sp500.length}`);
    console.log("Analyse du Top 100 lancée...");
    

    console.log("Première action du top :", top100[0].symbol); 
  }
}

demarrerAnalyse();


async function API_GET(endpoint, queryParam = "") {
  try {
    const separator = queryParam ? "/" : "";

    const url = `${BASE_URL}${endpoint}${separator}?${queryParam}&apikey=${API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {throw new Error(`HTTP error! status: ${response.status}`)};

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error.message);
    return null;
  }
}



