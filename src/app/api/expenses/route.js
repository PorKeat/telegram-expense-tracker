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
  // Fetch expenses for this user
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('telegram_user_id', user.id.toString())
    .order('date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await request.json();
  const supabase = createAdminClient();

  // Support array of expenses (for offline sync) or a single expense
  const items = Array.isArray(body) ? body : [body];
  
  // Force telegram_user_id to be the authenticated user to prevent spoofing
  const safeItems = items.map(item => {
    const { id, is_offline, ...safeItem } = item; // strip fake client IDs
    return {
      ...safeItem,
      telegram_user_id: user.id.toString(),
      // Keep telegram_chat_id from client, or fallback to private
      telegram_chat_id: item.telegram_chat_id || 'private' 
    };
  });

  const { data, error } = await supabase
    .from('expenses')
    .insert(safeItems)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(request) {
  const { user, error: authError } = authenticate(request);
  if (authError) return NextResponse.json({ error: authError }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body;
  
  if (!id) return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });

  const supabase = createAdminClient();
  
  // Important: Use .eq('telegram_user_id', user.id) to ensure users can only update THEIR OWN expenses
  const { data, error } = await supabase
    .from('expenses')
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
  
  if (!id) return NextResponse.json({ error: 'Missing expense ID' }, { status: 400 });

  const supabase = createAdminClient();
  
  // Important: Use .eq('telegram_user_id', user.id) to ensure users can only delete THEIR OWN expenses
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('telegram_user_id', user.id.toString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
