"use client";

import { useState, useEffect } from 'react';
import { isThisMonth, parseISO } from 'date-fns';
import { createClient } from '../utils/supabase/client';

// Components
import Home from '../components/Home';
import AddExpense from '../components/AddExpense';
import History from '../components/History';
import Reports from '../components/Reports';
import BottomNav from '../components/BottomNav';
import Settings from '../components/Settings';
import Dialog from '../components/Dialog';
import SplashScreen from '../components/SplashScreen';

function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
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

  const supabase = createClient();

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

      const fetchExpenses = async () => {
        const startTime = Date.now();
        
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('telegram_user_id', uid)
          .eq('telegram_chat_id', cid)
          .order('date', { ascending: false });
        
        if (data) {
          setExpenses(data);
        }

        // Fetch user settings
        const { data: settingsData } = await supabase
          .from('user_settings')
          .select('*')
          .eq('telegram_chat_id', cid)
          .single();
        
        if (settingsData) {
          setNotificationSettings({
            budget_alerts: settingsData.budget_alerts,
            report_frequency: settingsData.report_frequency
          });
        }

        // Guarantee splash screen shows for at least 1.5 seconds
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1500;
        if (elapsedTime < minLoadingTime) {
          setTimeout(() => setIsInitialLoading(false), minLoadingTime - elapsedTime);
        } else {
          setIsInitialLoading(false);
        }
      };
      
      fetchExpenses();

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

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select();

    if (data && data.length > 0) {
      setExpenses([data[0], ...expenses]);
    } else if (error) {
      console.error(error);
      setDialogConfig({ type: 'alert', message: "Failed to save to cloud", onConfirm: () => {} });
    }
    
    setShowAddModal(false);
  };

  const handleUpdateExpense = async (updatedExpense) => {
    const { id, ...updates } = updatedExpense;
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select();

    if (data && data.length > 0) {
      setExpenses(expenses.map(e => e.id === id ? data[0] : e));
    }
    setEditingExpense(null);
  };

  const handleDeleteExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(expenses.filter(e => e.id !== id));
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

      const { data, error } = await supabase
        .from('expenses')
        .insert(imports)
        .select();

      if (error) {
        console.error('Supabase import error:', error);
        setDialogConfig({ type: 'alert', message: `Import failed: ${error.message}`, onConfirm: () => {} });
        return false;
      }

      if (data) {
        setExpenses([...data, ...expenses]);
        return true;
      }
    } catch (err) {
      console.error('Import exception:', err);
      setDialogConfig({ type: 'alert', message: `Import error: ${err.message}`, onConfirm: () => {} });
      return false;
    }
  };

  const handleWipeData = async () => {
    await supabase.from('expenses')
      .delete()
      .eq('telegram_user_id', telegramUserId)
      .eq('telegram_chat_id', telegramChatId);
      
    setExpenses([]);
    setSpendLimit('');
    setCustomCategories([]);
    localStorage.removeItem(`${storageKey}_limit`);
    localStorage.removeItem(`${storageKey}_categories`);
  };

  const handleUpdateNotificationSettings = async (newSettings) => {
    setNotificationSettings(newSettings);
    if (telegramChatId !== 'direct' && telegramChatId !== 'private') {
      await supabase.from('user_settings').upsert({
        telegram_chat_id: telegramChatId,
        budget_alerts: newSettings.budget_alerts,
        report_frequency: newSettings.report_frequency
      });
    }
  };

  const renderContent = () => {
    if (isInitialLoading) {
      return <SplashScreen />;
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
