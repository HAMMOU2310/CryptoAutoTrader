from flask import Flask, jsonify
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "environment": "production",
        "version": "2.0",
        "endpoints": [
            "/", "/health", "/btc-price", "/market-data", 
            "/indicators", "/account", "/check-keys"
        ]
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})

@app.route('/btc-price')
def btc_price():
    """سعر BTC تجريبي مؤقت"""
    return jsonify({
        "success": True,
        "symbol": "BTCUSDT",
        "price": 45230.75,
        "source": "Test data",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/market-data')
def market_data():
    """بيانات سوق تجريبية"""
    return jsonify({
        "success": True,
        "symbol": "BTCUSDT",
        "current_price": 45230.75,
        "price_change_24h": 1.5,
        "high_24h": 45500.00,
        "low_24h": 44800.50,
        "volume": 1250000000
    })

@app.route('/indicators')
def indicators():
    """مؤشرات فنية تجريبية"""
    return jsonify({
        "success": True,
        "symbol": "BTCUSDT",
        "indicators": {
            "rsi": {"value": 65.5, "signal": "neutral"},
            "macd": {"value": 120.5, "signal": "bullish"},
            "moving_averages": {"sma_20": 45000, "sma_50": 44500, "trend": "bullish"}
        }
    })

@app.route('/account')
def account():
    """معلومات حساب تجريبية"""
    return jsonify({
        "success": True,
        "account_type": "Testnet",
        "balances": [
            {"asset": "BTC", "free": 0.05, "locked": 0, "total": 0.05},
            {"asset": "USDT", "free": 1000, "locked": 0, "total": 1000}
        ]
    })

@app.route('/check-keys')
def check_keys():
    keys = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'TRADING_PAIR', 'NODE_ENV']
    results = {key: key in os.environ for key in keys}
    results['total_environment_variables'] = len(os.environ)
    return jsonify(results)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
