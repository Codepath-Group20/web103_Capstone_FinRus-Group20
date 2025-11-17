import './dotenv.js'
import pool from './database.js'
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper functions for ES Modules environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reads the schema.sql file from the current directory.
 * @returns {string} The content of the schema.sql file.
 */
const readSchema = () => {
    const schemaPath = path.join(__dirname, 'schema.sql');
    try {
        console.log(`Attempting to read schema from: ${schemaPath}`);
        return readFileSync(schemaPath, 'utf-8');
    } catch (error) {
        console.error("Error reading schema.sql. Ensure it is located in the server/config directory.", error);
        throw error;
    }
}

/**
 * Executes the full SQL schema to create all financial tables.
 * @param {string} sql The content of the schema.sql file.
 */
const createFinancialTables = async (sql) => {
    try {
        console.log('Resetting database and creating financial tables...');
        await pool.query(sql);
        console.log('Financial database schema created successfully.');
    } catch (error) {
        console.error('Error creating financial tables. Check your permissions and schema syntax.', error);
        throw error;
    }
}

// --- Seeding Functions ---

const seedStrategiesTable = async () => {
    try {
        console.log('Seeding strategies table...');
        
        const sampleStrategies = [
            // Strategy ID 1 (Needed for relationships)
            { name: 'Golden Cross MA', description: 'A classic strategy based on 50-day and 200-day moving average crossover signals.', type: 'moving_average', parameters: { short_period: 50, long_period: 200 } },
            // Strategy ID 2
            { name: 'RSI Overbought/Oversold', description: 'Uses the Relative Strength Index (RSI) to identify overbought (>70) and oversold (<30) conditions.', type: 'rsi', parameters: { period: 14, overbought: 70, oversold: 30 } },
            // Strategy ID 3
            { name: 'MACD Crossover', description: 'Buys when the MACD line crosses above the signal line and sells when it crosses below.', type: 'macd', parameters: { fast: 12, slow: 26, signal: 9 } }
        ];

        const insertQuery = `INSERT INTO strategies (name, description, type, parameters) VALUES ($1, $2, $3, $4::jsonb)`;

        for (const strategy of sampleStrategies) {
            await pool.query(insertQuery, [strategy.name, strategy.description, strategy.type, JSON.stringify(strategy.parameters)]);
        }
        
        console.log('Strategies table seeded successfully.');
    } catch (error) {
        console.error('Error seeding strategies table:', error);
        throw error;
    }
}

const seedBacktestResults = async () => {
    try {
        console.log('Seeding backtest_results table...');

        const results = [
            {
                strategy_id: 1, // Golden Cross
                symbol: 'SPY',
                start_date: '2020-01-01',
                end_date: '2023-12-31',
                initial_capital: 10000.00,
                final_capital: 15500.00,
                total_return: 0.55,
                sharpe_ratio: 1.25,
                max_drawdown: 0.15,
                win_rate: 0.65,
                total_trades: 12,
                trades: JSON.stringify([{ entry: '2020-03-01', exit: '2021-06-15', pnl: 0.35 }, { entry: '2022-01-01', exit: '2023-10-30', pnl: 0.10 }])
            },
            {
                strategy_id: 2, // RSI
                symbol: 'TSLA',
                start_date: '2021-01-01',
                end_date: '2023-12-31',
                initial_capital: 5000.00,
                final_capital: 6100.00,
                total_return: 0.22,
                sharpe_ratio: 0.85,
                max_drawdown: 0.40,
                win_rate: 0.45,
                total_trades: 45,
                trades: JSON.stringify([{ entry: '2021-05-01', exit: '2021-08-30', pnl: 0.15 }])
            },
            {
                strategy_id: 3, // MACD Crossover
                symbol: 'QQQ',
                start_date: '2019-01-01',
                end_date: '2023-12-31',
                initial_capital: 20000.00,
                final_capital: 21500.00,
                total_return: 0.075,
                sharpe_ratio: 0.45,
                max_drawdown: 0.20,
                win_rate: 0.52,
                total_trades: 28,
                trades: JSON.stringify([])
            },
        ];

        const insertQuery = `
            INSERT INTO backtest_results (strategy_id, symbol, start_date, end_date, initial_capital, final_capital, total_return, sharpe_ratio, max_drawdown, win_rate, total_trades, trades)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
        `;

        for (const r of results) {
            await pool.query(insertQuery, [
                r.strategy_id, r.symbol, r.start_date, r.end_date, r.initial_capital, r.final_capital, 
                r.total_return, r.sharpe_ratio, r.max_drawdown, r.win_rate, r.total_trades, r.trades
            ]);
        }

        console.log('Backtest results table seeded successfully.');
    } catch (error) {
        console.error('Error seeding backtest results table:', error);
        throw error;
    }
}

const seedPortfolios = async () => {
    try {
        console.log('Seeding portfolios table...');

        const portfolios = [
            // Portfolio ID 1 (Needed for positions)
            { name: 'Long-Term Growth', initial_capital: 100000.00, current_capital: 115000.00 },
            // Portfolio ID 2
            { name: 'High-Risk Alpha', initial_capital: 50000.00, current_capital: 55500.00 },
        ];

        const insertQuery = `INSERT INTO portfolios (name, initial_capital, current_capital) VALUES ($1, $2, $3)`;

        for (const p of portfolios) {
            await pool.query(insertQuery, [p.name, p.initial_capital, p.current_capital]);
        }

        console.log('Portfolios table seeded successfully.');
    } catch (error) {
        console.error('Error seeding portfolios table:', error);
        throw error;
    }
}

const seedPortfolioPositions = async () => {
    try {
        console.log('Seeding portfolio_positions table...');

        const positions = [
            // Positions for Portfolio ID 1
            { portfolio_id: 1, symbol: 'MSFT', quantity: 100, average_price: 300.50, current_price: 350.75, unrealized_pnl: 5025.00 },
            { portfolio_id: 1, symbol: 'AAPL', quantity: 150, average_price: 150.00, current_price: 180.00, unrealized_pnl: 4500.00 },
            // Positions for Portfolio ID 2
            { portfolio_id: 2, symbol: 'AMD', quantity: 200, average_price: 80.00, current_price: 110.00, unrealized_pnl: 6000.00 },
            { portfolio_id: 2, symbol: 'NVDA', quantity: 50, average_price: 500.00, current_price: 490.00, unrealized_pnl: -500.00 },
        ];

        const insertQuery = `
            INSERT INTO portfolio_positions (portfolio_id, symbol, quantity, average_price, current_price, unrealized_pnl)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;

        for (const pos of positions) {
            await pool.query(insertQuery, [pos.portfolio_id, pos.symbol, pos.quantity, pos.average_price, pos.current_price, pos.unrealized_pnl]);
        }

        console.log('Portfolio positions table seeded successfully.');
    } catch (error) {
        console.error('Error seeding portfolio positions table:', error);
        throw error;
    }
}


/**
 * Main function to reset and seed the database.
 */
const resetDatabase = async () => {
    let sqlSchema;
    try {
        // 1. Read the schema file
        sqlSchema = readSchema();
        
        // 2. Execute the schema (creates all tables)
        await createFinancialTables(sqlSchema);

        // 3. Seed all tables
        await seedStrategiesTable();
        await seedBacktestResults();
        await seedPortfolios();
        await seedPortfolioPositions();
        
        console.log('Database reset completed successfully.');
    } catch (err) {
        console.error('Database reset failed:', err);
    } finally {
        // 4. Close the connection pool
        if (pool) {
            await pool.end();
        }
    }
}

resetDatabase();
