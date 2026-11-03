'use client'

import React, { useRef } from 'react'
import { X, Upload, RotateCcw, Layers, Move } from 'lucide-react'

interface PositionCoord {
  x: number
  y: number
}

interface BackgroundUploadModalProps {
  isOpen: boolean
  onClose: () => void
  bgClassic: string
  bgCustom: string
  isCustom: boolean
  onToggleCustom: (checked: boolean) => void
  onUploadImage: (file: File, target: 'classic' | 'custom') => void
  onResetDefaults: () => void
  classicPosition: PositionCoord
  customPosition: PositionCoord
  onChangeClassicPosition: (pos: PositionCoord) => void
  onChangeCustomPosition: (pos: PositionCoord) => void
}

const PRESET_POSITIONS: { label: string; x: number; y: number }[] = [
  { label: 'Top Left', x: 0, y: 0 },
  { label: 'Top Center', x: 50, y: 0 },
  { label: 'Top Right', x: 100, y: 0 },
  { label: 'Center Left', x: 0, y: 50 },
  { label: 'Center', x: 50, y: 50 },
  { label: 'Center Right', x: 100, y: 50 },
  { label: 'Bottom Left', x: 0, y: 100 },
  { label: 'Bottom Center', x: 50, y: 100 },
  { label: 'Bottom Right', x: 100, y: 100 },
]

/**
 * BackgroundUploadModal — manage and replace both background images.
 * Supports drag-and-drop, file upload, position presets, and fine-tuning sliders.
 */
export const BackgroundUploadModal: React.FC<BackgroundUploadModalProps> = ({
  isOpen,
  onClose,
  bgClassic,
  bgCustom,
  isCustom,
  onToggleCustom,
  onUploadImage,
  onResetDefaults,
  classicPosition,
  customPosition,
  onChangeClassicPosition,
  onChangeCustomPosition,
}) => {
  const classicInputRef = useRef<HTMLInputElement>(null)
  const customInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'classic' | 'custom') => {
    const file = e.target.files?.[0]
    if (file) onUploadImage(file, target)
  }

  const handleDrop = (e: React.DragEvent, target: 'classic' | 'custom') => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) onUploadImage(file, target)
  }

  const renderPositionControls = (
    position: PositionCoord,
    onChange: (pos: PositionCoord) => void,
    label: string
  ) => (
    <div className="pt-3 border-t border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5" />
          Position
        </span>
        <button
          type="button"
          onClick={() => onChange({ x: 50, y: 0 })}
          className="text-[10px] text-neutral-400 hover:text-white underline transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
        {PRESET_POSITIONS.map((preset) => {
          const isSelected = position.x === preset.x && position.y === preset.y
          return (
            <button
              key={`${label}-${preset.label}`}
              type="button"
              onClick={() => onChange({ x: preset.x, y: preset.y })}
              className={`py-1 px-1.5 rounded-lg border transition-all text-center ${
                isSelected
                  ? 'bg-amber-400/25 border-amber-400 text-amber-200 font-bold'
                  : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
              }`}
            >
              {preset.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-2 pt-1 bg-black/30 p-2.5 rounded-xl border border-white/5">
        <div>
          <div className="flex justify-between text-[10px] text-neutral-300 mb-1">
            <span>X Offset:</span>
            <span className="font-mono text-amber-300">{position.x}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={position.x}
            onChange={(e) => onChange({ ...position, x: Number(e.target.value) })}
            className="w-full accent-amber-400 h-1 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-neutral-300 mb-1">
            <span>Y Offset:</span>
            <span className="font-mono text-amber-300">{position.y}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={position.y}
            onChange={(e) => onChange({ ...position, y: Number(e.target.value) })}
            className="w-full accent-amber-400 h-1 bg-white/20 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#10111a] border border-white/15 rounded-[28px] shadow-2xl overflow-hidden text-neutral-100 flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <h2 className="text-lg font-semibold text-white">Background Manager</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Classic Background */}
            <div
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'classic')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Classic</span>
                {!isCustom && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-400/20 text-indigo-300 border border-indigo-400/30">
                    Active
                  </span>
                )}
              </div>

              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgClassic}
                  alt="Classic Background"
                  style={{ objectPosition: `${classicPosition.x}% ${classicPosition.y}%` }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => classicInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold shadow-lg active:scale-95"
                  >
                    Change Photo
                  </button>
                </div>
              </div>

              <input
                ref={classicInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'classic')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => classicInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-indigo-400/20 hover:bg-indigo-400/30 border border-indigo-400/40 text-xs font-medium text-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-300" />
                <span>Upload Classic Image</span>
              </button>

              {renderPositionControls(classicPosition, onChangeClassicPosition, 'classic')}
            </div>

            {/* Custom Background */}
            <div
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, 'custom')}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-white">Custom</span>
                {isCustom && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Active
                  </span>
                )}
              </div>

              <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden border border-white/10 bg-black/50 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bgCustom}
                  alt="Custom Background"
                  style={{ objectPosition: `${customPosition.x}% ${customPosition.y}%` }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => customInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-full bg-white text-black text-xs font-semibold shadow-lg active:scale-95"
                  >
                    Change Photo
                  </button>
                </div>
              </div>

              <input
                ref={customInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'custom')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => customInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-xs font-medium text-amber-200 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>Upload Custom Image</span>
              </button>

              {renderPositionControls(customPosition, onChangeCustomPosition, 'custom')}
            </div>
          </div>

          {/* Reset bar */}
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-neutral-400 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Drag &amp; drop images onto either panel to update.</span>
            </div>
            <button
              type="button"
              onClick={onResetDefaults}
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs underline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Both to Defaults</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.01] flex items-center justify-between">
          <div className="text-xs text-neutral-400 flex items-center gap-2">
            <span>Active:</span>
            <button
              type="button"
              onClick={() => onToggleCustom(!isCustom)}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors"
            >
              Switch to {isCustom ? 'Classic' : 'Custom'}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black font-semibold text-xs hover:bg-neutral-200 active:scale-95 transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
