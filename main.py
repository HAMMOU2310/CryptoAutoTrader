from flask import Flask, jsonify, request
import os
from binance.client import Client
from binance.enums import *
from datetime import datetime
import pandas as pd
import ta
import numpy as np

app = Flask(__name__)

# تهيئة عميل Binance Testnet
def get_binance_client():
    try:
        api_key = os.environ.get('BINANCE_API_KEY')
        api_secret = os.environ.get('BINANCE_SECRET_KEY')
        
        if not api_key or not api_secret:
            raise ValueError("Binance API keys are missing")
            
        client = Client(
            api_key=api_key,
            api_secret=api_secret,
            testnet=True  # مهم: هذا للاختبار فقط!
        )
        return client
    except Exception as e:
        print(f"Error initializing Binance client: {e}")
        return None

# ==================== نقاط النهاية الأساسية ====================

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "environment": "production",
        "endpoints": {
            "health": "/health",
            "check_keys": "/check-keys",
            "btc_price": "/btc-price",
            "account_info": "/account",
            "market_data": "/market-data",
            "indicators": "/indicators",
            "test_order": "/test-order (POST)"
        }
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/check-keys')
def check_keys():
    keys = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'TRADING_PAIR', 'NODE_ENV']
    results = {key: key in os.environ for key in keys}
    
    for key in keys:
        if results[key]:
            results[f"{key}_length"] = len(os.environ.get(key, ''))
    
    results['total_environment_variables'] = len(os.environ)
    return jsonify(results)

# ==================== نقاط Binance API ====================

@app.route('/btc-price')
def btc_price():
    """جلب سعر BTC/USDT الحالي"""
    try:
        client = get_binance_client()
        if not client:
            return jsonify({"error": "Binance client not initialized"}), 500
            
        ticker = client.get_symbol_ticker(symbol="BTCUSDT")
        return jsonify({
            "success": True,
            "symbol": "BTCUSDT",
            "price": float(ticker['price']),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/account')
def account_info():
    """معلومات حساب Binance Testnet"""
    try:
        client = get_binance_client()
        if not client:
            return jsonify({"error": "Binance client not initialized"}), 500
            
        account = client.get_account()
        # عرض الرصيد المتاح فقط
        balances = []
        for asset in account['balances']:
            free = float(asset['free'])
            locked = float(asset['locked'])
            if free > 0 or locked > 0:
                balances.append({
                    'asset': asset['asset'],
                    'free': free,
                    'locked': locked,
                    'total': free + locked
                })
        
        return jsonify({
            "success": True,
            "account_type": "Testnet",
            "balances": balances,
            "total_assets": len(balances)
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/market-data')
def market_data():
    """جلب بيانات السوق للـ 24 ساعة الماضية"""
    try:
        client = get_binance_client()
        if not client:
            return jsonify({"error": "Binance client not initialized"}), 500
            
        # جلب بيانات الشموع للساعة الواحدة (آخر 24 شمعة)
        klines = client.get_klines(
            symbol="BTCUSDT",
            interval=Client.KLINE_INTERVAL_1HOUR,
            limit=24
        )
        
        # تحليل البيانات
        prices = []
        volumes = []
        
        for k in klines:
            prices.append({
                'open': float(k[1]),
                'high': float(k[2]),
                'low': float(k[3]),
                'close': float(k[4]),
                'volume': float(k[5]),
                'time': datetime.fromtimestamp(k[0]/1000).isoformat()
            })
            volumes.append(float(k[5]))
        
        # حساب التغير
        if len(prices) >= 2:
            price_change = ((prices[-1]['close'] - prices[0]['close']) / prices[0]['close']) * 100
        else:
            price_change = 0
        
        return jsonify({
            "success": True,
            "symbol": "BTCUSDT",
            "timeframe": "1H",
            "candles_count": len(prices),
            "current_price": prices[-1]['close'] if prices else 0,
            "price_change_24h": round(price_change, 2),
            "high_24h": max([p['high'] for p in prices]) if prices else 0,
            "low_24h": min([p['low'] for p in prices]) if prices else 0,
            "total_volume": sum(volumes),
            "latest_candle": prices[-1] if prices else None
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/indicators')
def indicators():
    """حساب المؤشرات الفنية"""
    try:
        client = get_binance_client()
        if not client:
            return jsonify({"error": "Binance client not initialized"}), 500
            
        # جلب 100 شمعة ساعة (للحصول على بيانات كافية)
        klines = client.get_klines(
            symbol="BTCUSDT",
            interval=Client.KLINE_INTERVAL_1HOUR,
            limit=100
        )
        
        closes = [float(k[4]) for k in klines]
        
        if len(closes) < 14:
            return jsonify({"error": "Not enough data for indicators"}), 400
        
        # تحويل إلى pandas Series للمؤشرات
        close_series = pd.Series(closes)
        
        # حساب RSI
        rsi_indicator = ta.momentum.RSIIndicator(close=close_series, window=14)
        rsi = rsi_indicator.rsi()
        
        # حساب MACD
        macd_indicator = ta.trend.MACD(close=close_series)
        macd_line = macd_indicator.macd()
        signal_line = macd_indicator.macd_signal()
        macd_histogram = macd_indicator.macd_diff()
        
        # حساب المتوسطات المتحركة
        sma_20 = ta.trend.SMAIndicator(close=close_series, window=20).sma_indicator()
        sma_50 = ta.trend.SMAIndicator(close=close_series, window=50).sma_indicator()
        
        return jsonify({
            "success": True,
            "symbol": "BTCUSDT",
            "indicators": {
                "rsi": {
                    "current": float(rsi.iloc[-1]),
                    "interpretation": "oversold" if rsi.iloc[-1] < 30 else "overbought" if rsi.iloc[-1] > 70 else "neutral"
                },
                "macd": {
                    "macd_line": float(macd_line.iloc[-1]),
                    "signal_line": float(signal_line.iloc[-1]),
                    "histogram": float(macd_histogram.iloc[-1]),
                    "signal": "bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "bearish"
                },
                "moving_averages": {
                    "sma_20": float(sma_20.iloc[-1]),
                    "sma_50": float(sma_50.iloc[-1]),
                    "trend": "bullish" if sma_20.iloc[-1] > sma_50.iloc[-1] else "bearish"
                }
            },
            "current_price": closes[-1],
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/test-order', methods=['POST'])
def test_order():
    """وضع أمر تجريبي على Testnet"""
    try:
        client = get_binance_client()
        if not client:
            return jsonify({"error": "Binance client not initialized"}), 500
        
        # جلب سعر السوق الحالي
        ticker = client.get_symbol_ticker(symbol="BTCUSDT")
        current_price = float(ticker['price'])
        
        # وضع أمر شراء تجريبي صغير (0.001 BTC)
        order = client.create_test_order(
            symbol='BTCUSDT',
            side='BUY',
            type='MARKET',
            quantity=0.001
        )
        
        return jsonify({
            "success": True,
            "message": "Test order placed successfully (simulation only)",
            "order_details": {
                "symbol": "BTCUSDT",
                "side": "BUY",
                "type": "MARKET",
                "quantity": 0.001,
                "estimated_price": current_price,
                "estimated_cost": current_price * 0.001
            },
            "note": "This is a TEST order on Binance Testnet. No real trade executed."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
