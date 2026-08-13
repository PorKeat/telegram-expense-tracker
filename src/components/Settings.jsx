import { Download, Trash2, DollarSign, Coins, Sun, Moon, Palette } from 'lucide-react';

export default function Settings({ currency, setCurrency, customExchangeRate, setCustomExchangeRate, spendLimit, setSpendLimit, theme, setTheme, expenses, onWipeData }) {
  
  const handleExportCSV = () => {
    if (expenses.length === 0) return alert('No data to export.');
    
    // Create CSV content
    const headers = ['Date', 'Item', 'Category', 'Quantity', 'Unit Price', 'Total'];
    const csvRows = [headers.join(',')];
    
    expenses.forEach(exp => {
      const row = [
        exp.date.split('T')[0],
        `"${exp.item}"`,
        `"${exp.category}"`,
        exp.quantity,
        exp.price,
        exp.total
      ];
      csvRows.push(row.join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'spendly_expenses.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleWipeData = () => {
    const confirm = window.confirm("Are you absolutely sure? This will delete all your expenses permanently.");
    if (confirm) {
      onWipeData();
    }
  };

  const themeOptions = [
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'light', icon: Sun, label: 'Light' }
  ];

  const colorOptions = [
    { id: '#2b80ff', name: 'Blue' },
    { id: '#32d74b', name: 'Green' },
    { id: '#ff453a', name: 'Red' },
    { id: '#bf5af2', name: 'Purple' },
    { id: '#ff9f0a', name: 'Orange' },
  ];

  return (
    <div className="app-content">
      <div className="header" style={{ paddingTop: '20px' }}>
        <h2>Settings</h2>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Appearance</h3>
      <div className="card flex-col gap-lg" style={{ marginBottom: '32px' }}>
        
        {/* Theme Toggle */}
        <div className="flex-row space-between">
          <div className="flex-col">
            <span style={{ fontWeight: 500 }}>Theme</span>
            <span className="text-small">Choose visual style</span>
          </div>
          <div className="flex-row gap-sm" style={{ backgroundColor: 'var(--surface-color-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            {themeOptions.map(t => (
              <button 
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  backgroundColor: theme === t.id ? 'var(--primary-color)' : 'transparent',
                  color: theme === t.id ? 'var(--bg-color)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Preferences</h3>
      <div className="card flex-col gap-md" style={{ marginBottom: '32px' }}>
        <div className="flex-row space-between">
          <div className="flex-col">
            <span style={{ fontWeight: 500 }}>Currency</span>
            <span className="text-small">Choose your primary currency</span>
          </div>
          <div className="flex-row gap-sm" style={{ backgroundColor: 'var(--surface-color-elevated)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
            <button 
              onClick={() => setCurrency('$')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: currency === '$' ? 'var(--primary-color)' : 'transparent',
                color: currency === '$' ? 'var(--bg-color)' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <DollarSign size={16} /> USD
            </button>
            <button 
              onClick={() => setCurrency('៛')}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: currency === '៛' ? 'var(--primary-color)' : 'transparent',
                color: currency === '៛' ? 'var(--bg-color)' : 'var(--text-secondary)',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Coins size={16} /> Riels
            </button>
          </div>
        </div>

        {currency === '៛' && (
          <div className="flex-row space-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div className="flex-col">
              <span style={{ fontWeight: 500 }}>Exchange Rate</span>
              <span className="text-small">1 USD = ? Riels</span>
            </div>
            <div style={{ width: '120px' }}>
              <input 
                type="number" 
                value={customExchangeRate}
                onChange={e => setCustomExchangeRate(parseFloat(e.target.value) || 0)}
                style={{ padding: '8px', textAlign: 'right' }}
              />
            </div>
          </div>
        )}

        <div className="flex-row space-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div className="flex-col">
            <span style={{ fontWeight: 500 }}>Monthly Limit (USD)</span>
            <span className="text-small">Get alerted if you overspend</span>
          </div>
          <div style={{ width: '120px' }}>
            <input 
              type="number" 
              value={spendLimit}
              onChange={e => setSpendLimit(e.target.value)}
              placeholder="e.g. 500"
              style={{ padding: '8px', textAlign: 'right' }}
            />
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Data Management</h3>
      <div className="card flex-col gap-md">
        <button 
          className="button button-secondary flex-row space-between" 
          onClick={handleExportCSV}
          style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={20} /> Export to CSV
          </span>
        </button>

        <button 
          className="button flex-row space-between" 
          onClick={handleWipeData}
          style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger-color)', boxShadow: 'none' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} /> Wipe All Data
          </span>
        </button>
      </div>
    </div>
  );
}
