import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function AddExpense({ onClose, onSave, initialData, currency = '$', exchangeRate = 1 }) {
  const [item, setItem] = useState(initialData?.item || '');
  const [price, setPrice] = useState(initialData?.price ? (initialData.price * exchangeRate).toString() : '');
  const [quantity, setQuantity] = useState(initialData?.quantity || 1);
  const [category, setCategory] = useState(initialData?.category || 'Food & Drink');
  
  const getInitialDate = () => {
    if (initialData?.date) return initialData.date.split('T')[0];
    return new Date().toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getInitialDate());
  
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
      date: dateObj.toISOString()
    });
  };

  const categories = ['Food & Drink', 'Transport', 'Shopping', 'Housing', 'Utilities', 'Entertainment', 'Other'];

  return (
    <div className="modal-overlay">
      <div className="header flex-row space-between" style={{ padding: '24px' }}>
        <h2>{initialData ? 'Edit Expense' : 'Add Expense'}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <X size={28} />
        </button>
      </div>

      <div className="app-content" style={{ paddingBottom: '24px' }}>
        
        <div className="card flex-col gap-lg" style={{ marginBottom: '24px' }}>
          {/* Main Total Display */}
          <div className="flex-col" style={{ alignItems: 'center', marginBottom: '8px' }}>
            <p className="text-secondary">Total Amount</p>
            <h1 style={{ fontSize: '56px', color: 'var(--primary-color)' }}>{currency}{total.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</h1>
            {quantity > 1 && (
              <p className="text-small">{quantity} × {currency}{price || '0.00'}</p>
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
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
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
        </div>

        <button className="button" onClick={handleSave} style={{ padding: '20px' }}>
          <Check size={20} /> Save Expense
        </button>
      </div>
    </div>
  );
}
