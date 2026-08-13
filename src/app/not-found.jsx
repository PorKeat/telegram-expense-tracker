import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="app-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: '24px' }}>
      <h1 style={{ fontSize: '80px', color: 'var(--primary-color)', marginBottom: '16px' }}>404</h1>
      <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Page Not Found</h2>
      <p className="text-secondary" style={{ marginBottom: '32px', maxWidth: '300px' }}>
        The page you are looking for doesn't exist or has been moved.
      </p>
      <Link href="/" className="button" style={{ textDecoration: 'none' }}>
        Return Home
      </Link>
    </div>
  );
}
