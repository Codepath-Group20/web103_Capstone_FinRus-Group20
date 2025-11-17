import React, { useState, useEffect } from 'react';
import { backtestAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Backtest.css';

function Backtest() {
  const [formData, setFormData] = useState({
    strategyType: 'SMA',
    symbol: 'AAPL',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    initialCapital: 10000,
    shortPeriod: 20,
    longPeriod: 50,
    rsiPeriod: 14,
    oversold: 30,
    overbought: 70
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await backtestAPI.getResults(10);
      setHistory(data.results || []);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const strategyParams = formData.strategyType === 'SMA' 
        ? { shortPeriod: parseInt(formData.shortPeriod), longPeriod: parseInt(formData.longPeriod) }
        : { period: parseInt(formData.rsiPeriod), oversold: parseInt(formData.oversold), overbought: parseInt(formData.overbought) };

      const data = await backtestAPI.runBacktest({
        strategyType: formData.strategyType,
        strategyParams,
        symbol: formData.symbol,
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialCapital: parseFloat(formData.initialCapital)
      });

      setResults(data.results);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="backtest-container">
      <h1>Backtesting Engine</h1>
      <p className="subtitle">Test your trading strategies against historical data</p>

      <div className="backtest-layout">
        <div className="backtest-form-section">
          <div className="card">
            <h2>Configure Backtest</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Strategy Type</label>
                <select 
                  name="strategyType" 
                  value={formData.strategyType} 
                  onChange={handleInputChange}
                >
                  <option value="SMA">Simple Moving Average (SMA)</option>
                  <option value="RSI">Relative Strength Index (RSI)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Stock Symbol</label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g., AAPL, MSFT, GOOGL"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Initial Capital</label>
                <input
                  type="number"
                  name="initialCapital"
                  value={formData.initialCapital}
                  onChange={handleInputChange}
                  min="1000"
                  step="1000"
                />
              </div>

              {formData.strategyType === 'SMA' && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Short Period</label>
                      <input
                        type="number"
                        name="shortPeriod"
                        value={formData.shortPeriod}
                        onChange={handleInputChange}
                        min="5"
                        max="50"
                      />
                    </div>

                    <div className="form-group">
                      <label>Long Period</label>
                      <input
                        type="number"
                        name="longPeriod"
                        value={formData.longPeriod}
                        onChange={handleInputChange}
                        min="20"
                        max="200"
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.strategyType === 'RSI' && (
                <>
                  <div className="form-group">
                    <label>RSI Period</label>
                    <input
                      type="number"
                      name="rsiPeriod"
                      value={formData.rsiPeriod}
                      onChange={handleInputChange}
                      min="5"
                      max="30"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Oversold Threshold</label>
                      <input
                        type="number"
                        name="oversold"
                        value={formData.oversold}
                        onChange={handleInputChange}
                        min="10"
                        max="40"
                      />
                    </div>

                    <div className="form-group">
                      <label>Overbought Threshold</label>
                      <input
                        type="number"
                        name="overbought"
                        value={formData.overbought}
                        onChange={handleInputChange}
                        min="60"
                        max="90"
                      />
                    </div>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="primary-btn submit-btn"
                disabled={loading}
              >
                {loading ? 'Running Backtest...' : 'Run Backtest'}
              </button>
            </form>
          </div>

          {history.length > 0 && (
            <div className="card history-section">
              <h3>Recent Backtests</h3>
              <div className="history-list">
                {history.map((item, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <span className="history-symbol">{item.symbol}</span>
                      <span className="history-return" 
                        style={{ color: item.total_return >= 0 ? '#4CAF50' : '#f44336' }}>
                        {item.total_return?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="history-date">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="backtest-results-section">
          {error && (
            <div className="card error-card">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          )}

          {results && (
            <>
              <div className="card">
                <h2>Performance Metrics</h2>
                <div className="metrics-grid">
                  <div className="metric">
                    <div className="metric-label">Initial Capital</div>
                    <div className="metric-value">
                      {formatCurrency(results.initialCapital)}
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Final Capital</div>
                    <div className="metric-value">
                      {formatCurrency(results.finalCapital)}
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Total Return</div>
                    <div className="metric-value" 
                      style={{ color: results.totalReturn >= 0 ? '#4CAF50' : '#f44336' }}>
                      {results.totalReturn.toFixed(2)}%
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Sharpe Ratio</div>
                    <div className="metric-value">
                      {results.sharpeRatio.toFixed(4)}
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Max Drawdown</div>
                    <div className="metric-value" style={{ color: '#f44336' }}>
                      {results.maxDrawdown.toFixed(2)}%
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Win Rate</div>
                    <div className="metric-value">
                      {results.winRate.toFixed(2)}%
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Total Trades</div>
                    <div className="metric-value">
                      {results.totalTrades}
                    </div>
                  </div>

                  <div className="metric">
                    <div className="metric-label">Profit/Loss</div>
                    <div className="metric-value"
                      style={{ color: (results.finalCapital - results.initialCapital) >= 0 ? '#4CAF50' : '#f44336' }}>
                      {formatCurrency(results.finalCapital - results.initialCapital)}
                    </div>
                  </div>
                </div>
              </div>

              {results.equity && results.equity.length > 0 && (
                <div className="card">
                  <h2>Equity Curve</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={results.equity.map((value, index) => ({ day: index, equity: value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" label={{ value: 'Trading Days', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Equity ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="equity" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {results.trades && results.trades.length > 0 && (
                <div className="card">
                  <h2>Trade History</h2>
                  <div className="trades-table-container">
                    <table className="trades-table">
                      <thead>
                        <tr>
                          <th>Entry Date</th>
                          <th>Exit Date</th>
                          <th>Entry Price</th>
                          <th>Exit Price</th>
                          <th>Quantity</th>
                          <th>Profit/Loss</th>
                          <th>Return %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.trades.map((trade, index) => (
                          <tr key={index}>
                            <td>{trade.entryDate}</td>
                            <td>{trade.exitDate}</td>
                            <td>${trade.entryPrice.toFixed(2)}</td>
                            <td>${trade.exitPrice.toFixed(2)}</td>
                            <td>{trade.quantity}</td>
                            <td style={{ color: trade.profit >= 0 ? '#4CAF50' : '#f44336' }}>
                              {formatCurrency(trade.profit)}
                            </td>
                            <td style={{ color: trade.returnPct >= 0 ? '#4CAF50' : '#f44336' }}>
                              {trade.returnPct.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Backtest;
