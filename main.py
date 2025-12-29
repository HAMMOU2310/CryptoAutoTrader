import os
from flask import Flask
import threading
from binance.client import Client
import time

# إنشاء تطبيق Flask
app = Flask(__name__)

@app.route('/')
def home():
    return "Trading Bot is Running! ✅"

@app.route('/health')
def health_check():
    return "OK", 200

# وظيفة البوت في thread منفصل
def run_bot():
    api_key = os.environ.get('BINANCE_API_KEY')
    api_secret = os.environ.get('BINANCE_SECRET_KEY')
    use_testnet = os.environ.get('USE_TESTNET', 'true').lower() == 'true'
    
    if api_key and api_secret:
        client = Client(api_key, api_secret, testnet=use_testnet)
        print("✅ Connected to Binance API")
        
        while True:
            # كود التداول الخاص بك هنا
            try:
                # مثال: الحصول على سعر Bitcoin
                ticker = client.get_symbol_ticker(symbol='BTCUSDT')
                print(f"BTC Price: {ticker['price']}")
            except Exception as e:
                print(f"Error: {e}")
            
            time.sleep(60)  # انتظر دقيقة
    else:
        print("❌ API keys not found!")

if __name__ == '__main__':
    # بدء البوت في thread منفصل
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    
    # تشغيل خادم Flask على المنفذ المطلوب
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port)
