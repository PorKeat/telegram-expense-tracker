import crypto from 'crypto';

export function verifyTelegramWebAppData(initData) {
  if (!initData) return null;
  
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) return null;
    
    urlParams.delete('hash');
    
    // Sort keys alphabetically
    const keys = Array.from(urlParams.keys()).sort();
    const dataCheckString = keys.map(key => `${key}=${urlParams.get(key)}`).join('\n');
    
    // Generate secret key using HMAC-SHA256 with "WebAppData" string
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN || '')
      .digest();
      
    // Generate the hash using the secret key and the dataCheckString
    const generatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
      
    if (generatedHash !== hash) {
      console.error("Telegram verification failed: Hash mismatch");
      return null;
    }
    
    // If valid, parse and return the user object
    const userString = urlParams.get('user');
    if (userString) {
      const user = JSON.parse(userString);
      return user;
    }
    return null;
  } catch (error) {
    console.error("Telegram verification error:", error);
    return null;
  }
}
