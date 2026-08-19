import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { chat_id, text } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is not set in environment variables');
      return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
    }

    if (!chat_id || !text) {
      return NextResponse.json({ error: 'Missing chat_id or text' }, { status: 400 });
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Telegram API Error:', data);
      return NextResponse.json({ error: data.description || 'Failed to send message' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Notification API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
