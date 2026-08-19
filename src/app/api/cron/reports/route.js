import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req) {
  // Check authorization
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'No Bot Token' }, { status: 500 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Determine if today is Sunday (0) or 1st of month
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const isFirstOfMonth = today.getDate() === 1;

    if (!isSunday && !isFirstOfMonth) {
      return NextResponse.json({ message: 'No reports scheduled for today' });
    }

    // Fetch all user settings
    const { data: users, error: userError } = await supabase.from('user_settings').select('*');
    if (userError) throw userError;

    const messagesSent = [];

    for (const user of users) {
      const freq = user.report_frequency;
      if (freq === 'off') continue;
      
      const sendWeekly = freq === 'weekly' && isSunday;
      const sendMonthly = freq === 'monthly' && isFirstOfMonth;

      if (!sendWeekly && !sendMonthly) continue;

      // Calculate date range
      const startDate = new Date();
      if (sendWeekly) startDate.setDate(startDate.getDate() - 7);
      if (sendMonthly) startDate.setMonth(startDate.getMonth() - 1);
      
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('*')
        .eq('telegram_chat_id', user.telegram_chat_id)
        .gte('date', startDate.toISOString());
        
      if (expError || !expenses || expenses.length === 0) continue;

      const totalSpent = expenses.reduce((sum, e) => sum + Number(e.price * e.quantity), 0);
      
      const categories = {};
      let topExpense = expenses[0];

      expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + Number(e.price * e.quantity);
        if (Number(e.price * e.quantity) > Number(topExpense.price * topExpense.quantity)) topExpense = e;
      });

      const topCats = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      const title = sendWeekly ? 'WEEKLY REPORT' : 'MONTHLY REPORT';
      let message = `📊 <b>${title}</b>\n━━━━━━━━━━━━━━━\n💵 <b>Total Spent:</b> $${totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2})}\n\n<b>By Category:</b>\n`;
      
      topCats.forEach(cat => {
        message += `• ${cat[0]}: $${cat[1].toLocaleString(undefined, {minimumFractionDigits: 2})}\n`;
      });

      message += `\n<b>Largest Purchase:</b>\n• ${topExpense.item} ($${Number(topExpense.price * topExpense.quantity).toLocaleString(undefined, {minimumFractionDigits: 2})})\n━━━━━━━━━━━━━━━`;

      // Send via Telegram
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: user.telegram_chat_id,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      messagesSent.push(user.telegram_chat_id);
    }

    return NextResponse.json({ success: true, count: messagesSent.length, messagesSent });
  } catch (error) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
