'use client'

import React from 'react'

export interface GlassToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  offLabel?: string
  onLabel?: string
  className?: string
}

/**
 * GlassToggle — frosted glass toggle switch with springy knob animation.
 * Switches between two background themes with crossfade.
 */
export const GlassToggle: React.FC<GlassToggleProps> = ({
  checked,
  onChange,
  offLabel = "Blue's",
  onLabel = "Yellow's",
  className = '',
}) => {
  const toggle = () => onChange(!checked)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle background: currently ${checked ? onLabel : offLabel}`}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={`
        group relative h-[52px] w-[184px] p-1.5 rounded-full select-none cursor-pointer
        backdrop-blur-2xl bg-white/[0.12] hover:bg-white/[0.18] active:scale-[0.98]
        border border-white/30 hover:border-white/45
        shadow-[inset_0_1px_2px_rgba(255,255,255,0.45),0_8px_32px_rgba(0,0,0,0.35)]
        transition-all duration-300 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090a0f]
        ${className}
      `}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Ambient glow - OFF state (purple) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-600 ease-in-out ${
          checked ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          background:
            'radial-gradient(circle at 75% 50%, rgba(139, 92, 246, 0.95) 0%, rgba(79, 70, 229, 0.75) 45%, transparent 75%)',
          filter: 'blur(4px)',
        }}
      />
      {/* Ambient glow - ON state (amber) */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 rounded-full pointer-events-none transition-opacity duration-600 ease-in-out ${
          checked ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background:
            'radial-gradient(circle at 25% 50%, rgba(245, 158, 11, 0.95) 0%, rgba(251, 191, 36, 0.75) 45%, transparent 75%)',
          filter: 'blur(4px)',
        }}
      />

      {/* Labels */}
      <div className="relative w-full h-full flex items-center justify-between px-3 pointer-events-none z-10">
        <span
          className={`font-sans font-medium text-[14px] text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out pl-1 ${
            checked ? 'opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
          }`}
        >
          {offLabel}
        </span>
        <span
          className={`font-sans font-medium text-[14px] text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out pr-1 ${
            checked ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          {onLabel}
        </span>
      </div>

      {/* Glass Knob */}
      <div
        aria-hidden="true"
        className="absolute top-1 left-1 w-11 h-11 rounded-full backdrop-blur-md bg-white/35 group-hover:bg-white/45 border border-white/60 group-hover:border-white/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),0_4px_16px_rgba(0,0,0,0.4)] flex items-center justify-center pointer-events-none z-20 transition-transform duration-500"
        style={{
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: checked ? 'translate3d(0px, 0, 0)' : 'translate3d(130px, 0, 0)',
        }}
      >
        {/* Reflection arc */}
        <div className="absolute top-1 left-2 right-2 h-4 rounded-t-full bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

        {/* Icons */}
        <div className="relative w-5 h-5 flex items-center justify-center">
          {/* Moon (OFF) */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-4 h-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] absolute transition-all duration-300 ease-out ${
              checked ? 'opacity-0 scale-75 rotate-45' : 'opacity-100 scale-100 rotate-0'
            }`}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          {/* Person (ON) */}
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className={`w-4 h-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] absolute transition-all duration-300 ease-out ${
              checked ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-45'
            }`}
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>
    </button>
  )
}
