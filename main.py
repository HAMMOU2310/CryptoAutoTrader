from flask import Flask, jsonify
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "endpoints": ["/", "/health", "/test", "/btc-test"]
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/test')
def test():
    return jsonify({"test": "ok"})

@app.route('/btc-test')
def btc_test():
    """اختبار بسيط - إرجاع سعر تجريبي"""
    return jsonify({
        "symbol": "BTCUSDT",
        "price": 45000.50,
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
