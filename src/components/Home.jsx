import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { AlertTriangle } from 'lucide-react';

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
    const cat = allCategories.find(c => c.name === category);
    return <span style={{ fontSize: '24px' }}>{cat ? cat.icon : '📦'}</span>;
  };

  return (
    <div className="app-content">
      <div className="header flex-row space-between" style={{ paddingTop: '20px' }}>
        <h2>Dashboard</h2>
      </div>

      <div className="glass-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
        <p className="text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px', fontWeight: 600 }}>Today's Spend</p>
        <h1 style={{ fontSize: '48px', margin: '8px 0', color: 'var(--text-primary)', fontWeight: 300, letterSpacing: '-2px' }}>
          {currency}{(todayTotal * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}
        </h1>
        
        <div className="flex-row gap-md" style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--surface-border)' }}>
          <div className="flex-col" style={{ flex: 1 }}>
            <p className="text-tiny">This Week</p>
            <h3 style={{ marginTop: '6px', fontSize: '20px', fontWeight: 400, color: 'var(--text-primary)' }}>{currency}{(weekTotal * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}</h3>
          </div>
          <div style={{ width: '1px', height: '40px', backgroundColor: 'var(--surface-border)' }}></div>
          <div className="flex-col" style={{ flex: 1 }}>
            <p className="text-tiny">This Month</p>
            <h3 style={{ marginTop: '4px', color: isOverLimit ? 'var(--danger-color)' : 'inherit' }}>
              {currency}{(monthTotal * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}
            </h3>
          </div>
        </div>

        {limit > 0 && (
          <div style={{ marginTop: '32px' }}>
            <div className="flex-row space-between" style={{ marginBottom: '12px' }}>
              <span className="text-tiny">Monthly Budget</span>
              <span className="text-tiny" style={{ color: isOverLimit ? 'var(--danger-color)' : 'inherit', fontWeight: isOverLimit ? 700 : 500 }}>
                {progressPercent.toFixed(0)}% of {currency}{(limit * exchangeRate).toLocaleString(undefined, currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0})}
              </span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${progressPercent}%`, 
                  background: isOverLimit ? 'linear-gradient(135deg, #ff8a8a, var(--danger-color))' : 'var(--primary-gradient)',
                  boxShadow: '0 0 15px var(--primary-glow)',
                  transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s ease'
                }} 
              />
            </div>
            {isOverLimit && (
              <div className="flex-row" style={{ marginTop: '12px', gap: '8px', color: '#fff', background: 'linear-gradient(135deg, rgba(217, 56, 56, 0.9), rgba(153, 34, 34, 0.9))', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 15px rgba(217,56,56,0.3)' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: '12px', fontWeight: 600 }}>Limit Exceeded by {currency}{((monthTotal - limit) * exchangeRate).toLocaleString(undefined, currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0})}!</span>
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
                <h3 style={{ fontSize: '16px' }}>-{currency}{(expense.total * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}</h3>
                <p className="text-small">{format(parseISO(expense.date), 'MMM d')}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
