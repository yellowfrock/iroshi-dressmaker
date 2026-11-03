'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050505] text-[#e5e5e5]">
      {/* Ambient Radial Vignette */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a24 0%, #050505 100%)' }}
      />

      <div className="relative z-10 w-full max-w-md bg-[#0a0a0a] rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl">
        {/* Header & Logo Seal */}
        <div className="text-center mb-8 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788536047/logo.png"
            alt="Iroshi Dressmaker"
            className="w-16 h-16 object-contain rounded-full drop-shadow-[0_0_20px_rgba(244,211,137,0.3)] mb-4"
          />
          <span className="font-mono text-[10px] text-[#F4D389] tracking-widest uppercase mb-1">
            Atelier Management Portal
          </span>
          <h1 className="font-serif italic text-3xl text-white font-medium">
            Admin Access
          </h1>
          <p className="text-xs text-white/50 mt-1">
            Sign in to manage bridal &amp; rental collections
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="p-3.5 mb-6 rounded-xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono"
          >
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
            >
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="admin@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[46px] mt-2 py-3 px-6 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-medium text-sm transition-all shadow-[0_8px_25px_rgba(216,27,43,0.35)] disabled:opacity-50 cursor-pointer active:scale-[0.98]"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          <Link
            href="/"
            className="font-mono text-xs text-white/50 hover:text-white transition-colors no-underline"
          >
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  )
}
