from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)

# قائمة المسارات المعروفة
ENDPOINTS = {
    "/": "Home page",
    "/health": "Health check",
    "/test": "Test endpoint",
    "/env": "Environment info (safe)"
}

@app.route('/')
def home():
    return jsonify({
        'service': 'Crypto Auto Trader',
        'status': 'active',
        'endpoints': ENDPOINTS,
        'environment': os.environ.get('NODE_ENV', 'production')
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'python_version': sys.version,
        'flask_version': '2.3.3'
    })

@app.route('/test')
def test():
    return jsonify({'test': 'success', 'code': 200})

@app.route('/env')
def env():
    # عرض متغيرات البيئة بأمان (بدون عرض المفاتيح السرية)
    safe_env = {
        'NODE_ENV': os.environ.get('NODE_ENV'),
        'PORT': os.environ.get('PORT'),
        'has_binance_key': 'BINANCE_API_KEY' in os.environ,
        'has_binance_secret': 'BINANCE_SECRET_KEY' in os.environ,
        'total_env_vars': len(os.environ)
    }
    return jsonify(safe_env)

@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'Not Found',
        'available_endpoints': list(ENDPOINTS.keys()),
        'message': 'Use one of the available endpoints'
    }), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    print(f"🚀 Starting server on port {port}")
    print(f"📁 Python: {sys.version}")
    print(f"🔑 Environment variables: {len(os.environ)}")
    app.run(host='0.0.0.0', port=port, debug=False)
