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
              padding: '8px', 
              borderRadius: '20px', 
              border: 'none',
              backgroundColor: timeframe === t ? 'var(--primary-color)' : 'var(--surface-color-elevated)',
              color: timeframe === t ? 'var(--bg-color)' : 'var(--text-secondary)',
              textTransform: 'capitalize',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="glass-card flex-col" style={{ marginBottom: '24px', alignItems: 'center', textAlign: 'center' }}>
        <p className="text-secondary">Total Spending ({timeframe})</p>
        <h1 style={{ fontSize: '40px', margin: '8px 0', color: 'var(--text-primary)' }}>
          {currency}{(totalSpending * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{currency}{(amount * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-color-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${percentage}%`, 
                    height: '100%', 
                    backgroundColor: 'var(--primary-color)',
                    borderRadius: '4px',
                    boxShadow: '0 0 10px var(--primary-glow)'
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
