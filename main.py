"""
Crypto Auto Trader - الإصدار المتقدم مع معالجة الأخطاء التلقائية
يتضمن حلولاً للمشاكل التي واجهناها في النشر والتشغيل
"""

import os
import sys
import logging
from datetime import datetime
from flask import Flask, jsonify

# إعداد السجلات (Logging) لمتابعة الأخطاء
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ==================== إعدادات استيراد المكتبات مع معالجة الأخطاء ====================

def safe_import(module_name, install_name=None):
    """
    استيراد مكتبة بأمان مع رسالة خطو واضحة إذا فشل
    """
    try:
        module = __import__(module_name)
        logger.info(f"✅ تم تحميل المكتبة بنجاح: {module_name}")
        return module
    except ImportError as e:
        error_msg = f"❌ المكتبة {module_name} غير مثبتة. قم بتثبيتها باستخدام: pip install {install_name or module_name}"
        logger.error(error_msg)
        return None

# محاولة استيراد المكتبات الأساسية
FLASK_AVAILABLE = True  # Flask متأكد أنه مثبت

# محاولة استيراد مكتبات Binance
BINANCE_AVAILABLE = False
client = None
binance_module = safe_import('binance.client', 'python-binance')

if binance_module:
    try:
        from binance.client import Client
        from binance.enums import *
        BINANCE_AVAILABLE = True
        logger.info("✅ مكتبة Binance جاهزة للاستخدام")
    except Exception as e:
        logger.error(f"❌ خطأ في تحميل Binance: {str(e)}")

# محاولة استيراد مكتبات التحليل الفني
TA_AVAILABLE = False
ta_module = safe_import('ta')

if ta_module:
    TA_AVAILABLE = True
    logger.info("✅ مكتبة التحليل الفني (ta) جاهزة للاستخدام")

# محاولة استيراد pandas
PANDAS_AVAILABLE = False
pandas_module = safe_import('pandas')

if pandas_module:
    PANDAS_AVAILABLE = True
    logger.info("✅ مكتبة pandas جاهزة للاستخدام")

# ==================== وظائف المساعدة مع معالجة الأخطاء ====================

def get_binance_client():
    """
    إنشاء عميل Binance مع معالجة جميع الأخطاء المحتملة
    """
    if not BINANCE_AVAILABLE:
        return {
            "success": False,
            "error": "مكتبة python-binance غير مثبتة",
            "solution": "أضف 'python-binance==1.0.19' إلى requirements.txt"
        }
    
    try:
        api_key = os.environ.get('BINANCE_API_KEY')
        api_secret = os.environ.get('BINANCE_SECRET_KEY')
        
        if not api_key or not api_secret:
            return {
                "success": False,
                "error": "مفاتيح Binance غير موجودة في متغيرات البيئة",
                "solution": "أضف BINANCE_API_KEY و BINANCE_SECRET_KEY إلى Environment Variables"
            }
        
        # اختبار طول المفاتيح (مفتاح Binance عادةً 64 حرفاً)
        if len(api_key) < 20 or len(api_secret) < 20:
            return {
                "success": False,
                "error": "مفاتيح Binance قصيرة جداً أو غير صحيحة",
                "solution": "تأكد من نسخ المفاتيح كاملة من Binance Testnet"
            }
        
        client = Client(
            api_key=api_key,
            api_secret=api_secret,
            testnet=True  # مهم: للاختبار فقط!
        )
        
        # اختبار الاتصال
        client.get_account()
        
        return {
            "success": True,
            "client": client,
            "message": "اتصال Binance Testnet ناجح"
        }
        
    except Exception as e:
        error_msg = str(e).lower()
        
        if "api-key" in error_msg or "signature" in error_msg:
            return {
                "success": False,
                "error": "مفاتيح Binance غير صالحة",
                "solution": "تحقق من صحة المفاتيح أو أنشئ مفاتيح جديدة من Binance Testnet"
            }
        elif "network" in error_msg or "connection" in error_msg:
            return {
                "success": False,
                "error": "مشكلة في الاتصال بـ Binance",
                "solution": "تحقق من اتصال الإنترنت أو حاول لاحقاً"
            }
        else:
            return {
                "success": False,
                "error": f"خطأ غير متوقع: {str(e)}",
                "solution": "تحقق من السجلات (Logs) لمزيد من التفاصيل"
            }

def get_system_status():
    """
    الحصول على حالة النظام الكاملة
    """
    return {
        "timestamp": datetime.now().isoformat(),
        "environment": {
            "binance_api_key_exists": 'BINANCE_API_KEY' in os.environ,
            "binance_secret_key_exists": 'BINANCE_SECRET_KEY' in os.environ,
            "trading_pair_exists": 'TRADING_PAIR' in os.environ,
            "node_env_exists": 'NODE_ENV' in os.environ,
            "total_env_vars": len(os.environ)
        },
        "libraries": {
            "binance": BINANCE_AVAILABLE,
            "ta": TA_AVAILABLE,
            "pandas": PANDAS_AVAILABLE,
            "flask": FLASK_AVAILABLE
        },
        "service": {
            "name": "Crypto Auto Trader",
            "version": "2.0 المتقدم",
            "status": "active"
        }
    }

# ==================== نقاط النهاية (Endpoints) ====================

@app.route('/')
def home():
    """الصفحة الرئيسية مع معلومات النظام الكاملة"""
    system_status = get_system_status()
    
    endpoints = {
        "basic": ["/", "/health", "/system-status", "/check-keys"],
        "binance": ["/btc-price", "/account", "/market-data", "/indicators"],
        "debug": ["/debug", "/test-connection"]
    }
    
    return jsonify({
        **system_status,
        "endpoints": endpoints,
        "instructions": {
            "إذا لم تعمل نقاط Binance": "تحقق من المفاتيح في Environment Variables",
            "إذا ظهرت أخطاء في المكتبات": "تأكد من requirements.txt يحتوي جميع المكتبات",
            "للتشخيص المفصل": "استخدم /system-status و /debug"
        }
    })

@app.route('/health')
def health():
    """فحص صحة النظام"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Crypto Auto Trader"
    })

@app.route('/system-status')
def system_status():
    """حالة النظام المفصلة"""
    return jsonify(get_system_status())

@app.route('/check-keys')
def check_keys():
    """فحص المفاتيح البيئية"""
    keys_to_check = {
        'BINANCE_API_KEY': 'مفتاح Binance العام',
        'BINANCE_SECRET_KEY': 'مفتاح Binance السري',
        'TRADING_PAIR': 'زوج التداول (مثال: BTCUSDT)',
        'NODE_ENV': 'بيئة التشغيل (production/development)'
    }
    
    results = {}
    for key, description in keys_to_check.items():
        exists = key in os.environ
        results[key] = {
            "exists": exists,
            "description": description,
            "length": len(os.environ.get(key, '')) if exists else 0,
            "value_preview": os.environ.get(key, '')[:10] + "..." if exists and len(os.environ.get(key, '')) > 10 else os.environ.get(key, '') if exists else ""
        }
    
    return jsonify({
        "success": True,
        "keys": results,
        "total_environment_variables": len(os.environ),
        "missing_keys": [key for key in keys_to_check if not results[key]["exists"]]
    })

@app.route('/btc-price')
def btc_price():
    """جلب سعر BTC/USDT مع معالجة الأخطاء"""
    try:
        # محاولة الاتصال بـ Binance للحصول على سعر حقيقي
        binance_result = get_binance_client()
        
        if binance_result["success"]:
            client = binance_result["client"]
            ticker = client.get_symbol_ticker(symbol="BTCUSDT")
            
            return jsonify({
                "success": True,
                "symbol": "BTCUSDT",
                "price": float(ticker['price']),
                "source": "Binance Testnet",
                "timestamp": datetime.now().isoformat(),
                "connection": "ناجح"
            })
        else:
            # إذا فشل الاتصال بـ Binance، نرجع سعر تجريبي
            return jsonify({
                "success": True,
                "symbol": "BTCUSDT",
                "price": 45230.75,
                "source": "بيانات تجريبية (لأن الاتصال ب Binance فشل)",
                "timestamp": datetime.now().isoformat(),
                "error": binance_result.get("error", "خطأ غير معروف"),
                "solution": binance_result.get("solution", "تحقق من السجلات"),
                "connection": "فشل - استخدام بيانات تجريبية"
            })
            
    except Exception as e:
        logger.error(f"خطأ في /btc-price: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "symbol": "BTCUSDT",
            "price": 45230.75,
            "source": "بيانات تجريبية (بسبب خطأ استثناء)",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/account')
def account_info():
    """معلومات حساب Binance Testnet"""
    binance_result = get_binance_client()
    
    if not binance_result["success"]:
        return jsonify({
            "success": False,
            "error": binance_result.get("error", "خطأ في الاتصال ب Binance"),
            "solution": binance_result.get("solution", "تحقق من المفاتيح والاتصال"),
            "demo_account": {
                "account_type": "Testnet (تجريبي)",
                "balances": [
                    {"asset": "BTC", "free": 0.05, "locked": 0, "total": 0.05},
                    {"asset": "USDT", "free": 1000, "locked": 0, "total": 1000}
                ]
            }
        })
    
    try:
        client = binance_result["client"]
        account = client.get_account()
        
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
            "account_type": "Binance Testnet",
            "balances": balances,
            "total_assets": len(balances),
            "connection": "ناجح"
        })
        
    except Exception as e:
        logger.error(f"خطأ في /account: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "demo_account": {
                "account_type": "Testnet (تجريبي بسبب خطأ)",
                "balances": [
                    {"asset": "BTC", "free": 0.05, "locked": 0, "total": 0.05},
                    {"asset": "USDT", "free": 1000, "locked": 0, "total": 1000}
                ]
            }
        }), 500

@app.route('/market-data')
def market_data():
    """بيانات السوق مع معالجة الأخطاء"""
    try:
        binance_result = get_binance_client()
        
        if binance_result["success"] and BINANCE_AVAILABLE:
            client = binance_result["client"]
            
            klines = client.get_klines(
                symbol="BTCUSDT",
                interval=Client.KLINE_INTERVAL_1HOUR,
                limit=24
            )
            
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
                "source": "Binance Testnet"
            })
        else:
            # بيانات تجريبية إذا فشل الاتصال
            return jsonify({
                "success": True,
                "symbol": "BTCUSDT",
                "timeframe": "1H",
                "candles_count": 24,
                "current_price": 45230.75,
                "price_change_24h": 1.5,
                "high_24h": 45500.00,
                "low_24h": 44800.50,
                "total_volume": 1250000000,
                "source": "بيانات تجريبية",
                "binance_error": binance_result.get("error", "غير متصل")
            })
            
    except Exception as e:
        logger.error(f"خطأ في /market-data: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "demo_data": {
                "symbol": "BTCUSDT",
                "current_price": 45230.75,
                "price_change_24h": 1.5,
                "high_24h": 45500.00,
                "low_24h": 44800.50
            }
        }), 500

@app.route('/indicators')
def indicators():
    """المؤشرات الفنية مع معالجة الأخطاء"""
    try:
        # التحقق من تثبيت المكتبات المطلوبة
        if not TA_AVAILABLE or not PANDAS_AVAILABLE:
            return jsonify({
                "success": True,
                "symbol": "BTCUSDT",
                "indicators": {
                    "rsi": {"value": 65.5, "signal": "neutral", "note": "بيانات تجريبية - مكتبة ta غير مثبتة"},
                    "macd": {"value": 120.5, "signal": "bullish", "note": "بيانات تجريبية - مكتبة ta غير مثبتة"},
                    "moving_averages": {
                        "sma_20": 45000, 
                        "sma_50": 44500, 
                        "trend": "bullish",
                        "note": "بيانات تجريبية - مكتبة ta غير مثبتة"
                    }
                },
                "current_price": 45230.75,
                "source": "بيانات تجريبية (المكتبات غير مثبتة)"
            })
        
        binance_result = get_binance_client()
        
        if binance_result["success"]:
            client = binance_result["client"]
            
            klines = client.get_klines(
                symbol="BTCUSDT",
                interval=Client.KLINE_INTERVAL_1HOUR,
                limit=100
            )
            
            closes = [float(k[4]) for k in klines]
            
            if len(closes) < 14:
                return jsonify({
                    "success": False,
                    "error": "بيانات غير كافية لحساب المؤشرات",
                    "min_data_needed": 14,
                    "available_data": len(closes)
                }), 400
            
            import pandas as pd
            import ta
            
            close_series = pd.Series(closes)
            
            rsi_indicator = ta.momentum.RSIIndicator(close=close_series, window=14)
            rsi = rsi_indicator.rsi()
            
            macd_indicator = ta.trend.MACD(close=close_series)
            macd_line = macd_indicator.macd()
            signal_line = macd_indicator.macd_signal()
            
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
                        "histogram": float(macd_indicator.macd_diff().iloc[-1]),
                        "signal": "bullish" if macd_line.iloc[-1] > signal_line.iloc[-1] else "bearish"
                    },
                    "moving_averages": {
                        "sma_20": float(sma_20.iloc[-1]),
                        "sma_50": float(sma_50.iloc[-1]),
                        "trend": "bullish" if sma_20.iloc[-1] > sma_50.iloc[-1] else "bearish"
                    }
                },
                "current_price": closes[-1],
                "source": "Binance Testnet + تحليل فني حقيقي"
            })
        else:
            # بيانات تجريبية إذا فشل الاتصال
            return jsonify({
                "success": True,
                "symbol": "BTCUSDT",
                "indicators": {
                    "rsi": {"value": 65.5, "signal": "neutral", "note": "بيانات تجريبية"},
                    "macd": {"value": 120.5, "signal": "bullish", "note": "بيانات تجريبية"},
                    "moving_averages": {
                        "sma_20": 45000, 
                        "sma_50": 44500, 
                        "trend": "bullish",
                        "note": "بيانات تجريبية"
                    }
                },
                "current_price": 45230.75,
                "source": "بيانات تجريبية (فشل الاتصال ب Binance)",
                "binance_error": binance_result.get("error", "غير متصل")
            })
            
    except Exception as e:
        logger.error(f"خطأ في /indicators: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "demo_indicators": {
                "rsi": {"value": 65.5, "signal": "neutral"},
                "macd": {"value": 120.5, "signal": "bullish"},
                "moving_averages": {"sma_20": 45000, "sma_50": 44500, "trend": "bullish"}
            }
        }), 500

@app.route('/debug')
def debug():
    """صفحة تصحيح الأخطاء المفصلة"""
    system_status = get_system_status()
    
    # جمع المعلومات التشخيصية
    diagnostics = {
        "python_version": sys.version,
        "working_directory": os.getcwd(),
        "environment_keys": list(os.environ.keys())[:20],  # أول 20 مفتاح فقط
        "binance_test": get_binance_client(),
        "flask_route_map": []
    }
    
    # جمع قائمة جميع نقاط النهاية
    for rule in app.url_map.iter_rules():
        if rule.endpoint != 'static':
            diagnostics["flask_route_map"].append({
                "endpoint": rule.endpoint,
                "path": str(rule),
                "methods": list(rule.methods)
            })
    
    return jsonify({
        "system_status": system_status,
        "diagnostics": diagnostics,
        "timestamp": datetime.now().isoformat(),
        "message": "صفحة تصحيح الأخطاء - جميع المعلومات التشخيصية"
    })

@app.route('/test-connection')
def test_connection():
    """اختبار الاتصال بجميع المكونات"""
    tests = []
    
    # اختبار 1: متغيرات البيئة
    env_test = {
        "name": "Environment Variables",
        "status": "pending"
    }
    required_keys = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY']
    missing_keys = [key for key in required_keys if key not in os.environ]
    
    if not missing_keys:
        env_test["status"] = "pass"
        env_test["message"] = "جميع المفاتيح المطلوبة موجودة"
    else:
        env_test["status"] = "fail"
        env_test["message"] = f"المفاتيح الناقصة: {missing_keys}"
    
    tests.append(env_test)
    
    # اختبار 2: مكتبة Binance
    binance_test = {
        "name": "Binance Library",
        "status": "pass" if BINANCE_AVAILABLE else "fail",
        "message": "مكتبة Binance مثبتة" if BINANCE_AVAILABLE else "مكتبة Binance غير مثبتة"
    }
    tests.append(binance_test)
    
    # اختبار 3: الاتصال بـ Binance
    connection_test = {
        "name": "Binance Connection",
        "status": "pending"
    }
    
    binance_result = get_binance_client()
    if binance_result["success"]:
        connection_test["status"] = "pass"
        connection_test["message"] = "الاتصال بـ Binance Testnet ناجح"
    else:
        connection_test["status"] = "fail"
        connection_test["message"] = binance_result.get("error", "خطأ غير معروف")
        connection_test["solution"] = binance_result.get("solution", "تحقق من السجلات")
    
    tests.append(connection_test)
    
    # اختبار 4: المكتبات الأخرى
    libs_test = {
        "name": "Other Libraries",
        "status": "pending"
    }
    
    missing_libs = []
    if not TA_AVAILABLE:
        missing_libs.append("ta (للتحليل الفني)")
    if not PANDAS_AVAILABLE:
        missing_libs.append("pandas (لمعالجة البيانات)")
    
    if not missing_libs:
        libs_test["status"] = "pass"
        libs_test["message"] = "جميع المكتبات مثبتة"
    else:
        libs_test["status"] = "warning"
        libs_test["message"] = f"المكتبات الناقصة: {', '.join(missing_libs)}"
        libs_test["note"] = "سيتم استخدام البيانات التجريبية لهذه المكونات"
    
    tests.append(libs_test)
    
    # حساب النتيجة الإجمالية
    passed = sum(1 for test in tests if test["status"] == "pass")
    total = len(tests)
    
    return jsonify({
        "success": True,
        "tests": tests,
        "summary": {
            "total_tests": total,
            "passed": passed,
            "failed": sum(1 for test in tests if test["status"] == "fail"),
            "warnings": sum(1 for test in tests if test["status"] == "warning"),
            "score": f"{passed}/{total}"
        },
        "overall_status": "healthy" if passed == total else "needs_attention",
        "timestamp": datetime.now().isoformat()
    })

# ==================== تشغيل التطبيق ====================

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("بدء تشغيل Crypto Auto Trader - الإصدار المتقدم")
    logger.info(f"الوقت: {datetime.now().isoformat()}")
    logger.info("=" * 50)
    
    # عرض حالة النظام عند البدء
    status = get_system_status()
    logger.info(f"حالة النظام: {status}")
    
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=False)
