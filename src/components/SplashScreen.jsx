export default function SplashScreen({ isFadingOut }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: '#000000',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999,
      opacity: isFadingOut ? 0 : 1,
      transition: 'opacity 0.6s ease-in-out',
      pointerEvents: 'none'
    }}>
      <div style={{
        animation: 'netflixZoom 3s cubic-bezier(0.1, 0.1, 0.25, 1) forwards',
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
          }}
        />
        <h1 style={{
          fontSize: '34px',
          fontWeight: 800,
          color: '#ffffff',
          margin: 0,
          letterSpacing: '0.5px'
        }}>
          Spendly
        </h1>
      </div>

      <style jsx>{`
        @keyframes netflixZoom {
          0% { transform: scale(0.9); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
