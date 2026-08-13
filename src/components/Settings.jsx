import { useState, useRef } from 'react';
import { Download, Trash2, DollarSign, Coins, Sun, Moon, Palette, Plus, X, Upload, Check } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function Settings({ currency, setCurrency, customExchangeRate, setCustomExchangeRate, spendLimit, setSpendLimit, customCategories, setCustomCategories, theme, setTheme, expenses, onWipeData, onImportData }) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🎮');
  const [pendingImport, setPendingImport] = useState(null);

  const handleAddCategory = () => {
    if (newCatName.trim()) {
      setCustomCategories([...customCategories, { name: newCatName.trim(), icon: newCatEmoji, isCustom: true }]);
      setNewCatName('');
    }
  };

  const handleDeleteCategory = (name) => {
    setCustomCategories(customCategories.filter(c => c.name !== name));
  };

  const fileInputRef = useRef(null);

  const processParsedData = (data) => {
    const parsedExpenses = data.map(row => {
      const dateStr = row['Date'] || row['date'] || new Date().toISOString();
      const item = row['Item'] || row['item'] || row['Name'] || 'Imported Expense';
      const category = row['Category'] || row['category'] || 'Other';
      const quantity = parseInt(row['Quantity'] || row['Qty'] || row['quantity'] || '1', 10);
      const price = parseFloat(row['Unit Price'] || row['Price'] || row['price'] || row['Total'] || '0');
      const total = parseFloat(row['Total'] || row['total'] || (price * quantity).toString() || '0');

      return {
        item,
        category,
        quantity: isNaN(quantity) ? 1 : quantity,
        price: isNaN(price) ? 0 : price,
        total: isNaN(total) ? 0 : total,
        date: new Date(dateStr).toISOString()
      };
    });

    if (parsedExpenses.length > 0) {
      setPendingImport(parsedExpenses);
    } else {
      alert('No valid expenses found in the file.');
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          if (results.errors.length > 0 && results.data.length === 0) {
            alert('Failed to parse CSV file.');
            return;
          }
          processParsedData(results.data);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with headers matching the first row
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        processParsedData(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Unsupported file type.');
    }

    // Reset input
    event.target.value = '';
  };

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

      <h3 style={{ marginBottom: '16px' }}>Custom Categories</h3>
      <div className="card flex-col gap-md" style={{ marginBottom: '32px' }}>
        {customCategories.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '8px 0' }}>No custom categories yet.</p>
        ) : (
          <div className="flex-col gap-sm">
            {customCategories.map(cat => (
              <div key={cat.name} className="flex-row space-between" style={{ padding: '12px', backgroundColor: 'var(--surface-color-elevated)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex-row gap-sm">
                  <span style={{ fontSize: '20px' }}>{cat.icon}</span>
                  <span style={{ fontWeight: 500 }}>{cat.name}</span>
                </div>
                <button onClick={() => handleDeleteCategory(cat.name)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex-row gap-sm" style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <input 
            type="text" 
            value={newCatEmoji}
            onChange={e => setNewCatEmoji(e.target.value)}
            style={{ width: '60px', padding: '12px', textAlign: 'center', fontSize: '20px' }}
            maxLength="2"
          />
          <input 
            type="text" 
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="New Category Name"
            style={{ flex: 1, padding: '12px' }}
          />
          <button 
            onClick={handleAddCategory}
            style={{ backgroundColor: 'var(--primary-color)', color: 'var(--bg-color)', border: 'none', borderRadius: 'var(--radius-md)', width: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Data Management</h3>
      <div className="card flex-col gap-md">
        
        {/* Hidden file input */}
        <input 
          type="file" 
          accept=".csv, .xlsx, .xls" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          style={{ display: 'none' }} 
        />

        <div className="flex-row gap-sm">
          <button 
            className="button button-secondary flex-row" 
            onClick={() => fileInputRef.current?.click()}
            style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={20} /> Import Data
            </span>
          </button>

          <button 
            className="button button-secondary flex-row" 
            onClick={handleExportCSV}
            style={{ flex: 1, padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={20} /> Export CSV
            </span>
          </button>
        </div>

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

      {pendingImport && (
        <div className="modal-overlay" style={{ zIndex: 1000, backgroundColor: 'var(--bg-color)' }}>
          <div className="header flex-row space-between" style={{ padding: '24px' }}>
            <h2>Import Preview</h2>
            <button onClick={() => setPendingImport(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <X size={28} />
            </button>
          </div>
          
          <div className="app-content" style={{ paddingBottom: '24px', flex: 1, overflowY: 'auto' }}>
            <p className="text-secondary" style={{ marginBottom: '16px' }}>
              Found {pendingImport.length} expenses to import. Please review them below:
            </p>
            
            <div className="card flex-col gap-sm" style={{ marginBottom: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
              {pendingImport.slice(0, 50).map((exp, idx) => (
                <div key={idx} className="flex-row space-between" style={{ padding: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex-col">
                    <span style={{ fontWeight: 500 }}>{exp.item}</span>
                    <span className="text-small">{exp.category} • {exp.date.split('T')[0]}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{currency}{exp.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
              ))}
              {pendingImport.length > 50 && (
                <p className="text-secondary text-center" style={{ paddingTop: '8px' }}>
                  ...and {pendingImport.length - 50} more items
                </p>
              )}
            </div>

            <div className="flex-col gap-md">
              <button 
                className="button" 
                style={{ padding: '16px' }}
                onClick={() => {
                  onImportData(pendingImport);
                  setPendingImport(null);
                  alert(`Successfully imported ${pendingImport.length} expenses!`);
                }}
              >
                <Check size={20} /> Confirm Import ({pendingImport.length} items)
              </button>
              <button 
                className="button button-secondary" 
                style={{ padding: '16px' }}
                onClick={() => setPendingImport(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
