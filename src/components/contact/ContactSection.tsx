import { siteConfig } from '@/config/site'

interface ContactSectionProps {
  className?: string
}

export default function ContactSection({ className = '' }: ContactSectionProps) {
  const waNumber = siteConfig.placeholders.whatsappNumber || '94769750186'
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    'Hello Iroshi Dress Maker, I would like to enquire about scheduling an appointment or checking dress availability.'
  )}`

  return (
    <div className={`max-w-4xl mx-auto w-full flex flex-col gap-6 ${className}`.trim()}>
      {/* WhatsApp Atelier Line Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl flex flex-col items-start justify-between">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.539 1.772.827 2.788.828h.003c3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.586-5.766-5.768-5.766z" />
            </svg>
          </div>

          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#F4D389] block mb-2">
            Fastest Communication Channel
          </span>
          <h2 className="font-serif italic text-3xl sm:text-4xl text-white font-medium mb-3">
            WhatsApp Atelier Line
          </h2>
          <p className="text-sm sm:text-base text-white/70 font-light leading-relaxed mb-8">
            Whether you wish to enquire about custom bridal dressmaking, check rental availability for a specific dress code, or arrange a trial fitting, WhatsApp provides instant direct contact with our design team.
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row items-center gap-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex-1 min-h-[50px] py-3.5 px-8 rounded-full bg-[#D81B2B] hover:bg-[#BF1524] text-white font-medium text-sm sm:text-base text-center transition-all shadow-[0_8px_30px_rgba(216,27,43,0.4)] flex items-center justify-center gap-2 no-underline"
          >
            <span>Chat on WhatsApp Now</span>
          </a>

          <a
            href="tel:+94769750186"
            className="w-full sm:w-auto min-h-[50px] py-3.5 px-6 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs tracking-wider flex items-center justify-center gap-2 no-underline transition-colors"
          >
            <span>Call: +94 76 975 0186</span>
          </a>
        </div>
      </div>

      {/* Atelier Consultation Guidelines */}
      <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
        <h3 className="font-serif italic text-xl text-white font-medium">
          Appointment Guidelines
        </h3>
        <ul className="space-y-2 text-sm text-white/65 font-light leading-relaxed">
          <li className="flex items-start gap-2">
            <span className="text-[#F4D389]">•</span>
            <span><strong>Advance Booking:</strong> Bridal consultations should be reserved 2–3 days in advance to ensure our head designer is available.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F4D389]">•</span>
            <span><strong>Dress Codes:</strong> Please note the code of any dress you see on our website (e.g. BR001, RN001) so we can prepare it for your arrival.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#F4D389]">•</span>
            <span><strong>Fitting Companions:</strong> You are warmly welcome to bring up to two trusted family members or friends to your fitting.</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

