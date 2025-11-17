import pandas as pd
import yfinance as yf
import time
from datetime import datetime, timedelta
import logging
import hashlib
from typing import Optional, Dict, Any, List

# Set up logging for better error tracking
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# In-memory cache with expiration
_cache: Dict[str, Dict[str, Any]] = {}
_cache_expiry: Dict[str, datetime] = {}
CACHE_DURATION = 300  # 5 minutes

def _get_cache_key(ticker: str, start_date: str, end_date: str) -> str:
    """Generate cache key for the request."""
    return hashlib.md5(f"{ticker}_{start_date}_{end_date}".encode()).hexdigest()

def _is_cache_valid(cache_key: str) -> bool:
    """Check if cached data is still valid."""
    if cache_key not in _cache_expiry:
        return False
    return datetime.now() < _cache_expiry[cache_key]

def _fetch_data_simple(ticker: str, start_date: str, end_date: str, retries: int = 3, delay: int = 1) -> Optional[pd.DataFrame]:
    """
    Simple fetch function using the exact approach from Tester.ipynb that works.
    Returns pandas DataFrame directly.
    """
    for attempt in range(retries):
        try:
            # Getting stock data (exact same approach as notebook)
            stock = yf.Ticker(ticker)
            # Fetch historical data
            hist = stock.history(start=start_date, end=end_date)
            
            # Check if data is empty
            if hist.empty:
                logger.warning(f"No data found for {ticker} between {start_date} and {end_date}.")
                if attempt < retries - 1:
                    logger.info(f"Retrying...({attempt + 1}/{retries})")
                    time.sleep(delay)
                    continue
                else:
                    logger.error(f"No data available after {retries} attempts")
                    return None
            
            # Success - return the DataFrame
            return hist
            
        except Exception as e:
            logger.error(f"❌ Error fetching {ticker} data: {str(e)}")
            
            if attempt < retries - 1:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                logger.error(f"All retry attempts failed for {ticker}")
                return None
    
    return None

def fetch_historical_data(
    ticker: str, 
    start_date: str, 
    end_date: str, 
    retries: int = 3, 
    delay: int = 1, 
    use_cache: bool = True
) -> Optional[Dict[str, Any]]:
    """Fetch historical stock data from Yahoo Finance with caching support.
    Uses the simple, proven approach from Tester.ipynb.
    
    ARGS:
        ticker (str): Stock ticker symbol.
        start_date (str): Start date in 'YYYY-MM-DD' format.
        end_date (str): End date in 'YYYY-MM-DD' format.
        retries (int): Number of retry attempts.
        delay (int): Delay between retries in seconds.
        use_cache (bool): Whether to use caching mechanism.
        
    RETURNS:
        dict: Dictionary containing historical stock data, or None if all attempts fail.
              
    RAISES:
        ValueError: If ticker is invalid or dates are malformed.
    """
    
    # Input validation
    if not ticker or not isinstance(ticker, str):
        raise ValueError("Ticker must be a non-empty string")
    
    ticker = ticker.upper().strip()
    
    # Validate date format
    try:
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError as e:
        raise ValueError(f"Dates must be in YYYY-MM-DD format: {e}")
    
    # Adjust future dates to current date
    today = datetime.now().date()
    if end_dt.date() > today:
        end_date = today.strftime('%Y-%m-%d')
        logger.warning(f"End date was in future, adjusted to today: {end_date}")
    
    if start_dt.date() > today:
        # If start date is in future, get last 30 days of data
        end_date = today.strftime('%Y-%m-%d')
        start_date = (today - timedelta(days=30)).strftime('%Y-%m-%d')
        logger.warning(f"Start date was in future, adjusted to last 30 days: {start_date} to {end_date}")
    
    # Check cache first
    if use_cache:
        cache_key = _get_cache_key(ticker, start_date, end_date)
        if cache_key in _cache and _is_cache_valid(cache_key):
            logger.info(f"📊 Returning cached data for {ticker}")
            cached_data = _cache[cache_key].copy()
            cached_data['metadata']['cached'] = True
            return cached_data
    
    # Use the simple fetch function from notebook
    logger.info(f"Fetching data for {ticker} from {start_date} to {end_date}")
    hist = _fetch_data_simple(ticker, start_date, end_date, retries, delay)
    
    # Check if we got data
    if hist is None or hist.empty:
        logger.error(f"No data available for {ticker}")
        return _create_error_response(ticker, start_date, end_date, "No data found", retries)
    
    try:
        # Reset index to make 'Date' a column
        hist_reset = hist.reset_index()
        
        # Convert datetime index to string for JSON serialization
        # Handle timezone-aware dates properly
        if 'Date' in hist_reset.columns:
            # Remove timezone info and format as string
            if hist_reset['Date'].dt.tz is not None:
                hist_reset['Date'] = hist_reset['Date'].dt.tz_localize(None)
            hist_reset['Date'] = hist_reset['Date'].dt.strftime('%Y-%m-%d')
        
        # Round numerical values for cleaner JSON
        numerical_columns = ['Open', 'High', 'Low', 'Close', 'Adj Close']
        for col in numerical_columns:
            if col in hist_reset.columns:
                hist_reset[col] = hist_reset[col].round(2)
        
        # Convert Volume to int if it exists
        if 'Volume' in hist_reset.columns:
            hist_reset['Volume'] = hist_reset['Volume'].astype(int)
        
        # Create response data
        data_json = {
            'ticker': ticker,
            'data': hist_reset.to_dict(orient='records'),
            'metadata': {
                'start_date': start_date,
                'end_date': end_date,
                'fetched_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                'data_points': len(hist_reset),
                'success': True,
                'cached': False,
                'columns': list(hist_reset.columns)
            }
        }
        
        # Cache the result
        if use_cache:
            cache_key = _get_cache_key(ticker, start_date, end_date)
            _cache[cache_key] = data_json.copy()
            _cache_expiry[cache_key] = datetime.now() + timedelta(seconds=CACHE_DURATION)
            logger.info(f"💾 Cached data for {ticker}")
        
        logger.info(f"✅ Successfully fetched {len(hist_reset)} data points for {ticker}")
        return data_json
        
    except Exception as e:
        logger.error(f"❌ Error processing data for {ticker}: {str(e)}")
        return _create_error_response(ticker, start_date, end_date, str(e), retries)

def _create_error_response(ticker: str, start_date: str, end_date: str, error_msg: str, attempts: int) -> Dict[str, Any]:
    """Create a standardized error response."""
    return {
        'ticker': ticker,
        'data': [],
        'metadata': {
            'start_date': start_date,
            'end_date': end_date,
            'fetched_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'data_points': 0,
            'success': False,
            'cached': False,
            'error': error_msg,
            'attempts': attempts
        }
    }

def fetch_multiple_tickers(
    tickers: List[str], 
    start_date: str, 
    end_date: str, 
    retries: int = 3, 
    delay: int = 1,
    use_cache: bool = True
) -> Dict[str, Optional[Dict[str, Any]]]:
    """Fetch historical data for multiple tickers.
    
    ARGS:
        tickers (list): List of ticker symbols.
        start_date (str): Start date in 'YYYY-MM-DD' format.
        end_date (str): End date in 'YYYY-MM-DD' format.
        retries (int): Number of retry attempts per ticker.
        delay (int): Delay between retries in seconds.
        use_cache (bool): Whether to use caching mechanism.
        
    RETURNS:
        dict: Dictionary with ticker symbols as keys and data dictionaries as values.
    """
    results = {}
    
    for i, ticker in enumerate(tickers):
        logger.info(f"Processing ticker {i+1}/{len(tickers)}: {ticker}")
        results[ticker] = fetch_historical_data(ticker, start_date, end_date, retries, delay, use_cache)
        
        # Small delay between requests to be respectful to the API
        if i < len(tickers) - 1:  # Don't delay after the last request
            time.sleep(0.1)
    
    return results

def get_recent_data(
    ticker: str, 
    days_back: int = 30, 
    retries: int = 3, 
    delay: int = 1,
    use_cache: bool = True
) -> Optional[Dict[str, Any]]:
    """Convenience function to get recent stock data.
    
    ARGS:
        ticker (str): Stock ticker symbol.
        days_back (int): Number of days back from today.
        retries (int): Number of retry attempts.
        delay (int): Delay between retries in seconds.
        use_cache (bool): Whether to use caching mechanism.
        
    RETURNS:
        dict: Dictionary containing recent stock data.
    """
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
    
    return fetch_historical_data(ticker, start_date, end_date, retries, delay, use_cache)

def clear_cache() -> None:
    """Clear the data cache."""
    global _cache, _cache_expiry
    cleared_items = len(_cache)
    _cache.clear()
    _cache_expiry.clear()
    logger.info(f"🧹 Cache cleared ({cleared_items} items removed)")

def get_cache_info() -> Dict[str, Any]:
    """Get information about the current cache state."""
    valid_items = sum(1 for key in _cache.keys() if _is_cache_valid(key))
    return {
        'total_items': len(_cache),
        'valid_items': valid_items,
        'expired_items': len(_cache) - valid_items,
        'cache_duration_seconds': CACHE_DURATION
    }