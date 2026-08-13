# Spendly - Telegram Expense Tracker 💰

Spendly is a modern, mobile-first Telegram Mini App (Web App) built to track your daily expenses seamlessly within Telegram. It features a luxurious Emerald, Brown, and Gold color palette, fast interactions, and context-aware data isolation.

## ✨ Features

- **Telegram Integrated**: Built specifically as a Telegram Web App. It automatically reads user and chat context from `initDataUnsafe`.
- **Context-Aware Data Isolation**: Your data is securely namespaced based on *who* opens the app and *where* they open it. 
  - Open it in your private chat for personal expenses.
  - Open it in a group chat to track shared expenses.
- **Multi-Currency Support**: First-class support for USD and Cambodian Riels (៛), with a customizable exchange rate right from the settings.
- **Budgeting & Alerts**: Set a Monthly Limit and get native Telegram warning popups the moment you overspend.
- **Luxurious UI**: A strict 3-color design system (Emerald Green, Deep Brown, and Gold) ensuring a premium and consistent experience.
- **Data Portability**: Export your expense history directly to a CSV file.
- **Privacy First**: Everything is stored directly on your device (`localStorage`) mapped to your Telegram ID.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Vanilla CSS (Strict CSS Variables)
- **Icons**: Lucide React
- **Date Parsing**: date-fns
- **Package Manager**: pnpm

## 🛠️ Local Development

1. Clone the repository:
```bash
git clone https://github.com/PorKeat/telegram-expense-tracker.git
cd telegram-expense-tracker
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

## 🌍 Deployment

To deploy Spendly as a Telegram bot:

1. Build the production application:
```bash
pnpm run build
```
2. Host the `dist/` directory on a static hosting provider (Vercel, Netlify, Firebase, GitHub Pages).
3. Go to Telegram, message **@BotFather**, create a `/newbot`, and link your hosted URL via the `/newapp` or `/setmenubutton` commands.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 License

MIT
