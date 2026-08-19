export default function SplashScreen() {
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
    }}>
      <div style={{
        animation: 'pulseLogo 1.5s infinite ease-in-out',
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
            borderRadius: '24px',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
            marginBottom: '24px'
          }}
        />
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          background: 'linear-gradient(to right, #fbbf24, #10b981)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          letterSpacing: '-0.5px'
        }}>
          Spendly
        </h1>
      </div>

      <style jsx>{`
        @keyframes pulseLogo {
          0% { transform: scale(0.95); opacity: 0.8; filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.2)); }
          50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 25px rgba(16, 185, 129, 0.6)); }
          100% { transform: scale(0.95); opacity: 0.8; filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.2)); }
        }
      `}</style>
    </div>
  );
}
