import re

with open("src/app/page.jsx", "r") as f:
    content = f.read()

# 1. Add localStorage cache fetching inside fetchExpenses
fetch_patch = """
      const fetchExpenses = async () => {
        const startTime = Date.now();
        
        // 1. Instantly load cached offline expenses
        const cached = localStorage.getItem(`${dynamicKey}_cached_expenses`);
        if (cached) {
          try { setExpenses(JSON.parse(cached)); } catch(e) {}
        }

        // 2. Fetch from Supabase
        const { data, error } = await supabase
"""
content = content.replace("      const fetchExpenses = async () => {\n        const startTime = Date.now();\n        \n        const { data, error } = await supabase", fetch_patch)

# 2. Add useEffect to save expenses to cache
cache_effect = """
  useEffect(() => {
    if (expenses.length > 0 && storageKey) {
      localStorage.setItem(`${storageKey}_cached_expenses`, JSON.stringify(expenses));
    }
  }, [expenses, storageKey]);

  useEffect(() => {
    localStorage.setItem('spendly_currency', currency);
"""
content = content.replace("  useEffect(() => {\n    localStorage.setItem('spendly_currency', currency);", cache_effect)

# 3. Handle offline saving and sync in handleAddExpense
add_patch = """
    // Let Supabase generate the ID if it's a new UUID table
    if (typeof newExpense.id === 'number') {
      delete newExpense.id;
    }

    try {
      if (!navigator.onLine) throw new Error("Offline");

      const { data, error } = await supabase
        .from('expenses')
        .insert([newExpense])
        .select();

      if (data && data.length > 0) {
        setExpenses([data[0], ...expenses]);
      } else if (error) {
        throw error;
      }
    } catch (err) {
      console.log("Saving offline...");
      newExpense.id = Date.now(); // Temp offline ID
      newExpense.is_offline = true;
      setExpenses([newExpense, ...expenses]);
      setDialogConfig({ type: 'alert', message: "You are offline. Expense saved locally and will sync when you reconnect.", onConfirm: () => {} });
    }
"""
old_add = """    // Let Supabase generate the ID if it's a new UUID table
    if (typeof newExpense.id === 'number') {
      delete newExpense.id;
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert([newExpense])
      .select();

    if (data && data.length > 0) {
      setExpenses([data[0], ...expenses]);
    } else if (error) {
      console.error(error);
      setDialogConfig({ type: 'alert', message: "Failed to save to cloud", onConfirm: () => {} });
    }"""
content = content.replace(old_add, add_patch)

# 4. Add offline sync listener
sync_patch = """
  // Offline Sync Queue Listener
  useEffect(() => {
    const syncOffline = async () => {
      const offlineItems = expenses.filter(e => e.is_offline);
      if (offlineItems.length === 0) return;

      console.log("Syncing offline items...", offlineItems);
      const itemsToSync = offlineItems.map(item => {
        const { id, is_offline, ...rest } = item; // Remove temp ID and flag
        return rest;
      });

      const { data, error } = await supabase.from('expenses').insert(itemsToSync).select();
      
      if (data) {
        // Replace offline items with synced items from DB
        setExpenses(prev => {
          const onlineItems = prev.filter(e => !e.is_offline);
          return [...data, ...onlineItems].sort((a, b) => new Date(b.date) - new Date(a.date));
        });
      }
    };

    window.addEventListener('online', syncOffline);
    return () => window.removeEventListener('online', syncOffline);
  }, [expenses]);

  const renderContent = () => {
"""
content = content.replace("  const renderContent = () => {", sync_patch)

with open("src/app/page.jsx", "w") as f:
    f.write(content)

print("page.jsx updated for offline support!")
