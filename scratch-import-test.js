import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const mockExpense = {
    telegram_user_id: 'private',
    telegram_chat_id: 'direct',
    item: 'Test Import',
    category: 'Other',
    quantity: 1,
    price: 10,
    total: 10,
    date: new Date().toISOString()
  };
  
  const { data, error } = await supabase.from('expenses').insert([mockExpense]).select();
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}
run();
