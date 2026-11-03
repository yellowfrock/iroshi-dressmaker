'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'

export default function SareeCollectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[SareeCollectionError]', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-20 bg-[#050505] text-[#e5e5e5]">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-black/50 border border-white/10 backdrop-blur-md shadow-2xl">
        <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center mx-auto mb-4 text-red-400">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h2 className="text-xl font-serif italic text-white font-medium mb-2">
          Unable to Load Saree Collection
        </h2>
        <p className="text-xs sm:text-sm text-white/60 mb-6 font-light leading-relaxed">
          We encountered a temporary connection issue while retrieving our atelier collection. Please try refreshing or return to the portfolio.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#F4D389] hover:bg-[#ebd080] text-black font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Retry
          </button>
          <Link
            href="/portfolio#saree-collection"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-mono text-xs tracking-wider transition-all no-underline text-center"
          >
            Back to Portfolio
          </Link>
        </div>
      </div>
    </div>
  )
}
