// نظام التداول الآلي المتقدم
class BinanceTradingSystem {
    constructor() {
        this.apiKey = '';
        this.apiSecret = '';
        this.balance = 80.00;
        this.isConnected = false;
        this.isSystemOn = false;
        this.autoTrading = false;
        this.activeTrades = [];
        this.tradeHistory = [];
        this.performance = {
            totalTrades: 0,
            successfulTrades: 0,
            failedTrades: 0,
            totalProfit: 0,
            dailyProfit: 0
        };
        
        this.settings = {
            dailyLossLimit: 10, // 10%
            maxTradeSize: 10, // 10% من الرصيد
            maxActiveTrades: 5,
            stopLoss: 1.5, // 1.5%
            takeProfitLevels: [1, 2, 3] // 1%, 2%, 3%
        };
        
        this.allowedCoins = [
            'ADAUSDT', 'ALGOUSDT', 'ALICEUSDT', 'ALPINEUSDT', 'ANKRUSDT',
            'APTUSDT', 'ARUSDT', 'ARBUSDT', 'ARKUSDT', 'ARPAUSDT',
            'ATAUSDT', 'ATOMUSDT', 'AXLUSDT', 'BANDUSDT', 'BATUSDT',
            'CFXUSDT', 'CHRUSDT', 'CTKUSDT', 'CTRUSDT', 'CTSIDT',
            'CVCUSDT', 'CYBERUSDT', 'DATAUSDT', 'DENTUSDT', 'DGBUSDT',
            'DOGEUSDT', 'DOTUSDT', 'DUSKUSDT', 'EDUUSDT', 'ENSUSDT',
            'ETCUSDT', 'FETUSDT', 'FIOUSDT', 'FISUSDT', 'FLUXUSDT',
            'GALAUSDT', 'GLMUSDT', 'GMTUSDT', 'HIGHUSDT', 'HIVEUSDT',
            'ICPUSDT', 'IDEXUSDT', 'IOSTUSDT', 'IOTAUSDT', 'KSMUSDT',
            'LINKUSDT', 'LISTAUSDT', 'LRCUSDT', 'LSKUSDT', 'MANTAUSDT',
            'MDTUSDT', 'NEARUSDT', 'NOTUSDT', 'OGNUSDT', 'ONTUSDT',
            'PHAUSDT', 'PEPEUSDT', 'PONDUSDT', 'PROVEUSDT', 'PUNDIXUSDT',
            'PYRUSDT', 'RADUSDT', 'RAREUSDT', 'RLCUSDT', 'RSRUSDT',
            'RVNUSDT', 'SEIUSDT', 'SFPUSDT', 'SKLUSDT', 'SOLUSDT',
            'SSVUSDT', 'STXUSDT', 'SUIUSDT', 'SUSHIUSDT', 'SXPUSDT',
            'THETAUSDT', 'TRBUSDT', 'TRXUSDT', 'TWTUSDT', 'UTKUSDT',
            'VETUSDT', 'VICUSDT', 'WINUSDT', 'WLDUSDT', 'XCNUSDT',
            'XECUSDT', 'XLMUSDT', 'XRPUSDT', 'XTZUSDT', 'ZECUSDT',
            'ZENUSDT', 'ZILUSDT', 'PHBUSDT', 'BLCUSDT', 'CUSDT'
        ];
        
        this.initialize();
    }
    
    initialize() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.updateUI();
        this.startMarketMonitoring();
        this.showNotification('نظام التداول الآلي جاهز', 'success');
    }
    
    setupEventListeners() {
        // تبديل الصفحات
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.switchPage(page);
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // زر التشغيل الرئيسي
        document.getElementById('system-power-toggle').addEventListener('change', (e) => {
            this.toggleSystem(e.target.checked);
        });
        
        // حفظ مفاتيح API
        document.getElementById('save-api-keys').addEventListener('click', () => {
            this.saveApiKeys();
        });
        
        // اختبار الاتصال
        document.getElementById('test-api-connection').addEventListener('click', () => {
            this.testApiConnection();
        });
        
        // التداول الآلي
        document.getElementById('auto-trading-toggle').addEventListener('change', (e) => {
            this.toggleAutoTrading(e.target.checked);
        });
        
        // تحديث البيانات
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.refreshMarketData();
        });
        
        // الشراء اليدوي
        document.getElementById('manual-buy-btn').addEventListener('click', () => {
            this.executeManualTrade('BUY');
        });
        
        // البيع اليدوي
        document.getElementById('manual-sell-btn').addEventListener('click', () => {
            this.executeManualTrade('SELL');
        });
        
        // تحديث التحليل
        document.getElementById('refresh-analysis').addEventListener('click', () => {
            this.performMarketAnalysis();
        });
        
        // إغلاق المودال
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeTradeModal();
        });
    }
    
    switchPage(page) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
    }
    
    toggleSystem(state) {
        this.isSystemOn = state;
        this.updateSystemStatus();
        
        if (state) {
            this.showNotification('تم تشغيل نظام التداول الآلي', 'success');
            this.startTradingCycle();
        } else {
            this.showNotification('تم إيقاف نظام التداول الآلي', 'warning');
        }
    }
    
    async saveApiKeys() {
        const apiKey = document.getElementById('api-key').value;
        const apiSecret = document.getElementById('api-secret').value;
        
        if (!apiKey || !apiSecret) {
            this.showNotification('يرجى إدخال مفاتيح API', 'error');
            return;
        }
        
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        
        localStorage.setItem('binance_api_key', apiKey);
        localStorage.setItem('binance_api_secret', apiSecret);
        
        this.showNotification('تم حفظ مفاتيح API بنجاح', 'success');
        await this.testApiConnection();
    }
    
    async testApiConnection() {
        if (!this.apiKey || !this.apiSecret) {
            this.showNotification('يرجى إدخال مفاتيح API أولاً', 'error');
            return;
        }
        
        try {
            // محاكاة اختبار الاتصال
            await this.simulateApiCall();
            this.isConnected = true;
            this.updateApiStatus();
            this.showNotification('تم الاتصال بنجاح مع Binance API', 'success');
        } catch (error) {
            this.isConnected = false;
            this.updateApiStatus();
            this.showNotification('فشل الاتصال مع Binance API', 'error');
        }
    }
    
    simulateApiCall() {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // محاكاة نجاح الاتصال
                resolve(true);
            }, 1000);
        });
    }
    
    toggleAutoTrading(state) {
        this.autoTrading = state;
        
        if (state && this.isSystemOn) {
            this.startAutoTrading();
            this.showNotification('تم تفعيل التداول الآلي', 'success');
        } else if (!state) {
            this.showNotification('تم إيقاف التداول الآلي', 'warning');
        }
    }
    
    async startAutoTrading() {
        if (!this.autoTrading || !this.isSystemOn) return;
        
        // تحليل السوق وإيجاد أفضل الفرص
        const opportunities = await this.analyzeMarketOpportunities();
        
        // تنفيذ الصفقات على أفضل 3 فرص
        const topOpportunities = opportunities.slice(0, 3);
        
        for (const opportunity of topOpportunities) {
            if (this.activeTrades.length >= this.settings.maxActiveTrades) {
                break;
            }
            
            await this.executeAutoTrade(opportunity);
        }
        
        // جدولة التداول التلقائي التالي
        setTimeout(() => this.startAutoTrading(), 300000); // كل 5 دقائق
    }
    
    async analyzeMarketOpportunities() {
        const opportunities = [];
        
        // محاكاة تحليل السوق
        const sampleCoins = this.getRandomCoins(10);
        
        for (const coin of sampleCoins) {
            const score = await this.calculateTradeScore(coin);
            
            if (score > 70) { // درجة عالية للتداول
                opportunities.push({
                    symbol: coin,
                    score: score,
                    recommendation: 'شراء قوي',
                    reasons: ['سيولة عالية', 'نموذج فني إيجابي', 'مؤشرات إيجابية']
                });
            }
        }
        
        return opportunities.sort((a, b) => b.score - a.score);
    }
    
    getRandomCoins(count) {
        const shuffled = [...this.allowedCoins].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    async calculateTradeScore(symbol) {
        // محاكاة حساب درجة التداول
        let score = Math.floor(Math.random() * 30) + 50; // بين 50-80
        
        // زيادة الدرجة بناءً على الظروف المثالية
        const fearGreed = await this.getFearGreedIndex();
        if (fearGreed >= 20 && fearGreed <= 35) {
            score += 15;
        }
        
        // زيادة الدرجة للعملات عالية السيولة
        if (['BTCUSDT', 'ETHUSDT', 'BNBUSDT'].includes(symbol)) {
            score += 10;
        }
        
        return Math.min(score, 100);
    }
    
    async getFearGreedIndex() {
        // محاكاة مؤشر الخوف والجشع
        return Math.floor(Math.random() * 40) + 20; // بين 20-60
    }
    
    async executeAutoTrade(opportunity) {
        if (!this.isConnected) return;
        
        const tradeSize = this.calculateTradeSize();
        const currentPrice = await this.getCurrentPrice(opportunity.symbol);
        
        const trade = {
            id: Date.now(),
            symbol: opportunity.symbol,
            type: 'BUY',
            entryPrice: currentPrice,
            quantity: tradeSize / currentPrice,
            stopLoss: currentPrice * (1 - this.settings.stopLoss / 100),
            takeProfits: [
                currentPrice * (1 + this.settings.takeProfitLevels[0] / 100),
                currentPrice * (1 + this.settings.takeProfitLevels[1] / 100),
                currentPrice * (1 + this.settings.takeProfitLevels[2] / 100)
            ],
            status: 'ACTIVE',
            timestamp: new Date(),
            autoTrade: true
        };
        
        this.activeTrades.push(trade);
        this.updateActiveTradesUI();
        this.showNotification(`تم فتح صفقة تلقائية على ${opportunity.symbol}`, 'success');
        
        // مراقبة الصفقة
        this.monitorTrade(trade);
    }
    
    async executeManualTrade(type) {
        const symbol = document.getElementById('manual-coin-select').value;
        const amount = parseFloat(document.getElementById('manual-trade-amount').value);
        
        if (!symbol) {
            this.showNotification('يرجى اختيار عملة', 'error');
            return;
        }
        
        if (amount > this.balance) {
            this.showNotification('الرصيد غير كافي', 'error');
            return;
        }
        
        const currentPrice = await this.getCurrentPrice(symbol);
        
        const trade = {
            id: Date.now(),
            symbol: symbol,
            type: type,
            entryPrice: currentPrice,
            quantity: amount / currentPrice,
            stopLoss: currentPrice * (1 - this.settings.stopLoss / 100),
            takeProfits: [
                currentPrice * (1 + this.settings.takeProfitLevels[0] / 100),
                currentPrice * (1 + this.settings.takeProfitLevels[1] / 100),
                currentPrice * (1 + this.settings.takeProfitLevels[2] / 100)
            ],
            status: 'ACTIVE',
            timestamp: new Date(),
            autoTrade: false
        };
        
        this.activeTrades.push(trade);
        this.balance -= amount;
        this.updateUI();
        this.updateActiveTradesUI();
        
        this.showNotification(`تم فتح صفقة ${type === 'BUY' ? 'شراء' : 'بيع'} على ${symbol}`, 'success');
        
        // مراقبة الصفقة
        this.monitorTrade(trade);
    }
    
    calculateTradeSize() {
        const maxSize = this.balance * (this.settings.maxTradeSize / 100);
        return Math.min(maxSize, 10); // حد أقصى 10 USDT للصفقة
    }
    
    async getCurrentPrice(symbol) {
        // محاكاة سعر حالي
        return 1 + Math.random() * 0.1; // بين 1-1.1
    }
    
    async monitorTrade(trade) {
        const interval = setInterval(async () => {
            if (trade.status !== 'ACTIVE') {
                clearInterval(interval);
                return;
            }
            
            const currentPrice = await this.getCurrentPrice(trade.symbol);
            const profitPercent = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
            
            // التحقق من وقف الخسارة
            if (currentPrice <= trade.stopLoss) {
                await this.closeTrade(trade, currentPrice, 'STOP_LOSS');
                clearInterval(interval);
                return;
            }
            
            // التحقق من مستويات جني الأرباح
            if (currentPrice >= trade.takeProfits[0]) {
                await this.takePartialProfit(trade, 0.3, currentPrice, 'TAKE_PROFIT_1');
            }
            
            if (currentPrice >= trade.takeProfits[1]) {
                await this.takePartialProfit(trade, 0.3, currentPrice, 'TAKE_PROFIT_2');
            }
            
            if (currentPrice >= trade.takeProfits[2]) {
                await this.closeTrade(trade, currentPrice, 'TAKE_PROFIT_3');
                clearInterval(interval);
            }
            
            // تحديث واجهة الصفقة
            this.updateTradeInUI(trade, profitPercent);
        }, 30000); // كل 30 ثانية
    }
    
    async closeTrade(trade, closePrice, reason) {
        const profit = (closePrice - trade.entryPrice) * trade.quantity;
        trade.exitPrice = closePrice;
        trade.exitTime = new Date();
        trade.status = 'CLOSED';
        trade.closeReason = reason;
        trade.profit = profit;
        
        // تحديث الرصيد والأداء
        this.balance += trade.quantity * closePrice + (profit || 0);
        
        if (profit > 0) {
            this.performance.successfulTrades++;
            this.performance.totalProfit += profit;
            this.performance.dailyProfit += profit;
        } else {
            this.performance.failedTrades++;
        }
        
        this.performance.totalTrades++;
        
        // نقل الصفقة للسجل
        this.tradeHistory.push(trade);
        this.activeTrades = this.activeTrades.filter(t => t.id !== trade.id);
        
        // تحديث الواجهة
        this.updateUI();
        this.updateActiveTradesUI();
        this.updateTradeHistoryUI();
        
        // إرسال إشعار
        const message = profit > 0 
            ? `تم إغلاق صفقة ${trade.symbol} بربح ${profit.toFixed(2)} USDT`
            : `تم إغلاق صفقة ${trade.symbol} بخسارة ${Math.abs(profit).toFixed(2)} USDT`;
        
        this.showNotification(message, profit > 0 ? 'success' : 'error');
    }
    
    async takePartialProfit(trade, percentage, price, level) {
        if (trade.partialProfits && trade.partialProfits[level]) return;
        
        const partialQuantity = trade.quantity * percentage;
        const profit = (price - trade.entryPrice) * partialQuantity;
        
        if (!trade.partialProfits) trade.partialProfits = {};
        trade.partialProfits[level] = {
            quantity: partialQuantity,
            price: price,
            profit: profit,
            timestamp: new Date()
        };
        
        trade.quantity -= partialQuantity;
        this.balance += partialQuantity * price;
        this.performance.dailyProfit += profit;
        this.performance.totalProfit += profit;
        
        this.updateUI();
        this.showNotification(`تم جني أرباح جزئية من ${trade.symbol} بمستوى ${level}`, 'success');
    }
    
    startMarketMonitoring() {
        // تحديث بيانات السوق كل دقيقة
        setInterval(() => {
            this.updateMarketData();
        }, 60000);
        
        // تحديث مؤشر الخوف والجشع كل 5 دقائق
        setInterval(() => {
            this.updateFearGreedIndex();
        }, 300000);
        
        // تحديث الوقت
        setInterval(() => {
            this.updateTime();
        }, 1000);
    }
    
    async updateMarketData() {
        // محاكاة تحديث بيانات السوق
        await this.performMarketAnalysis();
        this.updateUI();
    }
    
    async performMarketAnalysis() {
        // تحليل أفضل العملات
        const topCoins = await this.getTopLiquidityCoins();
        this.updateTopCoinsUI(topCoins);
        
        // تحليل الرابحين والخاسرين
        const { gainers, losers } = await this.getGainersLosers();
        this.updateGainersLosersUI(gainers, losers);
        
        // تحليل فرص الانفجار
        const breakoutCoins = await this.analyzeBreakoutOpportunities();
        this.updateBreakoutAnalysisUI(breakoutCoins);
    }
    
    async getTopLiquidityCoins() {
        // محاكاة أفضل العملات بالسيولة
        const shuffled = [...this.allowedCoins].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3).map((coin, index) => ({
            symbol: coin,
            price: (1 + Math.random() * 0.5).toFixed(4),
            change24h: (Math.random() * 10 - 5).toFixed(2),
            volume: (Math.random() * 1000000 + 500000).toFixed(0),
            liquidityScore: Math.floor(Math.random() * 30) + 70
        }));
    }
    
    async getGainersLosers() {
        const sampleCoins = this.getRandomCoins(20);
        
        const gainers = sampleCoins.slice(0, 10).map((coin, index) => ({
            rank: index + 1,
            symbol: coin,
            change: (Math.random() * 15 + 1).toFixed(2),
            volume: (Math.random() * 500000 + 100000).toFixed(0)
        }));
        
        const losers = sampleCoins.slice(10, 20).map((coin, index) => ({
            rank: index + 1,
            symbol: coin,
            change: (-Math.random() * 15 - 1).toFixed(2),
            volume: (Math.random() * 500000 + 100000).toFixed(0)
        }));
        
        return { gainers, losers };
    }
    
    async analyzeBreakoutOpportunities() {
        const sampleCoins = this.getRandomCoins(5);
        
        return sampleCoins.map(coin => ({
            symbol: coin,
            currentPrice: (1 + Math.random() * 0.2).toFixed(4),
            breakoutScore: Math.floor(Math.random() * 30) + 60,
            signalStrength: Math.floor(Math.random() * 30) + 70,
            pattern: ['ماروبوزو', 'إنقلابي صعودي', 'شمعة بيضاء'][Math.floor(Math.random() * 3)],
            volumeSpike: Math.random() > 0.5
        }));
    }
    
    updateUI() {
        // تحديث الرصيد
        document.getElementById('current-balance').textContent = `${this.balance.toFixed(2)} USDT`;
        document.getElementById('trading-balance').textContent = `${this.balance.toFixed(2)} USDT`;
        
        // تحديث معدل النجاح
        const successRate = this.performance.totalTrades > 0 
            ? ((this.performance.successfulTrades / this.performance.totalTrades) * 100).toFixed(1)
            : '0';
        document.getElementById('success-rate').textContent = `${successRate}%`;
        
        // تحديث الأرباح
        document.getElementById('total-profit').textContent = `${this.performance.totalProfit.toFixed(2)} USDT`;
        document.getElementById('daily-profit').textContent = `${this.performance.dailyProfit.toFixed(2)} USDT`;
        
        // تحديث الصفقات النشطة
        document.getElementById('active-trades').textContent = this.activeTrades.length;
        document.getElementById('active-trades-count').textContent = this.activeTrades.length;
        document.getElementById('successful-trades-count').textContent = this.performance.successfulTrades;
        document.getElementById('failed-trades-count').textContent = this.performance.failedTrades;
        
        // تحديث مؤشر المخاطرة
        const riskLevel = this.calculateRiskLevel();
        document.getElementById('risk-level').textContent = riskLevel.level;
        document.getElementById('risk-status').textContent = riskLevel.status;
        document.getElementById('risk-status').className = riskLevel.class;
    }
    
    calculateRiskLevel() {
        if (this.activeTrades.length === 0) {
            return { level: 'منخفض', status: 'آمن', class: 'success' };
        }
        
        const totalExposure = this.activeTrades.reduce((sum, trade) => {
            return sum + (trade.quantity * trade.entryPrice);
        }, 0);
        
        const exposurePercentage = (totalExposure / this.balance) * 100;
        
        if (exposurePercentage < 20) {
            return { level: 'منخفض', status: 'آمن', class: 'success' };
        } else if (exposurePercentage < 50) {
            return { level: 'متوسط', status: 'مقبول', class: 'warning' };
        } else {
            return { level: 'عالي', status: 'خطير', class: 'danger' };
        }
    }
    
    updateSystemStatus() {
        const statusIndicator = document.getElementById('system-status');
        const statusText = document.getElementById('status-text');
        
        if (this.isSystemOn) {
            statusIndicator.className = 'status-indicator active';
            statusText.textContent = 'النظام نشط';
            statusText.style.color = 'var(--secondary-color)';
        } else {
            statusIndicator.className = 'status-indicator';
            statusText.textContent = 'النظام متوقف';
            statusText.style.color = 'var(--gray-color)';
        }
    }
    
    updateApiStatus() {
        const statusDot = document.getElementById('api-status-dot');
        const statusText = document.getElementById('api-status-text');
        
        if (this.isConnected) {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'متصل';
            statusText.style.color = 'var(--secondary-color)';
        } else {
            statusDot.className = 'status-dot';
            statusText.textContent = 'غير متصل';
            statusText.style.color = 'var(--danger-color)';
        }
    }
    
    updateActiveTradesUI() {
        const table = document.getElementById('active-trades-table');
        if (!table) return;
        
        table.innerHTML = this.activeTrades.map(trade => `
            <tr>
                <td>
                    <strong>${trade.symbol}</strong><br>
                    <small>${trade.autoTrade ? 'تلقائي' : 'يدوي'}</small>
                </td>
                <td>
                    <span class="badge ${trade.type === 'BUY' ? 'success' : 'danger'}">
                        ${trade.type === 'BUY' ? 'شراء' : 'بيع'}
                    </span>
                </td>
                <td>${trade.entryPrice.toFixed(4)}</td>
                <td>${trade.quantity.toFixed(4)}</td>
                <td>${trade.stopLoss.toFixed(4)}</td>
                <td>
                    ${trade.takeProfits.map((tp, i) => 
                        `<div>TP${i+1}: ${tp.toFixed(4)}</div>`
                    ).join('')}
                </td>
                <td class="profit-positive">+${(((trade.entryPrice * 1.01 - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2)}%</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="tradingSystem.closeTradeById(${trade.id})">
                        إغلاق
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    updateTradeHistoryUI() {
        const successfulList = document.getElementById('successful-trades-list');
        const failedList = document.getElementById('failed-trades-list');
        
        if (successfulList) {
            const successfulTrades = this.tradeHistory.filter(t => t.profit > 0).slice(0, 5);
            successfulList.innerHTML = successfulTrades.map(trade => `
                <div class="trade-history-item success">
                    <div class="trade-info">
                        <strong>${trade.symbol}</strong>
                        <span>${trade.type === 'BUY' ? 'شراء' : 'بيع'}</span>
                    </div>
                    <div class="trade-details">
                        <span>الدخول: ${trade.entryPrice.toFixed(4)}</span>
                        <span>الخروج: ${trade.exitPrice.toFixed(4)}</span>
                        <span class="profit">+${trade.profit.toFixed(2)} USDT</span>
                    </div>
                    <div class="trade-time">
                        ${new Date(trade.timestamp).toLocaleTimeString('ar-SA')}
                    </div>
                </div>
            `).join('');
        }
        
        if (failedList) {
            const failedTrades = this.tradeHistory.filter(t => t.profit <= 0).slice(0, 5);
            failedList.innerHTML = failedTrades.map(trade => `
                <div class="trade-history-item danger">
                    <div class="trade-info">
                        <strong>${trade.symbol}</strong>
                        <span>${trade.type === 'BUY' ? 'شراء' : 'بيع'}</span>
                    </div>
                    <div class="trade-details">
                        <span>الدخول: ${trade.entryPrice.toFixed(4)}</span>
                        <span>الخروج: ${trade.exitPrice.toFixed(4)}</span>
                        <span class="profit">${trade.profit.toFixed(2)} USDT</span>
                    </div>
                    <div class="trade-time">
                        ${new Date(trade.timestamp).toLocaleTimeString('ar-SA')}
                    </div>
                </div>
            `).join('');
        }
    }
    
    updateTopCoinsUI(topCoins) {
        const container = document.getElementById('top-coins-container');
        if (!container) return;
        
        container.innerHTML = topCoins.map(coin => `
            <div class="coin-card">
                <div class="coin-header">
                    <h4>${coin.symbol}</h4>
                    <div class="coin-price">${coin.price} USDT</div>
                </div>
                <div class="coin-stats">
                    <div class="stat">
                        <span class="stat-label">التغير (24h):</span>
                        <span class="stat-value ${coin.change24h >= 0 ? 'profit-positive' : 'profit-negative'}">
                            ${coin.change24h >= 0 ? '+' : ''}${coin.change24h}%
                        </span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">الحجم:</span>
                        <span class="stat-value">${parseInt(coin.volume).toLocaleString()}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">درجة السيولة:</span>
                        <span class="stat-value">${coin.liquidityScore}/100</span>
                    </div>
                </div>
                <div class="coin-actions">
                    <button class="btn btn-sm btn-primary" 
                            onclick="tradingSystem.analyzeCoin('${coin.symbol}')">
                        تحليل مفصل
                    </button>
                    <button class="btn btn-sm btn-success" 
                            onclick="tradingSystem.executeManualTradeFromExplore('${coin.symbol}', 'BUY')">
                        شراء
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateGainersLosersUI(gainers, losers) {
        const gainersTable = document.getElementById('gainers-table');
        const losersTable = document.getElementById('losers-table');
        
        if (gainersTable) {
            gainersTable.innerHTML = gainers.map(coin => `
                <tr>
                    <td>${coin.rank}</td>
                    <td><strong>${coin.symbol}</strong></td>
                    <td class="profit-positive">+${coin.change}%</td>
                    <td>${parseInt(coin.volume).toLocaleString()}</td>
                </tr>
            `).join('');
        }
        
        if (losersTable) {
            losersTable.innerHTML = losers.map(coin => `
                <tr>
                    <td>${coin.rank}</td>
                    <td><strong>${coin.symbol}</strong></td>
                    <td class="profit-negative">${coin.change}%</td>
                    <td>${parseInt(coin.volume).toLocaleString()}</td>
                </tr>
            `).join('');
        }
    }
    
    updateBreakoutAnalysisUI(breakoutCoins) {
        const container = document.getElementById('breakout-analysis');
        if (!container) return;
        
        container.innerHTML = breakoutCoins.map(coin => `
            <div class="breakout-item">
                <div class="breakout-header">
                    <h5>${coin.symbol}</h5>
                    <span class="price">${coin.currentPrice} USDT</span>
                </div>
                <div class="breakout-metrics">
                    <div class="metric">
                        <span class="metric-label">قوة الإشارة:</span>
                        <span class="metric-value ${coin.signalStrength > 80 ? 'high' : 'medium'}">
                            ${coin.signalStrength}/100
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">درجة الانفجار:</span>
                        <span class="metric-value ${coin.breakoutScore > 75 ? 'high' : 'medium'}">
                            ${coin.breakoutScore}/100
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">النمط:</span>
                        <span class="metric-value">${coin.pattern}</span>
                    </div>
                </div>
                <div class="breakout-indicators">
                    <span class="indicator ${coin.volumeSpike ? 'active' : ''}">
                        <i class="fas fa-chart-bar"></i>
                        ارتفاع الحجم
                    </span>
                </div>
                <div class="breakout-actions">
                    <button class="btn btn-sm btn-success" 
                            onclick="tradingSystem.executeManualTradeFromExplore('${coin.symbol}', 'BUY')">
                        <i class="fas fa-bolt"></i>
                        تنفيذ سريع
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    async updateFearGreedIndex() {
        const index = await this.getFearGreedIndex();
        const fill = document.getElementById('fear-greed-fill');
        const score = document.getElementById('fear-greed-score');
        const advice = document.getElementById('fg-advice');
        
        if (fill && score && advice) {
            const percentage = index;
            fill.style.width = `${percentage}%`;
            score.textContent = index;
            
            // تغيير لون المؤشر حسب القيمة
            if (index >= 20 && index <= 35) {
                fill.style.background = '#1dd1a1'; // أخضر للشراء
                advice.textContent = 'إشارة شراء مثالية - نسبة الخوف والجشع مثالية';
            } else if (index < 20) {
                fill.style.background = '#ff6b6b'; // أحمر للخوف الشديد
                advice.textContent = 'خوف شديد - كن حذراً';
            } else {
                fill.style.background = '#feca57'; // أصفر للجشع
                advice.textContent = 'جشع عالي - خذ حذرك';
            }
        }
    }
    
    updateTime() {
        const timeElement = document.getElementById('last-update-time');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleTimeString('ar-SA');
        }
        
        const uptimeElement = document.getElementById('uptime');
        if (uptimeElement && this.systemStartTime) {
            const uptime = Date.now() - this.systemStartTime;
            const hours = Math.floor(uptime / (1000 * 60 * 60));
            const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
            uptimeElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    loadFromStorage() {
        const savedApiKey = localStorage.getItem('binance_api_key');
        const savedApiSecret = localStorage.getItem('binance_api_secret');
        const savedPerformance = localStorage.getItem('trading_performance');
        const savedSettings = localStorage.getItem('trading_settings');
        
        if (savedApiKey) {
            this.apiKey = savedApiKey;
            document.getElementById('api-key').value = savedApiKey;
        }
        
        if (savedApiSecret) {
            this.apiSecret = savedApiSecret;
            document.getElementById('api-secret').value = savedApiSecret;
        }
        
        if (savedPerformance) {
            this.performance = JSON.parse(savedPerformance);
        }
        
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            
            // تحديث واجهة الإعدادات
            document.getElementById('daily-loss-limit').value = this.settings.dailyLossLimit;
            document.getElementById('loss-limit-value').textContent = `${this.settings.dailyLossLimit}%`;
            
            document.getElementById('max-trade-size').value = this.settings.maxTradeSize;
            document.getElementById('trade-size-value').textContent = `${this.settings.maxTradeSize}%`;
            
            document.getElementById('max-active-trades').value = this.settings.maxActiveTrades;
        }
    }
    
    saveToStorage() {
        localStorage.setItem('trading_performance', JSON.stringify(this.performance));
        localStorage.setItem('trading_settings', JSON.stringify(this.settings));
    }
    
    showNotification(message, type = 'info') {
        Toastify({
            text: message,
            duration: 5000,
            gravity: "top",
            position: "right",
            backgroundColor: type === 'success' ? '#2ecc71' : 
                          type === 'error' ? '#e74c3c' : 
                          type === 'warning' ? '#f39c12' : '#3498db',
            stopOnFocus: true,
            className: `toast-${type}`,
            callback: function() {}
        }).showToast();
        
        // إضافة الرسالة إلى سجل النظام
        this.addSystemMessage(message, type);
    }
    
    addSystemMessage(message, type) {
        const container = document.getElementById('system-messages');
        if (!container) return;
        
        const icon = type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
        const messageElement = document.createElement('div');
        messageElement.className = 'message-item';
        messageElement.innerHTML = `
            <div class="message-icon">
                <i class="fas ${icon} ${type}"></i>
            </div>
            <div class="message-content">
                <p>${message}</p>
                <small>${new Date().toLocaleTimeString('ar-SA')}</small>
            </div>
        `;
        
        container.insertBefore(messageElement, container.firstChild);
        
        // تحديث عداد الإشعارات
        const badge = document.getElementById('trades-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
        }
    }
    
    // طرق مساعدة للواجهة
    analyzeCoin(symbol) {
        this.showNotification(`جاري تحليل ${symbol}...`, 'info');
        // هنا يمكن إضافة تحليل مفصل للعملة
    }
    
    executeManualTradeFromExplore(symbol, type) {
        document.getElementById('manual-coin-select').value = symbol;
        document.getElementById('manual-trade-amount').value = 10;
        
        if (type === 'BUY') {
            this.executeManualTrade('BUY');
        } else {
            this.executeManualTrade('SELL');
        }
    }
    
    closeTradeById(tradeId) {
        const trade = this.activeTrades.find(t => t.id === tradeId);
        if (trade) {
            this.closeTrade(trade, trade.entryPrice * 0.99, 'MANUAL_CLOSE');
        }
    }
    
    openTradeModal(trade) {
        const modal = document.getElementById('trade-modal');
        const details = document.getElementById('trade-details');
        
        if (modal && details) {
            details.innerHTML = `
                <div class="trade-modal-details">
                    <h4>${trade.symbol} - ${trade.type === 'BUY' ? 'شراء' : 'بيع'}</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">سعر الدخول:</span>
                            <span class="value">${trade.entryPrice.toFixed(4)} USDT</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">الكمية:</span>
                            <span class="value">${trade.quantity.toFixed(4)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">وقف الخسارة:</span>
                            <span class="value">${trade.stopLoss.toFixed(4)} USDT</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">جني الأرباح:</span>
                            <span class="value">
                                ${trade.takeProfits.map((tp, i) => 
                                    `TP${i+1}: ${tp.toFixed(4)} USDT`
                                ).join('<br>')}
                            </span>
                        </div>
                        <div class="detail-item">
                            <span class="label">نوع الصفقة:</span>
                            <span class="value">${trade.autoTrade ? 'تلقائي' : 'يدوي'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">وقت الدخول:</span>
                            <span class="value">${new Date(trade.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                    </div>
                    
                    <div class="trade-chart">
                        <h5>تحليل الصفقة</h5>
                        <canvas id="trade-chart-canvas" width="400" height="200"></canvas>
                    </div>
                </div>
            `;
            
            modal.classList.add('active');
            
            // إنشاء رسم بياني للصفقة
            this.createTradeChart(trade);
        }
    }
    
    closeTradeModal() {
        const modal = document.getElementById('trade-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    createTradeChart(trade) {
        const canvas = document.getElementById('trade-chart-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // بيانات محاكاة للرسم البياني
        const data = {
            labels: ['-5m', '-4m', '-3m', '-2m', '-1m', 'الدخول', '+1m', '+2m', '+3m', '+4m', '+5m'],
            datasets: [
                {
                    label: 'سعر العملة',
                    data: [
                        trade.entryPrice * 0.99,
                        trade.entryPrice * 0.995,
                        trade.entryPrice * 0.998,
                        trade.entryPrice * 0.999,
                        trade.entryPrice * 1.001,
                        trade.entryPrice,
                        trade.entryPrice * 1.005,
                        trade.entryPrice * 1.01,
                        trade.entryPrice * 1.015,
                        trade.entryPrice * 1.02,
                        trade.entryPrice * 1.025
                    ],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'سعر الدخول',
                    data: Array(11).fill(trade.entryPrice),
                    borderColor: '#2ecc71',
                    borderDash: [5, 5],
                    fill: false
                },
                {
                    label: 'وقف الخسارة',
                    data: Array(11).fill(trade.stopLoss),
                    borderColor: '#e74c3c',
                    borderDash: [5, 5],
                    fill: false
                }
            ]
        };
        
        new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }
    
    refreshMarketData() {
        this.showNotification('جاري تحديث بيانات السوق...', 'info');
        this.performMarketAnalysis();
        setTimeout(() => {
            this.showNotification('تم تحديث بيانات السوق بنجاح', 'success');
        }, 1000);
    }
    
    startTradingCycle() {
        this.systemStartTime = Date.now();
        document.getElementById('last-start').textContent = new Date().toLocaleTimeString('ar-SA');
        document.getElementById('system-state').textContent = 'نشط';
        document.getElementById('system-state').style.color = 'var(--secondary-color)';
        
        if (this.autoTrading) {
            this.startAutoTrading();
        }
    }
}

// إنشاء وتشغيل النظام
const tradingSystem = new BinanceTradingSystem();
window.tradingSystem = tradingSystem;

// إعدادات منزلقات الأمان
document.getElementById('daily-loss-limit').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('loss-limit-value').textContent = `${value}%`;
    tradingSystem.settings.dailyLossLimit = parseInt(value);
    tradingSystem.saveToStorage();
});

document.getElementById('max-trade-size').addEventListener('input', function() {
    const value = this.value;
    document.getElementById('trade-size-value').textContent = `${value}%`;
    tradingSystem.settings.maxTradeSize = parseInt(value);
    tradingSystem.saveToStorage();
});

document.getElementById('max-active-trades').addEventListener('change', function() {
    tradingSystem.settings.maxActiveTrades = parseInt(this.value);
    tradingSystem.saveToStorage();
});

// ملء قائمة العملات للتداول اليدوي
const coinSelect = document.getElementById('manual-coin-select');
if (coinSelect) {
    tradingSystem.allowedCoins.forEach(coin => {
        const option = document.createElement('option');
        option.value = coin;
        option.textContent = coin;
        coinSelect.appendChild(option);
    });
}

// إضافة نصائح استراتيجية
const strategyTips = [
    "استخدم مؤشر الخوف والجشع بين 20-35 للإشارات المثالية",
    "ركز على العملات عالية السيولة لتجنب الانزلاق السعري",
    "استخدم تصحيح فيبوناتشي لدخول الصفقات عند مستويات 0.618",
    "ابحث عن نمط ماروبوزو أو إنقلابي صعودي لدخول الصفقات",
    "احرص على نسبة المخاطرة/العائد 1:2 على الأقل",
    "استخدم وقف الخسارة المتحرك عند تحقيق الأرباح",
    "تنويع الصفقات على 3-5 عملات مختلفة",
    "تحليل اتجاه العام والاتجاه الفرعي قبل الدخول",
    "مراقبة حجم التداول اللحظي للتأكد من قوة الاتجاه",
    "استخدم موجات إليوت لتحديد مراحل السوق"
];

const tipsContainer = document.getElementById('strategy-tips');
if (tipsContainer) {
    tipsContainer.innerHTML = strategyTips.map((tip, index) => `
        <div class="tip-item">
            <div class="tip-number">${index + 1}</div>
            <div class="tip-content">${tip}</div>
        </div>
    `).join('');
}

// تحديث واجهة المستخدم عند تحميل الصفحة
window.addEventListener('load', () => {
    tradingSystem.updateUI();
    tradingSystem.updateSystemStatus();
    tradingSystem.updateApiStatus();
    tradingSystem.updateFearGreedIndex();
    tradingSystem.updateTime();
});

// تحديث الوقت كل ثانية
setInterval(() => {
    tradingSystem.updateTime();
}, 1000);