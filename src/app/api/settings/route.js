import { NextResponse } from 'next/server';
import { verifyTelegramWebAppData } from '../../../utils/telegramAuth';
import { createAdminClient } from '../../../utils/supabase/server';

function authenticate(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header' };
  }
  const initData = authHeader.split('Bearer ')[1];
  const user = verifyTelegramWebAppData(initData);
  if (!user) {
    return { error: 'Unauthorized: Invalid Telegram signature' };
  }
  return { user };
}

export async function GET(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get('chat_id');
  if (!chatId) return NextResponse.json({ error: 'Missing chat_id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('telegram_chat_id', chatId)
    .single();

  // If no settings exist yet, return defaults
  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ data: { budget_alerts: true, report_frequency: 'weekly' } });
  }
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await request.json();
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      telegram_chat_id: body.chat_id,
      budget_alerts: body.budget_alerts,
      report_frequency: body.report_frequency
    });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
