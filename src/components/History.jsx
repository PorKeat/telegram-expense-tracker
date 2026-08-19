import { useState } from 'react';
import { createPortal } from 'react-dom';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { Edit2, Trash2, Search, Filter, X } from 'lucide-react';

export default function History({ expenses, currency, exchangeRate, onEdit, onDelete, allCategories = [] }) {
  const [filterQuery, setFilterQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDateRange, setFilterDateRange] = useState('All');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.item.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          expense.category.toLowerCase().includes(filterQuery.toLowerCase());
    const matchesCategory = filterCategory === 'All' || expense.category === filterCategory;
    
    let matchesDate = true;
    const dateObj = parseISO(expense.date);
    if (filterDateRange === 'Today') matchesDate = isToday(dateObj);
    else if (filterDateRange === 'Yesterday') matchesDate = isYesterday(dateObj);
    else if (filterDateRange === 'This Week') matchesDate = isThisWeek(dateObj);
    else if (filterDateRange === 'This Month') matchesDate = isThisMonth(dateObj);

    return matchesSearch && matchesCategory && matchesDate;
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
      <div className="header flex-row space-between" style={{ paddingTop: '20px', paddingBottom: '16px' }}>
        <h2>Expense History</h2>
        <button 
          onClick={() => setShowFilterSheet(true)}
          style={{ 
            background: 'var(--surface-color-elevated)', 
            border: '1px solid var(--surface-border)', 
            color: 'var(--text-primary)', 
            borderRadius: 'var(--radius-pill)', 
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <Filter size={16} /> 
          {(filterQuery || filterCategory !== 'All' || filterDateRange !== 'All') ? 'Filtered' : 'Filter'}
        </button>
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

      {showFilterSheet && typeof document !== 'undefined' && createPortal(
        <div className="modal-overlay" onClick={() => setShowFilterSheet(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
            <div className="flex-row space-between" style={{ marginBottom: '24px' }}>
              <h2>Filter & Search</h2>
              <button onClick={() => setShowFilterSheet(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)' }}>
                <X size={24} />
              </button>
            </div>

            <div className="flex-col gap-lg" style={{ overflowY: 'auto', paddingBottom: '16px' }}>
              <div className="flex-col gap-sm">
                <label className="text-secondary text-small">Search Items</label>
                <div className="flex-row gap-sm" style={{ background: 'var(--surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)' }}>
                  <Search size={20} color="var(--text-secondary)" />
                  <input 
                    type="text" 
                    placeholder="Search by name..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', flex: 1, fontSize: '16px', width: '100%', padding: 0, boxShadow: 'none' }}
                  />
                </div>
              </div>

              <div className="flex-col gap-sm">
                <label className="text-secondary text-small">Date Range</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['All', 'Today', 'Yesterday', 'This Week', 'This Month'].map(range => (
                    <button
                      key={range}
                      onClick={() => setFilterDateRange(range)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: filterDateRange === range ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--surface-border)',
                        background: filterDateRange === range ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                        color: filterDateRange === range ? 'var(--emerald-raw)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: filterDateRange === range ? 600 : 400,
                        boxShadow: filterDateRange === range ? '0 4px 15px var(--primary-glow), inset 0 2px 5px rgba(255,255,255,0.4)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-col gap-sm">
                <label className="text-secondary text-small">Category</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    onClick={() => setFilterCategory('All')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: filterCategory === 'All' ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--surface-border)',
                      background: filterCategory === 'All' ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                      color: filterCategory === 'All' ? 'var(--emerald-raw)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: filterCategory === 'All' ? 600 : 400,
                      boxShadow: filterCategory === 'All' ? '0 4px 15px var(--primary-glow), inset 0 2px 5px rgba(255,255,255,0.4)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    All
                  </button>
                  {allCategories.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setFilterCategory(c.name)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        border: filterCategory === c.name ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--surface-border)',
                        background: filterCategory === c.name ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                        color: filterCategory === c.name ? 'var(--emerald-raw)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: filterCategory === c.name ? 600 : 400,
                        boxShadow: filterCategory === c.name ? '0 4px 15px var(--primary-glow), inset 0 2px 5px rgba(255,255,255,0.4)' : 'none',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
