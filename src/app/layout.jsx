import './globals.css';

export const metadata = {
  title: 'Spendly Telegram Mini App',
  description: 'Expense tracker for Telegram',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body suppressHydrationWarning>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
