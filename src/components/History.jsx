import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2, Search } from 'lucide-react';

export default function History({ expenses, currency, exchangeRate, onEdit, onDelete, allCategories = [] }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.item.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          expense.category.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort expenses by date descending
  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by date
  const grouped = sortedExpenses.reduce((acc, expense) => {
    const date = format(parseISO(expense.date), 'MMMM d, yyyy');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {});

  const getIcon = (category) => {
    const cat = allCategories.find(c => c.name === category);
    return <span style={{ fontSize: '24px' }}>{cat ? cat.icon : '📦'}</span>;
  };

  return (
    <div className="app-content">
      <div className="header" style={{ paddingTop: '20px', paddingBottom: '16px' }}>
        <h2>Expense History</h2>
      </div>

      <div style={{ marginBottom: '24px', padding: '0 4px', display: 'flex', gap: '8px' }}>
        <div className="flex-row gap-sm" style={{ flex: 1, backgroundColor: 'var(--surface-color-elevated)', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)' }}>
          <Search size={16} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search items..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', flex: 1, fontSize: '14px', width: '100%' }}
          />
        </div>
        
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{ 
            backgroundColor: 'var(--surface-color-elevated)', 
            border: '1px solid var(--surface-border)', 
            borderRadius: 'var(--radius-md)', 
            padding: '8px', 
            color: 'var(--text-primary)', 
            fontSize: '14px',
            outline: 'none',
            maxWidth: '140px'
          }}
        >
          <option value="All">All Categories</option>
          {allCategories.map(c => (
            <option key={c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p className="text-secondary">No expenses found.</p>
        </div>
      ) : (
        Object.keys(grouped).map(date => {
          const dailyTotal = grouped[date].reduce((sum, e) => sum + e.total, 0);
          
          return (
            <div key={date} style={{ marginBottom: '32px' }}>
              <div className="flex-row space-between" style={{ marginBottom: '12px' }}>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{date}</h3>
                <h3 style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{currency}{(dailyTotal * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}</h3>
              </div>
              
              <div className="glass-card" style={{ padding: '0 var(--spacing-lg)' }}>
                {grouped[date].map(expense => (
                  <div key={expense.id} className="expense-item">
                    <div className="flex-row gap-md" style={{ flex: 1 }}>
                      <div className="expense-icon">
                        {getIcon(expense.category)}
                      </div>
                      <div className="flex-col">
                        <h3 style={{ fontSize: '16px' }}>{expense.item}</h3>
                        <p className="text-small">
                          {expense.quantity > 1 ? `${expense.quantity} × ${currency}{(expense.price * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))} — ` : ''} 
                          {expense.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex-col gap-sm" style={{ alignItems: 'flex-end' }}>
                      <h3 style={{ fontSize: '16px' }}>-{currency}{(expense.total * exchangeRate).toLocaleString(undefined, (currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0}))}</h3>
                      <div className="flex-row gap-sm">
                        <button onClick={() => onEdit(expense)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete(expense.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  );
}
