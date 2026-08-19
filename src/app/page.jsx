"use client";

import { useState, useEffect } from 'react';
import { isThisMonth, parseISO } from 'date-fns';


// Components
import Home from '../components/Home';
import AddExpense from '../components/AddExpense';
import History from '../components/History';
import Reports from '../components/Reports';
import BottomNav from '../components/BottomNav';
import Settings from '../components/Settings';
import Subscriptions from '../components/Subscriptions';
import Dialog from '../components/Dialog';
import SplashScreen from '../components/SplashScreen';

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [currency, setCurrency] = useState('$');
  const [theme, setTheme] = useState('dark');
  const [customExchangeRate, setCustomExchangeRate] = useState(4000);
  const [storageKey, setStorageKey] = useState('spendly_expenses');
  const [spendLimit, setSpendLimit] = useState('');
  const [customCategories, setCustomCategories] = useState([]);
  const [dialogConfig, setDialogConfig] = useState(null);
  
  const [telegramUserId, setTelegramUserId] = useState('private');
  const [telegramChatId, setTelegramChatId] = useState('direct');
  const [notificationSettings, setNotificationSettings] = useState({ budget_alerts: true, report_frequency: 'weekly' });

  const [initData, setInitData] = useState('');

  const defaultCategories = [
    { name: 'Food & Drink', icon: '☕' },
    { name: 'Shopping', icon: '🛍️' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Housing', icon: '🏠' },
    { name: 'Utilities', icon: '⚡' },
    { name: 'Other', icon: '📦' }
  ];

  const allCategories = [...defaultCategories, ...customCategories];

  // Load from Supabase on mount and initialize Telegram
  useEffect(() => {
    const initializeApp = () => {
      let dynamicKey = 'spendly_expenses';
      let uid = 'private';
      let cid = 'direct';

      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {

        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        const iData = window.Telegram.WebApp.initData || '';
        setInitData(iData);


        try {
          if (window.Telegram.WebApp.requestWriteAccess && !localStorage.getItem('telegram_write_access_requested')) {
            window.Telegram.WebApp.requestWriteAccess();
            localStorage.setItem('telegram_write_access_requested', 'true');
          }
        } catch(e) {}

        const initData = window.Telegram.WebApp.initDataUnsafe || {};
        if (initData.user?.id) uid = initData.user.id.toString();
        if (initData.chat?.id) cid = initData.chat.id.toString();

        if (uid !== 'private' || cid !== 'direct') {
          dynamicKey = `spendly_expenses_${uid}_${cid}`;
        }
      }
      
      setTelegramUserId(uid);
      setTelegramChatId(cid);
      setStorageKey(dynamicKey);


const fetchExpenses = async (currentInitData) => {
        const startTime = Date.now();
        
        // 1. Instantly load cached offline expenses
        const cached = localStorage.getItem(`${dynamicKey}_cached_expenses`);
        if (cached) {
          try { setExpenses(JSON.parse(cached)); } catch(_e) {}
        }

        // 2. Fetch from secure API
        if (currentInitData) {
          try {
            const res = await fetch('/api/expenses', {
              headers: { 'Authorization': `Bearer ${currentInitData}` }
            });
            if (res.ok) {
              const { data } = await res.json();
              if (data) setExpenses(data);
            }
            
            const settingsRes = await fetch(`/api/settings?chat_id=${cid}`, {
              headers: { 'Authorization': `Bearer ${currentInitData}` }
            });
            if (settingsRes.ok) {
              const { data: settingsData } = await settingsRes.json();
              if (settingsData) {
                setNotificationSettings({
                  budget_alerts: settingsData.budget_alerts,
                  report_frequency: settingsData.report_frequency
                });
              }
            }
          } catch (_err) {
            console.error("Fetch failed (offline or error)");
          }
        }

        // Guarantee splash screen shows for a smooth duration, then trigger fade out
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 900;
        
        const finishLoading = () => {
          setIsFadingOut(true);
          setTimeout(() => setIsInitialLoading(false), 300); // Wait for fade out animation
        };

        if (elapsedTime < minLoadingTime) {
          setTimeout(finishLoading, minLoadingTime - elapsedTime);
        } else {
          finishLoading();
        }
      };
      
      fetchExpenses(window.Telegram?.WebApp?.initData || '');

      const savedCurrency = localStorage.getItem('spendly_currency');
      if (savedCurrency) setCurrency(savedCurrency);

      const savedTheme = localStorage.getItem('spendly_theme');
      if (savedTheme) setTheme(savedTheme);

      const savedRate = localStorage.getItem('spendly_exchange_rate');
      if (savedRate) setCustomExchangeRate(parseFloat(savedRate));

      const savedLimit = localStorage.getItem(`${dynamicKey}_limit`);
      if (savedLimit) setSpendLimit(savedLimit);

      const savedCats = localStorage.getItem(`${dynamicKey}_categories`);
      if (savedCats) {
        try {
          setCustomCategories(JSON.parse(savedCats));
        } catch(e) {}
      }

      // Cleanup legacy inline styles from previous versions
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--primary-glow');
    };

    // Small delay to ensure Telegram SDK has fully parsed the URL hash
    const timer = setTimeout(initializeApp, 150);
    return () => clearTimeout(timer);
  }, []);

  // Sync state to DOM and localStorage
  // Expenses are synced to Supabase directly, so we no longer save them to localStorage here.


  useEffect(() => {
    if (expenses.length > 0 && storageKey) {
      localStorage.setItem(`${storageKey}_cached_expenses`, JSON.stringify(expenses));
    }
  }, [expenses, storageKey]);

  useEffect(() => {
    localStorage.setItem('spendly_currency', currency);

  }, [currency]);

  useEffect(() => {
    localStorage.setItem('spendly_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('spendly_exchange_rate', customExchangeRate);
  }, [customExchangeRate]);

  useEffect(() => {
    if (spendLimit) {
      localStorage.setItem(`${storageKey}_limit`, spendLimit);
    } else {
      localStorage.removeItem(`${storageKey}_limit`);
    }
  }, [spendLimit, storageKey]);

  useEffect(() => {
    localStorage.setItem(`${storageKey}_categories`, JSON.stringify(customCategories));
  }, [customCategories, storageKey]);

  const exchangeRate = currency === '៛' ? customExchangeRate : 1;

  const handleAddExpense = async (expense) => {
    const limit = parseFloat(spendLimit);
    if (limit > 0) {
      // Calculate current month's total
      const currentMonthTotal = expenses
        .filter(e => isThisMonth(parseISO(e.date)))
        .reduce((sum, e) => sum + e.total, 0);
      
      const newTotal = currentMonthTotal + expense.total;
      
      if (newTotal > limit) {
        const message = `⚠️ Budget Warning! This expense brings your monthly total to ${currency}${(newTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}, exceeding your limit of ${currency}${(limit * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}.`;
        
        // Send a direct Telegram Bot Message if connected
        if (notificationSettings.budget_alerts && telegramUserId !== 'private' && telegramUserId !== 'null') {
          const formattedMessage = `🚨 <b>BUDGET EXCEEDED</b>\n━━━━━━━━━━━━━━━\n• <b>Item:</b> ${expense.item}\n• <b>Cost:</b> ${currency}${(expense.total * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}\n• <b>Current Total:</b> ${currency}${(newTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}\n• <b>Monthly Limit:</b> ${currency}${(limit * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}\n━━━━━━━━━━━━━━━\n⚠️ <i>You are ${currency}${((newTotal - limit) * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})} over budget!</i>`;
          
          fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramUserId,
              text: formattedMessage
            })
          }).catch(console.error);
        }

        try {
          if (window.Telegram?.WebApp?.showAlert) {
            window.Telegram.WebApp.showAlert(message);
          } else {
            setDialogConfig({ type: 'alert', message, onConfirm: () => {} });
          }
        } catch(e) {
          setDialogConfig({ type: 'alert', message, onConfirm: () => {} });
        }
      }
    }

    const newExpense = {
      ...expense,
      telegram_user_id: telegramUserId,
      telegram_chat_id: telegramChatId
    };
    

    // Let Supabase generate the ID if it's a new UUID table
    if (typeof newExpense.id === 'number') {
      delete newExpense.id;
    }

try {
      if (!navigator.onLine) throw new Error("Offline");

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${initData}`
        },
        body: JSON.stringify(newExpense)
      });
      
      if (!res.ok) throw new Error("Failed to save to cloud");
      
      const { data } = await res.json();
      if (data && data.length > 0) {
        setExpenses([data[0], ...expenses]);
      }
    } catch (_err) {
      console.log("Saving offline...");
      newExpense.id = Date.now(); // Temp offline ID
      newExpense.is_offline = true;
      setExpenses([newExpense, ...expenses]);
      setDialogConfig({ type: 'alert', message: "You are offline. Expense saved locally and will sync when you reconnect.", onConfirm: () => {} });
    }

    
    setShowAddModal(false);
  };

const handleUpdateExpense = async (updatedExpense) => {
    const { id, ...updates } = updatedExpense;
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${initData}`
        },
        body: JSON.stringify(updatedExpense) // send full object with ID
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data && data.length > 0) {
          setExpenses(expenses.map(e => e.id === id ? data[0] : e));
        }
      }
    } catch (err) {
      console.error(err);
    }
    setEditingExpense(null);
  };

const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`/api/expenses?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${initData}` }
      });
      if (res.ok) {
        setExpenses(expenses.filter(e => e.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

const handleImportData = async (newExpenses) => {
    try {
      const imports = newExpenses.map(exp => {
        const newExp = {
          ...exp,
          telegram_user_id: telegramUserId,
          telegram_chat_id: telegramChatId
        };
        if (typeof newExp.id === 'number') delete newExp.id;
        return newExp;
      });

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${initData}`
        },
        body: JSON.stringify(imports)
      });

      if (!res.ok) {
        const err = await res.json();
        setDialogConfig({ type: 'alert', message: `Import failed: ${err.error}`, onConfirm: () => {} });
        return false;
      }

      const { data } = await res.json();
      if (data) {
        setExpenses([...data, ...expenses]);
        return true;
      }
    } catch (err) {
      console.error('Import exception:', err);
      return false;
    }
  };

const handleWipeData = async () => {
    try {
      const res = await fetch('/api/wipe', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${initData}` }
      });
      if (res.ok) {
        setExpenses([]);
        setSpendLimit('');
        setCustomCategories([]);
        localStorage.removeItem(`${storageKey}_limit`);
        localStorage.removeItem(`${storageKey}_categories`);
      }
    } catch (err) {
      console.error(err);
    }
  };

const handleUpdateNotificationSettings = async (newSettings) => {
    setNotificationSettings(newSettings);
    if (telegramChatId !== 'direct' && telegramChatId !== 'private') {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${initData}`
          },
          body: JSON.stringify({
            chat_id: telegramChatId,
            ...newSettings
          })
        });
      } catch (err) {
        console.error(err);
      }
    }
  };


// Offline Sync Queue Listener
  useEffect(() => {
    const syncOffline = async () => {
      const offlineItems = expenses.filter(e => e.is_offline);
      if (offlineItems.length === 0 || !initData) return;

      console.log("Syncing offline items...", offlineItems);
      const itemsToSync = offlineItems.map(item => {
        const { id: _id, is_offline: _is_offline, ...rest } = item; // Remove temp ID and flag
        return rest;
      });

      try {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${initData}`
          },
          body: JSON.stringify(itemsToSync)
        });
        
        if (res.ok) {
          const { data } = await res.json();
          if (data) {
            // Replace offline items with synced items from DB
            setExpenses(prev => {
              const onlineItems = prev.filter(e => !e.is_offline);
              return [...data, ...onlineItems].sort((a, b) => new Date(b.date) - new Date(a.date));
            });
          }
        }
      } catch (err) {
        console.error("Sync failed", err);
      }
    };

    window.addEventListener('online', syncOffline);
    return () => window.removeEventListener('online', syncOffline);
  }, [expenses, initData]);

  const renderContent = () => {

    if (isInitialLoading) {
      return <SplashScreen isFadingOut={isFadingOut} />;
    }

    switch (activeTab) {
      case 'home':
        return <Home expenses={expenses} currency={currency} exchangeRate={exchangeRate} spendLimit={spendLimit} allCategories={allCategories} />;
      case 'history':
        return <History 
                  expenses={expenses} 
                  currency={currency}
                  exchangeRate={exchangeRate}
                  onEdit={(expense) => setEditingExpense(expense)}
                  onDelete={handleDeleteExpense} 
                  allCategories={allCategories}
               />;
      case 'reports':
        return <Reports expenses={expenses} currency={currency} exchangeRate={exchangeRate} allCategories={allCategories} />;
      case 'settings':
        return <Settings 
                  currency={currency} 
                  setCurrency={setCurrency} 
                  customExchangeRate={customExchangeRate}
                  setCustomExchangeRate={setCustomExchangeRate}
                  spendLimit={spendLimit}
                  setSpendLimit={setSpendLimit}
                  customCategories={customCategories}
                  setCustomCategories={setCustomCategories}
                  theme={theme}
                  setTheme={setTheme}
                  expenses={expenses} 
                  onWipeData={handleWipeData} 
                  onImportData={handleImportData}
                  setDialogConfig={setDialogConfig}
                  notificationSettings={notificationSettings}
                  setNotificationSettings={handleUpdateNotificationSettings}
               />;
      default:
        return <Home expenses={expenses} currency={currency} exchangeRate={exchangeRate} spendLimit={spendLimit} allCategories={allCategories} />;
    }
  };

  return (
    <>
      {isInitialLoading && <SplashScreen isFadingOut={isFadingOut} />}
      
      <div key={activeTab} className="page-transition">
        {renderContent()}
      </div>
      
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onAddClick={() => setShowAddModal(true)}
        hideAdd={showAddModal || editingExpense}
      />
      
      {showAddModal && (
        <AddExpense 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddExpense}
          globalCurrency={currency}
          customExchangeRate={customExchangeRate}
          allCategories={allCategories}
        />
      )}

      {editingExpense && (
        <AddExpense 
          initialData={editingExpense}
          onClose={() => setEditingExpense(null)} 
          onSave={handleUpdateExpense}
          globalCurrency={currency}
          customExchangeRate={customExchangeRate}
          allCategories={allCategories}
        />
      )}
      

      
      <Dialog config={dialogConfig} onClose={() => setDialogConfig(null)} />
    </>
  );
}

export default App;
