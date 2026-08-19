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

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('telegram_user_id', user.id.toString())
    .order('next_billing_date', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await request.json();
  const supabase = createAdminClient();

  const newSub = {
    ...body,
    telegram_user_id: user.id.toString(),
    telegram_chat_id: body.telegram_chat_id || 'private',
    is_active: true
  };
  
  if (newSub.id) delete newSub.id; // ensure ID is auto-generated

  const { data, error } = await supabase
    .from('subscriptions')
    .insert([newSub])
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  
  if (!id) return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .eq('telegram_user_id', user.id.toString())
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) return NextResponse.json({ error: 'Missing subscription ID' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)
    .eq('telegram_user_id', user.id.toString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
