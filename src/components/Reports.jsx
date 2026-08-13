import { useState, useMemo } from 'react';
import { parseISO, isThisWeek, isThisMonth, isThisYear, differenceInDays, startOfWeek, startOfMonth, startOfYear } from 'date-fns';
import { TrendingUp, Receipt, Trophy, Calendar } from 'lucide-react';

export default function Reports({ expenses, currency, exchangeRate, allCategories = [] }) {
  const [timeframe, setTimeframe] = useState('month');

  // Filter expenses by timeframe
  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const date = parseISO(expense.date);
      if (timeframe === 'week') return isThisWeek(date, { weekStartsOn: 1 });
      if (timeframe === 'month') return isThisMonth(date);
      if (timeframe === 'year') return isThisYear(date);
      return true;
    });
  }, [expenses, timeframe]);

  // Aggregate categories
  const categoryTotals = useMemo(() => {
    return filteredExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.total;
      return acc;
    }, {});
  }, [filteredExpenses]);

  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  const highestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const totalSpending = filteredExpenses.reduce((sum, e) => sum + e.total, 0);
  const maxCategoryTotal = highestCategory ? highestCategory[1] : 1;
  const biggestExpense = filteredExpenses.length > 0 ? Math.max(...filteredExpenses.map(e => e.total)) : 0;
  
  // Calculate Daily Average
  const dailyAverage = useMemo(() => {
    if (totalSpending === 0) return 0;
    const now = new Date();
    let daysPassed = 1;
    if (timeframe === 'week') daysPassed = differenceInDays(now, startOfWeek(now, { weekStartsOn: 1 })) + 1;
    if (timeframe === 'month') daysPassed = differenceInDays(now, startOfMonth(now)) + 1;
    if (timeframe === 'year') daysPassed = differenceInDays(now, startOfYear(now)) + 1;
    return totalSpending / Math.max(daysPassed, 1);
  }, [totalSpending, timeframe]);

  const getIcon = (categoryName) => {
    const cat = allCategories.find(c => c.name === categoryName);
    return cat ? cat.icon : '📦';
  };

  const formatMoney = (amount) => {
    return `${currency}${(amount * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}`;
  };

  return (
    <div className="app-content">
      <div className="header" style={{ paddingTop: '20px' }}>
        <h2>Analytics Dashboard</h2>
      </div>

      <div className="flex-row gap-sm" style={{ marginBottom: '24px' }}>
        {['week', 'month', 'year'].map(t => (
          <button 
            key={t}
            onClick={() => setTimeframe(t)}
            style={{ 
              flex: 1, 
              padding: '10px', 
              borderRadius: '24px', 
              border: timeframe === t ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
              background: timeframe === t ? 'var(--primary-gradient)' : 'rgba(255, 255, 255, 0.03)',
              color: timeframe === t ? 'var(--emerald-raw)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
              fontWeight: timeframe === t ? 600 : 500,
              cursor: 'pointer',
              outline: 'none',
              boxShadow: timeframe === t ? '0 4px 15px var(--primary-glow), inset 0 2px 5px rgba(255,255,255,0.4)' : 'none',
              textShadow: timeframe === t ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Total Card */}
      <div className="glass-card flex-col" style={{ marginBottom: '16px', alignItems: 'center', textAlign: 'center', padding: '32px 16px' }}>
        <p className="text-tiny" style={{ letterSpacing: '1px' }}>Total Spending ({timeframe})</p>
        <h1 style={{ fontSize: '48px', margin: '8px 0', color: 'var(--primary-color)', textShadow: '0 0 20px var(--primary-glow)' }}>
          {formatMoney(totalSpending)}
        </h1>
      </div>

      {/* 2x2 KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card flex-col gap-sm" style={{ padding: '16px' }}>
          <div className="flex-row gap-xs text-secondary"><Calendar size={16} /> <span className="text-tiny">Daily Avg</span></div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{formatMoney(dailyAverage)}</div>
        </div>
        <div className="glass-card flex-col gap-sm" style={{ padding: '16px' }}>
          <div className="flex-row gap-xs text-secondary"><Receipt size={16} /> <span className="text-tiny">Transactions</span></div>
          <div style={{ fontSize: '20px', fontWeight: 600 }}>{filteredExpenses.length}</div>
        </div>
        <div className="glass-card flex-col gap-sm" style={{ padding: '16px' }}>
          <div className="flex-row gap-xs text-secondary"><TrendingUp size={16} /> <span className="text-tiny">Biggest Expense</span></div>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--danger-color)' }}>{formatMoney(biggestExpense)}</div>
        </div>
        <div className="glass-card flex-col gap-sm" style={{ padding: '16px' }}>
          <div className="flex-row gap-xs text-secondary"><Trophy size={16} /> <span className="text-tiny">Top Category</span></div>
          <div style={{ fontSize: '20px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {highestCategory ? highestCategory[0] : '-'}
          </div>
        </div>
      </div>

      {/* Vertical Chart */}
      <h3 style={{ marginBottom: '16px', paddingLeft: '4px' }}>Top Categories</h3>
      <div className="glass-card" style={{ marginBottom: '24px', height: '220px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '24px 16px 16px 16px', gap: '12px' }}>
        {sortedCategories.length === 0 ? (
          <div className="text-secondary" style={{ width: '100%', textAlign: 'center', alignSelf: 'center' }}>No data for this period.</div>
        ) : (
          sortedCategories.slice(0, 5).map(([category, amount]) => {
            const percentage = (amount / maxCategoryTotal) * 100;
            return (
              <div key={category} className="flex-col" style={{ alignItems: 'center', gap: '12px', height: '100%', justifyContent: 'flex-end', flex: 1 }}>
                <span className="text-tiny" style={{ fontSize: '10px', color: 'var(--primary-color)' }}>{Math.round(percentage)}%</span>
                <div style={{ width: '100%', maxWidth: '32px', height: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', display: 'flex', alignItems: 'flex-end', padding: '4px', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${percentage}%`, 
                    background: 'var(--primary-gradient)',
                    borderRadius: '12px',
                    boxShadow: '0 0 15px var(--primary-glow)',
                    transition: 'height 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)'
                  }} />
                </div>
                <div style={{ fontSize: '20px' }}>{getIcon(category)}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Breakdown */}
      <h3 style={{ marginBottom: '16px', paddingLeft: '4px' }}>Detailed Breakdown</h3>
      <div className="glass-card flex-col gap-md">
        {sortedCategories.length === 0 ? (
          <p className="text-secondary text-center">No data for this period.</p>
        ) : (
          sortedCategories.map(([category, amount]) => {
            const percentage = (amount / maxCategoryTotal) * 100;
            return (
              <div key={category} className="flex-row space-between" style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex-row gap-sm">
                  <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {getIcon(category)}
                  </div>
                  <div className="flex-col">
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{category}</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{Math.round(percentage)}% of top spend</span>
                  </div>
                </div>
                <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--primary-color)' }}>{formatMoney(amount)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
