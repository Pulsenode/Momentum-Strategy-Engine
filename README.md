
---

# Momentum-Strategy-Engine

Algorithmic trading system built with Node.js that retrieves market data, computes momentum factors across S&P 500 equities, and executes systematic, data-driven analysis.

---

## Features

* Retrieve S&P 500 market data via external API
* Compute momentum scores (1M / 3M / 6M)
* Rank and select Top 3 stocks
* Execute automated trading logic (buy/sell)
* Prevent duplicate executions using weekly signals tracking
* Store trading results and performance metrics in MySQL
* Manage users for report distribution
* Send automated email reports
* Structured logging system
* Data validation layer
* CLI output with console.table

---

## Project Overview

This project was designed to automatically identify high-momentum stocks from the S&P 500 using a structured and repeatable process.

The main objective is to reduce psychological bias in investment decisions by relying entirely on quantitative analysis rather than emotions.

It also acts as a time-saving tool by filtering hundreds of stocks down to only the most relevant opportunities.

This project is part of my learning journey in software engineering and algorithmic systems.

> This tool is for educational purposes only and should not be considered financial advice.

---

## Tech Stack

* Node.js (ES6+)
* MySQL (via `mysql2`)
* Resend (email API)
* External financial data API (market data provider)

---

## Project Structure

```
Momentum-Strategy-Engine/
│
├── database/
│   └── schema.sql
│
├── src/
│
│   ├── config/
│   │   └── db.js              # Database connection logic
│
│   ├── repositories/         # Database queries
│   │   ├── signal.repo.js
│   │   ├── result.repo.js
│   │   ├── trade.repo.js
│   │   └── user.repo.js
│
│   ├── services/             # Business logic
│   │   ├── scan.service.js
│   │   ├── trade.service.js
│   │   ├── report.service.js
│   │   └── email.service.js
│
│   ├── utils/                # Reusable helpers
│   │   ├── throttle.js
│   │   ├── validation.js
│   │   ├── format.js
│   │   └── logger.js
│
│   └── index.js              # Entry point (orchestrator)
│
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Installation

Clone the repository and install dependencies:

```
npm install
```

---

## Environment Variables

Create a `.env` file at the root of the project:

```
RESEND_API_KEY=your_api_key
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=momentum_db
```

---

## Database Setup

Make sure your MySQL server is running.

You can either create the database manually:

```sql
CREATE DATABASE momentum_db;
```

Or handle it directly in your Node.js code using `CREATE TABLE IF NOT EXISTS` for automatic initialization.

---

## Usage

Start the application:

```
npm start
```

The program will:

1. Fetch S&P 500 market data
2. Filter invalid or insufficient data
3. Compute momentum scores
4. Rank the top 3 stocks
5. Store results in the database
6. Display results in the terminal
7. Send an email report

---

## Core Logic

### Data Pipeline

* Fetch historical price data
* Apply validation filters (minimum 6 months / 126 trading days)
* Compute momentum scores
* Rank and select top performers

### Momentum Strategy

The algorithm combines:

* Short-term performance (1 month)
* Medium-term performance (6 months)

This helps reduce noise and identify consistent upward trends.

---

## Technical Highlights

### Asynchronous Processing

* Uses `async/await` to handle multiple API calls efficiently
* Prevents blocking the main execution thread

### Rate Limiting Handling

* Custom throttle implemented (200ms delay)
* Prevents API rate limit issues

### Data Validation

* Excludes incomplete or invalid stocks
* Ensures consistency in calculations

### Dual Data Representation

* `rawScore`: used for sorting and calculations
* `formattedScore`: used for display and reporting

### CLI Output

* Uses `console.table()` for clean, readable output

---

## What I Learned

### JavaScript & System Design

* Writing structured and modular code
* Managing async workflows with `async/await`
* Understanding execution flow in real-world applications

### Data Handling

* Transforming raw API data into usable insights
* Working with arrays and sorting algorithms

### Backend Development

* Integrating a MySQL database
* Structuring services and utilities

### Error Handling

* Building resilient systems using `try/catch`
* Preventing crashes from API or data issues

### Real-World Constraints

* Handling API rate limits
* Debugging scope and data flow issues

---

## Future Improvements

* Multi-strategy support
* Portfolio management per strategy
* Backtesting engine
* Web dashboard (visualization)
* Cloud deployment with cron jobs
* Advanced logging and monitoring
* Risk management system

---

## License & Financial Disclaimer

### License

Copyright (c) 2026 Clement Dedieu
All rights reserved.

This project is strictly private. No part of this code may be copied, modified, distributed, or used without explicit written permission.



### Financial Disclaimer

Trading and investing involve significant risk.

* This project does NOT provide financial advice
* All results are for educational purposes only
* The author is not responsible for any financial losses
* Data accuracy is not guaranteed (third-party APIs)

---

