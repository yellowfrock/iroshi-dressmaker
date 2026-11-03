import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        textAlign: 'center',
        padding: 'var(--space-8)',
      }}
    >
      <div>
        <p
          style={{
            fontSize: '5rem',
            marginBottom: 'var(--space-4)',
          }}
          aria-hidden="true"
        >
          👗
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--font-size-lg)',
            maxWidth: '400px',
            marginInline: 'auto',
            marginBottom: 'var(--space-8)',
            lineHeight: 1.7,
          }}
        >
          The page you are looking for does not exist. Browse our collection instead.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/portfolio#latest-collection" className="btn-secondary">
            Latest Collection
          </Link>
        </div>
      </div>
    </div>
  )
}
