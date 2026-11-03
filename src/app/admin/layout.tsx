import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Management | Iroshi Dress Maker',
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white">
      {children}
    </div>
  )
}
