print("🚀 Crypto Trading Bot Started!")
print("✅ All dependencies installed successfully")

# Test imports
try:
    from binance.client import Client
    print("✅ Binance library imported successfully")
except ImportError as e:
    print(f"❌ Import error: {e}")

# Keep the bot running
import time
counter = 0
while True:
    counter += 1
    print(f"🔄 Bot running... Iteration {counter}")
    time.sleep(30)  # Wait 30 seconds
