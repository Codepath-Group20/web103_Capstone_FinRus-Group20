import React, { useState, useEffect } from 'react';
import { 
  getStockData, 
  getMultipleStockData, 
  getRecentStockData,
  getCacheInfo,
  clearCache,
  checkApiHealth,
  useStockData 
} from './yahoofin_API';

const DataPipelineTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  // Use the hook to test it as well
  const { data: hookData, loading: hookLoading, error: hookError } = useStockData('AAPL', { days_back: 5 });

  const addResult = (testName, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      testName,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runTest = async (testName, testFunction) => {
    setCurrentTest(testName);
    try {
      const result = await testFunction();
      return result;
    } catch (error) {
      addResult(testName, false, `Exception: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const testApiHealth = async () => {
    const result = await checkApiHealth();
    if (result.success) {
      addResult('API Health', true, 'API is healthy', result.data);
    } else {
      addResult('API Health', false, result.error);
    }
    return result;
  };

  const testSingleStock = async () => {
    const result = await getStockData('AAPL', { days_back: 7 });
    if (result.success && result.data.metadata.success) {
      addResult('Single Stock', true, 
        `Retrieved ${result.data.metadata.data_points} data points for ${result.data.ticker}`,
        result.data);
    } else {
      addResult('Single Stock', false, result.error || 'Unknown error');
    }
    return result;
  };

  const testMultipleStocks = async () => {
    const result = await getMultipleStockData(['AAPL', 'GOOGL', 'MSFT'], { days_back: 5 });
    if (result.success) {
      const successCount = Object.values(result.data.data)
        .filter(stock => stock && stock.metadata && stock.metadata.success).length;
      addResult('Multiple Stocks', true, 
        `${successCount}/${result.data.tickers_count} stocks retrieved successfully`,
        result.data);
    } else {
      addResult('Multiple Stocks', false, result.error);
    }
    return result;
  };

  const testRecentData = async () => {
    const result = await getRecentStockData('TSLA', 10);
    if (result.success && result.data.metadata.success) {
      addResult('Recent Data', true, 
        `Retrieved ${result.data.metadata.data_points} recent data points for ${result.data.ticker}`,
        result.data);
    } else {
      addResult('Recent Data', false, result.error || 'Unknown error');
    }
    return result;
  };

  const testCaching = async () => {
    // Clear cache first
    const clearResult = await clearCache();
    if (!clearResult.success) {
      addResult('Caching', false, `Failed to clear cache: ${clearResult.error}`);
      return clearResult;
    }

    // First fetch (should cache)
    const startTime1 = Date.now();
    const result1 = await getStockData('NVDA', { days_back: 3 });
    const time1 = Date.now() - startTime1;

    if (!result1.success) {
      addResult('Caching', false, `First fetch failed: ${result1.error}`);
      return result1;
    }

    // Second fetch (should use cache)
    const startTime2 = Date.now();
    const result2 = await getStockData('NVDA', { days_back: 3 });
    const time2 = Date.now() - startTime2;

    if (!result2.success) {
      addResult('Caching', false, `Second fetch failed: ${result2.error}`);
      return result2;
    }

    const speedup = time1 / time2;
    const cached = result2.data.metadata.cached;
    
    addResult('Caching', true, 
      `First fetch: ${time1}ms, Second fetch: ${time2}ms, Cached: ${cached}, Speedup: ${speedup.toFixed(1)}x`,
      { time1, time2, cached, speedup });
    
    return { success: true };
  };

  const testErrorHandling = async () => {
    const result = await getStockData('INVALID_TICKER_12345', { days_back: 1 });
    if (!result.success || (result.data && !result.data.metadata.success)) {
      addResult('Error Handling', true, 
        `Properly handled invalid ticker: ${result.error || result.data.metadata.error}`);
      return { success: true };
    } else {
      addResult('Error Handling', false, 'Should have failed with invalid ticker');
      return { success: false };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest('Initializing tests...');

    const tests = [
      { name: 'API Health Check', func: testApiHealth },
      { name: 'Single Stock Fetch', func: testSingleStock },
      { name: 'Multiple Stocks Fetch', func: testMultipleStocks },
      { name: 'Recent Data Fetch', func: testRecentData },
      { name: 'Caching Mechanism', func: testCaching },
      { name: 'Error Handling', func: testErrorHandling },
    ];

    for (const test of tests) {
      await runTest(test.name, test.func);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest('Tests completed');
    setIsRunning(false);
  };

  const getTestSummary = () => {
    const total = testResults.length;
    const passed = testResults.filter(result => result.success).length;
    return { total, passed, percentage: total > 0 ? (passed / total * 100).toFixed(1) : 0 };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🧪 Data Pipeline Test Dashboard</h2>
      
      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          {isRunning ? '⏳ Running Tests...' : '🚀 Run All Tests'}
        </button>
        
        {isRunning && (
          <div style={{ marginTop: '10px', color: '#666' }}>
            Current: {currentTest}
          </div>
        )}
      </div>

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '5px' 
        }}>
          <h3>📊 Test Summary</h3>
          {(() => {
            const summary = getTestSummary();
            return (
              <div>
                <strong>
                  {summary.passed}/{summary.total} tests passed ({summary.percentage}%)
                </strong>
                <div style={{ 
                  marginTop: '10px', 
                  color: summary.passed === summary.total ? 'green' : 'orange' 
                }}>
                  {summary.passed === summary.total 
                    ? '🎉 All tests passed!' 
                    : '⚠️ Some tests failed'}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Hook Test Section */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#e8f4f8', 
        borderRadius: '5px' 
      }}>
        <h3>🪝 React Hook Test (useStockData)</h3>
        <div style={{ marginBottom: '10px' }}>
          <strong>Testing AAPL - Last 5 days</strong>
        </div>
        
        {hookLoading && <div style={{ color: '#666' }}>⏳ Loading hook data...</div>}
        
        {hookError && (
          <div style={{ color: 'red' }}>
            ❌ Hook Error: {hookError}
          </div>
        )}
        
        {hookData && (
          <div>
            <div style={{ color: 'green' }}>
              ✅ Hook Success: {hookData.metadata?.data_points} data points
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
              Cached: {hookData.metadata?.cached ? 'Yes' : 'No'} | 
              Fetched: {hookData.metadata?.fetched_at}
            </div>
          </div>
        )}
      </div>

      {/* Test Results */}
      <div>
        <h3>📋 Test Results</h3>
        {testResults.length === 0 ? (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            No tests run yet. Click "Run All Tests" to start.
          </div>
        ) : (
          <div>
            {testResults.map((result, index) => (
              <div 
                key={index} 
                style={{
                  margin: '10px 0',
                  padding: '15px',
                  border: `2px solid ${result.success ? '#4CAF50' : '#f44336'}`,
                  borderRadius: '5px',
                  backgroundColor: result.success ? '#e8f5e8' : '#ffeaea'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <strong>
                    {result.success ? '✅' : '❌'} {result.testName}
                  </strong>
                  <small style={{ color: '#666' }}>
                    {result.timestamp}
                  </small>
                </div>
                
                <div style={{ marginTop: '5px', color: '#333' }}>
                  {result.message}
                </div>
                
                {result.data && (
                  <details style={{ marginTop: '10px' }}>
                    <summary style={{ cursor: 'pointer', color: '#666' }}>
                      📄 View Raw Data
                    </summary>
                    <pre style={{ 
                      marginTop: '10px', 
                      padding: '10px', 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: '3px',
                      fontSize: '12px',
                      overflow: 'auto',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPipelineTest;