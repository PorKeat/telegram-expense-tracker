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

export async function POST(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const supabase = createAdminClient();
  
  // Wipe all expenses belonging to this authenticated user
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('telegram_user_id', user.id.toString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
