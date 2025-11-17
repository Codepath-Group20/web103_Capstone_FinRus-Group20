from flask import Flask, jsonify, request
from flask_cors import CORS
from YahooData import fetch_historical_data, fetch_multiple_tickers, get_recent_data, clear_cache, get_cache_info
from datetime import datetime, timedelta
import logging
import re
from typing import Dict, Any, Optional
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Rate limiting (simple in-memory implementation)
request_counts = {}
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 100

def validate_ticker(ticker: str) -> bool:
    """Validate ticker symbol format."""
    if not ticker or not isinstance(ticker, str):
        return False
    # Basic ticker validation: 1-5 alphanumeric characters
    return bool(re.match(r'^[A-Z0-9]{1,5}$', ticker.upper()))

def validate_date_format(date_str: str) -> bool:
    """Validate date format YYYY-MM-DD."""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except ValueError:
        return False

def rate_limit(f):
    """Simple rate limiting decorator."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = request.remote_addr
        current_time = datetime.now()
        
        # Clean old entries
        cutoff_time = current_time - timedelta(seconds=RATE_LIMIT_WINDOW)
        if client_ip in request_counts:
            request_counts[client_ip] = [
                req_time for req_time in request_counts[client_ip] 
                if req_time > cutoff_time
            ]
        else:
            request_counts[client_ip] = []
        
        # Check rate limit
        if len(request_counts[client_ip]) >= MAX_REQUESTS_PER_WINDOW:
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return jsonify({
                'error': 'Rate limit exceeded',
                'message': f'Maximum {MAX_REQUESTS_PER_WINDOW} requests per {RATE_LIMIT_WINDOW} seconds'
            }), 429
        
        # Add current request
        request_counts[client_ip].append(current_time)
        
        return f(*args, **kwargs)
    return decorated_function

def create_error_response(error_message: str, status_code: int = 400) -> tuple:
    """Create standardized error response."""
    logger.error(f"API Error: {error_message}")
    return jsonify({
        'success': False,
        'error': error_message,
        'timestamp': datetime.now().isoformat()
    }), status_code

@app.route('/api/stock/<ticker>')
@rate_limit
def get_stock_data(ticker: str):
    """API endpoint to fetch historical stock data for a single ticker.
    
    Query Parameters:
        - days_back (int): Number of days back from today (default: 30)
        - start_date (str): Start date in YYYY-MM-DD format
        - end_date (str): End date in YYYY-MM-DD format
        - use_cache (bool): Whether to use caching (default: true)
    
    Returns:
        JSON response with stock data or error message
    """
    try:
        # Validate ticker
        if not validate_ticker(ticker):
            return create_error_response(f"Invalid ticker format: {ticker}")
        
        ticker = ticker.upper()
        
        # Get query parameters
        days_back = request.args.get('days_back', 30, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        use_cache = request.args.get('use_cache', 'true').lower() == 'true'
        
        # Validate days_back
        if days_back <= 0 or days_back > 365:
            return create_error_response("days_back must be between 1 and 365")
        
        # Calculate dates if not provided
        if not start_date or not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        else:
            # Validate provided dates
            if not validate_date_format(start_date) or not validate_date_format(end_date):
                return create_error_response("Dates must be in YYYY-MM-DD format")
            
            # Check date logic
            if start_date >= end_date:
                return create_error_response("start_date must be before end_date")
        
        logger.info(f"Fetching data for {ticker} from {start_date} to {end_date}")
        
        # Fetch data
        data = fetch_historical_data(ticker, start_date, end_date, use_cache=use_cache)
        
        if data is None:
            return create_error_response(f'No data found for {ticker}', 404)
        
        # Add success flag to response
        data['success'] = True
        
        return jsonify(data)
        
    except ValueError as ve:
        return create_error_response(str(ve))
    except Exception as e:
        logger.exception(f"Unexpected error in get_stock_data: {str(e)}")
        return create_error_response(f'Internal server error: {str(e)}', 500)

@app.route('/api/stock/multiple')
@rate_limit
def get_multiple_stocks():
    """API endpoint to fetch historical data for multiple stocks.
    
    Query Parameters:
        - tickers (str): Comma-separated list of ticker symbols
        - days_back (int): Number of days back from today (default: 30)
        - start_date (str): Start date in YYYY-MM-DD format
        - end_date (str): End date in YYYY-MM-DD format
        - use_cache (bool): Whether to use caching (default: true)
    
    Returns:
        JSON response with data for all requested tickers
    """
    try:
        # Get and validate tickers
        tickers_param = request.args.get('tickers', '')
        if not tickers_param:
            return create_error_response('No tickers provided')
        
        tickers = [ticker.strip().upper() for ticker in tickers_param.split(',') if ticker.strip()]
        
        if not tickers:
            return create_error_response('No valid tickers provided')
        
        # Limit number of tickers to prevent abuse
        if len(tickers) > 10:
            return create_error_response('Maximum 10 tickers allowed per request')
        
        # Validate all tickers
        invalid_tickers = [ticker for ticker in tickers if not validate_ticker(ticker)]
        if invalid_tickers:
            return create_error_response(f'Invalid ticker format: {", ".join(invalid_tickers)}')
        
        # Get query parameters
        days_back = request.args.get('days_back', 30, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        use_cache = request.args.get('use_cache', 'true').lower() == 'true'
        
        # Validate days_back
        if days_back <= 0 or days_back > 365:
            return create_error_response("days_back must be between 1 and 365")
        
        # Calculate dates if not provided
        if not start_date or not end_date:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days_back)).strftime('%Y-%m-%d')
        else:
            # Validate provided dates
            if not validate_date_format(start_date) or not validate_date_format(end_date):
                return create_error_response("Dates must be in YYYY-MM-DD format")
            
            if start_date >= end_date:
                return create_error_response("start_date must be before end_date")
        
        logger.info(f"Fetching data for {len(tickers)} tickers from {start_date} to {end_date}")
        
        # Fetch data for all tickers
        results = fetch_multiple_tickers(tickers, start_date, end_date, use_cache=use_cache)
        
        # Add metadata to response
        response = {
            'success': True,
            'tickers_requested': tickers,
            'tickers_count': len(tickers),
            'data': results,
            'metadata': {
                'start_date': start_date,
                'end_date': end_date,
                'fetched_at': datetime.now().isoformat()
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.exception(f"Unexpected error in get_multiple_stocks: {str(e)}")
        return create_error_response(f'Internal server error: {str(e)}', 500)

@app.route('/api/stock/recent/<ticker>')
@rate_limit
def get_recent_stock_data(ticker: str):
    """API endpoint to fetch recent stock data (convenience endpoint).
    
    Query Parameters:
        - days_back (int): Number of days back from today (default: 30)
        - use_cache (bool): Whether to use caching (default: true)
    """
    try:
        if not validate_ticker(ticker):
            return create_error_response(f"Invalid ticker format: {ticker}")
        
        ticker = ticker.upper()
        days_back = request.args.get('days_back', 30, type=int)
        use_cache = request.args.get('use_cache', 'true').lower() == 'true'
        
        if days_back <= 0 or days_back > 365:
            return create_error_response("days_back must be between 1 and 365")
        
        logger.info(f"Fetching recent {days_back} days data for {ticker}")
        
        data = get_recent_data(ticker, days_back=days_back, use_cache=use_cache)
        
        if data is None:
            return create_error_response(f'No recent data found for {ticker}', 404)
        
        data['success'] = True
        return jsonify(data)
        
    except Exception as e:
        logger.exception(f"Unexpected error in get_recent_stock_data: {str(e)}")
        return create_error_response(f'Internal server error: {str(e)}', 500)

@app.route('/api/cache/info')
def get_cache_status():
    """Get cache information."""
    try:
        cache_info = get_cache_info()
        cache_info['success'] = True
        return jsonify(cache_info)
    except Exception as e:
        return create_error_response(f'Error getting cache info: {str(e)}', 500)

@app.route('/api/cache/clear', methods=['POST'])
def clear_data_cache():
    """Clear the data cache."""
    try:
        clear_cache()
        return jsonify({
            'success': True,
            'message': 'Cache cleared successfully',
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return create_error_response(f'Error clearing cache: {str(e)}', 500)

@app.route('/api/health')
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'FinRus Historical Data API',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return create_error_response('Endpoint not found', 404)

@app.errorhandler(405)
def method_not_allowed(error):
    """Handle 405 errors."""
    return create_error_response('Method not allowed', 405)

if __name__ == '__main__':
    logger.info("Starting FinRus Historical Data API...")
    app.run(debug=True, host='0.0.0.0', port=5000)