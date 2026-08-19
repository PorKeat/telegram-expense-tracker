import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function AddExpense({ onClose, onSave, initialData, currency = '$', exchangeRate = 1, allCategories = [] }) {
  const [item, setItem] = useState(initialData?.item || '');
  const [price, setPrice] = useState(initialData?.price ? (initialData.price * exchangeRate).toString() : '');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [category, setCategory] = useState(initialData?.category || 'Food & Drink');
  
  const getInitialDate = () => {
    if (initialData?.date) return initialData.date.split('T')[0];
    return new Date().toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getInitialDate());
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
  
  const total = (parseFloat(price || 0) * quantity);

  const handleSave = () => {
    if (!item || !price || !date) return;
    
    // Convert the date string (YYYY-MM-DD) to an ISO string for storage
    const dateObj = new Date(date);
    const basePrice = parseFloat(price) / exchangeRate;
    
    onSave({
      id: initialData?.id || Date.now(),
      item,
      price: basePrice,
      quantity,
      total: basePrice * quantity,
      category,
      date: dateObj.toISOString(),
      is_recurring: isRecurring
    });
  };

  // Removed hardcoded categories

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ paddingBottom: '24px', maxHeight: '92vh' }}>
        <div className="header flex-row space-between" style={{ padding: '20px 24px 12px 24px' }}>
          <h2>{initialData ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="app-content hide-scrollbar" style={{ padding: '0 24px 16px 24px', flex: '0 1 auto', overflowY: 'auto' }}>
          <div className="glass-card flex-col gap-md" style={{ marginBottom: '16px', padding: '16px' }}>
          {/* Main Total Display */}
          <div className="flex-col" style={{ alignItems: 'center', marginBottom: '4px' }}>
            <p className="text-secondary" style={{ textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px', fontWeight: 600 }}>Total Amount</p>
            <h1 style={{ fontSize: '42px', color: 'var(--primary-color)', fontWeight: 300, letterSpacing: '-1px', margin: '4px 0' }}>{currency}{total.toLocaleString(undefined, currency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0})}</h1>
            {quantity > 1 && (
              <p className="text-small" style={{ margin: 0 }}>{quantity} × {currency}{price || '0.00'}</p>
            )}
          </div>

          <div className="flex-col gap-sm">
            <label className="text-small">What did you buy?</label>
            <input 
              type="text" 
              placeholder="e.g. Coffee" 
              value={item} 
              onChange={e => setItem(e.target.value)}
              autoFocus
            />
          </div>

          <div className="flex-row gap-md">
            <div className="flex-col gap-sm" style={{ flex: 2 }}>
              <label className="text-small">Unit Price ({currency})</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={price} 
                onChange={e => setPrice(e.target.value)}
                step="0.01"
              />
            </div>
            <div className="flex-col gap-sm" style={{ flex: 1 }}>
              <label className="text-small">Qty</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
          </div>

          <div className="flex-row gap-md">
            <div className="flex-col gap-sm" style={{ flex: 1 }}>
              <label className="text-small">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {allCategories.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-col gap-sm" style={{ flex: 1 }}>
              <label className="text-small">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-row gap-sm" style={{ alignItems: 'center', marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
            <div 
              onClick={() => setIsRecurring(!isRecurring)}
              style={{
                width: '24px', height: '24px', borderRadius: '6px',
                border: isRecurring ? 'none' : '2px solid var(--text-tertiary)',
                background: isRecurring ? 'var(--primary-color)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s flex-shrink-0'
              }}
            >
              {isRecurring && <Check size={16} color="var(--surface-solid)" />}
            </div>
            <label onClick={() => setIsRecurring(!isRecurring)} className="text-small" style={{ cursor: 'pointer', flex: 1, color: isRecurring ? 'var(--primary-color)' : 'var(--text-primary)', userSelect: 'none' }}>
              Monthly Subscription
            </label>
          </div>
        </div>
        </div>

        <div style={{ padding: '0 24px 24px 24px', flexShrink: 0 }}>
          <button className="button" onClick={handleSave} disabled={!item || !price || !date}>
            <Check size={20} /> Save Expense
          </button>
        </div>
      </div>
    </div>
  );
}
