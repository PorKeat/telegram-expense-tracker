export default function manifest() {
  return {
    name: 'Spendly Expense Tracker',
    short_name: 'Spendly',
    description: 'Track your expenses directly inside Telegram.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1b1e',
    theme_color: '#10b981',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'apple touch icon'
      }
    ],
  }
}
