'use client'

import { getWhatsAppUrl } from '@/lib/whatsapp'

interface FloatingWhatsAppButtonProps {
  whatsappNumber: string | null | undefined
}

export default function FloatingWhatsAppButton({ whatsappNumber }: FloatingWhatsAppButtonProps) {
  const url = getWhatsAppUrl(whatsappNumber)

  if (!url) return null

  return (
    <aside
      aria-label="Direct WhatsApp Contact"
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        zIndex: 999,
      }}
    >
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Iroshi Dress Maker on WhatsApp"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#25D366',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '999px',
          textDecoration: 'none',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4), 0 2px 6px rgba(0,0,0,0.1)',
          fontWeight: 600,
          fontSize: 'var(--font-size-sm)',
          transition: 'all 0.25s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)'
          e.currentTarget.style.boxShadow = '0 12px 28px rgba(37, 211, 102, 0.55), 0 4px 10px rgba(0,0,0,0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(37, 211, 102, 0.4), 0 2px 6px rgba(0,0,0,0.1)'
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.062-1.92-.47-1.464-.606-2.42-2.103-2.493-2.202-.072-.098-.59-1.848-.59-2.915 0-.967.49-1.442.665-1.637.174-.194.38-.243.507-.243.127 0 .253.002.364.007.117.006.275-.044.429.328.16.386.545 1.332.593 1.43.048.098.08.213.016.34-.064.128-.096.208-.19.319-.095.111-.2.247-.286.332-.095.096-.195.2-.084.391.111.191.493.813 1.057 1.316.726.647 1.337.848 1.528.943.191.096.302.08.414-.048.111-.128.476-.556.603-.746.127-.19.254-.159.428-.095.175.063 1.11.523 1.3.618.19.096.317.143.365.223.048.079.048.46-.096.865z" />
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.98-1.399C8.423 21.498 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18c-1.688 0-3.26-.505-4.577-1.373l-.328-.216-2.972.834.84-2.885-.237-.346C3.784 14.61 3.25 13.345 3.25 12c0-4.825 3.925-8.75 8.75-8.75s8.75 3.925 8.75 8.75-3.925 8.75-8.75 8.75z" />
        </svg>
        <span className="hidden sm:inline">Enquire via WhatsApp</span>
      </a>
    </aside>
  )
}
