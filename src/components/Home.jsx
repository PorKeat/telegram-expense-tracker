import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { Coffee, ShoppingBag, Car, Home as HomeIcon, Zap, MoreHorizontal, AlertTriangle } from 'lucide-react';

export default function Home({ expenses, currency, exchangeRate, spendLimit, allCategories = [] }) {
  // Calculations
  const todayTotal = expenses
    .filter(e => isToday(parseISO(e.date)))
    .reduce((sum, e) => sum + e.total, 0);

  const weekTotal = expenses
    .filter(e => isThisWeek(parseISO(e.date)))
    .reduce((sum, e) => sum + e.total, 0);

  const monthTotal = expenses
    .filter(e => isThisMonth(parseISO(e.date)))
    .reduce((sum, e) => sum + e.total, 0);

  const limit = parseFloat(spendLimit) || 0;
  const progressPercent = limit > 0 ? Math.min((monthTotal / limit) * 100, 100) : 0;
  const isOverLimit = limit > 0 && monthTotal > limit;

  const recentExpenses = expenses.slice(0, 5);

  const getIcon = (category) => {
    const customCat = allCategories.find(c => c.name === category && c.isCustom);
    if (customCat) {
      return <span style={{ fontSize: '24px' }}>{customCat.icon}</span>;
    }

    switch(category) {
      case 'Food & Drink': return <Coffee size={24} />;
      case 'Shopping': return <ShoppingBag size={24} />;
      case 'Transport': return <Car size={24} />;
      case 'Housing': return <HomeIcon size={24} />;
      case 'Utilities': return <Zap size={24} />;
      default: return <MoreHorizontal size={24} />;
    }
  };

  return (
    <div className="app-content">
      <div className="header flex-row space-between" style={{ paddingTop: '20px' }}>
        <h2>Dashboard</h2>
        <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'var(--surface-color-elevated)' }} />
      </div>

      <div className="glass-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <p className="text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 600 }}>Total Balance</p>
        <h1 style={{ fontSize: '48px', margin: '8px 0', color: 'var(--text-primary)', fontWeight: 300, letterSpacing: '-2px' }}>
          {currency}{(todayTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </h1>
        
        <div className="flex-row gap-md" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
          <div className="flex-col" style={{ flex: 1 }}>
            <p className="text-tiny">This Week</p>
            <h3 style={{ marginTop: '6px', fontSize: '20px', fontWeight: 400, color: 'var(--text-primary)' }}>{currency}{(weekTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
          </div>
          <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--surface-border)' }}></div>
          <div className="flex-col" style={{ flex: 1 }}>
            <p className="text-tiny">This Month</p>
            <h3 style={{ marginTop: '4px', color: isOverLimit ? 'var(--danger-color)' : 'inherit' }}>
              {currency}{(monthTotal * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </h3>
          </div>
        </div>

        {limit > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div className="flex-row space-between" style={{ marginBottom: '12px' }}>
              <span className="text-tiny">Monthly Budget</span>
              <span className="text-tiny" style={{ color: isOverLimit ? 'var(--danger-color)' : 'inherit', fontWeight: isOverLimit ? 700 : 500 }}>
                {progressPercent.toFixed(0)}% of {currency}{(limit * exchangeRate).toLocaleString()}
              </span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--surface-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progressPercent}%`, 
                  backgroundColor: isOverLimit ? 'var(--danger-color)' : 'var(--primary-color)',
                  boxShadow: '0 0 10px var(--primary-glow)',
                  transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), background-color 0.3s ease'
                }} 
              />
            </div>
            {isOverLimit && (
              <div className="flex-row" style={{ marginTop: '12px', gap: '8px', color: 'var(--bg-color)', backgroundColor: 'var(--danger-color)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Limit Exceeded by {currency}{((monthTotal - limit) * exchangeRate).toLocaleString()}!</span>
              </div>
            )}
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: 'var(--spacing-md)', paddingLeft: '4px', fontWeight: 500, letterSpacing: '0.5px' }}>Recent Activity</h3>
      <div className="glass-card" style={{ padding: '0 var(--spacing-md)' }}>
        {recentExpenses.length === 0 ? (
          <p className="text-secondary" style={{ padding: 'var(--spacing-lg) 0', textAlign: 'center' }}>No expenses yet.</p>
        ) : (
          recentExpenses.map(expense => (
            <div key={expense.id} className="expense-item">
              <div className="flex-row gap-md">
                <div className="expense-icon">
                  {getIcon(expense.category)}
                </div>
                <div className="flex-col">
                  <h3 style={{ fontSize: '16px' }}>{expense.item}</h3>
                  <p className="text-small">{expense.category}</p>
                </div>
              </div>
              <div className="flex-col" style={{ alignItems: 'flex-end' }}>
                <h3 style={{ fontSize: '16px' }}>-{currency}{(expense.total * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h3>
                <p className="text-small">{format(parseISO(expense.date), 'MMM d')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
