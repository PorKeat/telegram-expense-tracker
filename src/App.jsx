import { useState, useEffect } from 'react';
import { isThisMonth, parseISO } from 'date-fns';
import './index.css';

// Components
import Home from './components/Home';
import AddExpense from './components/AddExpense';
import History from './components/History';
import Reports from './components/Reports';
import BottomNav from './components/BottomNav';
import Settings from './components/Settings';

function App() {
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

  const defaultCategories = [
    { name: 'Food & Drink', iconType: 'lucide' },
    { name: 'Shopping', iconType: 'lucide' },
    { name: 'Transport', iconType: 'lucide' },
    { name: 'Housing', iconType: 'lucide' },
    { name: 'Utilities', iconType: 'lucide' },
    { name: 'Other', iconType: 'lucide' }
  ];

  const allCategories = [...defaultCategories, ...customCategories];

  // Load from localStorage on mount and initialize Telegram
  useEffect(() => {
    let dynamicKey = 'spendly_expenses';

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand(); // Expands the mini app to full height

      const initData = window.Telegram.WebApp.initDataUnsafe || {};
      const userId = initData.user?.id;
      const chatId = initData.chat?.id;

      if (userId || chatId) {
        dynamicKey = `spendly_expenses_${userId || 'private'}_${chatId || 'direct'}`;
      }
    }
    
        setStorageKey(dynamicKey);

    const savedExpenses = localStorage.getItem(dynamicKey);
    if (savedExpenses) {
      try {
        setExpenses(JSON.parse(savedExpenses));
      } catch (e) {
        console.error("Failed to parse expenses");
      }
    } else {
      // Data Migration check: If they have old generic data, move it to their specific namespace
      const oldExpenses = localStorage.getItem('spendly_expenses');
      if (oldExpenses && dynamicKey !== 'spendly_expenses') {
        try {
          const parsed = JSON.parse(oldExpenses);
          setExpenses(parsed);
          localStorage.setItem(dynamicKey, oldExpenses);
        } catch (e) {
          console.error("Failed to migrate expenses");
        }
      } else {
        // Mock data for initial preview
        const mockData = [
          { id: 1, item: 'Coffee', quantity: 2, price: 4.5, total: 9, category: 'Food & Drink', date: new Date().toISOString() },
          { id: 2, item: 'Taxi', quantity: 1, price: 15, total: 15, category: 'Transport', date: new Date(Date.now() - 86400000).toISOString() },
        ];
        setExpenses(mockData);
        localStorage.setItem(dynamicKey, JSON.stringify(mockData));
      }
    }

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
  }, []);

  // Sync state to DOM and localStorage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(expenses));
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

  const handleAddExpense = (expense) => {
    const limit = parseFloat(spendLimit);
    if (limit > 0) {
      // Calculate current month's total
      const currentMonthTotal = expenses
        .filter(e => isThisMonth(parseISO(e.date)))
        .reduce((sum, e) => sum + e.total, 0);
      
      const newTotal = currentMonthTotal + expense.total;
      
      if (newTotal > limit) {
        const message = `⚠️ Budget Warning! This expense brings your monthly total to ${currency}${(newTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}, exceeding your limit of ${currency}${(limit * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}.`;
        try {
          if (window.Telegram?.WebApp?.initData) {
            window.Telegram.WebApp.showAlert(message);
          } else {
            alert(message);
          }
        } catch (error) {
          alert(message);
        }
      }
    }

    setExpenses([expense, ...expenses]);
    setShowAddModal(false);
  };

  const handleUpdateExpense = (updatedExpense) => {
    setExpenses(expenses.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleImportData = (newExpenses) => {
    // Merge without duplicating IDs
    const currentMaxId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) : Date.now();
    const imported = newExpenses.map((exp, index) => ({
      ...exp,
      id: currentMaxId + index + 1
    }));
    setExpenses([...imported, ...expenses]);
  };

  const handleWipeData = () => {
    setExpenses([]);
    setSpendLimit('');
    setCustomCategories([]);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_limit`);
    localStorage.removeItem(`${storageKey}_categories`);
  };

  const renderContent = () => {
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
               />;
      default:
        return <Home expenses={expenses} currency={currency} exchangeRate={exchangeRate} spendLimit={spendLimit} allCategories={allCategories} />;
    }
  };

  return (
    <>
      {renderContent()}
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {showAddModal && (
        <AddExpense 
          onClose={() => setShowAddModal(false)} 
          onSave={handleAddExpense}
          currency={currency}
          exchangeRate={exchangeRate}
          allCategories={allCategories}
        />
      )}

      {editingExpense && (
        <AddExpense 
          initialData={editingExpense}
          onClose={() => setEditingExpense(null)} 
          onSave={handleUpdateExpense}
          currency={currency}
          exchangeRate={exchangeRate}
          allCategories={allCategories}
        />
      )}
      
      {/* Floating Action Button */}
      {(!showAddModal && !editingExpense) && (
        <button 
          className="fab" 
          onClick={() => setShowAddModal(true)}
          aria-label="Add Expense"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      )}
    </>
  );
}

export default App;
