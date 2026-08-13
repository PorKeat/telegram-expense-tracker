import { useState } from 'react';

export default function Reports({ expenses, currency, exchangeRate }) {
  const [timeframe, setTimeframe] = useState('month');

  // Simple aggregation for categories
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.total;
    return acc;
  }, {});

  // Sort by highest spending
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const highestCategory = sortedCategories.length > 0 ? sortedCategories[0] : null;
  const totalSpending = expenses.reduce((sum, e) => sum + e.total, 0);
  const maxCategoryTotal = highestCategory ? highestCategory[1] : 1;

  return (
    <div className="app-content">
      <div className="header" style={{ paddingTop: '20px' }}>
        <h2>Reports</h2>
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

      <div className="glass-card flex-col" style={{ marginBottom: '24px', alignItems: 'center', textAlign: 'center' }}>
        <p className="text-secondary">Total Spending ({timeframe})</p>
        <h1 style={{ fontSize: '40px', margin: '8px 0', color: 'var(--text-primary)' }}>
          {currency}{(totalSpending * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}
        </h1>
        {highestCategory && (
          <p className="text-small" style={{ marginTop: '8px' }}>
            Highest spend on <span style={{ color: 'var(--primary-color)' }}>{highestCategory[0]}</span>
          </p>
        )}
      </div>

      <h3 style={{ marginBottom: '16px' }}>Category Breakdown</h3>
      <div className="glass-card flex-col gap-lg">
        {sortedCategories.length === 0 ? (
          <p className="text-secondary text-center">No data for this period.</p>
        ) : (
          sortedCategories.map(([category, amount]) => {
            const percentage = (amount / maxCategoryTotal) * 100;
            return (
              <div key={category} className="flex-col gap-xs">
                <div className="flex-row space-between">
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{category}</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{currency}{(amount * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-color-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    background: 'var(--primary-gradient)',
                    borderRadius: '4px',
                    boxShadow: '0 0 15px var(--primary-glow)'
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
