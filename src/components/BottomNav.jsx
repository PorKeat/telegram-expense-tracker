import { Home, List, PieChart, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: List, label: 'Expenses' },
    { id: 'reports', icon: PieChart, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="floating-nav-container">
      <nav className="bottom-nav-pill glass-pill">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
