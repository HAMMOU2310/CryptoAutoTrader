 os
import time
from flask import Flask
from binance.client import Client
import threading

app = Flask(__name__)

@app.route('/')
def home():
    return "🚀 Trading Bot is Running! ✅"

@app.route('/health')
def health_check():
    return "OK", 200

def run_bot():
    """دالة تشغيل البوت"""
    # الحصول على مفاتيح API من Environment Variables
    api_key = os.environ.get('BINANCE_API_KEY')
    api_secret = os.environ.get('BINANCE_SECRET_KEY')
    
    print(f"🔍 Checking API Key: {'✅ Found' if api_key else '❌ Missing'}")
    print(f"🔍 Checking Secret Key: {'✅ Found' if api_secret else '❌ Missing'}")
    
    if not api_key or not api_secret:
        print("❌ ERROR: API keys missing! Please add them in Render Environment Variables")
        print("❌ Required: BINANCE_API_KEY and BINANCE_SECRET_KEY")
        return
    
    try:
        # الاتصال بـ Binance Testnet
        client = Client(api_key, api_secret, testnet=True)
        print("✅ Successfully connected to Binance Testnet")
        
        # اختبار الاتصال
        account = client.get_account()
        print(f"✅ Account Status: Active (Testnet)")
        
        while True:
            try:
                # الحصول على سعر البيتكوين
                ticker = client.get_symbol_ticker(symbol='BTCUSDT')
                price = float(ticker['price'])
                print(f"💰 BTC Price: ${price:,.2f}")
                
            except Exception as e:
                print(f"⚠️ Temporary error: {e}")
            
            time.sleep(30)  # انتظر 30 ثانية
            
    except Exception as e:
        print(f"❌ Failed to connect: {e}")
        print("❌ Check: 1) API keys 2) Internet 3) Binance service")

if __name__ == '__main__':
    # بدء البوت في thread منفصل
    bot_thread = threading.Thread(target=run_bot, daemon=True)
    bot_thread.start()
    
    # تشغيل خادم Flask
    port = int(os.environ.get('PORT', 10000))
    print(f"🌐 Server starting on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False
