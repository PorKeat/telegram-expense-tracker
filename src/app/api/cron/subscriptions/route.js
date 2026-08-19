import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../utils/supabase/server';
import { format, addMonths, addYears, parseISO, isBefore, isSameDay } from 'date-fns';

export async function GET(request) {
  // Verify Vercel Cron Secret to ensure only Vercel can trigger this
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = new Date();
  // We want to process any subscription where next_billing_date <= today
  const todayString = format(today, 'yyyy-MM-dd');

  // Fetch active subscriptions due for billing
  const { data: subscriptions, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('is_active', true)
    .lte('next_billing_date', todayString);

  if (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, processed: 0 });
  }

  let processedCount = 0;

  for (const sub of subscriptions) {
    // 1. Insert new expense
    const newExpense = {
      telegram_user_id: sub.telegram_user_id,
      telegram_chat_id: sub.telegram_chat_id,
      description: `🔄 Auto: ${sub.name}`,
      amount: sub.amount,
      total: sub.amount,
      category: sub.category,
      date: new Date().toISOString()
    };

    const { error: insertError } = await supabase.from('expenses').insert([newExpense]);

    if (!insertError) {
      // 2. Update next billing date
      let currentBillingDate = parseISO(sub.next_billing_date);
      let nextDate = sub.billing_cycle === 'yearly' 
        ? addYears(currentBillingDate, 1) 
        : addMonths(currentBillingDate, 1);
      
      // If it's still in the past (e.g. skipped multiple months), fast forward to next future date
      while (isBefore(nextDate, today) || isSameDay(nextDate, today)) {
        nextDate = sub.billing_cycle === 'yearly' ? addYears(nextDate, 1) : addMonths(nextDate, 1);
      }

      await supabase
        .from('subscriptions')
        .update({ next_billing_date: format(nextDate, 'yyyy-MM-dd') })
        .eq('id', sub.id);

      // 3. Notify user via Telegram
      if (sub.telegram_chat_id && sub.telegram_chat_id !== 'direct' && sub.telegram_chat_id !== 'private') {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (botToken) {
          try {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: sub.telegram_chat_id,
                text: `🔄 <b>Automated Subscription Logged</b>\n\nYour subscription for <b>${sub.name}</b> ($${sub.amount}) has been automatically logged.\nNext billing date: ${format(nextDate, 'MMM do, yyyy')}`,
                parse_mode: 'HTML'
              })
            });
          } catch (e) {
            console.error("Failed to send telegram notification:", e);
          }
        }
      }
      processedCount++;
    } else {
      console.error("Failed to insert auto expense:", insertError);
    }
  }

  return NextResponse.json({ success: true, processed: processedCount });
}
