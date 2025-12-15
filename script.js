// ============================================
// نظام التداول الآلي المتقدم - الإصدار المعدل
// ============================================

class TradingSystem {
    constructor() {
        this.systemActive = false;
        this.autoTradingActive = false;
        this.balance = 80.00;
        this.activeTrades = [];
        this.tradeHistory = [];
        this.breakoutCoins = [];
        this.breakoutUpdateInterval = null;
        this.manualTradeUpdateInterval = null;
        this.systemStartTime = null;
        this.uptimeInterval = null;
        
        this.init();
    }
    
    init() {
        console.log('🚀 بدء نظام التداول الآلي...');
        
        // 1. تحميل البيانات المحفوظة
        this.loadFromStorage();
        
        // 2. إعداد الواجهة
        this.setupUI();
        
        // 3. إعداد العملات
        this.setupCoins();
        
        // 4. تحديث الواجهة
        this.updateUI();
        
        // 5. بدء التحديثات
        this.startUpdates();
        
        // 6. إضافة رسالة ترحيب
        this.addSystemMessage('مرحباً بك في نظام التداول الآلي المتقدم', 'info');
        this.addSystemMessage('النظام جاهز للتداول، اضغط على زر التشغيل للبدء', 'info');
    }
    
    loadFromStorage() {
        try {
            const savedData = localStorage.getItem('trading_system_data');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.systemActive = data.systemActive || false;
                this.autoTradingActive = data.autoTradingActive || false;
                this.balance = data.balance || 80.00;
                this.activeTrades = data.activeTrades || [];
                this.tradeHistory = data.tradeHistory || [];
                this.breakoutCoins = data.breakoutCoins || [];
            }
        } catch (error) {
            console.log('❌ خطأ في تحميل البيانات:', error);
        }
    }
    
    saveToStorage() {
        try {
            const data = {
                systemActive: this.systemActive,
                autoTradingActive: this.autoTradingActive,
                balance: this.balance,
                activeTrades: this.activeTrades,
                tradeHistory: this.tradeHistory,
                breakoutCoins: this.breakoutCoins,
                lastUpdate: new Date()
            };
            localStorage.setItem('trading_system_data', JSON.stringify(data));
        } catch (error) {
            console.log('❌ خطأ في حفظ البيانات:', error);
        }
    }
    
    setupUI() {
        // 1. أحداث التنقل بين الصفحات
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.switchPage(page);
                
                // تحديث الروابط النشطة
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
        
        // 2. زر تشغيل النظام الرئيسي
        document.getElementById('system-power-btn').addEventListener('click', () => {
            this.toggleSystem();
        });
        
        // 3. التبديل في صفحة الحساب
        document.getElementById('system-power-toggle').addEventListener('change', (e) => {
            this.toggleSystem(e.target.checked);
        });
        
        // 4. زر التداول الآلي
        document.getElementById('start-auto-trading').addEventListener('click', () => {
            this.toggleAutoTrading();
        });
        
        // 5. التبديل الآلي
        document.getElementById('auto-trading-toggle').addEventListener('change', (e) => {
            this.toggleAutoTrading(e.target.checked);
        });
        
        // 6. التداول اليدوي
        document.getElementById('manual-buy-btn').addEventListener('click', () => {
            this.executeManualTrade('BUY');
        });
        
        document.getElementById('manual-sell-btn').addEventListener('click', () => {
            this.executeManualTrade('SELL');
        });
        
        // 7. تحديث التحليل
        document.getElementById('refresh-analysis').addEventListener('click', () => {
            this.refreshAnalysis();
        });
        
        // 8. تحديث البيانات
        document.getElementById('refresh-data').addEventListener('click', () => {
            this.refreshAllData();
        });
        
        // 9. إعدادات API
        document.getElementById('save-api-keys').addEventListener('click', () => {
            this.saveApiKeys();
        });
        
        // 10. إعدادات الحماية
        document.getElementById('daily-loss-limit').addEventListener('input', (e) => {
            document.getElementById('loss-limit-value').textContent = `${e.target.value}%`;
        });
        
        document.getElementById('max-trade-size').addEventListener('input', (e) => {
            document.getElementById('trade-size-value').textContent = `${e.target.value}%`;
        });
    }
    
    setupCoins() {
        // قائمة العملات للتداول اليدوي
        const coins = [
            'ADAUSDT', 'ALGOUSDT', 'BTCUSDT', 'ETHUSDT', 
            'DOGEUSDT', 'XRPUSDT', 'DOTUSDT', 'LINKUSDT',
            'SOLUSDT', 'MATICUSDT', 'TWTUSDT', 'OGNUSDT',
            'ATOMUSDT', 'BNBUSDT', 'AVAXUSDT', 'UNIUSDT'
        ];
        
        const select = document.getElementById('manual-coin-select');
        if (select) {
            select.innerHTML = '<option value="">-- اختر العملة --</option>';
            coins.forEach(coin => {
                const option = document.createElement('option');
                option.value = coin;
                option.textContent = coin;
                select.appendChild(option);
            });
            
            // عند اختيار عملة، تحديث معلومات التداول
            select.addEventListener('change', () => {
                this.updateManualTradeInfo();
            });
        }
    }
    
    switchPage(page) {
        // إخفاء جميع الصفحات
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // إظهار الصفحة المطلوبة
        document.getElementById(page).classList.add('active');
    }
    
    toggleSystem(forceState = null) {
        if (forceState !== null) {
            this.systemActive = forceState;
        } else {
            this.systemActive = !this.systemActive;
        }
        
        if (this.systemActive) {
            this.systemStartTime = new Date();
            this.startUptimeCounter();
            this.startBackgroundUpdates();
            this.addSystemMessage('✅ تم تشغيل النظام بنجاح', 'success');
            this.showNotification('🚀 النظام يعمل الآن', 'success');
        } else {
            this.stopBackgroundUpdates();
            this.addSystemMessage('⏸️ تم إيقاف النظام', 'warning');
            this.showNotification('النظام متوقف', 'warning');
        }
        
        this.updateSystemStatus();
        this.updatePowerButton();
        this.saveToStorage();
    }
    
    toggleAutoTrading(forceState = null) {
        if (forceState !== null) {
            this.autoTradingActive = forceState;
        } else {
            this.autoTradingActive = !this.autoTradingActive;
        }
        
        if (this.autoTradingActive && this.systemActive) {
            this.startAutoTrading();
            this.addSystemMessage('🤖 تم تفعيل التداول الآلي', 'success');
            this.showNotification('التداول الآلي يعمل', 'success');
        } else if (!this.autoTradingActive) {
            this.addSystemMessage('🛑 تم إيقاف التداول الآلي', 'warning');
        }
        
        this.updateAutoTradingStatus();
        this.saveToStorage();
    }
    
    updateSystemStatus() {
        const indicator = document.getElementById('status-indicator');
        const statusText = document.getElementById('system-status-text');
        const systemState = document.getElementById('system-state');
        
        if (this.systemActive) {
            indicator.classList.add('active');
            indicator.classList.remove('inactive');
            statusText.textContent = 'النظام نشط';
            statusText.style.color = '#10b981';
            if (systemState) {
                systemState.textContent = 'نشط';
                systemState.style.color = '#10b981';
            }
        } else {
            indicator.classList.remove('active');
            indicator.classList.add('inactive');
            statusText.textContent = 'النظام متوقف';
            statusText.style.color = '#ef4444';
            if (systemState) {
                systemState.textContent = 'متوقف';
                systemState.style.color = '#ef4444';
            }
        }
    }
    
    updatePowerButton() {
        const powerBtn = document.getElementById('system-power-btn');
        const toggleSwitch = document.getElementById('system-power-toggle');
        
        if (powerBtn) {
            if (this.systemActive) {
                powerBtn.innerHTML = '<i class="fas fa-power-off"></i><span>إيقاف النظام</span>';
                powerBtn.classList.remove('system-inactive');
                powerBtn.classList.add('system-active');
            } else {
                powerBtn.innerHTML = '<i class="fas fa-power-off"></i><span>تشغيل النظام</span>';
                powerBtn.classList.remove('system-active');
                powerBtn.classList.add('system-inactive');
            }
        }
        
        if (toggleSwitch) {
            toggleSwitch.checked = this.systemActive;
        }
    }
    
    startUptimeCounter() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
        }
        
        this.uptimeInterval = setInterval(() => {
            if (this.systemActive && this.systemStartTime) {
                const now = new Date();
                const diff = now - this.systemStartTime;
                
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                const uptimeElement = document.getElementById('uptime');
                if (uptimeElement) {
                    uptimeElement.textContent = 
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
                
                const lastStartElement = document.getElementById('last-start');
                if (lastStartElement) {
                    lastStartElement.textContent = this.systemStartTime.toLocaleTimeString('ar-SA');
                }
            }
        }, 1000);
    }
    
    startBackgroundUpdates() {
        // 1. تحديث العملات للانفجار كل دقيقة
        if (this.breakoutUpdateInterval) {
            clearInterval(this.breakoutUpdateInterval);
        }
        
        this.breakoutUpdateInterval = setInterval(() => {
            if (this.systemActive) {
                this.updateBreakoutCoins();
                this.addSystemMessage('🔄 تم تحديث قائمة العملات للانفجار', 'info');
            }
        }, 60000); // كل دقيقة
        
        // 2. تحديث التداول اليدوي كل 5 ثواني
        if (this.manualTradeUpdateInterval) {
            clearInterval(this.manualTradeUpdateInterval);
        }
        
        this.manualTradeUpdateInterval = setInterval(() => {
            if (this.systemActive) {
                this.updateManualTradeInfo();
            }
        }, 5000); // كل 5 ثواني
        
        // 3. تحديث أولي
        this.updateBreakoutCoins();
        this.updateManualTradeInfo();
    }
    
    stopBackgroundUpdates() {
        if (this.breakoutUpdateInterval) {
            clearInterval(this.breakoutUpdateInterval);
            this.breakoutUpdateInterval = null;
        }
        
        if (this.manualTradeUpdateInterval) {
            clearInterval(this.manualTradeUpdateInterval);
            this.manualTradeUpdateInterval = null;
        }
        
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
            this.uptimeInterval = null;
        }
    }
    
    startAutoTrading() {
        if (!this.systemActive) {
            this.showNotification('⚠️ يرجى تشغيل النظام أولاً', 'error');
            return;
        }
        
        // محاكاة التداول الآلي
        this.simulateAutoTrading();
    }
    
    simulateAutoTrading() {
        if (!this.autoTradingActive || !this.systemActive) return;
        
        // تحديث حالة التداول الآلي
        this.updateAutoTradingStatus();
        
        // محاكاة صفقة تلقائية كل 30 ثانية
        setInterval(() => {
            if (this.autoTradingActive && this.systemActive) {
                this.executeAutoTrade();
            }
        }, 30000);
    }
    
    executeAutoTrade() {
        // عملات عشوائية للصفقات التلقائية
        const coins = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOGEUSDT', 'XRPUSDT'];
        const randomCoin = coins[Math.floor(Math.random() * coins.length)];
        const amount = parseFloat(document.getElementById('auto-trade-size').value) || 10;
        
        // محاكاة الصفقة
        const trade = {
            id: Date.now(),
            symbol: randomCoin,
            type: 'BUY',
            amount: amount,
            entryPrice: this.getCurrentPrice(randomCoin),
            timestamp: new Date(),
            status: 'ACTIVE',
            autoTrade: true
        };
        
        this.activeTrades.push(trade);
        this.updateActiveTradesUI();
        
        // محاكاة إغلاق الصفقة بعد 10 ثواني
        setTimeout(() => {
            const profit = amount * 0.02; // 2% ربح
            trade.exitPrice = trade.entryPrice * 1.02;
            trade.exitTime = new Date();
            trade.status = 'CLOSED';
            trade.profit = profit;
            
            this.balance += profit;
            this.tradeHistory.push(trade);
            this.activeTrades = this.activeTrades.filter(t => t.id !== trade.id);
            
            this.updateUI();
            this.showNotification(`✅ صفقة تلقائية: ${randomCoin} +${profit.toFixed(2)} USDT`, 'success');
            this.addSystemMessage(`تم إغلاق صفقة ${randomCoin} بربح ${profit.toFixed(2)} USDT`, 'success');
        }, 10000);
        
        this.showNotification(`🤖 فتح صفقة تلقائية على ${randomCoin}`, 'info');
    }
    
    updateBreakoutCoins() {
        if (!this.systemActive) return;
        
        // إظهار مؤشر التحديث
        const indicator = document.getElementById('breakout-update-indicator');
        if (indicator) {
            indicator.classList.add('breakout-updating');
        }
        
        // عملات عشوائية مع تحديثات
        this.breakoutCoins = [
            {
                symbol: 'TWTUSDT',
                currentPrice: (1.08 + Math.random() * 0.02).toFixed(4),
                breakoutScore: 85 + Math.floor(Math.random() * 15),
                signalStrength: 64 + Math.floor(Math.random() * 15),
                pattern: ['ماروبوزو', 'إنقلابي صعودي', 'شمعة بيضاء'][Math.floor(Math.random() * 3)],
                volumeSpike: Math.random() > 0.3
            },
            {
                symbol: 'OGNUSDT',
                currentPrice: (1.13 + Math.random() * 0.02).toFixed(4),
                breakoutScore: 78 + Math.floor(Math.random() * 15),
                signalStrength: 69 + Math.floor(Math.random() * 15),
                pattern: ['ماروبوزو', 'إنقلابي صعودي', 'شمعة بيضاء'][Math.floor(Math.random() * 3)],
                volumeSpike: Math.random() > 0.4
            },
            {
                symbol: 'ALGOUSDT',
                currentPrice: (1.11 + Math.random() * 0.02).toFixed(4),
                breakoutScore: 82 + Math.floor(Math.random() * 15),
                signalStrength: 89 + Math.floor(Math.random() * 10),
                pattern: ['ماروبوزو', 'إنقلابي صعودي', 'شمعة بيضاء'][Math.floor(Math.random() * 3)],
                volumeSpike: Math.random() > 0.5
            },
            {
                symbol: 'ADAUSDT',
                currentPrice: (0.48 + Math.random() * 0.02).toFixed(4),
                breakoutScore: 75 + Math.floor(Math.random() * 15),
                signalStrength: 72 + Math.floor(Math.random() * 15),
                pattern: ['ماروبوزو', 'إنقلابي صعودي', 'شمعة بيضاء'][Math.floor(Math.random() * 3)],
                volumeSpike: Math.random() > 0.3
            },
            {
                symbol: 'DOGEUSDT',
                currentPrice: (0.098 + Math.random() * 0.002).toFixed(4),
                breakoutScore: 90 + Math.floor(Math.random() * 10),
                signalStrength: 81 + Math.floor(Math.random() * 10),
                pattern: ['ماروبوزو', 'إنقلابي صعودي', 'شمعة بيضاء'][Math.floor(Math.random() * 3)],
                volumeSpike: Math.random() > 0.6
            }
        ];
        
        // تحديث العرض
        this.displayBreakoutCoins();
        
        // تحديث وقت آخر تحديث
        const updateTime = document.getElementById('last-update-time');
        if (updateTime) {
            updateTime.textContent = new Date().toLocaleTimeString('ar-SA');
        }
        
        // إخفاء مؤشر التحديث بعد ثانية
        setTimeout(() => {
            if (indicator) {
                indicator.classList.remove('breakout-updating');
            }
        }, 1000);
    }
    
    displayBreakoutCoins() {
        const container = document.getElementById('breakout-analysis');
        if (!container) return;
        
        container.innerHTML = this.breakoutCoins.map(coin => `
            <div class="breakout-item">
                <div class="breakout-header">
                    <h5>${coin.symbol}</h5>
                    <span class="price">${coin.currentPrice} USDT</span>
                </div>
                <div class="breakout-metrics">
                    <div class="metric">
                        <span class="metric-label">قوة الإشارة:</span>
                        <span class="metric-value ${coin.signalStrength > 80 ? 'high' : coin.signalStrength > 60 ? 'medium' : 'low'}">
                            ${coin.signalStrength}/100
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">درجة الانفجار:</span>
                        <span class="metric-value ${coin.breakoutScore > 80 ? 'high' : coin.breakoutScore > 60 ? 'medium' : 'low'}">
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
                        ${coin.volumeSpike ? 'ارتفاع الحجم' : 'حجم عادي'}
                    </span>
                </div>
                <div class="breakout-actions">
                    <button class="btn btn-sm btn-success" 
                            onclick="tradingSystem.executeTradeFromBreakout('${coin.symbol}', ${coin.currentPrice})">
                        <i class="fas fa-bolt"></i>
                        تنفيذ سريع
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    updateManualTradeInfo() {
        const selectedCoin = document.getElementById('manual-coin-select')?.value;
        if (!selectedCoin) return;
        
        // الحصول على السعر الحالي
        const currentPrice = this.getCurrentPrice(selectedCoin);
        
        // حساب مستويات التداول
        const entryPrice = (currentPrice * 0.998).toFixed(4); // دخول أقل بنسبة 0.2%
        const stopLoss = (currentPrice * 0.985).toFixed(4);   // وقف خسارة 1.5%
        const takeProfit1 = (currentPrice * 1.01).toFixed(4); // ربح 1%
        const takeProfit2 = (currentPrice * 1.02).toFixed(4); // ربح 2%
        const takeProfit3 = (currentPrice * 1.03).toFixed(4); // ربح 3%
        
        // التوقيت المناسب للتداول
        const tradingTime = this.getBestTradingTime();
        const currentTime = new Date().toLocaleTimeString('ar-SA');
        
        // تحديث العرض
        const container = document.getElementById('real-time-trade-info');
        if (!container) return;
        
        container.innerHTML = `
            <div class="trade-header">
                <h5><i class="fas fa-chart-line"></i> معلومات الصفقة في الوقت الحقيقي</h5>
                <span class="trade-time">${currentTime}</span>
            </div>
            <div class="trade-details">
                <div class="detail-item">
                    <span class="detail-label">العملة:</span>
                    <span class="detail-value">${selectedCoin}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">سعر السوق:</span>
                    <span class="detail-value price">${currentPrice.toFixed(4)} USDT</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">سعر الدخول:</span>
                    <span class="detail-value entry">${entryPrice} USDT</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">وقف الخسارة:</span>
                    <span class="detail-value stop-loss">${stopLoss} USDT</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">جني الربح 1:</span>
                    <span class="detail-value take-profit">${takeProfit1} USDT</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">جني الربح 2:</span>
                    <span class="detail-value take-profit">${takeProfit2} USDT</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">جني الربح 3:</span>
                    <span class="detail-value take-profit">${takeProfit3} USDT</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">التوقيت:</span>
                    <span class="detail-value">${tradingTime}</span>
                </div>
            </div>
        `;
    }
    
    executeManualTrade(type) {
        const selectedCoin = document.getElementById('manual-coin-select')?.value;
        const amount = parseFloat(document.getElementById('manual-trade-amount')?.value) || 10;
        
        if (!selectedCoin) {
            this.showNotification('⚠️ يرجى اختيار عملة', 'error');
            return;
        }
        
        if (!this.systemActive) {
            this.showNotification('⚠️ يرجى تشغيل النظام أولاً', 'error');
            return;
        }
        
        if (amount > this.balance) {
            this.showNotification('⚠️ الرصيد غير كافي', 'error');
            return;
        }
        
        const currentPrice = this.getCurrentPrice(selectedCoin);
        
        // إنشاء الصفقة
        const trade = {
            id: Date.now(),
            symbol: selectedCoin,
            type: type,
            amount: amount,
            entryPrice: currentPrice,
            timestamp: new Date(),
            status: 'ACTIVE',
            autoTrade: false
        };
        
        this.activeTrades.push(trade);
        this.balance -= amount;
        
        // محاكاة إغلاق الصفقة بعد 3 ثواني
        setTimeout(() => {
            const profit = amount * 0.015; // 1.5% ربح
            trade.exitPrice = currentPrice * 1.015;
            trade.exitTime = new Date();
            trade.status = 'CLOSED';
            trade.profit = profit;
            
            this.balance += amount + profit;
            this.tradeHistory.push(trade);
            this.activeTrades = this.activeTrades.filter(t => t.id !== trade.id);
            
            this.updateUI();
            this.showNotification(`✅ ${type === 'BUY' ? 'شراء' : 'بيع'} ${selectedCoin} بربح ${profit.toFixed(2)} USDT`, 'success');
            this.addSystemMessage(`تم إغلاق صفقة ${selectedCoin} بربح ${profit.toFixed(2)} USDT`, 'success');
        }, 3000);
        
        this.showNotification(`📊 جاري ${type === 'BUY' ? 'شراء' : 'بيع'} ${selectedCoin}...`, 'info');
        this.updateUI();
    }
    
    executeTradeFromBreakout(symbol, price) {
        document.getElementById('manual-coin-select').value = symbol;
        document.getElementById('manual-trade-amount').value = 10;
        this.updateManualTradeInfo();
        this.showNotification(`تم اختيار ${symbol} للتداول`, 'info');
    }
    
    getCurrentPrice(symbol) {
        // أسعار افتراضية للعملات
        const basePrices = {
            'BTCUSDT': 42000,
            'ETHUSDT': 2200,
            'ADAUSDT': 0.48,
            'DOGEUSDT': 0.098,
            'XRPUSDT': 0.62,
            'DOTUSDT': 7.5,
            'LINKUSDT': 14.2,
            'SOLUSDT': 95,
            'TWTUSDT': 1.08,
            'OGNUSDT': 1.13,
            'ALGOUSDT': 1.11,
            'ATOMUSDT': 8.5,
            'BNBUSDT': 300,
            'MATICUSDT': 0.75,
            'AVAXUSDT': 35,
            'UNIUSDT': 6.2
        };
        
        const base = basePrices[symbol] || 1.0;
        const change = (Math.random() - 0.5) * 0.01; // ±1%
        return base * (1 + change);
    }
    
    getBestTradingTime() {
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 11) return 'أفضل وقت للتداول';
        if (hour >= 14 && hour <= 16) return 'وقت جيد للتداول';
        if (hour >= 20 && hour <= 22) return 'وقت مناسب للتداول';
        return 'راقب السوق';
    }
    
    updateUI() {
        // تحديث الرصيد
        document.getElementById('current-balance').textContent = `${this.balance.toFixed(2)} USDT`;
        document.getElementById('trading-balance').textContent = `${this.balance.toFixed(2)} USDT`;
        
        // تحديث الصفقات النشطة
        document.getElementById('active-trades').textContent = this.activeTrades.length;
        document.getElementById('active-trades-count').textContent = this.activeTrades.length;
        
        // تحديث الصفقات الناجحة والخاسرة
        const successfulTrades = this.tradeHistory.filter(t => t.profit > 0).length;
        const failedTrades = this.tradeHistory.filter(t => t.profit <= 0).length;
        
        document.getElementById('successful-trades-count').textContent = successfulTrades;
        document.getElementById('failed-trades-count').textContent = failedTrades;
        
        // تحديث معدل النجاح
        const totalTrades = this.tradeHistory.length;
        const successRate = totalTrades > 0 ? (successfulTrades / totalTrades * 100).toFixed(1) : '0';
        document.getElementById('success-rate').textContent = `${successRate}%`;
        
        // تحديث الأرباح
        const totalProfit = this.tradeHistory.reduce((sum, trade) => sum + (trade.profit || 0), 0);
        document.getElementById('total-profit').textContent = `${totalProfit.toFixed(2)} USDT`;
        
        // تحديث الواجهات الأخرى
        this.updateActiveTradesUI();
        this.updateTradeHistoryUI();
        this.updateTopCoinsUI();
        this.updateGainersLosersUI();
    }
    
    updateActiveTradesUI() {
        const table = document.getElementById('active-trades-table');
        if (!table) return;
        
        table.innerHTML = this.activeTrades.map(trade => `
            <tr>
                <td>${trade.symbol}</td>
                <td>
                    <span class="badge ${trade.type === 'BUY' ? 'success' : 'danger'}">
                        ${trade.type === 'BUY' ? 'شراء' : 'بيع'}
                    </span>
                </td>
                <td>${trade.entryPrice.toFixed(4)}</td>
                <td>${trade.amount.toFixed(2)}</td>
                <td>${(trade.entryPrice * 0.985).toFixed(4)}</td>
                <td>
                    ${(trade.entryPrice * 1.01).toFixed(4)}<br>
                    ${(trade.entryPrice * 1.02).toFixed(4)}<br>
                    ${(trade.entryPrice * 1.03).toFixed(4)}
                </td>
                <td class="profit-positive">+1.5%</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="tradingSystem.closeTrade(${trade.id})">
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
                <div class="trade-item success">
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
                <div class="trade-item danger">
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
    
    updateTopCoinsUI() {
        // محاكاة أفضل العملات
        const topCoins = [
            { symbol: 'BTCUSDT', price: '42,150.50', change: '+1.2%', volume: '2.5B' },
            { symbol: 'ETHUSDT', price: '2,215.75', change: '+0.8%', volume: '1.8B' },
            { symbol: 'BNBUSDT', price: '305.20', change: '+2.1%', volume: '900M' }
        ];
        
        const container = document.getElementById('top-coins-container');
        if (container) {
            container.innerHTML = topCoins.map(coin => `
                <div class="coin-card">
                    <div class="coin-header">
                        <h4>${coin.symbol}</h4>
                        <div class="coin-price">${coin.price}</div>
                    </div>
                    <div class="coin-stats">
                        <div class="stat">
                            <span class="stat-label">التغير:</span>
                            <span class="stat-value ${coin.change.startsWith('+') ? 'profit-positive' : 'profit-negative'}">
                                ${coin.change}
                            </span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">الحجم:</span>
                            <span class="stat-value">${coin.volume}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    updateGainersLosersUI() {
        // محاكاة الرابحين والخاسرين
        const gainers = [
            { symbol: 'DOGEUSDT', change: '+12.5%', volume: '500M' },
            { symbol: 'SHIBUSDT', change: '+8.3%', volume: '300M' },
            { symbol: 'PEPEUSDT', change: '+6.7%', volume: '150M' }
        ];
        
        const losers = [
            { symbol: 'LTCUSDT', change: '-3.2%', volume: '200M' },
            { symbol: 'XLMUSDT', change: '-2.8%', volume: '120M' },
            { symbol: 'EOSUSDT', change: '-2.1%', volume: '90M' }
        ];
        
        const gainersTable = document.getElementById('gainers-table');
        const losersTable = document.getElementById('losers-table');
        
        if (gainersTable) {
            gainersTable.innerHTML = gainers.map((coin, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${coin.symbol}</td>
                    <td class="profit-positive">${coin.change}</td>
                    <td>${coin.volume}</td>
                </tr>
            `).join('');
        }
        
        if (losersTable) {
            losersTable.innerHTML = losers.map((coin, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${coin.symbol}</td>
                    <td class="profit-negative">${coin.change}</td>
                    <td>${coin.volume}</td>
                </tr>
            `).join('');
        }
    }
    
    updateAutoTradingStatus() {
        const toggle = document.getElementById('auto-trading-toggle');
        if (toggle) {
            toggle.checked = this.autoTradingActive;
        }
    }
    
    startUpdates() {
        // تحديث عام كل 30 ثانية
        setInterval(() => {
            if (this.systemActive) {
                this.updateUI();
            }
        }, 30000);
        
        // تحديث أولي
        this.updateUI();
    }
    
    refreshAnalysis() {
        this.updateBreakoutCoins();
        this.updateTopCoinsUI();
        this.updateGainersLosersUI();
        this.showNotification('🔄 تم تحديث التحليل', 'info');
    }
    
    refreshAllData() {
        this.updateUI();
        this.updateBreakoutCoins();
        this.updateManualTradeInfo();
        this.showNotification('🔄 تم تحديث جميع البيانات', 'success');
    }
    
    closeTrade(tradeId) {
        const trade = this.activeTrades.find(t => t.id === tradeId);
        if (trade) {
            const profit = trade.amount * 0.01; // 1% ربح
            trade.exitPrice = trade.entryPrice * 1.01;
            trade.exitTime = new Date();
            trade.status = 'CLOSED';
            trade.profit = profit;
            
            this.balance += trade.amount + profit;
            this.tradeHistory.push(trade);
            this.activeTrades = this.activeTrades.filter(t => t.id !== tradeId);
            
            this.updateUI();
            this.showNotification(`✅ تم إغلاق صفقة ${trade.symbol} بربح ${profit.toFixed(2)} USDT`, 'success');
        }
    }
    
    saveApiKeys() {
        const apiKey = document.getElementById('api-key').value;
        const apiSecret = document.getElementById('api-secret').value;
        
        if (apiKey && apiSecret) {
            this.showNotification('✅ تم حفظ مفاتيح API', 'success');
            this.addSystemMessage('تم حفظ إعدادات API بنجاح', 'success');
        } else {
            this.showNotification('⚠️ يرجى إدخال المفاتيح', 'error');
        }
    }
    
    addSystemMessage(message, type = 'info') {
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
        
        // تحديد عدد الرسائل
        const messages = container.querySelectorAll('.message-item');
        if (messages.length > 10) {
            messages[messages.length - 1].remove();
        }
    }
    
    showNotification(message, type = 'info') {
        // استخدام Toastify إذا كان متاحاً
        if (typeof Toastify === 'function') {
            Toastify({
                text: message,
                duration: 5000,
                gravity: "top",
                position: "right",
                backgroundColor: type === 'success' ? '#10b981' : 
                              type === 'error' ? '#ef4444' : 
                              type === 'warning' ? '#f59e0b' : '#3b82f6',
                stopOnFocus: true,
                className: `toast-${type}`,
                callback: function() {}
            }).showToast();
        } else {
            // إشعار مخصص
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : 
                                  type === 'error' ? 'exclamation-circle' : 
                                  'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#10b981' : 
                             type === 'error' ? '#ef4444' : 
                             type === 'warning' ? '#f59e0b' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
}

// ============================================
// بدء النظام عند تحميل الصفحة
// ============================================

let tradingSystem;

window.addEventListener('load', () => {
    // إنشاء نظام التداول
    tradingSystem = new TradingSystem();
    window.tradingSystem = tradingSystem;
    
    // إضافة أنماط CSS ديناميكية
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .system-active {
            background: linear-gradient(135deg, #10b981, #059669) !important;
            color: white !important;
        }
        
        .system-inactive {
            background: linear-gradient(135deg, #6b7280, #4b5563) !important;
            color: white !important;
        }
        
        .breakout-updating {
            animation: pulse 1s infinite;
            color: #f59e0b;
        }
        
        .success-header {
            border-bottom: 3px solid #10b981 !important;
        }
        
        .danger-header {
            border-bottom: 3px solid #ef4444 !important;
        }
        
        .badge.success {
            background: #10b981 !important;
        }
        
        .badge.danger {
            background: #ef4444 !important;
        }
    `;
    document.head.appendChild(style);
    
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
    
    console.log('✅ تم تحميل نظام التداول بنجاح');
});
