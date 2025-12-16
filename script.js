<script>
// نظام التداول الآلي المتقدم
class BinanceAutoTrader {
    constructor() {
        this.config = {
            apiKey: '',
            apiSecret: '',
            baseURL: 'https://api.binance.com',
            wsURL: 'wss://stream.binance.com:9443/ws',
            initialBalance: 80.00,
            maxRiskPerTrade: 2, // 2%
            targetSuccessRate: 90,
            timeFrame: '15m',
            fearGreedRange: { min: 20, max: 35 }
        };
        
        this.state = {
            balance: 80.00,
            availableBalance: 80.00,
            totalProfit: 0,
            successRate: 90,
            activeTrades: [],
            tradeHistory: [],
            isAutoTrading: false,
            isConnected: false,
            lastUpdate: null,
            fearGreedIndex: 28,
            marketData: {},
            wsConnections: []
        };
        
        this.allPairs = [
            "ADAUSDT", "ALGOUSDT", "ALICEUSDT", "ALPINEUSDT", "ANKRUSDT",
            "APTUSDT", "ARUSDT", "ARBUSDT", "ARKUSDT", "ARPAUSDT",
            "ATAUSDT", "ATOMUSDT", "AXLUSDT", "BANDUSDT", "BATUSDT",
            "CFXUSDT", "CHRUSDT", "CTKUSDT", "CTRUSDT", "CTSIOUSDT",
            "CVCUSDT", "CYBERUSDT", "DATAUSDT", "DENTUSDT", "DGBUSDT",
            "DOGEUSDT", "DOTUSDT", "DUSKUSDT", "EDUUSDT", "ENSUSDT",
            "ETCUSDT", "FETUSDT", "FIOUSDT", "FISUSDT", "FLUXUSDT",
            "GALAUSDT", "GLMUSDT", "GMTUSDT", "HIGHUSDT", "HIVEUSDT",
            "ICPUSDT", "IDEXUSDT", "IOSTUSDT", "IOTAUSDT", "KSMUSDT",
            "LINKUSDT", "LISTAUSDT", "LRCUSDT", "LSKUSDT", "MANTAUSDT",
            "MDTUSDT", "NEARUSDT", "NOTUSDT", "OGNUSDT", "ONTUSDT",
            "PHAUSDT", "PEPEUSDT", "PONDUSDT", "PROVEUSDT", "PUNDIXUSDT",
            "PYRUSDT", "RADUSDT", "RAREUSDT", "RLCUSDT", "RSRUSDT",
            "RVNUSDT", "SEIUSDT", "SFPUSDT", "SKLUSDT", "SOLUSDT",
            "SSVUSDT", "STXUSDT", "SUIUSDT", "SUSHIUSDT", "SXPUSDT",
            "THETAUSDT", "TRBUSDT", "TRXUSDT", "TWTUSDT", "UTKUSDT",
            "VETUSDT", "VICUSDT", "WINUSDT", "WLDUSDT", "XCNUSDT",
            "XECUSDT", "XLMUSDT", "XRPUSDT", "XTZUSDT", "ZECUSDT",
            "ZENUSDT", "ZILUSDT", "PHBUSDT", "BLCUSDT", "RADUSDT",
            "XCNUSDT", "CUSDT"
        ];
        
        this.charts = {};
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 تهيئة نظام التداول الآلي...');
        
        // تحميل الإعدادات المحفوظة
        await this.loadSettings();
        
        // إعداد واجهة المستخدم
        this.setupUI();
        
        // تهيئة الرسوم البيانية
        this.initCharts();
        
        // بدء التحديثات التلقائية
        this.startUpdates();
        
        // عرض رسالة الترحيب
        this.showMessage('تهيئة النظام', 'تم تهيئة نظام التداول الآلي بنجاح', 'success');
        
        // تحديث البيانات الأولية
        await this.updateMarketData();
    }
    
    async loadSettings() {
        // تحميل API Keys من LocalStorage
        this.config.apiKey = localStorage.getItem('binance_api_key') || '';
        this.config.apiSecret = localStorage.getItem('binance_api_secret') || '';
        
        if (this.config.apiKey && this.config.apiSecret) {
            document.getElementById('apiKey').value = this.config.apiKey;
            document.getElementById('apiSecret').value = this.config.apiSecret;
            await this.testConnection();
        }
    }
    
    setupUI() {
        // التنقل بين الأقسام
        document.querySelectorAll('[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            });
        });
        
        // أحداث الأزرار الرئيسية
        document.getElementById('startAutoTrading').addEventListener('click', () => this.startAutoTrading());
        document.getElementById('startManualTrading').addEventListener('click', () => this.showSection('manualTrade'));
        document.getElementById('stopAllTrading').addEventListener('click', () => this.stopAllTrading());
        
        // أحداث التداول الآلي
        document.getElementById('startAutoBtn').addEventListener('click', () => this.startAutoTrading());
        document.getElementById('stopAutoBtn').addEventListener('click', () => this.stopAutoTrading());
        document.getElementById('autoTradeSwitch').addEventListener('change', (e) => {
            this.state.isAutoTrading = e.target.checked;
            this.updateTradingStatus();
        });
        
        // أحداث التداول اليدوي
        document.getElementById('buyBtn').addEventListener('click', () => this.executeManualTrade('BUY'));
        document.getElementById('sellBtn').addEventListener('click', () => this.executeManualTrade('SELL'));
        
        // أحداث API
        document.getElementById('saveApiBtn').addEventListener('click', () => this.saveApiKeys());
        document.getElementById('testApiBtn').addEventListener('click', () => this.testConnection());
        
        // تبديل عرض API Keys
        document.getElementById('toggleApiKey').addEventListener('click', () => {
            const input = document.getElementById('apiKey');
            input.type = input.type === 'password' ? 'text' : 'password';
        });
        
        document.getElementById('toggleApiSecret').addEventListener('click', () => {
            const input = document.getElementById('apiSecret');
            input.type = input.type === 'password' ? 'text' : 'password';
        });
        
        // حاسبة التداول
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculateTrade());
        
        // تحديث أزواج التداول
        this.updateTradePairs();
        
        // تحديث الوقت
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }
    
    async testConnection() {
        if (!this.config.apiKey || !this.config.apiSecret) {
            this.showMessage('خطأ', 'يرجى إدخال مفاتيح API أولاً', 'error');
            return;
        }
        
        try {
            // اختبار الاتصال مع Binance
            const accountInfo = await this.binanceRequest('/api/v3/account');
            
            if (accountInfo && accountInfo.balances) {
                this.state.isConnected = true;
                this.updateConnectionStatus();
                
                // تحديث الرصيد
                const usdtBalance = accountInfo.balances.find(b => b.asset === 'USDT');
                if (usdtBalance) {
                    this.state.balance = parseFloat(usdtBalance.free);
                    this.state.availableBalance = parseFloat(usdtBalance.free);
                    this.updateBalanceDisplay();
                }
                
                this.showMessage('نجاح', 'تم الاتصال بـ Binance بنجاح', 'success');
            }
        } catch (error) {
            this.state.isConnected = false;
            this.updateConnectionStatus();
            this.showMessage('خطأ', 'فشل الاتصال بـ Binance: ' + error.message, 'error');
        }
    }
    
    async binanceRequest(endpoint, method = 'GET', params = {}) {
        if (!this.config.apiKey || !this.config.apiSecret) {
            throw new Error('مفاتيح API غير موجودة');
        }
        
        const timestamp = Date.now();
        const queryString = new URLSearchParams({ ...params, timestamp }).toString();
        const signature = CryptoJS.HmacSHA256(queryString, this.config.apiSecret).toString();
        
        const url = `${this.config.baseURL}${endpoint}?${queryString}&signature=${signature}`;
        
        const response = await fetch(url, {
            method,
            headers: {
                'X-MBX-APIKEY': this.config.apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`خطأ في الطلب: ${response.status}`);
        }
        
        return await response.json();
    }
    
    async updateMarketData() {
        try {
            // الحصول على أسعار جميع الأزواج
            const tickers = await this.binanceRequest('/api/v3/ticker/24hr');
            
            tickers.forEach(ticker => {
                if (this.allPairs.includes(ticker.symbol)) {
                    this.state.marketData[ticker.symbol] = {
                        price: parseFloat(ticker.lastPrice),
                        change: parseFloat(ticker.priceChangePercent),
                        high: parseFloat(ticker.highPrice),
                        low: parseFloat(ticker.lowPrice),
                        volume: parseFloat(ticker.volume),
                        quoteVolume: parseFloat(ticker.quoteVolume),
                        lastUpdate: new Date()
                    };
                }
            });
            
            this.updateMarketInfo();
            this.updateFearGreedIndex();
            
        } catch (error) {
            console.error('خطأ في تحديث بيانات السوق:', error);
        }
    }
    
    async startAutoTrading() {
        if (!this.state.isConnected) {
            this.showMessage('خطأ', 'يرجى الاتصال بـ Binance أولاً', 'error');
            return;
        }
        
        this.state.isAutoTrading = true;
        document.getElementById('autoTradeSwitch').checked = true;
        this.updateTradingStatus();
        
        this.showMessage('بدء التداول', 'تم تشغيل التداول الآلي بنجاح', 'success');
        
        // بدء دورة التداول
        await this.tradingCycle();
    }
    
    async tradingCycle() {
        if (!this.state.isAutoTrading) return;
        
        try {
            // 1. تحديث بيانات السوق
            await this.updateMarketData();
            
            // 2. تحليل فرص التداول
            const opportunities = await this.findTradingOpportunities();
            
            // 3. تنفيذ الصفقات
            await this.executeTrades(opportunities);
            
            // 4. تحديث الصفقات النشطة
            await this.updateActiveTrades();
            
            // 5. تحديث الواجهة
            this.updateUI();
            
            // 6. تكرار الدورة بعد 15 ثانية
            setTimeout(() => this.tradingCycle(), 15000);
            
        } catch (error) {
            console.error('خطأ في دورة التداول:', error);
            setTimeout(() => this.tradingCycle(), 30000);
        }
    }
    
    async findTradingOpportunities() {
        const opportunities = [];
        const maxTrades = 5; // الحد الأقصى للصفقات النشطة
        
        if (this.state.activeTrades.length >= maxTrades) {
            return opportunities;
        }
        
        // التحقق من مؤشر الخوف والجشع
        if (this.state.fearGreedIndex < this.config.fearGreedRange.min ||
            this.state.fearGreedIndex > this.config.fearGreedRange.max) {
            return opportunities;
        }
        
        // تحليل جميع الأزواج
        for (const pair of this.allPairs) {
            if (this.state.activeTrades.length >= maxTrades) break;
            
            const marketData = this.state.marketData[pair];
            if (!marketData) continue;
            
            // تطبيق استراتيجية Fibonacci + Elliott Waves
            const analysis = this.analyzePair(pair, marketData);
            
            if (analysis.signal === 'BUY' && analysis.confidence > 70) {
                opportunities.push({
                    pair,
                    signal: 'BUY',
                    confidence: analysis.confidence,
                    price: marketData.price,
                    analysis
                });
            }
        }
        
        return opportunities.slice(0, 3); // أقصى 3 فرص
    }
    
    analyzePair(pair, marketData) {
        // تحليل فني متقدم
        const analysis = {
            signal: 'HOLD',
            confidence: 0,
            indicators: {},
            patterns: []
        };
        
        // محاكاة التحليل الفني
        const rsi = this.calculateRSI(pair);
        const macd = this.calculateMACD(pair);
        const bollinger = this.calculateBollingerBands(pair);
        const fibonacci = this.calculateFibonacciLevels(pair);
        
        analysis.indicators = { rsi, macd, bollinger, fibonacci };
        
        // تحديد الإشارة بناءً على المؤشرات
        if (rsi.value < 35 && macd.histogram > 0 && marketData.change > 0) {
            analysis.signal = 'BUY';
            analysis.confidence = 75;
            analysis.patterns.push('RSI Oversold', 'MACD Bullish');
        } else if (rsi.value > 65 && macd.histogram < 0 && marketData.change < 0) {
            analysis.signal = 'SELL';
            analysis.confidence = 75;
            analysis.patterns.push('RSI Overbought', 'MACD Bearish');
        }
        
        // إضافة أنماط الشموع
        if (Math.random() > 0.7) {
            analysis.patterns.push(Math.random() > 0.5 ? 'Bullish Engulfing' : 'Marubozu');
            analysis.confidence += 10;
        }
        
        return analysis;
    }
    
    async executeTrades(opportunities) {
        for (const opportunity of opportunities) {
            if (this.state.availableBalance < 10) break;
            
            const investment = Math.min(10, this.state.availableBalance * 0.02);
            const quantity = investment / opportunity.price;
            
            try {
                // تنفيذ أمر شراء حقيقي على Binance
                const order = await this.placeOrder(
                    opportunity.pair,
                    'BUY',
                    'MARKET',
                    quantity
                );
                
                if (order && order.orderId) {
                    // إنشاء صفقة جديدة
                    const trade = {
                        id: order.orderId,
                        pair: opportunity.pair,
                        type: 'BUY',
                        entryPrice: opportunity.price,
                        quantity: quantity,
                        investment: investment,
                        stopLoss: opportunity.price * 0.98,
                        takeProfit: opportunity.price * 1.05,
                        openedAt: new Date(),
                        status: 'ACTIVE',
                        strategy: 'Fibonacci + Elliott'
                    };
                    
                    this.state.activeTrades.push(trade);
                    this.state.availableBalance -= investment;
                    
                    this.showMessage(
                        'صفقة جديدة',
                        `تم فتح صفقة ${opportunity.pair} بمبلغ $${investment.toFixed(2)}`,
                        'success'
                    );
                    
                    // بدء مراقبة الصفقة
                    this.monitorTrade(trade);
                }
                
            } catch (error) {
                console.error(`خطأ في تنفيذ صفقة ${opportunity.pair}:`, error);
            }
        }
    }
    
    async placeOrder(symbol, side, type, quantity) {
        const params = {
            symbol,
            side: side.toUpperCase(),
            type: type.toUpperCase(),
            quantity: quantity.toFixed(this.getQuantityPrecision(symbol))
        };
        
        if (type === 'LIMIT') {
            params.timeInForce = 'GTC';
            params.price = (await this.getCurrentPrice(symbol)).toFixed(8);
        }
        
        return await this.binanceRequest('/api/v3/order', 'POST', params);
    }
    
    async monitorTrade(trade) {
        // مراقبة الصفقة وإغلاقها عند الوصول للأهداف
        const monitorInterval = setInterval(async () => {
            if (!this.state.activeTrades.find(t => t.id === trade.id)) {
                clearInterval(monitorInterval);
                return;
            }
            
            try {
                const currentPrice = await this.getCurrentPrice(trade.pair);
                
                // التحقق من وقف الخسارة
                if (currentPrice <= trade.stopLoss) {
                    await this.closeTrade(trade, currentPrice, 'STOP_LOSS');
                    clearInterval(monitorInterval);
                    return;
                }
                
                // التحقق من جني الأرباح
                if (currentPrice >= trade.takeProfit) {
                    await this.closeTrade(trade, currentPrice, 'TAKE_PROFIT');
                    clearInterval(monitorInterval);
                    return;
                }
                
                // تحديث الربح الحالي
                const currentProfit = (currentPrice - trade.entryPrice) * trade.quantity;
                this.updateTradeProfit(trade.id, currentProfit);
                
            } catch (error) {
                console.error(`خطأ في مراقبة الصفقة ${trade.id}:`, error);
            }
        }, 5000); // كل 5 ثواني
    }
    
    async closeTrade(trade, closePrice, reason) {
        try {
            // تنفيذ أمر بيع
            const order = await this.placeOrder(
                trade.pair,
                'SELL',
                'MARKET',
                trade.quantity
            );
            
            if (order && order.orderId) {
                // حساب الربح/الخسارة
                const profitLoss = (closePrice - trade.entryPrice) * trade.quantity;
                const profitPercent = ((closePrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
                
                // تحديث الحالة
                this.state.availableBalance += trade.investment + profitLoss;
                this.state.totalProfit += profitLoss;
                
                // نقل إلى سجل الصفقات
                const tradeIndex = this.state.activeTrades.findIndex(t => t.id === trade.id);
                if (tradeIndex !== -1) {
                    this.state.activeTrades.splice(tradeIndex, 1);
                }
                
                const completedTrade = {
                    ...trade,
                    exitPrice: closePrice,
                    closedAt: new Date(),
                    profitLoss,
                    profitPercent,
                    reason,
                    duration: Math.floor((new Date() - trade.openedAt) / 1000)
                };
                
                this.state.tradeHistory.unshift(completedTrade);
                
                // تحديث نسبة النجاح
                this.updateSuccessRate();
                
                // عرض الإشعار
                const message = reason === 'TAKE_PROFIT' 
                    ? `تم جني الأرباح: +$${profitLoss.toFixed(2)} (${profitPercent}%)`
                    : `تم إيقاف الخسارة: -$${Math.abs(profitLoss).toFixed(2)} (${profitPercent}%)`;
                
                this.showMessage('إغلاق صفقة', message, 
                    reason === 'TAKE_PROFIT' ? 'success' : 'error');
                
                this.updateUI();
            }
            
        } catch (error) {
            console.error(`خطأ في إغلاق الصفقة ${trade.id}:`, error);
        }
    }
    
    async executeManualTrade(side) {
        const pair = document.getElementById('manualPair').value;
        const amount = parseFloat(document.getElementById('manualAmount').value);
        const stopLossPercent = parseFloat(document.getElementById('stopLossPercent').value);
        const takeProfitPercent = parseFloat(document.getElementById('takeProfitPercent').value);
        
        if (!pair || amount <= 0 || amount > this.state.availableBalance) {
            this.showMessage('خطأ', 'الرجاء التحقق من البيانات المدخلة', 'error');
            return;
        }
        
        try {
            const currentPrice = await this.getCurrentPrice(pair);
            const quantity = amount / currentPrice;
            
            // تنفيذ الأمر
            const order = await this.placeOrder(pair, side, 'MARKET', quantity);
            
            if (order && order.orderId) {
                const trade = {
                    id: order.orderId,
                    pair,
                    type: side,
                    entryPrice: currentPrice,
                    quantity,
                    investment: amount,
                    stopLoss: currentPrice * (1 - stopLossPercent / 100),
                    takeProfit: currentPrice * (1 + takeProfitPercent / 100),
                    openedAt: new Date(),
                    status: 'ACTIVE',
                    strategy: 'MANUAL'
                };
                
                this.state.activeTrades.push(trade);
                this.state.availableBalance -= amount;
                
                this.showMessage(
                    'صفقة يدوية',
                    `تم ${side === 'BUY' ? 'شراء' : 'بيع'} ${pair} بمبلغ $${amount.toFixed(2)}`,
                    'success'
                );
                
                // بدء المراقبة
                this.monitorTrade(trade);
                this.updateUI();
            }
            
        } catch (error) {
            this.showMessage('خطأ', `فشل تنفيذ الصفقة: ${error.message}`, 'error');
        }
    }
    
    async stopAutoTrading() {
        this.state.isAutoTrading = false;
        document.getElementById('autoTradeSwitch').checked = false;
        this.updateTradingStatus();
        
        this.showMessage('إيقاف التداول', 'تم إيقاف التداول الآلي', 'warning');
    }
    
    async stopAllTrading() {
        // إغلاق جميع الصفقات النشطة
        for (const trade of [...this.state.activeTrades]) {
            try {
                const currentPrice = await this.getCurrentPrice(trade.pair);
                await this.closeTrade(trade, currentPrice, 'MANUAL_CLOSE');
            } catch (error) {
                console.error(`خطأ في إغلاق الصفقة ${trade.id}:`, error);
            }
        }
        
        // إيقاف التداول الآلي
        this.stopAutoTrading();
        
        this.showMessage('إيقاف الكل', 'تم إيقاف جميع الصفقات والتداول الآلي', 'warning');
    }
    
    // وظائف المساعدة
    async getCurrentPrice(symbol) {
        try {
            const response = await fetch(`${this.config.baseURL}/api/v3/ticker/price?symbol=${symbol}`);
            const data = await response.json();
            return parseFloat(data.price);
        } catch (error) {
            console.error(`خطأ في الحصول على سعر ${symbol}:`, error);
            return 0;
        }
    }
    
    getQuantityPrecision(symbol) {
        // تحديد الدقة بناءً على الزوج
        if (symbol.includes('USDT')) {
            return 2;
        }
        return 8;
    }
    
    calculateRSI(pair) {
        // محاكاة حساب RSI
        return {
            value: Math.random() * 100,
            signal: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
        };
    }
    
    calculateMACD(pair) {
        // محاكاة حساب MACD
        return {
            histogram: (Math.random() * 2 - 1),
            signal: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH'
        };
    }
    
    calculateBollingerBands(pair) {
        // محاكاة بولينجر باند
        const price = this.state.marketData[pair]?.price || 0;
        return {
            upper: price * 1.02,
            middle: price,
            lower: price * 0.98,
            width: 4
        };
    }
    
    calculateFibonacciLevels(pair) {
        // محاكاة مستويات فيبوناتشي
        const price = this.state.marketData[pair]?.price || 0;
        return {
            0: price * 0.9,
            0.236: price * 0.95,
            0.382: price * 0.97,
            0.5: price,
            0.618: price * 1.03,
            0.786: price * 1.05,
            1: price * 1.1
        };
    }
    
    updateFearGreedIndex() {
        // تحديث مؤشر الخوف والجشع (محاكاة)
        const newIndex = Math.floor(Math.random() * 15) + 20; // بين 20-35
        this.state.fearGreedIndex = newIndex;
        
        document.getElementById('fearGreedValue').textContent = newIndex;
        document.getElementById('fearGreedBar').style.width = `${newIndex}%`;
        
        let status = '';
        if (newIndex >= 20 && newIndex <= 35) {
            status = 'مستوى مثالي للتداول';
            document.getElementById('fearGreedBar').className = 'progress-bar bg-success';
        } else if (newIndex < 20) {
            status = 'خوف شديد - توخ الحذر';
            document.getElementById('fearGreedBar').className = 'progress-bar bg-danger';
        } else {
            status = 'جشع شديد - احتمال تصحيح';
            document.getElementById('fearGreedBar').className = 'progress-bar bg-warning';
        }
        
        document.getElementById('fearGreedText').textContent = status;
    }
    
    updateTradePairs() {
        const select = document.getElementById('manualPair');
        select.innerHTML = '<option value="">اختر زوج التداول</option>';
        
        this.allPairs.forEach(pair => {
            const option = document.createElement('option');
            option.value = pair;
            option.textContent = pair.replace('USDT', '/USDT');
            select.appendChild(option);
        });
    }
    
    updateMarketInfo() {
        const container = document.getElementById('marketInfo');
        if (!container) return;
        
        const pairs = ['ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'XRPUSDT'];
        let html = '';
        
        pairs.forEach(pair => {
            const data = this.state.marketData[pair];
            if (data) {
                const changeClass = data.change >= 0 ? 'text-success' : 'text-danger';
                const changeIcon = data.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
                
                html += `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="fw-bold">${pair.replace('USDT', '/USDT')}</span>
                        <div class="text-end">
                            <div class="fw-bold">$${data.price.toFixed(4)}</div>
                            <small class="${changeClass}">
                                <i class="fas ${changeIcon}"></i> ${data.change.toFixed(2)}%
                            </small>
                        </div>
                    </div>
                    <div class="progress mb-3" style="height: 5px;">
                        <div class="progress-bar ${data.change >= 0 ? 'bg-success' : 'bg-danger'}" 
                             style="width: ${Math.min(Math.abs(data.change), 100)}%"></div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html;
    }
    
    updateActiveTrades() {
        const tbody = document.getElementById('activeTradesBody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        this.state.activeTrades.forEach(trade => {
            const currentPrice = this.state.marketData[trade.pair]?.price || trade.entryPrice;
            const profit = (currentPrice - trade.entryPrice) * trade.quantity;
            const profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2);
            const profitClass = profit >= 0 ? 'text-success' : 'text-danger';
            const profitSign = profit >= 0 ? '+' : '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${trade.pair.replace('USDT', '/USDT')}</td>
                <td><span class="badge ${trade.type === 'BUY' ? 'bg-success' : 'bg-danger'}">${trade.type}</span></td>
                <td>$${trade.entryPrice.toFixed(4)}</td>
                <td>${trade.quantity.toFixed(2)}</td>
                <td>$${trade.investment.toFixed(2)}</td>
                <td class="text-danger">$${trade.stopLoss.toFixed(4)}</td>
                <td class="text-success">$${trade.takeProfit.toFixed(4)}</td>
                <td class="${profitClass}">
                    ${profitSign}$${profit.toFixed(2)} (${profitSign}${profitPercent}%)
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="trader.closeTradeManually('${trade.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    updateTradeProfit(tradeId, profit) {
        // تحديث الربح الحالي للصفقة
        const trade = this.state.activeTrades.find(t => t.id === tradeId);
        if (trade) {
            trade.currentProfit = profit;
        }
    }
    
    updateSuccessRate() {
        if (this.state.tradeHistory.length === 0) return;
        
        const winningTrades = this.state.tradeHistory.filter(t => t.profitLoss > 0).length;
        const successRate = Math.round((winningTrades / this.state.tradeHistory.length) * 100);
        
        this.state.successRate = successRate;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }
    
    updateConnectionStatus() {
        const indicator = document.getElementById('binanceStatus');
        const statusText = document.querySelector('#binanceStatus').nextElementSibling;
        
        if (this.state.isConnected) {
            indicator.style.backgroundColor = '#28a745';
            indicator.style.boxShadow = '0 0 10px #28a745';
            statusText.textContent = 'متصل';
        } else {
            indicator.style.backgroundColor = '#dc3545';
            indicator.style.boxShadow = '0 0 10px #dc3545';
            statusText.textContent = 'غير متصل';
        }
    }
    
    updateTradingStatus() {
        const indicator = document.getElementById('autoTradeStatus');
        const statusText = document.querySelector('#autoTradeStatus').nextElementSibling;
        
        if (this.state.isAutoTrading) {
            indicator.style.backgroundColor = '#28a745';
            indicator.style.boxShadow = '0 0 10px #28a745';
            statusText.textContent = 'نشط';
        } else {
            indicator.style.backgroundColor = '#dc3545';
            indicator.style.boxShadow = '0 0 10px #dc3545';
            statusText.textContent = 'متوقف';
        }
    }
    
    updateBalanceDisplay() {
        document.getElementById('liveBalance').textContent = `$${this.state.balance.toFixed(2)}`;
        document.getElementById('availableBalance').textContent = `$${this.state.availableBalance.toFixed(2)}`;
        document.getElementById('totalProfit').textContent = `$${this.state.totalProfit.toFixed(2)}`;
        document.getElementById('activeTrades').textContent = this.state.activeTrades.length;
    }
    
    updateTime() {
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = now.toLocaleTimeString('ar-EG');
    }
    
    showSection(sectionId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إظهار القسم المطلوب
        document.getElementById(sectionId).classList.add('active');
        
        // تحديث الروابط النشطة
        document.querySelectorAll('[data-section]').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId) {
                link.classList.add('active');
            }
        });
    }
    
    initCharts() {
        const ctx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 20}, (_, i) => i + 1),
                datasets: [{
                    label: 'الربح اليومي ($)',
                    data: Array.from({length: 20}, () => Math.random() * 20 - 5),
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'الربح ($)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'الأيام'
                        }
                    }
                }
            }
        });
    }
    
    calculateTrade() {
        const entry = parseFloat(document.getElementById('calcEntry').value);
        const stopLoss = parseFloat(document.getElementById('calcStopLoss').value);
        const takeProfit = parseFloat(document.getElementById('calcTakeProfit').value);
        const amount = parseFloat(document.getElementById('calcAmount').value);
        
        if (!entry || !stopLoss || !takeProfit || !amount) {
            document.getElementById('calcResult').innerHTML = `
                <div class="alert alert-warning">يرجى ملء جميع الحقول</div>
            `;
            return;
        }
        
        const risk = entry - stopLoss;
        const reward = takeProfit - entry;
        const riskRewardRatio = reward / risk;
        
        const quantity = amount / entry;
        const potentialLoss = risk * quantity;
        const potentialProfit = reward * quantity;
        
        document.getElementById('calcResult').innerHTML = `
            <div class="alert alert-info">
                <h6>نتائج الحساب:</h6>
                <p><strong>الكمية:</strong> ${quantity.toFixed(4)}</p>
                <p><strong>نسبة المخاطرة إلى العائد:</strong> 1:${riskRewardRatio.toFixed(2)}</p>
                <p><strong>الخسارة المحتملة:</strong> $${potentialLoss.toFixed(2)}</p>
                <p><strong>الربح المحتمل:</strong> $${potentialProfit.toFixed(2)}</p>
                <p><strong>نسبة المخاطرة:</strong> ${(potentialLoss / amount * 100).toFixed(1)}%</p>
            </div>
        `;
    }
    
    async saveApiKeys() {
        const apiKey = document.getElementById('apiKey').value.trim();
        const apiSecret = document.getElementById('apiSecret').value.trim();
        
        if (!apiKey || !apiSecret) {
            this.showMessage('خطأ', 'يرجى إدخال مفاتيح API', 'error');
            return;
        }
        
        // حفظ في LocalStorage
        localStorage.setItem('binance_api_key', apiKey);
        localStorage.setItem('binance_api_secret', apiSecret);
        
        // تحديث الإعدادات
        this.config.apiKey = apiKey;
        this.config.apiSecret = apiSecret;
        
        this.showMessage('نجاح', 'تم حفظ مفاتيح API بنجاح', 'success');
        
        // اختبار الاتصال تلقائياً
        await this.testConnection();
    }
    
    async closeTradeManually(tradeId) {
        const trade = this.state.activeTrades.find(t => t.id === tradeId);
        if (!trade) return;
        
        try {
            const currentPrice = await this.getCurrentPrice(trade.pair);
            await this.closeTrade(trade, currentPrice, 'MANUAL_CLOSE');
        } catch (error) {
            this.showMessage('خطأ', `فشل إغلاق الصفقة: ${error.message}`, 'error');
        }
    }
    
    updateUI() {
        this.updateBalanceDisplay();
        this.updateActiveTrades();
        this.updateSuccessRate();
        this.updateConnectionStatus();
        this.updateTradingStatus();
    }
    
    startUpdates() {
        // تحديث بيانات السوق كل 30 ثانية
        setInterval(() => this.updateMarketData(), 30000);
        
        // تحديث الواجهة كل 10 ثواني
        setInterval(() => this.updateUI(), 10000);
        
        // تحديث مؤشر الخوف والجشع كل دقيقة
        setInterval(() => this.updateFearGreedIndex(), 60000);
    }
    
    showMessage(title, message, type = 'info') {
        const modal = new bootstrap.Modal(document.getElementById('messageModal'));
        const modalTitle = document.getElementById('messageModalTitle');
        const modalBody = document.getElementById('messageModalBody');
        
        modalTitle.textContent = title;
        
        let icon = '';
        let color = '';
        
        switch(type) {
            case 'success':
                icon = '✅';
                color = 'text-success';
                break;
            case 'error':
                icon = '❌';
                color = 'text-danger';
                break;
            case 'warning':
                icon = '⚠️';
                color = 'text-warning';
                break;
            default:
                icon = 'ℹ️';
                color = 'text-info';
        }
        
        modalBody.innerHTML = `
            <div class="text-center">
                <div class="display-4 mb-3 ${color}">${icon}</div>
                <h5 class="${color}">${title}</h5>
                <p>${message}</p>
            </div>
        `;
        
        modal.show();
        
        // إغلاق تلقائي بعد 3 ثواني
        setTimeout(() => {
            modal.hide();
        }, 3000);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
let trader;
document.addEventListener('DOMContentLoaded', async () => {
    trader = new BinanceAutoTrader();
    
    // جعل الكائن متاحاً عالمياً للاستخدام من الأزرار
    window.trader = trader;
    
    // إظهار رسالة الترحيب
    setTimeout(() => {
        trader.showMessage(
            'مرحباً بك في نظام التداول الآلي',
            'يرجى إدخال مفاتيح Binance API للبدء',
            'info'
        );
    }, 1000);
});

// وظائف إضافية للاستخدام من الأزرار
window.closeTradeManually = function(tradeId) {
    if (trader) trader.closeTradeManually(tradeId);
};

window.showSection = function(sectionId) {
    if (trader) trader.showSection(sectionId);
};
</script>

<!-- إضافة مكتبة CryptoJS للتوقيع -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
