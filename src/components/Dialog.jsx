export default function Dialog({ config, onClose }) {
  if (!config) return null;

  const isConfirm = config.type === 'confirm';

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, justifyContent: 'flex-end', animation: 'none', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div 
        className="glass-card flex-col gap-md" 
        style={{ 
          margin: '0', 
          animation: 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          paddingBottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)',
          borderLeft: 'none',
          borderRight: 'none',
          borderBottom: 'none'
        }}
      >
        <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--surface-border)', borderRadius: '2px', margin: '0 auto 8px auto' }} />
        
        <h3 style={{ textAlign: 'center', marginBottom: '8px' }}>
          {isConfirm ? 'Are you sure?' : 'Notice'}
        </h3>
        
        <p className="text-secondary" style={{ textAlign: 'center', marginBottom: '16px', lineHeight: 1.5 }}>
          {config.message}
        </p>

        <div className="flex-row gap-sm">
          {isConfirm && (
            <button 
              className="button button-secondary" 
              onClick={() => {
                if (config.onCancel) config.onCancel();
                onClose();
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          )}
          <button 
            className="button" 
            onClick={() => {
              if (config.onConfirm) config.onConfirm();
              onClose();
            }}
            style={{ flex: 1, backgroundColor: isConfirm ? 'var(--danger-color)' : 'var(--primary-color)', color: isConfirm ? 'white' : 'var(--emerald-raw)' }}
          >
            {isConfirm ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
