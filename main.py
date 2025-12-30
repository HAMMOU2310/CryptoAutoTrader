from flask import Flask, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "message": "System updated - New endpoints available",
        "endpoints": ["/", "/health", "/btc-price", "/market-data", "/indicators", "/account"]
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})

@app.route('/btc-price')
def btc_price():
    """سعر BTC تجريبي مؤقت"""
    return jsonify({
        "symbol": "BTCUSDT",
        "price": 45230.75,
        "source": "Test data",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
