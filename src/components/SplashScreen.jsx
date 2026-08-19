export default function SplashScreen({ isFadingOut }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg-color)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      opacity: isFadingOut ? 0 : 1,
      transition: 'opacity 0.4s ease-out',
    }}>
      <div style={{
        animation: 'smoothEntry 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <img 
          src="/icon.png" 
          alt="Spendly Logo" 
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '28px',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          }}
        />
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          Spendly
        </h1>
      </div>

      <style jsx>{`
        @keyframes smoothEntry {
          0% { transform: scale(0.85); opacity: 0; filter: blur(4px); }
          100% { transform: scale(1); opacity: 1; filter: blur(0px); }
        }
      `}</style>
    </div>
  );
}
