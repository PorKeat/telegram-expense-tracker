import { useState, useRef } from 'react';
import { Download, Trash2, DollarSign, Coins, Sun, Moon, Palette, Plus, X, Upload, Check } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function Settings({ currency, setCurrency, customExchangeRate, setCustomExchangeRate, spendLimit, setSpendLimit, customCategories, setCustomCategories, theme, setTheme, expenses, onWipeData, onImportData, setDialogConfig, notificationSettings = { budget_alerts: true, report_frequency: 'weekly' }, setNotificationSettings }) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🎮');
  const [pendingImport, setPendingImport] = useState(null);
  const [previewCurrency, setPreviewCurrency] = useState(currency);
  const [editingImportIdx, setEditingImportIdx] = useState(null);
  const [draftImportItem, setDraftImportItem] = useState('');
  const [draftImportCategory, setDraftImportCategory] = useState('');

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
    let lastSeenDate = new Date().toISOString();
    
    const parsedExpenses = data.map(row => {
      // Handle merged cells in Excel by carrying forward the last non-empty date
      let rawDate = row['Date'] || row['date'] || row['DATE'];
      if (!rawDate || rawDate.toString().trim() === '') {
        rawDate = lastSeenDate;
      } else {
        lastSeenDate = rawDate;
      }
      
      const dateStr = rawDate;
      const item = String(row['Item'] || row['item'] || row['Name'] || row['Purchases'] || row['purchases'] || 'Imported Expense');
      const category = String(row['Category'] || row['category'] || 'Other');
      const quantity = parseInt(row['Quantity'] || row['Qty'] || row['quantity'] || '1', 10);
      
      const parseMoney = (val) => {
        if (!val) return 0;
        return parseFloat(val.toString().replace(/,/g, ''));
      };
      
      let price = parseMoney(row['Unit Price'] || row['Price'] || row['price'] || '0');
      let total = parseMoney(row['Total'] || row['total'] || row['Expense'] || row['expense']);
      
      // Explicit support for "Expense (riel)"
      const rielTotal = parseMoney(row['Expense (riel)']);
      
      // If we got a specific Riel column, convert it to our base unit using the custom exchange rate
      if (rielTotal) {
         // App stores values in base (USD). customExchangeRate represents Riels per USD (e.g., 4000)
         const rateToUse = customExchangeRate || 4000;
         total = rielTotal / rateToUse;
         if (!price) price = total / (isNaN(quantity) || quantity === 0 ? 1 : quantity);
      } else if (!total && !price) {
         total = 0;
      } else if (!total && price) {
         total = price * (isNaN(quantity) ? 1 : quantity);
      } else if (total && !price) {
         price = total / (isNaN(quantity) || quantity === 0 ? 1 : quantity);
      }

      // If the CSV was exported directly from our app, or has generic total, we must convert it 
      // from the current display currency back to the base storage currency.
      // E.g., if currency === '៛', the generic 'Total' column is assumed to be in Riels.
      if (!rielTotal && currency === '៛') {
         total = total / customExchangeRate;
         price = price / customExchangeRate;
      }

      // Final Date formatting
      // Many CSVs/Excels use M/D/YYYY or D/M/YYYY. JS `new Date()` handles MM/DD/YYYY well natively.
      let parsedDate = new Date(dateStr);
      // Fallback for weird formats
      if (isNaN(parsedDate.getTime())) {
         const parts = dateStr.toString().split('/');
         if (parts.length === 3) {
           // Assume D/M/YYYY as per screenshot
           parsedDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00Z`);
         }
      }
      if (isNaN(parsedDate.getTime())) parsedDate = new Date();

      return {
        item,
        category,
        quantity: isNaN(quantity) ? 1 : quantity,
        price: isNaN(price) ? 0 : price,
        total: isNaN(total) ? 0 : total,
        date: parsedDate.toISOString()
      };
    });

    if (parsedExpenses.length > 0) {
      setPendingImport(parsedExpenses);
    } else {
      setDialogConfig({ type: 'alert', message: 'No valid expenses found in the file.', onConfirm: () => {} });
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
            setDialogConfig({ type: 'alert', message: 'Failed to parse CSV file.', onConfirm: () => {} });
            return;
          }
          processParsedData(results.data);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Use header: 1 to get a 2D array and manually find the header row
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        const json = [];
        let headers = null;
        let currentSectionDate = new Date();
        
        for (const row of rawRows) {
          const cleanRow = [...row];
          while(cleanRow.length > 0 && cleanRow[cleanRow.length - 1] === "") cleanRow.pop();
          if (cleanRow.length === 0) continue;
          
          // Date section header (single cell)
          if (cleanRow.length === 1) {
            const cell = cleanRow[0];
            if (cell instanceof Date) {
               currentSectionDate = cell;
            } else if (typeof cell === 'string' && cell.match(/\d/)) {
               const d = new Date(cell);
               if (!isNaN(d.getTime())) currentSectionDate = d;
            }
            continue;
          }
          
          // Detect headers if not found yet
          if (!headers && cleanRow.some(c => typeof c === 'string' && (c.toLowerCase().includes('purchase') || c.toLowerCase().includes('item') || c.toLowerCase().includes('expense') || c.toLowerCase().includes('category')))) {
             headers = cleanRow.map(h => String(h).trim());
             continue;
          }
          
          // We have headers -> Map to object
          if (headers && cleanRow.length >= 2) {
             const obj = { 'Date': currentSectionDate };
             headers.forEach((h, i) => {
               if (h) obj[h] = cleanRow[i];
             });
             json.push(obj);
             continue;
          }
          
          // Heuristic fallback: No headers found, but looks like [String, Number]
          if (!headers && cleanRow.length >= 2) {
             const col0 = cleanRow[0];
             const col1 = cleanRow[1];
             let isData = false;
             let val = 0;
             if (typeof col1 === 'number') { isData = true; val = col1; }
             else if (typeof col1 === 'string' && col1.match(/^[\d,\.]+$/)) {
               val = parseFloat(col1.replace(/,/g, ''));
               if (!isNaN(val)) isData = true;
             }
             
             if (isData && typeof col0 === 'string') {
               json.push({
                 'Item': col0,
                 'Expense (riel)': val, // Assume Riel given the user's context
                 'Date': currentSectionDate
               });
             }
          }
        }
        
        // Fallback to standard parser if our heuristic found absolutely nothing
        processParsedData(json.length > 0 ? json : XLSX.utils.sheet_to_json(worksheet, { defval: "" }));
      };
      reader.readAsArrayBuffer(file);
    } else {
      setDialogConfig({ type: 'alert', message: 'Unsupported file type.', onConfirm: () => {} });
    }

    // Reset input
    event.target.value = '';
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) return setDialogConfig({ type: 'alert', message: 'No data to export.', onConfirm: () => {} });
    
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
    setDialogConfig({
      type: 'confirm',
      message: 'Are you absolutely sure? This will delete all your expenses permanently.',
      onConfirm: () => {
        onWipeData();
      }
    });
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
      <div className="glass-card flex-col gap-lg" style={{ marginBottom: '32px' }}>
        
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
      <div className="glass-card flex-col gap-md" style={{ marginBottom: '32px' }}>
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
            <span style={{ fontWeight: 500 }}>Monthly Limit ({currency})</span>
            <span className="text-small">Get alerted if you overspend</span>
          </div>
          <div style={{ width: '120px' }}>
            <input 
              type="number" 
              value={spendLimit ? (parseFloat(spendLimit) * (currency === '៛' ? customExchangeRate : 1)).toString() : ''}
              onChange={e => {
                const val = parseFloat(e.target.value);
                if (isNaN(val)) {
                  setSpendLimit('');
                } else {
                  setSpendLimit((val / (currency === '៛' ? customExchangeRate : 1)).toString());
                }
              }}
              placeholder={`e.g. ${currency === '៛' ? '2000000' : '500'}`}
              style={{ padding: '8px', textAlign: 'right' }}
            />
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Telegram Bot Alerts</h3>
      <div className="glass-card flex-col gap-md" style={{ marginBottom: '32px' }}>
        <div className="flex-row space-between" style={{ alignItems: 'center' }}>
          <div className="flex-col">
            <span style={{ fontWeight: 500 }}>Budget Overspend Warning</span>
            <span className="text-small">Bot DM when limit exceeded</span>
          </div>
          <div 
            onClick={() => {
              if (setNotificationSettings) {
                setNotificationSettings({ ...notificationSettings, budget_alerts: !notificationSettings.budget_alerts });
              }
            }}
            style={{ 
              width: '48px', height: '28px', borderRadius: '14px', 
              background: notificationSettings.budget_alerts ? 'var(--primary-color)' : 'var(--surface-border)', 
              position: 'relative', cursor: 'pointer', transition: 'background 0.3s'
            }}
          >
            <div style={{ 
              width: '24px', height: '24px', borderRadius: '50%', background: '#fff', 
              position: 'absolute', top: '2px', left: notificationSettings.budget_alerts ? '22px' : '2px', 
              transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
            }}></div>
          </div>
        </div>

        <div className="flex-row space-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}>
          <div className="flex-col">
            <span style={{ fontWeight: 500 }}>Automated Reports</span>
            <span className="text-small">Summary DM from the bot</span>
          </div>
          <select 
            value={notificationSettings.report_frequency || 'weekly'}
            onChange={e => {
              if (setNotificationSettings) {
                setNotificationSettings({ ...notificationSettings, report_frequency: e.target.value });
              }
            }}
            style={{ width: '120px', padding: '8px' }}
          >
            <option value="off">Off</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Custom Categories</h3>
      <div className="glass-card flex-col gap-md" style={{ marginBottom: '32px' }}>
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
            style={{ background: 'var(--primary-gradient)', color: 'var(--emerald-raw)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '24px', width: '48px', height: '48px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 15px var(--primary-glow), inset 0 2px 5px rgba(255,255,255,0.4)', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <h3 style={{ marginBottom: '16px' }}>Data Management</h3>
      <div className="glass-card flex-col gap-md">
        
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
          className="button-secondary flex-row space-between" 
          onClick={handleWipeData}
          style={{ width: '100%', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', color: 'var(--danger-color)', boxShadow: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={20} /> Wipe All Data
          </span>
        </button>
      </div>

      {pendingImport && (
        <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setPendingImport(null)}>
          <div className="bottom-sheet" style={{ height: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="header flex-row space-between" style={{ padding: '24px' }}>
              <h2>Import Preview</h2>
            <button onClick={() => setPendingImport(null)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <X size={28} />
            </button>
          </div>
          
          <div className="app-content" style={{ paddingBottom: '24px', flex: 1, overflowY: 'auto' }}>
            <div className="flex-row space-between" style={{ marginBottom: '16px', alignItems: 'center' }}>
              <p className="text-secondary" style={{ marginBottom: 0 }}>
                Found {pendingImport.length} expenses.
              </p>
              
              <div className="flex-row gap-xs" style={{ backgroundColor: 'var(--surface-color-elevated)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                <button 
                  onClick={() => setPreviewCurrency('$')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: previewCurrency === '$' ? 'var(--primary-color)' : 'transparent',
                    color: previewCurrency === '$' ? 'var(--bg-color)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  $
                </button>
                <button 
                  onClick={() => setPreviewCurrency('៛')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: previewCurrency === '៛' ? 'var(--primary-color)' : 'transparent',
                    color: previewCurrency === '៛' ? 'var(--bg-color)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ៛
                </button>
              </div>
            </div>
            
            <div className="glass-card flex-col gap-sm" style={{ marginBottom: '24px', maxHeight: '50vh', overflowY: 'auto' }}>
              {pendingImport.slice(0, 50).map((exp, idx) => {
                const previewRate = previewCurrency === '៛' ? customExchangeRate : 1;
                const isEditing = editingImportIdx === idx;
                
                if (isEditing) {
                  return (
                    <div key={idx} className="flex-row space-between gap-sm" style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                      <div className="flex-col gap-xs" style={{ flex: 1 }}>
                        <input 
                          className="input" 
                          value={draftImportItem} 
                          onChange={e => setDraftImportItem(e.target.value)} 
                          style={{ padding: '4px 8px', fontSize: '14px' }}
                        />
                        <select 
                          className="input" 
                          value={draftImportCategory} 
                          onChange={e => setDraftImportCategory(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '14px' }}
                        >
                          <option value="Food">🍔 Food</option>
                          <option value="Transport">🚗 Transport</option>
                          <option value="Shopping">🛍️ Shopping</option>
                          <option value="Entertainment">🎬 Entertainment</option>
                          <option value="Utilities">💡 Utilities</option>
                          <option value="Other">📦 Other</option>
                          {customCategories.map(c => (
                            <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-col gap-xs">
                        <button 
                          className="button" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => {
                            const newImport = [...pendingImport];
                            newImport[idx] = { ...newImport[idx], item: draftImportItem, category: draftImportCategory };
                            setPendingImport(newImport);
                            setEditingImportIdx(null);
                          }}
                        >
                          Save
                        </button>
                        <button 
                          className="button button-secondary" 
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => setEditingImportIdx(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={idx} 
                    className="flex-row space-between" 
                    style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                    onClick={() => {
                      setDraftImportItem(exp.item);
                      setDraftImportCategory(exp.category);
                      setEditingImportIdx(idx);
                    }}
                  >
                    <div className="flex-col">
                      <span style={{ fontWeight: 500 }}>{exp.item}</span>
                      <span className="text-small">{exp.category} • {exp.date.split('T')[0]}</span>
                    </div>
                    <span style={{ fontWeight: 600 }}>{previewCurrency}{(exp.total * previewRate).toLocaleString(undefined, previewCurrency === '$' ? {minimumFractionDigits: 2, maximumFractionDigits: 2} : {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                  </div>
                );
              })}
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
                onClick={async () => {
                  const success = await onImportData(pendingImport);
                  if (success) {
                    setPendingImport(null);
                    setDialogConfig({ type: 'alert', message: `Successfully imported ${pendingImport.length} expenses!`, onConfirm: () => {} });
                  }
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
        </div>
      )}
    </div>
  );
}
