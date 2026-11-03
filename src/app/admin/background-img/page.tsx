'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, RotateCcw, Sparkles, Check, Move, Layers, ExternalLink, Image as ImageIcon } from 'lucide-react'
import type { PortfolioBackground } from '@/types'

const DEFAULT_CLASSIC_BG = '/portfolio/background.jpg'
const DEFAULT_CUSTOM_BG = '/portfolio/custom-background.png'

const PRESETS = [
  { label: 'Top Center', x: 50, y: 0 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'Bottom Center', x: 50, y: 100 },
  { label: 'Top Left', x: 0, y: 0 },
  { label: 'Top Right', x: 100, y: 0 },
]

export default function AdminBackgroundImgPage() {
  const router = useRouter()
  const classicFileInputRef = useRef<HTMLInputElement>(null)
  const customFileInputRef = useRef<HTMLInputElement>(null)

  // Loading & feedback states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [recordId, setRecordId] = useState<string | null>(null)

  // Background state
  const [classicUrl, setClassicUrl] = useState(DEFAULT_CLASSIC_BG)
  const [customUrl, setCustomUrl] = useState(DEFAULT_CUSTOM_BG)
  const [classicPos, setClassicPos] = useState({ x: 50, y: 0 })
  const [customPos, setCustomPos] = useState({ x: 50, y: 0 })
  const [activeTheme, setActiveTheme] = useState<'classic' | 'custom'>('classic')

  // Upload progress states
  const [uploadingClassic, setUploadingClassic] = useState(false)
  const [uploadingCustom, setUploadingCustom] = useState(false)

  // Load existing configuration from Supabase or localStorage
  useEffect(() => {
    async function loadBackgrounds() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/admin/login')
          return
        }

        const { data, error } = await supabase
          .from('portfolio_backgrounds')
          .select('*')
          .limit(1)
          .maybeSingle()

        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
            setTableExists(false)
          } else {
            console.error('Error loading portfolio_backgrounds:', error.message)
          }
          // Fallback to localStorage
          loadFromLocalStorage()
        } else if (data) {
          setTableExists(true)
          setRecordId(data.id)
          if (data.classic_url) setClassicUrl(data.classic_url)
          if (data.custom_url) setCustomUrl(data.custom_url)
          if (data.classic_pos_x !== undefined && data.classic_pos_y !== undefined) {
            setClassicPos({ x: Number(data.classic_pos_x), y: Number(data.classic_pos_y) })
          }
          if (data.custom_pos_x !== undefined && data.custom_pos_y !== undefined) {
            setCustomPos({ x: Number(data.custom_pos_x), y: Number(data.custom_pos_y) })
          }
          if (data.active_theme) {
            setActiveTheme(data.active_theme as 'classic' | 'custom')
          }
        } else {
          // Table exists but is empty
          loadFromLocalStorage()
        }
      } catch (err: unknown) {
        console.error('Unexpected error loading backgrounds:', err)
        loadFromLocalStorage()
      } finally {
        setLoading(false)
      }
    }

    function loadFromLocalStorage() {
      try {
        const sClassic = localStorage.getItem('portfolio_bg_classic')
        if (sClassic) setClassicUrl(sClassic)

        const sCustom = localStorage.getItem('portfolio_bg_custom')
        if (sCustom) setCustomUrl(sCustom)

        const sClassicPos = localStorage.getItem('portfolio_bg_classic_pos')
        if (sClassicPos) setClassicPos(JSON.parse(sClassicPos))

        const sCustomPos = localStorage.getItem('portfolio_bg_custom_pos')
        if (sCustomPos) setCustomPos(JSON.parse(sCustomPos))

        const sTheme = localStorage.getItem('portfolio_bg_theme')
        if (sTheme === 'custom' || sTheme === 'classic') setActiveTheme(sTheme)
      } catch {}
    }

    loadBackgrounds()
  }, [router])

  // Upload handler for files (Uploads to Supabase storage 'dress-images' or data URL)
  async function handleFileUpload(file: File, target: 'classic' | 'custom') {
    if (!file || !file.type.startsWith('image/')) return

    const setUploading = target === 'classic' ? setUploadingClassic : setUploadingCustom
    setUploading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `portfolio-backgrounds/${target}_${Date.now()}_${cleanFileName}`

      const { error: uploadErr } = await supabase.storage.from('dress-images').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })

      if (uploadErr) {
        // Fallback: Read as base64 data URL so it never fails even if storage isn't configured
        console.warn('Storage upload failed, falling back to DataURL:', uploadErr.message)
        const reader = new FileReader()
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string
          if (target === 'classic') setClassicUrl(dataUrl)
          else setCustomUrl(dataUrl)
          setUploading(false)
          setSuccessMessage(`Loaded ${target === 'classic' ? 'Classic' : 'Custom'} image preview!`)
        }
        reader.readAsDataURL(file)
        return
      }

      const { data: urlData } = supabase.storage.from('dress-images').getPublicUrl(filePath)
      if (target === 'classic') setClassicUrl(urlData.publicUrl)
      else setCustomUrl(urlData.publicUrl)

      setSuccessMessage(`Uploaded ${target === 'classic' ? 'Classic' : 'Custom'} image successfully!`)
      setTimeout(() => setSuccessMessage(null), 3500)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // Save changes to database and sync to localStorage
  async function handleSave() {
    setSaving(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const supabase = createClient()

      // 1. Sync to localStorage for immediate client-side reactivity
      try {
        localStorage.setItem('portfolio_bg_classic', classicUrl)
        localStorage.setItem('portfolio_bg_custom', customUrl)
        localStorage.setItem('portfolio_bg_classic_pos', JSON.stringify(classicPos))
        localStorage.setItem('portfolio_bg_custom_pos', JSON.stringify(customPos))
        localStorage.setItem('portfolio_bg_theme', activeTheme)
      } catch {}

      // 2. Persist to Supabase portfolio_backgrounds table
      if (recordId) {
        const { error } = await supabase
          .from('portfolio_backgrounds')
          .update({
            classic_url: classicUrl,
            custom_url: customUrl,
            classic_pos_x: classicPos.x,
            classic_pos_y: classicPos.y,
            custom_pos_x: customPos.x,
            custom_pos_y: customPos.y,
            active_theme: activeTheme,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recordId)

        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('portfolio_backgrounds')
          .insert({
            classic_url: classicUrl,
            custom_url: customUrl,
            classic_pos_x: classicPos.x,
            classic_pos_y: classicPos.y,
            custom_pos_x: customPos.x,
            custom_pos_y: customPos.y,
            active_theme: activeTheme,
          })
          .select()
          .single()

        if (error) {
          if (error.message.includes('does not exist') || error.message.includes('schema cache')) {
            setTableExists(false)
          } else {
            throw error
          }
        } else if (data) {
          setRecordId(data.id)
          setTableExists(true)
        }
      }

      setSuccessMessage('Background images and positions saved successfully to database!')
      setTimeout(() => setSuccessMessage(null), 4000)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save background images.')
    } finally {
      setSaving(false)
    }
  }

  // Reset to default photographs
  function handleReset() {
    if (!confirm('Reset background images to atelier defaults?')) return
    setClassicUrl(DEFAULT_CLASSIC_BG)
    setCustomUrl(DEFAULT_CUSTOM_BG)
    setClassicPos({ x: 50, y: 0 })
    setCustomPos({ x: 50, y: 0 })
    setActiveTheme('classic')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white">
      {/* Admin Monograph Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 sm:px-10 py-5 flex justify-between items-center select-none">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/ecyvwovp/image/upload/v1788536047/logo.png"
            alt="Iroshi Dressmaker"
            className="w-10 h-10 object-contain rounded-full drop-shadow"
          />
          <div>
            <h1 className="font-serif italic text-xl font-bold text-white tracking-wide">
              Iroshi Dressmaker
            </h1>
            <span className="font-mono text-[9px] text-[#F4D389] tracking-widest uppercase">
              Management Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/portfolio"
            target="_blank"
            className="text-xs font-mono text-white/60 hover:text-[#F4D389] transition-colors no-underline hidden sm:inline-flex items-center gap-1.5"
          >
            <span>View Portfolio Live</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 hover:text-white transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-10 pb-4 border-b border-white/10 font-mono text-xs">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/dresses"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Manage Catalog
          </Link>
          <Link
            href="/admin/dresses/new"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            + Add New Dress
          </Link>
          <Link
            href="/admin/featured-images"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Homepage Images
          </Link>
          <Link
            href="/admin/latest-collection"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Latest Collection
          </Link>
          <Link
            href="/admin/background-img"
            className="px-4 py-2 rounded-full bg-white/10 text-white font-medium no-underline flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#F4D389]" />
            <span>Background Img</span>
          </Link>
          <Link
            href="/admin/settings"
            className="px-4 py-2 rounded-full text-white/60 hover:text-white hover:bg-white/5 transition-all no-underline"
          >
            Site Settings
          </Link>
        </div>

        {/* Page Title & Intro */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] block mb-1">
              Portfolio Showcase Atmosphere
            </span>
            <h2 className="font-serif italic text-3xl sm:text-4xl text-white font-medium">
              Background Img
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
              Manage the two full-page dual backgrounds (Classic &amp; Custom) featured on the /portfolio page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-white/80 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] disabled:opacity-50 text-white font-semibold text-xs font-mono tracking-wider uppercase transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-mono flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs sm:text-sm font-mono">
            {errorMessage}
          </div>
        )}

        {/* SQL Table Notice if table not created yet */}
        {!tableExists && (
          <div className="mb-8 p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
            <div className="flex items-center gap-2 mb-2 font-mono text-xs uppercase tracking-wider text-amber-300 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Supabase Table Notice</span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed mb-3">
              The <code className="px-1.5 py-0.5 rounded bg-black/40 text-[#F4D389]">portfolio_backgrounds</code> table is not created in your Supabase project yet. Your changes are currently saved in browser localStorage.
            </p>
            <p className="text-xs text-white/60 mb-2">
              To persist background changes across all users and devices, run the migration script in your Supabase SQL Editor:
            </p>
            <pre className="p-3 rounded-lg bg-black/80 border border-white/10 font-mono text-[11px] text-amber-200/90 overflow-x-auto select-all">
{`CREATE TABLE IF NOT EXISTS portfolio_backgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classic_url TEXT NOT NULL DEFAULT '/portfolio/background.jpg',
  custom_url TEXT NOT NULL DEFAULT '/portfolio/custom-background.png',
  classic_pos_x NUMERIC NOT NULL DEFAULT 50,
  classic_pos_y NUMERIC NOT NULL DEFAULT 0,
  custom_pos_x NUMERIC NOT NULL DEFAULT 50,
  custom_pos_y NUMERIC NOT NULL DEFAULT 0,
  active_theme TEXT NOT NULL DEFAULT 'classic',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE portfolio_backgrounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read portfolio backgrounds" ON portfolio_backgrounds FOR SELECT USING (true);
CREATE POLICY "Admin write portfolio backgrounds" ON portfolio_backgrounds FOR ALL USING (auth.role() = 'authenticated');`}
            </pre>
          </div>
        )}

        {/* Global Default Theme Selector */}
        <div className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/10 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif italic text-lg text-white font-medium">Default Active Backdrop</h3>
            <p className="text-xs text-white/60 font-light mt-0.5">
              Choose which image visitors see first when they open the /portfolio page.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTheme('classic')}
              className={`px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTheme === 'classic'
                  ? 'bg-[#F4D389] text-black font-semibold shadow-[0_0_15px_rgba(244,211,137,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/15'
              }`}
            >
              Classic (Original)
            </button>
            <button
              type="button"
              onClick={() => setActiveTheme('custom')}
              className={`px-5 py-2 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                activeTheme === 'custom'
                  ? 'bg-[#F4D389] text-black font-semibold shadow-[0_0_15px_rgba(244,211,137,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/15'
              }`}
            >
              Custom (Alternate)
            </button>
          </div>
        </div>

        {/* Dual Backgrounds Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* ================= Classic Background Card ================= */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F4D389]" />
                  <h3 className="font-serif italic text-xl sm:text-2xl text-white font-medium">
                    Classic Background
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  Primary Red
                </span>
              </div>

              {/* Preview Window */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black/60 mb-5 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={classicUrl}
                  alt="Classic Background Preview"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ objectPosition: `${classicPos.x}% ${classicPos.y}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/80 pointer-events-none">
                  <span>Pos: X {classicPos.x}%, Y {classicPos.y}%</span>
                  <span className="text-[#F4D389]">Classic</span>
                </div>
              </div>

              {/* Upload & URL Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Image URL or Cloudinary Path
                  </label>
                  <input
                    type="text"
                    value={classicUrl}
                    onChange={(e) => setClassicUrl(e.target.value)}
                    placeholder="https://... or /portfolio/background.jpg"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-[#F4D389] transition-colors"
                  />
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    ref={classicFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'classic')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => classicFileInputRef.current?.click()}
                    disabled={uploadingClassic}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-mono text-white/80 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#F4D389]" />
                    <span>{uploadingClassic ? 'Uploading...' : 'Upload Image File'}</span>
                  </button>
                </div>

                {/* Position Sliders */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white/60 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-[#F4D389]" />
                      <span>Position Coordinates</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#F4D389]">
                      X: {classicPos.x}% · Y: {classicPos.y}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-white/50 block mb-1">Horizontal (X)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={classicPos.x}
                        onChange={(e) => setClassicPos({ ...classicPos, x: Number(e.target.value) })}
                        className="w-full accent-[#F4D389] cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-white/50 block mb-1">Vertical (Y)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={classicPos.y}
                        onChange={(e) => setClassicPos({ ...classicPos, y: Number(e.target.value) })}
                        className="w-full accent-[#F4D389] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setClassicPos({ x: p.x, y: p.y })}
                        className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/70 hover:text-white transition-all cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= Custom Background Card ================= */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <h3 className="font-serif italic text-xl sm:text-2xl text-white font-medium">
                    Custom Background
                  </h3>
                </div>
                <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                  Alternate Mood
                </span>
              </div>

              {/* Preview Window */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/15 bg-black/60 mb-5 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={customUrl}
                  alt="Custom Background Preview"
                  className="w-full h-full object-cover transition-all duration-300"
                  style={{ objectPosition: `${customPos.x}% ${customPos.y}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-white/80 pointer-events-none">
                  <span>Pos: X {customPos.x}%, Y {customPos.y}%</span>
                  <span className="text-blue-300">Custom</span>
                </div>
              </div>

              {/* Upload & URL Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Image URL or Cloudinary Path
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://... or /portfolio/custom-background.png"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-xs font-mono text-white focus:outline-none focus:border-blue-400 transition-colors"
                  />
                </div>

                {/* Upload Button */}
                <div>
                  <input
                    ref={customFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'custom')
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => customFileInputRef.current?.click()}
                    disabled={uploadingCustom}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 text-xs font-mono text-white/80 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>{uploadingCustom ? 'Uploading...' : 'Upload Image File'}</span>
                  </button>
                </div>

                {/* Position Sliders */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-white/60 flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-blue-400" />
                      <span>Position Coordinates</span>
                    </span>
                    <span className="text-[11px] font-mono text-blue-300">
                      X: {customPos.x}% · Y: {customPos.y}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-mono text-white/50 block mb-1">Horizontal (X)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={customPos.x}
                        onChange={(e) => setCustomPos({ ...customPos, x: Number(e.target.value) })}
                        className="w-full accent-blue-400 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-white/50 block mb-1">Vertical (Y)</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={customPos.y}
                        onChange={(e) => setCustomPos({ ...customPos, y: Number(e.target.value) })}
                        className="w-full accent-blue-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setCustomPos({ x: p.x, y: p.y })}
                        className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-white/70 hover:text-white transition-all cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
