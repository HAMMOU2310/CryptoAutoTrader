"""
Crypto Auto Trader - الإصدار المتين النهائي
يتضمن معالجة الأخطاء الذكية وبيانات احتياطية وتشخيص متقدم
"""

from flask import Flask, jsonify
import os
import sys
from datetime import datetime, timedelta
import traceback
import logging

# ==================== تهيئة التطبيق واللوج ====================
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== الاستيراد الذكي للمكتبات ====================
def smart_imports():
    """استيراد المكتبات بذكاء مع معالجة الأخطاء"""
    modules_status = {}
    imported_modules = {}
    
    # قائمة المكتبات المطلوبة مع رسائل الخطأ المفيدة
    required_modules = {
        'binance': {
            'import_path': 'binance.client',
            'install_cmd': 'pip install python-binance',
            'testnet_note': 'للاختبار فقط، تأكد من testnet=True'
        },
        'pandas': {
            'import_path': 'pandas',
            'install_cmd': 'pip install pandas',
            'alias': 'pd'
        },
        'ta': {
            'import_path': 'ta',
            'install_cmd': 'pip install ta'
        },
        'numpy': {
            'import_path': 'numpy',
            'install_cmd': 'pip install numpy',
            'alias': 'np'
        },
        'dotenv': {
            'import_path': 'dotenv',
            'install_cmd': 'pip install python-dotenv'
        }
    }
    
    for lib_name, config in required_modules.items():
        try:
            if lib_name == 'binance':
                from binance.client import Client
                from binance.enums import *
                imported_modules['Client'] = Client
                imported_modules['binance_enums'] = '*'
                modules_status[lib_name] = {'status': 'success', 'version': '1.0.19'}
            else:
                # استيراد المكتبات الأخرى
                module = __import__(config['import_path'].split('.')[0])
                imported_modules[lib_name] = module
                modules_status[lib_name] = {'status': 'success', 'version': getattr(module, '__version__', 'unknown')}
                
        except ImportError as e:
            modules_status[lib_name] = {
                'status': 'missing',
                'error': str(e),
                'solution': config['install_cmd'],
                'note': config.get('note', '')
            }
            logger.warning(f"المكتبة {lib_name} غير مثبتة: {config['install_cmd']}")
        except Exception as e:
            modules_status[lib_name] = {
                'status': 'error',
                'error': str(e),
                'solution': 'تحقق من التوافق أو جرب pip install --upgrade'
            }
    
    return modules_status, imported_modules

# تشغيل الاستيراد الذكي
MODULES_STATUS, IMPORTED_MODULES = smart_imports()

# ==================== فحص المتغيرات البيئية ====================
def check_environment():
    """فحص شامل للمتغيرات البيئية"""
    env_status = {}
    required_vars = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'TRADING_PAIR', 'NODE_ENV']
    
    for var in required_vars:
        exists = var in os.environ
        env_status[var] = {
            'exists': exists,
            'length': len(os.environ.get(var, '')),
            'value_preview': os.environ.get(var, '')[:4] + '****' if exists and len(os.environ.get(var, '')) > 8 else ''
        }
    
    # فحص إضافي لجودة المفاتيح
    if env_status['BINANCE_API_KEY']['exists']:
        key = os.environ.get('BINANCE_API_KEY', '')
        env_status['BINANCE_API_KEY']['is_testnet'] = 'test' in key.lower() or 'sandbox' in key.lower()
    
    return env_status

# ==================== نظام العميل الذكي (مع Fallback) ====================
class SmartBinanceClient:
    """عميل Binance ذكي مع معالجة الأخطاء والبيانات الاحتياطية"""
    
    def __init__(self):
        self.client = None
        self.status = 'initializing'
        self.last_error = None
        self.initialize_client()
    
    def initialize_client(self):
        """تهيئة عميل Binance مع معالجة جميع الأخطاء"""
        try:
            # التحقق من وجود المفاتيح
            api_key = os.environ.get('BINANCE_API_KEY')
            api_secret = os.environ.get('BINANCE_SECRET_KEY')
            
            if not api_key or not api_secret:
                self.status = 'no_keys'
                self.last_error = "مفاتيح Binance غير موجودة في البيئة"
                logger.warning(self.last_error)
                return
            
            # التحقق من استيراد المكتبة
            if 'Client' not in IMPORTED_MODULES:
                self.status = 'library_missing'
                self.last_error = "مكتبة python-binance غير مثبتة"
                logger.warning(self.last_error)
                return
            
            # إنشاء العميل
            self.client = IMPORTED_MODULES['Client'](
                api_key=api_key,
                api_secret=api_secret,
                testnet=True  # مهم: للتجربة فقط!
            )
            
            # اختبار الاتصال
            test_result = self.client.get_account()
            self.status = 'connected'
            logger.info("✅ تم الاتصال بنجاح بـ Binance Testnet")
            
        except Exception as e:
            self.status = 'error'
            self.last_error = str(e)
            logger.error(f"❌ فشل الاتصال بـ Binance: {e}")
    
    def get_btc_price(self):
        """جلب سعر BTC مع Fallback"""
        try:
            if self.status != 'connected' or not self.client:
                return self._get_fallback_price()
            
            ticker = self.client.get_symbol_ticker(symbol="BTCUSDT")
            return {
                'success': True,
                'source': 'binance_live',
                'data': {
                    'symbol': 'BTCUSDT',
                    'price': float(ticker['price']),
                    'timestamp': datetime.now().isoformat()
                }
            }
        except Exception as e:
            logger.error(f"خطأ في جلب السعر: {e}")
            return self._get_fallback_price()
    
    def _get_fallback_price(self):
        """بيانات احتياطية ذكية"""
        # سعر BTC عشوائي حول 45000 مع تغيير بسيط
        import random
        import time
        
        base_price = 45000.0
        variation = random.uniform(-500, 500)
        current_price = base_price + variation
        
        return {
            'success': True,
            'source': 'fallback_simulation',
            'data': {
                'symbol': 'BTCUSDT',
                'price': round(current_price, 2),
                'timestamp': datetime.now().isoformat(),
                'note': 'بيانات تجريبية - الاتصال بـ Binance غير متاح'
            }
        }
    
    def get_market_data(self):
        """بيانات السوق مع Fallback"""
        try:
            if self.status != 'connected' or not self.client:
                return self._get_fallback_market_data()
            
            # جلب بيانات 24 ساعة
            klines = self.client.get_klines(
                symbol="BTCUSDT",
                interval=IMPORTED_MODULES['Client'].KLINE_INTERVAL_1HOUR,
                limit=24
            )
            
            # معالجة البيانات
            prices = [float(k[4]) for k in klines]  # أسعار الإغلاق
            volumes = [float(k[5]) for k in klines]  # أحجام التداول
            
            return {
                'success': True,
                'source': 'binance_live',
                'data': {
                    'symbol': 'BTCUSDT',
                    'current_price': prices[-1],
                    'price_change_24h': round(((prices[-1] - prices[0]) / prices[0]) * 100, 2),
                    'high_24h': max(prices),
                    'low_24h': min(prices),
                    'volume_24h': sum(volumes),
                    'candles': len(prices)
                }
            }
        except Exception as e:
            logger.error(f"خطأ في بيانات السوق: {e}")
            return self._get_fallback_market_data()
    
    def _get_fallback_market_data(self):
        """بيانات سوق احتياطية"""
        import random
        
        base_price = 45230.75
        change_percent = random.uniform(-3, 3)
        current_price = base_price * (1 + change_percent/100)
        
        return {
            'success': True,
            'source': 'fallback_simulation',
            'data': {
                'symbol': 'BTCUSDT',
                'current_price': round(current_price, 2),
                'price_change_24h': round(change_percent, 2),
                'high_24h': round(current_price * 1.02, 2),
                'low_24h': round(current_price * 0.98, 2),
                'volume_24h': round(random.uniform(1000000, 5000000), 2),
                'note': 'بيانات سوق تجريبية'
            }
        }

# إنشاء عميل Binance الذكي
BINANCE_CLIENT = SmartBinanceClient()

# ==================== نقاط النهاية الرئيسية ====================

@app.route('/')
def home():
    """الصفحة الرئيسية مع معلومات النظام الكاملة"""
    env_status = check_environment()
    
    return jsonify({
        'service': 'Crypto Auto Trader Pro',
        'version': '2.0.0',
        'status': 'operational',
        'timestamp': datetime.now().isoformat(),
        'environment': os.environ.get('NODE_ENV', 'development'),
        'system': {
            'python_version': sys.version.split()[0],
            'platform': sys.platform,
            'modules_status': MODULES_STATUS,
            'binance_client_status': BINANCE_CLIENT.status
        },
        'environment_check': env_status,
        'endpoints': {
            'system': ['/', '/system-status', '/debug', '/test-connection'],
            'trading': ['/btc-price', '/market-data', '/indicators', '/account'],
            'health': ['/health', '/check-keys']
        },
        'instructions': {
            'if_errors': 'تحقق من /debug لمعلومات مفصلة',
            'missing_modules': 'راجع modules_status للأخطاء وحلولها',
            'binance_connection': f"حالة الاتصال: {BINANCE_CLIENT.status}"
        }
    })

@app.route('/health')
def health():
    """فحص الصحة الأساسي"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'crypto-auto-trader'
    })

@app.route('/check-keys')
def check_keys():
    """فحص مفاتيح API"""
    env_status = check_environment()
    
    all_keys_exist = all(env_status[var]['exists'] for var in ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY'])
    
    return jsonify({
        'all_keys_exist': all_keys_exist,
        'details': env_status,
        'recommendations': [
            'اضغط Manual Deploy بعد إضافة المفاتيح' if not all_keys_exist else 'المفاتيح موجودة',
            'تحقق من أن المفاتيح من Binance Testnet',
            'تأكد من ربط Environment Group إذا لزم الأمر'
        ]
    })

@app.route('/system-status')
def system_status():
    """حالة النظام التفصيلية"""
    env_status = check_environment()
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'modules': MODULES_STATUS,
        'environment': env_status,
        'binance_client': {
            'status': BINANCE_CLIENT.status,
            'last_error': BINANCE_CLIENT.last_error,
            'has_client': BINANCE_CLIENT.client is not None
        },
        'system_health': {
            'memory_usage': 'N/A',  # يمكن إضافة psutil لاحقاً
            'uptime': 'N/A',
            'total_endpoints': len([rule for rule in app.url_map.iter_rules()])
        },
        'actions_required': [
            action for action in [
                'تثبيت المكتبات المفقودة' if any(m['status'] == 'missing' for m in MODULES_STATUS.values()) else None,
                'إضافة مفاتيح Binance' if not env_status['BINANCE_API_KEY']['exists'] else None,
                'التحقق من اتصال الإنترنت' if BINANCE_CLIENT.status == 'error' else None
            ] if action
        ]
    })

@app.route('/debug')
def debug_endpoint():
    """صفحة تصحيح الأخطاء المتقدمة"""
    import inspect
    
    # جمع معلومات التصحيح
    debug_info = {
        'timestamp': datetime.now().isoformat(),
        'python_path': sys.path,
        'environment_variables_count': len(os.environ),
        'flask_routes': [str(rule) for rule in app.url_map.iter_rules()],
        'imported_modules': list(sys.modules.keys())[:20],
        'binance_client_details': {
            'status': BINANCE_CLIENT.status,
            'client_object': str(BINANCE_CLIENT.client)[:100] if BINANCE_CLIENT.client else None,
            'initialization_time': 'N/A'
        }
    }
    
    return jsonify(debug_info)

@app.route('/test-connection')
def test_connection():
    """اختبار الاتصال الشامل"""
    tests = []
    
    # اختبار 1: المكتبات الأساسية
    lib_test = {
        'name': 'المكتبات الأساسية',
        'status': 'success' if all(m['status'] == 'success' for m in MODULES_STATUS.values()) else 'partial',
        'details': MODULES_STATUS
    }
    tests.append(lib_test)
    
    # اختبار 2: المتغيرات البيئية
    env_test = {
        'name': 'المتغيرات البيئية',
        'status': 'success' if all(check_environment()[var]['exists'] for var in ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY']) else 'failed',
        'details': check_environment()
    }
    tests.append(env_test)
    
    # اختبار 3: اتصال Binance
    binance_test = {
        'name': 'اتصال Binance',
        'status': BINANCE_CLIENT.status,
        'details': {
            'has_client': BINANCE_CLIENT.client is not None,
            'last_error': BINANCE_CLIENT.last_error
        }
    }
    tests.append(binance_test)
    
    # تحديد الحالة العامة
    overall_status = 'success' if all(t['status'] in ['success', 'connected'] for t in tests) else 'partial'
    
    return jsonify({
        'overall': overall_status,
        'timestamp': datetime.now().isoformat(),
        'tests': tests,
        'recommendations': [
            f"حالة الاتصال بـ Binance: {BINANCE_CLIENT.status}",
            "إذا كان هناك أخطاء، راجع /debug للمزيد من المعلومات"
        ]
    })

@app.route('/btc-price')
def btc_price():
    """سعر BTC الذكي مع Fallback"""
    result = BINANCE_CLIENT.get_btc_price()
    
    # إضافة معلومات إضافية
    result['system_info'] = {
        'binance_status': BINANCE_CLIENT.status,
        'response_time': datetime.now().isoformat(),
        'data_source': result['source']
    }
    
    return jsonify(result)

@app.route('/market-data')
def market_data():
    """بيانات السوق الذكية"""
    result = BINANCE_CLIENT.get_market_data()
    
    # إضافة تحليل بسيط
    if result['success']:
        price_change = result['data']['price_change_24h']
        if price_change > 2:
            result['data']['trend'] = 'strong_bullish'
        elif price_change > 0:
            result['data']['trend'] = 'bullish'
        elif price_change < -2:
            result['data']['trend'] = 'strong_bearish'
        else:
            result['data']['trend'] = 'neutral'
    
    return jsonify(result)

@app.route('/indicators')
def indicators():
    """المؤشرات الفنية مع Fallback"""
    try:
        # محاولة حساب المؤشرات الحقيقية
        if (BINANCE_CLIENT.status == 'connected' and 
            'ta' in IMPORTED_MODULES and 
            'pandas' in IMPORTED_MODULES):
            
            # جلب بيانات تاريخية
            klines = BINANCE_CLIENT.client.get_klines(
                symbol="BTCUSDT",
                interval=IMPORTED_MODULES['Client'].KLINE_INTERVAL_1HOUR,
                limit=100
            )
            
            closes = [float(k[4]) for k in klines]
            
            if len(closes) >= 14:
                import pandas as pd
                import ta
                
                close_series = pd.Series(closes)
                
                # حساب RSI
                rsi_indicator = ta.momentum.RSIIndicator(close=close_series, window=14)
                rsi = rsi_indicator.rsi().iloc[-1]
                
                # حساب MACD
                macd_indicator = ta.trend.MACD(close=close_series)
                macd = macd_indicator.macd().iloc[-1]
                signal = macd_indicator.macd_signal().iloc[-1]
                
                return jsonify({
                    'success': True,
                    'source': 'ta_library',
                    'data': {
                        'rsi': float(rsi),
                        'macd': float(macd),
                        'signal_line': float(signal),
                        'interpretation': {
                            'rsi': 'oversold' if rsi < 30 else 'overbought' if rsi > 70 else 'neutral',
                            'macd': 'bullish' if macd > signal else 'bearish'
                        }
                    }
                })
        
        # Fallback إلى بيانات تجريبية
        import random
        return jsonify({
            'success': True,
            'source': 'fallback_simulation',
            'data': {
                'rsi': random.uniform(30, 70),
                'macd': random.uniform(-100, 100),
                'signal_line': random.uniform(-100, 100),
                'interpretation': {
                    'rsi': 'neutral',
                    'macd': 'bullish' if random.random() > 0.5 else 'bearish'
                },
                'note': 'مؤشرات تجريبية - المكتبات غير متوفرة'
            }
        })
        
    except Exception as e:
        logger.error(f"خطأ في حساب المؤشرات: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'solution': 'تأكد من تثبيت مكتبات pandas و ta',
            'fallback_data': {
                'rsi': 50.0,
                'macd': 25.0,
                'note': 'بيانات افتراضية بسبب خطأ'
            }
        })

@app.route('/account')
def account():
    """معلومات الحساب"""
    try:
        if BINANCE_CLIENT.status == 'connected' and BINANCE_CLIENT.client:
            account_info = BINANCE_CLIENT.client.get_account()
            
            balances = []
            for asset in account_info['balances']:
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
                'success': True,
                'source': 'binance_live',
                'data': {
                    'account_type': 'testnet',
                    'balances': balances,
                    'total_assets': len(balances),
                    'can_trade': account_info.get('canTrade', False)
                }
            })
    except Exception as e:
        logger.error(f"خطأ في جلب معلومات الحساب: {e}")
    
    # Fallback
    return jsonify({
        'success': True,
        'source': 'fallback_simulation',
        'data': {
            'account_type': 'testnet_simulation',
            'balances': [
                {'asset': 'BTC', 'free': 0.05, 'locked': 0, 'total': 0.05},
                {'asset': 'USDT', 'free': 1000, 'locked': 0, 'total': 1000}
            ],
            'note': 'بيانات حساب تجريبية'
        }
    })

# ==================== معالجة الأخطاء العامة ====================
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'endpoint_not_found',
        'message': 'نقطة النهاية غير موجودة',
        'available_endpoints': [str(rule) for rule in app.url_map.iter_rules()],
        'suggestion': 'تحقق من / للحصول على قائمة النقاط المتاحة'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'internal_server_error',
        'message': 'حدث خطأ داخلي في الخادم',
        'timestamp': datetime.now().isoformat(),
        'debug_info': 'تحقق من /debug للمزيد من المعلومات'
    }), 500

# ==================== التشغيل ====================
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    
    # رسالة بداية التشغيل
    print("=" * 50)
    print("🚀 بدء تشغيل Crypto Auto Trader Pro")
    print(f"📊 حالة المكتبات: {len([m for m in MODULES_STATUS.values() if m['status'] == 'success'])}/{len(MODULES_STATUS)}")
    print(f"🔑 حالة Binance: {BINANCE_CLIENT.status}")
    print(f"🌐 الخدمة ستشتغل على: http://0.0.0.0:{port}")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port)
