from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "environment": "production",
        "endpoints": ["/", "/env", "/check-keys", "/health", "/test"]
    })

@app.route('/env')
def env_check():
    """فحص وجود مفاتيح Binance"""
    has_binance_key = 'BINANCE_API_KEY' in os.environ
    return jsonify({
        "has_binance_key": has_binance_key,
        "binance_key_exists": has_binance_key,
        "message": "Environment check completed"
    })

@app.route('/check-keys')
def check_keys():
    """فحص جميع المفاتيح المهمة"""
    keys_to_check = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'TRADING_PAIR', 'NODE_ENV']
    results = {}
    
    for key in keys_to_check:
        exists = key in os.environ
        results[key] = exists
        if exists:
            results[f"{key}_length"] = len(os.environ.get(key, ''))
    
    results['total_environment_variables'] = len(os.environ)
    return jsonify(results)

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

@app.route('/test')
def test():
    return jsonify({"test": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
