export default function LoadingSkeleton() {
  return (
    <div className="app-content">
      {/* Header Skeleton */}
      <div className="header flex-row space-between" style={{ paddingTop: '20px', paddingBottom: '24px' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%', margin: 0 }}></div>
        <div className="skeleton skeleton-text" style={{ width: '48px', height: '48px', borderRadius: '24px' }}></div>
      </div>

      {/* Main Card Skeleton */}
      <div className="skeleton skeleton-card" style={{ height: '220px', marginBottom: '32px' }}></div>

      {/* List Items Skeleton */}
      <div className="flex-col gap-md">
        <div className="flex-row space-between">
          <div className="skeleton skeleton-title" style={{ width: '30%', margin: 0 }}></div>
          <div className="skeleton skeleton-title" style={{ width: '20%', margin: 0 }}></div>
        </div>
        
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card flex-row gap-md" style={{ padding: '16px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '48px', height: '48px', borderRadius: '16px' }}></div>
            <div className="flex-col gap-xs" style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '70%' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '14px' }}></div>
            </div>
            <div className="skeleton skeleton-text" style={{ width: '60px' }}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
