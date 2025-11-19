import React, { useState, useEffect } from 'react';
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

// --- MOCK API AND HELPERS (Self-Contained for Demonstration) ---

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// Mock data to simulate a successful backtest result
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
    { entryDate: '2023-08-01', exitDate: '2023-10-30', entryPrice: 175.00, exitPrice: 200.00, quantity: 12, profit: 300.00, returnPct: 14.28 },
  ],
  equityCurve: [
    { date: '2023-01-01', value: 10000.00 },
    { date: '2023-03-01', value: 10000.00 },
    { date: '2023-04-15', value: 10150.00 },
    { date: '2023-05-10', value: 10150.00 },
    { date: '2023-06-20', value: 10100.00 },
    { date: '2023-08-01', value: 10100.00 },
    { date: '2023-10-30', value: 10400.00 },
    { date: '2023-12-31', value: 12500.55 },
  ],
};

const backtestAPI = {
  runBacktest: async (data) => {
    console.log('Mock API: Running backtest with data:', data);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    return { 
        ...mockBacktestResult, 
        strategyName: data.strategyName || mockBacktestResult.strategyName,
        symbol: data.symbol || mockBacktestResult.symbol,
    };
  },
  getResults: async (limit) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { results: [{ id: 1, name: 'Latest SMA', date: '2024-11-17', return: '25.01%' }] };
  },
};

// --- END MOCK API AND HELPERS ---

// Component for the historical backtest runs list
const HistoryList = ({ history }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Backtests</h3>
        <ul className="space-y-3">
            {history.length > 0 ? (
                history.map((item, index) => (
                    <li key={index} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition duration-150">
                        <span className="font-medium text-gray-700">{item.name}</span>
                        <div className="flex items-center space-x-3">
                            <span className="text-gray-500">{item.date}</span>
                            <span className={`font-bold ${parseFloat(item.return) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {item.return}
                            </span>
                        </div>
                    </li>
                ))
            ) : (
                <li className="text-center text-gray-500 py-4">No history found. Run a backtest!</li>
            )}
        </ul>
    </div>
);


const Backtest = () => {
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
  const [history, setHistory] = useState([
      { id: 1, name: 'Tech Momentum', date: '2024-11-17', return: '25.01%' },
      { id: 2, name: 'Value Trap Test', date: '2024-11-10', return: '-5.22%' },
  ]); // Using the mock history immediately

  const loadHistory = async () => {
    try {
      // In a real app, this would fetch from an API
      const data = await backtestAPI.getResults(10); 
      setHistory(data.results || []);
    } catch (err) {
      console.error('Error loading history:', err);
    }
  };

  useEffect(() => {
    // loadHistory(); // Skipping actual API call for history to keep it fast
  }, []);

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
      const data = await backtestAPI.runBacktest(formData);
      if (data.success) {
        setResults(data);
        // Pretend to update history
        setHistory(prev => [
            { id: Date.now(), name: data.strategyName, date: new Date().toLocaleDateString(), return: `${data.totalReturn.toFixed(2)}%` },
            ...prev
        ].slice(0, 10));

      } else {
        setError(data.error || 'Backtest failed due to an unknown error.');
      }
    } catch (err) {
      setError('A connection error occurred. Please check the console for details.');
      console.error('Backtest Submission Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStrategyInputs = () => {
    switch (formData.strategyType) {
      case 'SMA':
        return (
          <>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="shortPeriod" className="block text-sm font-medium text-gray-700 mb-1">Short SMA Period</label>
              <input
                type="number"
                id="shortPeriod"
                name="shortPeriod"
                value={formData.shortPeriod}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="longPeriod" className="block text-sm font-medium text-gray-700 mb-1">Long SMA Period</label>
              <input
                type="number"
                id="longPeriod"
                name="longPeriod"
                value={formData.longPeriod}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </>
        );
      case 'RSI':
        return (
          <>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="rsiPeriod" className="block text-sm font-medium text-gray-700 mb-1">RSI Period</label>
              <input
                type="number"
                id="rsiPeriod"
                name="rsiPeriod"
                value={formData.rsiPeriod}
                onChange={handleInputChange}
                min="1"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="oversold" className="block text-sm font-medium text-gray-700 mb-1">Oversold Threshold</label>
              <input
                type="number"
                id="oversold"
                name="oversold"
                value={formData.oversold}
                onChange={handleInputChange}
                min="0" max="100"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="overbought" className="block text-sm font-medium text-gray-700 mb-1">Overbought Threshold</label>
              <input
                type="number"
                id="overbought"
                name="overbought"
                value={formData.overbought}
                onChange={handleInputChange}
                min="0" max="100"
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
          </>
        );
      default:
        return <p className="text-gray-500">Select a strategy type.</p>;
    }
  };

  const MetricCard = ({ title, value, isPositive = true, isCurrency = false }) => {
    const valueClass = isPositive ? 'text-green-600' : 'text-red-600';
    const displayValue = isCurrency ? formatCurrency(value) : `${value.toFixed(2)}${isPositive ? '%' : ''}`;

    return (
      <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${valueClass}`}>
          {displayValue}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-8 p-4">
      <h1 className="text-4xl font-extrabold text-gray-900 border-b pb-2 mb-6">Strategy Backtesting</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === Backtest Form (Column 1) === */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-2xl border-t-4 border-yellow-500 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Run New Backtest</h2>

            {/* Strategy Type */}
            <div>
              <label htmlFor="strategyType" className="block text-sm font-medium text-gray-700 mb-1">Strategy Type</label>
              <select
                id="strategyType"
                name="strategyType"
                value={formData.strategyType}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="SMA">SMA Crossover</option>
                <option value="RSI">RSI Indicator</option>
                {/* Add other strategy types here */}
              </select>
            </div>

            {/* Strategy Parameters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">Symbol (e.g., AAPL)</label>
                <input
                  type="text"
                  id="symbol"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500 uppercase"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label htmlFor="initialCapital" className="block text-sm font-medium text-gray-700 mb-1">Initial Capital ($)</label>
                <input
                  type="number"
                  id="initialCapital"
                  name="initialCapital"
                  value={formData.initialCapital}
                  onChange={handleInputChange}
                  min="1000"
                  step="100"
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-2">
                {renderStrategyInputs()}
            </div>

            {error && (
              <div className="p-3 text-sm font-medium text-red-700 bg-red-100 rounded-lg mt-4" role="alert">
                Error: {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-4 text-white font-semibold rounded-lg transition duration-300 shadow-md ${
                loading ? 'bg-yellow-400 cursor-not-allowed' : 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Running Backtest...
                </span>
              ) : 'Run Backtest'}
            </button>
          </form>
          
          <div className="mt-8">
              <HistoryList history={history} />
          </div>
        </div>

        {/* === Backtest Results (Column 2/3) === */}
        <div className="lg:col-span-2">
          {results ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-2xl border-t-4 border-green-500">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    ✅ Results for {results.strategyName} on {results.symbol}
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                    Period: {results.startDate} to {results.endDate} | Initial Capital: {formatCurrency(results.initialCapital)}
                </p>

                {/* Performance Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <MetricCard title="Total Return" value={results.totalReturn} isPositive={results.totalReturn >= 0} />
                  <MetricCard title="Final Capital" value={results.finalCapital} isPositive={true} isCurrency={true} />
                  <MetricCard title="Sharpe Ratio" value={results.sharpeRatio} isPositive={results.sharpeRatio >= 1} />
                  <MetricCard title="Max Drawdown" value={results.maxDrawdown} isPositive={results.maxDrawdown >= 0} />
                  <MetricCard title="Win Rate" value={results.winRate} isPositive={results.winRate >= 50} />
                  <MetricCard title="Total Trades" value={results.totalTrades} isPositive={true} isCurrency={false} />
                </div>

                {/* Equity Curve Chart */}
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Equity Curve</h3>
                <div className="bg-gray-50 p-4 rounded-lg h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={results.equityCurve} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis dataKey="date" stroke="#6b7280" tickFormatter={(date) => date.substring(5, 10)} />
                      <YAxis stroke="#6b7280" tickFormatter={(value) => formatCurrency(value)} domain={['auto', 'auto']} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Portfolio Value']} labelFormatter={(label) => `Date: ${label}`} />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} name="Portfolio Value" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trade Log Table */}
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Trade Log ({results.trades.length} Trades)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-xl">Entry Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-xl">Return %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.trades.map((trade, index) => (
                        <tr key={index} className="hover:bg-yellow-50 transition duration-150">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trade.entryDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.exitDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(trade.entryPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(trade.exitPrice)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{trade.quantity}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(trade.profit)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${trade.returnPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.returnPct.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[500px] bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <svg className="w-16 h-16 text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v14m-6-14v14m-6-8h6"></path></svg>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Backtest Results</h2>
              <p className="text-gray-600 text-center max-w-md">
                Enter your strategy parameters on the left and click **Run Backtest** to analyze its historical performance and view your Equity Curve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Backtest;
