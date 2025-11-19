import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import "./Backtest.css"; // Ensure this link is correct
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// --- MOCK DATA & HELPERS (For self-contained example) ---

// In a real application, this would come from the api.js file
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// Mock backtest results data structure for demonstration
const mockBacktestResult = {
  success: true,
  strategyName: 'SMA Crossover (20/50)',
  symbol: 'AAPL',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  initialCapital: 10000.00,
  finalCapital: 12500.55,
  totalReturn: 25.01,
  sharpeRatio: 1.55,
  maxDrawdown: -8.23,
  winRate: 65.00,
  totalTrades: 20,
  trades: [
    { entryDate: '2023-03-01', exitDate: '2023-04-15', entryPrice: 150.00, exitPrice: 165.00, quantity: 10, profit: 150.00, returnPct: 10.00 },
    { entryDate: '2023-05-10', exitDate: '2023-06-20', entryPrice: 170.00, exitPrice: 160.00, quantity: 5, profit: -50.00, returnPct: -5.88 },
    { entryDate: '2023-08-01', exitDate: '2023-09-10', entryPrice: 175.00, exitPrice: 190.00, quantity: 8, profit: 120.00, returnPct: 8.57 },
    { entryDate: '2023-10-20', exitDate: '2023-11-25', entryPrice: 185.00, exitPrice: 170.00, quantity: 12, profit: -180.00, returnPct: -8.11 },
  ],
  equityCurve: [
    { date: '2023-01-01', equity: 10000.00 },
    { date: '2023-03-01', equity: 10000.00 },
    { date: '2023-04-15', equity: 10150.00 },
    { date: '2023-05-10', equity: 10150.00 },
    { date: '2023-06-20', equity: 10100.00 },
    { date: '2023-08-01', equity: 10100.00 },
    { date: '2023-09-10', equity: 10220.00 },
    { date: '2023-10-20', equity: 10220.00 },
    { date: '2023-11-25', equity: 10040.00 },
    { date: '2023-12-31', equity: 12500.55 },
  ]
};

const strategyTypes = [
  { value: 'SMA', label: 'Simple Moving Average', description: 'Crossover strategy using short and long period SMAs.'
},
  { value: 'RSI', label: 'Relative Strength Index', description: 'Trades based on overbought and oversold conditions.' },
];

const BacktestForm = ({ onBacktest, isLoading }) => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
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
    }
  });
  const selectedStrategy = watch('strategyType');

  const onSubmit = (data) => {
    // Clean up parameters based on selected strategy
    const params = {
      strategyType: data.strategyType,
      symbol: data.symbol,
      startDate: data.startDate,
      endDate: data.endDate,
      initialCapital: parseFloat(data.initialCapital),
      parameters: {}
    };
    if (data.strategyType === 'SMA') {
      params.parameters.shortPeriod = parseInt(data.shortPeriod);
      params.parameters.longPeriod = parseInt(data.longPeriod);
    } else if (data.strategyType === 'RSI') {
      params.parameters.rsiPeriod = parseInt(data.rsiPeriod);
      params.parameters.oversold = parseInt(data.oversold);
      params.parameters.overbought = parseInt(data.overbought);
    }

    // In a real app: await backtestAPI.runBacktest(params)
    // For this example, we return mock data after a small delay
    setTimeout(() => {
      onBacktest(mockBacktestResult);
    }, 1500);
  };

  return (
    <div className="form-card">
      <h2 className="form-title">Strategy Parameters</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="form-body">
        <div className="input-group-grid">
          <div className="form-field">
            <label className="form-label">Strategy Type</label>
            <select
              {...register("strategyType")}
              className="form-input"
            >
              {strategyTypes.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Symbol (e.g., AAPL)</label>
            <input
              type="text"
              {...register("symbol", { required: true })}
              className="form-input uppercase"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Initial Capital ($)</label>
            <input
              type="number"
              step="0.01"
              min="100"
              {...register("initialCapital", { valueAsNumber: true, required: true })}
              className="form-input"
            />
          </div>
        </div>

        <div className="input-group-row">
          <div className="form-field">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              {...register("startDate", { required: true })}
              className="form-input"
            />
          </div>
          <div className="form-field">
            <label className="form-label">End Date</label>
            <input
              type="date"
              {...register("endDate", { required: true })}
              className="form-input"
            />
          </div>
        </div>

        <div className="strategy-params-section">
          <h3 className="params-title">Strategy Specific Parameters</h3>
          <div className="input-group-row">
            {selectedStrategy === 'SMA' && (
              <>
                <div className="form-field">
                  <label className="form-label">Short Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    {...register("shortPeriod", { valueAsNumber: true, required: true })}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Long Period (Days)</label>
                  <input
                    type="number"
                    min="1"
                    {...register("longPeriod", { valueAsNumber: true, required: true })}
                    className="form-input"
                  />
                </div>
              </>
            )}

            {selectedStrategy === 'RSI' && (
              <>
                <div className="form-field">
                  <label className="form-label">RSI Period</label>
                  <input
                    type="number"
                    min="1"
                    {...register("rsiPeriod", { valueAsNumber: true, required: true })}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Oversold Threshold</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register("oversold", { valueAsNumber: true, required: true })}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Overbought Threshold</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    {...register("overbought", { valueAsNumber: true, required: true })}
                    className="form-input"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`submit-btn ${isLoading ? 'submit-btn-disabled' : ''}`}
        >
          {isLoading ? 'Running Backtest...' : 'Run Backtest'}
        </button>
      </form>
    </div>
  );
};

// --- Backtest Page Component ---

const Backtest = () => {
  const [backtestResults, setBacktestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBacktest = (results) => {
    setLoading(true);
    setError(null);
    // Simulate API call delay before setting results
    setTimeout(() => {
      setBacktestResults(results);
      setLoading(false);
    }, 1500);
  };

  const MetricCard = ({ title, value, unit = '', color = 'text-gray-900', icon, isCurrency = false }) => {
    // Determine color class for positive/negative returns
    const valueColor = useMemo(() => {
      if (!value) return color;
      const numericValue = parseFloat(value);

      if (title === 'Total Return' || title === 'Sharpe Ratio' || title === 'Win Rate') {
        return numericValue >= 0 ? 'text-green' : 'text-red';
      }

      if (title === 'Max Drawdown') {
        // Drawdown is usually negative, smaller absolute value is better (or less negative)
        // Drawdown values are passed as negative percentages (e.g., -8.23)
        if (numericValue > -5.0) return 'text-green'; // Excellent drawdown
        if (numericValue > -15.0) return 'text-yellow'; // Acceptable
        return 'text-red'; // High drawdown
      }
      
      return color;
    }, [value, title, color]);

    const formattedValue = isCurrency ?
      formatCurrency(value) : value.toFixed(unit === '%' ? 2 : 4);

    return (
      <div className="metric-card">
        <div className={`metric-icon ${valueColor}`}>{icon}</div>
        <div>
          <p className="metric-label">{title}</p>
          <p className={`metric-value ${valueColor}`}>
            {formattedValue}
            <span className="metric-unit">{unit}</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <h1 className="page-title">Backtest Trading Strategies</h1>
        <hr className="title-separator" />

        <BacktestForm onBacktest={handleBacktest} isLoading={loading} />

        {loading && (
          <div className="loading-message-card">
            <svg className="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing market data and calculating results...
          </div>
        )}

        {backtestResults && (
          <div className="results-report">
            <h2 className="report-title">Backtest Report: {backtestResults.strategyName} on {backtestResults.symbol}</h2>

            {/* Metrics Grid */}
            <div className="metrics-grid">
              <MetricCard
                title="Final Capital"
                value={backtestResults.finalCapital}
                icon={'💰'}
                isCurrency={true}
              />
              <MetricCard
                title="Total Return"
                value={backtestResults.totalReturn}
                unit="%"
                icon={backtestResults.totalReturn >= 0 ? '📈' : '📉'}
              />
              <MetricCard
                title="Sharpe Ratio"
                value={backtestResults.sharpeRatio}
                icon={'📊'}
              />
              <MetricCard
                title="Max Drawdown"
                value={backtestResults.maxDrawdown}
                unit="%"
                icon={'🔻'}
              />
              <MetricCard
                title="Win Rate"
                value={backtestResults.winRate}
                unit="%"
                icon={'🎯'}
              />
              <MetricCard
                title="Total Trades"
                value={backtestResults.totalTrades}
                unit=""
                icon={'#️⃣'}
                isCurrency={false}
              />
              <MetricCard
                title="Initial Capital"
                value={backtestResults.initialCapital}
                icon={'💵'}
                isCurrency={true}
              />
              <MetricCard
                title="Period"
                value={0} // Mock value, in a real app this would be duration
                unit="Days"
                icon={'📅'}
                isCurrency={false}
              />
            </div>

            {/* Equity Curve Chart */}
            <div className="card-section">
              <h3 className="card-title">Equity Curve</h3>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={backtestResults.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis
                      domain={['auto', 'auto']}
                      tickFormatter={formatCurrency}
                      stroke="#6b7280"
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="equity"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Portfolio Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trades Table */}
            <div className="card-section">
              <h3 className="card-title">Detailed Trades ({backtestResults.totalTrades})</h3>
              <div className="table-container">
                <table className="trades-table">
                  <thead className="table-head">
                    <tr>
                      <th className="table-header-cell">Entry Date</th>
                      <th className="table-header-cell">Exit Date</th>
                      <th className="table-header-cell">Entry Price</th>
                      <th className="table-header-cell">Exit Price</th>
                      <th className="table-header-cell">Quantity</th>
                      <th className="table-header-cell">P/L</th>
                      <th className="table-header-cell">Return %</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {backtestResults.trades.map((trade, index) => (
                      <tr key={index} className="table-row-hover">
                        <td className="table-cell">{trade.entryDate}</td>
                        <td className="table-cell">{trade.exitDate}</td>
                        <td className="table-cell">{formatCurrency(trade.entryPrice)}</td>
                        <td className="table-cell">{formatCurrency(trade.exitPrice)}</td>
                        <td className="table-cell">{trade.quantity}</td>
                        <td className={`table-cell table-cell-pl ${trade.profit >= 0 ? 'text-green' : 'text-red'}`}>
                          {formatCurrency(trade.profit)}
                        </td>
                        <td className={`table-cell table-cell-return ${trade.returnPct >= 0 ? 'text-green' : 'text-red'}`}>
                          {trade.returnPct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Backtest;
