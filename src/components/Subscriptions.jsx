import { useState, useEffect } from 'react';
import { Plus, X, Calendar, Edit2, Trash2, Power, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Subscriptions({ initData, currency, exchangeRate, categories, onBack }) {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Other');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [nextBillingDate, setNextBillingDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchSubscriptions();
  }, [initData]);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${initData}` }
      });
      if (res.ok) {
        const { data } = await res.json();
        if (data) setSubscriptions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const openForm = (sub = null) => {
    if (sub) {
      setEditingSub(sub);
      setName(sub.name);
      setAmount((sub.amount * exchangeRate).toString());
      setCategory(sub.category);
      setBillingCycle(sub.billing_cycle);
      setNextBillingDate(sub.next_billing_date);
    } else {
      setEditingSub(null);
      setName('');
      setAmount('');
      setCategory(categories[0]?.name || 'Other');
      setBillingCycle('monthly');
      setNextBillingDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !amount || !nextBillingDate) return;
    
    const parsedAmount = parseFloat(amount) / exchangeRate;
    
    const payload = {
      name,
      amount: parsedAmount,
      category,
      billing_cycle: billingCycle,
      next_billing_date: nextBillingDate
    };

    try {
      if (editingSub) {
        const res = await fetch('/api/subscriptions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${initData}` },
          body: JSON.stringify({ id: editingSub.id, ...payload })
        });
        if (res.ok) {
          const { data } = await res.json();
          setSubscriptions(subscriptions.map(s => s.id === editingSub.id ? data[0] : s));
        }
      } else {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${initData}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const { data } = await res.json();
          setSubscriptions([...data, ...subscriptions]);
        }
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (sub) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${initData}` },
        body: JSON.stringify({ id: sub.id, is_active: !sub.is_active })
      });
      if (res.ok) {
        setSubscriptions(subscriptions.map(s => s.id === sub.id ? { ...s, is_active: !sub.is_active } : s));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this subscription?')) {
      try {
        const res = await fetch(`/api/subscriptions?id=${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${initData}` }
        });
        if (res.ok) {
          setSubscriptions(subscriptions.filter(s => s.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="section animate-fade-in" style={{ paddingBottom: '100px' }}>
      <div className="flex-row space-between" style={{ marginBottom: '24px' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="icon-btn" onClick={onBack} style={{ background: 'var(--card-bg)' }}>
            <X size={20} />
          </button>
          Smart Subscriptions
        </h2>
        <button className="button button-primary" onClick={() => openForm()} style={{ padding: '8px 16px', borderRadius: '100px', fontSize: '14px' }}>
          <Plus size={16} /> Add
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ background: 'var(--card-bg)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Power size={32} color="var(--primary-color)" />
          </div>
          <h3 style={{ marginBottom: '12px' }}>No Subscriptions Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Add your monthly bills (Netflix, Gym, Rent) and we will automatically log them for you.</p>
        </div>
      ) : (
        <div className="flex-col gap-md">
          {subscriptions.map(sub => (
            <div key={sub.id} className="card" style={{ padding: '16px', opacity: sub.is_active ? 1 : 0.6, borderLeft: sub.is_active ? '4px solid var(--primary-color)' : '4px solid var(--border-color)' }}>
              <div className="flex-row space-between" style={{ marginBottom: '12px' }}>
                <div className="flex-row gap-sm">
                  <div style={{ background: 'var(--bg-color)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {categories.find(c => c.name === sub.category)?.icon || '🔄'}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '16px' }}>{sub.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'}</div>
                  </div>
                </div>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>
                  {currency}{(sub.amount * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2})}
                </div>
              </div>
              
              <div className="flex-row space-between" style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex-row gap-sm" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <Calendar size={14} /> Next: {format(parseISO(sub.next_billing_date), 'MMM do, yyyy')}
                </div>
                <div className="flex-row gap-sm">
                  <button className="icon-btn" onClick={() => handleToggleActive(sub)} style={{ width: '30px', height: '30px', background: sub.is_active ? 'var(--card-bg)' : 'rgba(255, 69, 58, 0.1)', color: sub.is_active ? 'var(--text-color)' : 'var(--danger-color)' }}>
                    <Power size={14} />
                  </button>
                  <button className="icon-btn" onClick={() => openForm(sub)} style={{ width: '30px', height: '30px' }}>
                    <Edit2 size={14} />
                  </button>
                  <button className="icon-btn" onClick={() => handleDelete(sub.id)} style={{ width: '30px', height: '30px', color: 'var(--danger-color)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay" style={{ zIndex: 2000 }} onClick={() => setIsFormOpen(false)}>
          <div className="bottom-sheet" style={{ height: 'auto', paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }} onClick={e => e.stopPropagation()}>
            <div className="header flex-row space-between" style={{ padding: '24px 24px 0' }}>
              <h2>{editingSub ? 'Edit Subscription' : 'New Subscription'}</h2>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Name (e.g. Netflix)</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" placeholder="Subscription Name" />
              </div>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Amount ({currency})</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>{currency}</span>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" min="0.01" className="input" style={{ paddingLeft: '40px' }} placeholder="0.00" />
                </div>
              </div>
              
              <div className="flex-row gap-md" style={{ marginBottom: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="input" style={{ appearance: 'none' }}>
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Cycle</label>
                  <select value={billingCycle} onChange={e => setBillingCycle(e.target.value)} className="input" style={{ appearance: 'none' }}>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Next Billing Date</label>
                <input type="date" value={nextBillingDate} onChange={e => setNextBillingDate(e.target.value)} required className="input" />
              </div>
              
              <button type="submit" className="button button-primary" style={{ width: '100%', padding: '16px' }}>
                <Check size={20} /> Save Subscription
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
