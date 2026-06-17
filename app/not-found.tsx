import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        background: '#0a0a0a',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
      }}
    >
      <h1 style={{ fontSize: '4rem', color: '#ef4444' }}>404</h1>
      <p style={{ color: '#9ca3af' }}>Page not found</p>
      <Link href="/" style={{ color: '#22d3ee', marginTop: '1rem' }}>
        ← Return home
      </Link>
    </div>
  )
}
