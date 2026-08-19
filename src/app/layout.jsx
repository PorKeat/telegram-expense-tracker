import './globals.css';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')),
  title: 'Spendly Telegram Mini App',
  description: 'Expense tracker for Telegram',
  openGraph: {
    title: 'Spendly Expense Tracker',
    description: 'Track your expenses directly inside Telegram.',
    images: ['/og-image.jpg'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spendly Expense Tracker',
    description: 'Track your expenses directly inside Telegram.',
    images: ['/og-image.jpg'],
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
