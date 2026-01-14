# Momentum-Strategy-Engine
Algorithmic trading system built with Node.js that retrieves market data, computes momentum factors across S&amp;P 500 equities, and executes systematic trading strategies.

## 🚀Features
* Collect stock market data from the S&P 500
* Identify the top 3 stocks based on the Momentum
* Send email to inform the users about stocks ranking 
* The results will be displayed once per week

## 📅Project Overview

This project was created to automatically identify the top stocks from the S&P 500.

The main goal is to reduce psychological bias in investments decisions by relying on data-driven analysis rather than emotions.
The program also helps usrs save time and focus on the most relevant opportunities.

#### This project is designed as a learning experience and should not be considered financial advice.

## 📋Installation

```
npm install
```
To install addiotional package 

```
npm start
```
To start the program


## 📝The process

Firstly, i started bu structuring my code in three distinct section, data fetching, mathematical processing, and analytical orchestration. I have implemented asynchronos fonction and keyword await to manage multiple network requests without blocking the main execution thread.

During the process i have encounter an API Rate Limiting, to solve this problem i have impemented a custom throttle (200ms sleep timer) between API calls.
Debugged complex variable scope issues (closures abd block scopes) to ensure data remained accessible across the entine analysis lifecycle.

To check the data validation, i have implemented safety checks to exclude empty stocks or newly listed comapnies with insufficient historical data 
(less than 6 months/126 trading days).

The next step was to store the data by adding the objet "results" and creating a "dual score" system: using a rawScore for prices mathematical sorting while maintaining a formatted string (with symbols and rounded decimals) for the user interface.

I have also integrated a console.table() for the top 3 stocks, prodviding a clean, spreadsheet-like view of the top 3 recommendations including Symbol, Name, Price and Momentum Score.

## 🧠What I Learned 

Throughout this project, i have gathered multiple important skills and a better idea of the logic behind a program srtucture which improved my logical thinking:

#### 🧑‍💻Advanced JavaScript (ES6+) & Logic Flow

* **Asynchronous Programming:** Execution of non-blocking code using async/await to handle external API latency.

* **Data Structure Manipulation:** Array methods like .slice(), .sort(), and .push() to transform raw JSON data into actionable insights.

#### 🗄️ API Management & System Resilience

* **Rate Limiting & Throttling:** Sleep mechanism with Promise and setTimeout to prevent server-side blocking and ensure reliable long-running scans.

* **Error Handling Strategy:** Try/catch blocks to ensure the application continues running even if a specific data points are missing or network errors occur.

#### 🧠 Financial Engineering Logic

* **Algorithm Development:** Momentum algorithm that balances short-term (1 month) and medium-term (6 months) trends to filter out market noise.

* **Data Integrity:** Validation logic to ensure the mathematical model only processes stocks with sufficient historical liquidity and history.

#### 🔨 Developer Experience (DX) & Tooling

* **CLI Data Visualization:** Console.table() to create professional, scannable terminal reports.

* **Real-time Feedback Design:** System that provides the user with constant visual updates on the scan’s progress, essential for long-running scripts.





