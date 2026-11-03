'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface SiteSettings {
  id: string
  business_name: string | null
  whatsapp_number: string | null
  contact_email: string | null
  phone_number: string | null
  address: string | null
  instagram_url: string | null
  facebook_url: string | null
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle()
      if (error) {
        setError(error.message)
        return
      }
      setSettings(data)
      setLoading(false)
    }
    loadSettings()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (!settings) return
    setSettings((prev) => (prev ? { ...prev, [e.target.name]: e.target.value } : prev))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('site_settings')
      .update({
        business_name: settings.business_name,
        whatsapp_number: settings.whatsapp_number,
        contact_email: settings.contact_email,
        phone_number: settings.phone_number,
        address: settings.address,
        instagram_url: settings.instagram_url,
        facebook_url: settings.facebook_url,
      })
      .eq('id', settings.id)

    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e5e5e5] font-sans selection:bg-[#ff4d4d] selection:text-white pb-20">
      {/* Admin Monograph Header */}
      <header className="bg-[#0a0a0a] border-b border-white/10 px-6 sm:px-10 py-5 flex justify-between items-center select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="text-xs font-mono text-white/60 hover:text-white transition-colors no-underline"
          >
            ← Dashboard
          </Link>
          <span className="text-white/20">|</span>
          <h1 className="font-serif italic text-xl font-bold text-white tracking-wide">
            Site Settings
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-10">
        <div className="mb-8">
          <span className="font-mono text-xs uppercase tracking-wider text-[#F4D389] block mb-1">
            Global Configuration
          </span>
          <h2 className="font-serif italic text-2xl sm:text-3xl text-white font-medium">
            Atelier Contact &amp; Channels
          </h2>
          <p className="text-xs sm:text-sm text-white/60 font-light mt-1">
            Configure the primary WhatsApp booking phone number and studio details.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-4 mb-6 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-200 text-xs font-mono"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="p-4 mb-6 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-mono"
          >
            ✅ Settings updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* WhatsApp Primary Configuration */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-xl space-y-4">
            <h3 className="font-serif italic text-xl text-white font-medium">
              Primary WhatsApp Contact Number
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              This number is automatically prefilled whenever visitors click any &quot;Book Fitting&quot; or &quot;Enquire on WhatsApp&quot; button across the website.
            </p>

            <Field
              id="whatsapp_number"
              label="WhatsApp Number (International without + or spaces)"
              name="whatsapp_number"
              value={settings?.whatsapp_number ?? ''}
              onChange={handleChange}
              placeholder="e.g. 94769750186"
            />

            {settings?.whatsapp_number && (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs font-mono flex items-center justify-between">
                <span className="text-white/50">Live WhatsApp Link Preview:</span>
                <a
                  href={`https://wa.me/${settings.whatsapp_number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  wa.me/{settings.whatsapp_number} ↗
                </a>
              </div>
            )}
          </div>

          {/* Business & Studio Info */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-xl space-y-4">
            <h3 className="font-serif italic text-xl text-white font-medium">
              Studio Information
            </h3>

            <Field
              id="business_name"
              label="Business Name"
              name="business_name"
              value={settings?.business_name ?? ''}
              onChange={handleChange}
            />

            <Field
              id="contact_email"
              label="Contact Email"
              name="contact_email"
              type="email"
              value={settings?.contact_email ?? ''}
              onChange={handleChange}
            />

            <Field
              id="phone_number"
              label="Telephone Display"
              name="phone_number"
              type="tel"
              value={settings?.phone_number ?? ''}
              onChange={handleChange}
              placeholder="e.g. +94 76 975 0186"
            />

            <Field
              id="address"
              label="Primary Studio Address"
              name="address"
              value={settings?.address ?? ''}
              onChange={handleChange}
            />
          </div>

          {/* Social Channels */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-xl space-y-4">
            <h3 className="font-serif italic text-xl text-white font-medium">
              Social Media Accounts
            </h3>

            <Field
              id="instagram_url"
              label="Instagram URL"
              name="instagram_url"
              type="url"
              value={settings?.instagram_url ?? ''}
              onChange={handleChange}
              placeholder="https://instagram.com/iroshi_dressmaker_"
            />

            <Field
              id="facebook_url"
              label="Facebook URL"
              name="facebook_url"
              type="url"
              value={settings?.facebook_url ?? ''}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-8 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-[0_4px_20px_rgba(216,27,43,0.3)] disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <Link
              href="/admin"
              className="py-3 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-mono uppercase tracking-wider transition-all no-underline"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}

function Field({
  id,
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  id: string
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-mono text-white/70 uppercase tracking-wider mb-2"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#F4D389] transition-colors"
      />
    </div>
  )
}
