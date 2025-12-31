from flask import Flask, jsonify
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "version": "3.0",
        "endpoints": ["/", "/health", "/btc-test", "/check-keys"]
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "time": datetime.now().isoformat()})

@app.route('/btc-test')
def btc_test():
    return jsonify({
        "symbol": "BTCUSDT",
        "price": 45000.50,
        "timestamp": datetime.now().isoformat()
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
