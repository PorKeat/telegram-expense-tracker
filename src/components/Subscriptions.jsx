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
    <div className="app-content animate-fade-in" style={{ paddingBottom: '100px' }}>
      <div className="header flex-row space-between" style={{ paddingTop: '20px', paddingBottom: '20px', alignItems: 'center' }}>
        <div className="flex-row gap-sm" style={{ alignItems: 'center' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
            <X size={28} />
          </button>
          <h2 style={{ margin: 0, fontSize: '24px' }}>Subscriptions</h2>
        </div>
        <button className="button button-secondary flex-row gap-xs" onClick={() => openForm()} style={{ padding: '6px 14px', borderRadius: '100px', fontSize: '13px' }}>
          <Plus size={16} /> Add
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>
      ) : subscriptions.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ background: 'var(--surface-color)', width: '80px', height: '80px', borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <Power size={32} color="var(--primary-color)" />
          </div>
          <h3 style={{ marginBottom: '12px' }}>No Subscriptions Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>Add your monthly bills (Netflix, Gym, Rent) and we will automatically log them for you.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0 var(--spacing-lg)' }}>
          {subscriptions.map(sub => (
            <div key={sub.id} className="expense-item" style={{ opacity: sub.is_active ? 1 : 0.6 }}>
              <div className="flex-row gap-md" style={{ flex: 1, padding: '8px 0' }}>
                <div className="expense-icon" style={{ opacity: sub.is_active ? 1 : 0.5 }}>
                  {categories.find(c => c.name === sub.category)?.icon || '🔄'}
                </div>
                <div className="flex-col" style={{ flex: 1 }}>
                  <div className="flex-row space-between" style={{ alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', margin: 0, color: sub.is_active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{sub.name}</h3>
                    <h3 style={{ fontSize: '16px', margin: 0, color: sub.is_active ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {currency}{(sub.amount * exchangeRate).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </h3>
                  </div>
                  
                  <div className="flex-row space-between" style={{ alignItems: 'center', marginTop: '4px' }}>
                    <p className="text-small" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {sub.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'} • Next: {format(parseISO(sub.next_billing_date), 'MMM do')}
                    </p>
                    
                    <div className="flex-row gap-md">
                      <button onClick={() => handleToggleActive(sub)} style={{ background: 'none', border: 'none', color: sub.is_active ? 'var(--primary-color)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                        <Power size={16} />
                      </button>
                      <button onClick={() => openForm(sub)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(sub.id)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', display: 'flex' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()} style={{ paddingBottom: '24px', maxHeight: '92vh' }}>
            <div className="header flex-row space-between" style={{ padding: '20px 24px 12px 24px' }}>
              <h2>{editingSub ? 'Edit Subscription' : 'New Subscription'}</h2>
              <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            <div className="app-content hide-scrollbar" style={{ padding: '0 24px 16px 24px', flex: '1 1 auto', overflowY: 'auto' }}>
              <div className="glass-card flex-col gap-md" style={{ marginBottom: '16px', padding: '16px' }}>
                <div className="flex-col gap-sm">
                  <label className="text-small">Name (e.g. Netflix)</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required className="input" placeholder="Subscription Name" />
                </div>
                
                <div className="flex-col gap-sm">
                  <label className="text-small">Amount ({currency})</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)' }}>{currency}</span>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required step="0.01" min="0.01" className="input" style={{ paddingLeft: '32px', width: '100%' }} placeholder="0.00" />
                  </div>
                </div>
                
                <div className="flex-row gap-md">
                  <div className="flex-col gap-sm" style={{ flex: 1 }}>
                    <label className="text-small">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="input" style={{ appearance: 'none', width: '100%' }}>
                      {categories.map(c => (
                        <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-col gap-sm" style={{ flex: 1 }}>
                    <label className="text-small">Cycle</label>
                    <div className="flex-row gap-xs" style={{ background: 'var(--surface-color)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', height: '48px' }}>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setBillingCycle('monthly'); }}
                        style={{
                          flex: 1,
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: billingCycle === 'monthly' ? 'var(--primary-color)' : 'transparent',
                          color: billingCycle === 'monthly' ? 'var(--bg-color)' : 'var(--text-secondary)',
                          fontWeight: billingCycle === 'monthly' ? 600 : 400,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setBillingCycle('yearly'); }}
                        style={{
                          flex: 1,
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          background: billingCycle === 'yearly' ? 'var(--primary-color)' : 'transparent',
                          color: billingCycle === 'yearly' ? 'var(--bg-color)' : 'var(--text-secondary)',
                          fontWeight: billingCycle === 'yearly' ? 600 : 400,
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Yearly
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-col gap-sm">
                  <label className="text-small">Next Billing Date</label>
                  <input type="date" value={nextBillingDate} onChange={e => setNextBillingDate(e.target.value)} required className="input" />
                </div>
              </div>
            </div>
            
            <div style={{ padding: '0 24px 24px 24px', flexShrink: 0 }}>
              <button type="submit" onClick={handleSave} className="button" style={{ width: '100%' }} disabled={!name || !amount || !nextBillingDate}>
                <Check size={20} /> Save Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
