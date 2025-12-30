from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "service": "Crypto Auto Trader",
        "status": "active",
        "environment": "production",
        "endpoints": ["/", "/health", "/env", "/test", "/check-keys", "/debug-env"]
    })

@app.route('/env')
def env_check():
    """فحص وجود مفاتيح Binance"""
    has_binance_key = 'BINANCE_API_KEY' in os.environ
    return jsonify({
        "has_binance_key": has_binance_key,
        "message": "Environment check completed",
        "binance_key_exists": has_binance_key
    })

@app.route('/check-keys')
def check_keys():
    """فحص جميع المفاتيح المهمة"""
    keys = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'TRADING_PAIR', 'NODE_ENV']
    results = {key: (key in os.environ) for key in keys}
    
    # إظهار طول القيم (للأمان)
    for key in keys:
        if results[key]:
            results[f"{key}_length"] = len(os.environ.get(key, ''))
    
    results['total_environment_variables'] = len(os.environ)
    return jsonify(results)

@app.route('/debug-env')
def debug_env():
    """تصحيح مفصل للمتغيرات"""
    all_vars = {}
    for key in os.environ:
        value = os.environ[key]
        if any(secret in key.upper() for secret in ['KEY', 'SECRET', 'TOKEN', 'PASS']):
            all_vars[key] = f'***HIDDEN*** ({len(value)} chars)'
        else:
            all_vars[key] = value if len(value) < 50 else f'[{len(value)} chars]'
    
    return jsonify({
        'total_variables': len(os.environ),
        'sample_variables': dict(list(all_vars.items())[:10]),
        'binance_api_key_exists': 'BINANCE_API_KEY' in os.environ,
        'binance_secret_key_exists': 'BINANCE_SECRET_KEY' in os.environ
    })

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
