import React, { useState, useEffect } from "react";
import axios from "axios";

// Base URL for your Flask API
const API_BASE_URL = 'http://localhost:5000/api';

// Configure axios instance with default settings
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Fetch historical stock data for a single ticker
 * @param {string} ticker - Stock ticker symbol
 * @param {Object} options - Optional parameters
 * @param {number} options.days_back - Number of days back from today
 * @param {string} options.start_date - Start date in YYYY-MM-DD format
 * @param {string} options.end_date - End date in YYYY-MM-DD format
 * @param {boolean} options.use_cache - Whether to use caching
 * @returns {Promise<Object>} Stock data or error
 */
export const getStockData = async (ticker, options = {}) => {
  try {
    const {
      days_back = 30,
      start_date,
      end_date,
      use_cache = true
    } = options;

    // Build query parameters
    const params = new URLSearchParams({
      days_back: days_back.toString(),
      use_cache: use_cache.toString()
    });

    // Add date parameters if provided
    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);

    const response = await apiClient.get(`/stock/${ticker}?${params}`);
    
    if (response.data.success) {
      return {
        success: true,
        data: response.data
      };
    } else {
      return {
        success: false,
        error: response.data.error || 'Unknown error occurred'
      };
    }
  } catch (error) {
    console.error(`Error fetching data for ${ticker}:`, error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error'
    };
  }
};

/**
 * Fetch historical data for multiple tickers
 * @param {Array<string>} tickers - Array of ticker symbols
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} Multiple stock data or error
 */
export const getMultipleStockData = async (tickers, options = {}) => {
  try {
    const {
      days_back = 30,
      start_date,
      end_date,
      use_cache = true
    } = options;

    // Validate tickers array
    if (!Array.isArray(tickers) || tickers.length === 0) {
      throw new Error('Tickers must be a non-empty array');
    }

    // Build query parameters
    const params = new URLSearchParams({
      tickers: tickers.join(','),
      days_back: days_back.toString(),
      use_cache: use_cache.toString()
    });

    if (start_date) params.append('start_date', start_date);
    if (end_date) params.append('end_date', end_date);

    const response = await apiClient.get(`/stock/multiple?${params}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching multiple stock data:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error'
    };
  }
};

/**
 * Fetch recent stock data (convenience function)
 * @param {string} ticker - Stock ticker symbol
 * @param {number} days_back - Number of days back (default: 30)
 * @param {boolean} use_cache - Whether to use caching (default: true)
 * @returns {Promise<Object>} Recent stock data or error
 */
export const getRecentStockData = async (ticker, days_back = 30, use_cache = true) => {
  try {
    const params = new URLSearchParams({
      days_back: days_back.toString(),
      use_cache: use_cache.toString()
    });

    const response = await apiClient.get(`/stock/recent/${ticker}?${params}`);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error(`Error fetching recent data for ${ticker}:`, error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error'
    };
  }
};

/**
 * Get cache information
 * @returns {Promise<Object>} Cache info or error
 */
export const getCacheInfo = async () => {
  try {
    const response = await apiClient.get('/cache/info');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error getting cache info:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error'
    };
  }
};

/**
 * Clear the data cache
 * @returns {Promise<Object>} Success status or error
 */
export const clearCache = async () => {
  try {
    const response = await apiClient.post('/cache/clear');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error clearing cache:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error'
    };
  }
};

/**
 * Check API health status
 * @returns {Promise<Object>} Health status or error
 */
export const checkApiHealth = async () => {
  try {
    const response = await apiClient.get('/health');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error checking API health:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Network error'
    };
  }
};

// React Hook for managing stock data
export const useStockData = (ticker, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!ticker) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getStockData(ticker, options);
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ticker, options.days_back, options.start_date, options.end_date]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// React Hook for managing multiple stock data
export const useMultipleStockData = (tickers, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!tickers || tickers.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getMultipleStockData(tickers, options);
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [JSON.stringify(tickers), options.days_back, options.start_date, options.end_date]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};

// Default export for backward compatibility
export default {
  getStockData,
  getMultipleStockData,
  getRecentStockData,
  getCacheInfo,
  clearCache,
  checkApiHealth,
  useStockData,
  useMultipleStockData
};