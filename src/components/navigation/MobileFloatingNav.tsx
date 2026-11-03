'use client'

import Link from 'next/link'
import { getWhatsAppUrl } from '@/lib/whatsapp'
import { usePathname } from 'next/navigation'

interface MobileFloatingNavProps {
  whatsappNumber: string | null | undefined
}

export default function MobileFloatingNav({ whatsappNumber }: MobileFloatingNavProps) {
  const pathname = usePathname()
  const waUrl = getWhatsAppUrl(whatsappNumber) || `https://wa.me/94769750186`

  // Hide on admin pages
  if (pathname?.startsWith('/admin')) return null

  return (
    <nav
      aria-label="Mobile quick navigation"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        alignItems: 'center',
        // Only visible on mobile — CSS media query via className below
        pointerEvents: 'auto',
      }}
      className="mobile-floating-nav"
    >
      {/* Home */}
      <Link
        href="/"
        aria-label="Go to Home"
        className="mobile-float-btn"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#d64601',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(214, 70, 1, 0.45)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* Home icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9.75L12 3l9 6.75V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.75z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </Link>

      {/* Search */}
      <Link
        href="/menu"
        aria-label="Browse dresses"
        className="mobile-float-btn"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#d64601',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(214, 70, 1, 0.45)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* Search icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </Link>

      {/* WhatsApp */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="mobile-float-btn"
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          backgroundColor: '#d64601',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(214, 70, 1, 0.45)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        {/* WhatsApp icon */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.062-1.92-.47-1.464-.606-2.42-2.103-2.493-2.202-.072-.098-.59-1.848-.59-2.915 0-.967.49-1.442.665-1.637.174-.194.38-.243.507-.243.127 0 .253.002.364.007.117.006.275-.044.429.328.16.386.545 1.332.593 1.43.048.098.08.213.016.34-.064.128-.096.208-.19.319-.095.111-.2.247-.286.332-.095.096-.195.2-.084.391.111.191.493.813 1.057 1.316.726.647 1.337.848 1.528.943.191.096.302.08.414-.048.111-.128.476-.556.603-.746.127-.19.254-.159.428-.095.175.063 1.11.523 1.3.618.19.096.317.143.365.223.048.079.048.46-.096.865z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.688 0-3.26-.505-4.577-1.373l-.328-.216-2.972.834.84-2.885-.237-.346C3.784 14.61 3.25 13.345 3.25 12c0-4.825 3.925-8.75 8.75-8.75s8.75 3.925 8.75 8.75-3.925 8.75-8.75 8.75z" />
        </svg>
      </a>
    </nav>
  )
}
