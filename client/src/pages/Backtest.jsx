import React, { useState, useEffect } from 'react';
import { backtestAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Strategies from '../components/strategies';
import './Backtest.css';

// display the strategies from the strategies component and show backtest results
const Backtest = () => {
    const [backtestResults, setBacktestResults] = useState(null); 
    const handleBacktest = async (params) => {
        try {
            const results = await backtestAPI(params);
            setBacktestResults(results);
        } catch (error) {
            console.error('Error running backtest:', error);
        } 
    };
    return (
        <div className="BacktestPage">
            <h1>Backtest Trading Strategies</h1>
            <Strategies onBacktest={handleBacktest} />
            {backtestResults && (
                <div className="BacktestResults">
                    <h2>Results</h2>
                    {/* Render backtest results here */}
                </div>
            )}
        </div>
    );
};      
export default Backtest;