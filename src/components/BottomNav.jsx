import { Home, List, PieChart, Settings, Plus } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onAddClick, hideAdd }) {
  const navItemsLeft = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'history', icon: List, label: 'Expenses' }
  ];
  
  const navItemsRight = [
    { id: 'reports', icon: PieChart, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="floating-nav-container">
      <nav className="bottom-nav-pill glass-pill" style={{ position: 'relative', overflow: 'visible', padding: '4px 16px', display: 'flex', justifyContent: 'space-between' }}>
        
        {/* Left Side */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {navItemsLeft.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Center Space for FAB */}
        <div style={{ width: '60px' }}></div>

        {/* Right Side */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {navItemsRight.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Floating Center Button */}
        {!hideAdd && (
          <button 
            className="fab" 
            onClick={onAddClick}
            aria-label="Add Expense"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '24px',
              zIndex: 110,
              width: '64px',
              height: '64px',
              borderRadius: '32px'
            }}
          >
            <Plus size={32} strokeWidth={2.5} />
          </button>
        )}
      </nav>
    </div>
  );
}
