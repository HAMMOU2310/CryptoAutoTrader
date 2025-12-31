from flask import Flask, jsonify
import requests
import time
import os
from datetime import datetime

app = Flask(__name__)

@app.route('/')
def home():
    return """
    <h1>🚀 Crypto Auto Trader</h1>
    <p>✅ System is Running Perfectly!</p>
    <p>Time: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
    """

@app.route('/health')
def health():
    return jsonify({
        "status": "active",
        "service": "crypto-bot",
        "version": "1.0"
    })

@app.route('/price/btc')
def btc_price():
    try:
        response = requests.get('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', timeout=5)
        data = response.json()
        return jsonify({
            "symbol": "BTC/USDT",
            "price": data['price'],
            "time": datetime.now().strftime("%H:%M:%S")
        })
    except:
        return jsonify({"error": "Could not fetch price"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
