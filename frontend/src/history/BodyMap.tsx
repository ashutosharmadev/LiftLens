import { useState, type KeyboardEvent } from 'react'
import { region, type RegionId } from './regions'

/** Outline paths for each region of a front-facing figure, in a 200 x 400 box. */
const SHAPES: Record<RegionId, string[]> = {
  head: ['M100 13 A18 23 0 1 1 99.9 13 Z', 'M90 56 L110 56 L113 72 L87 72 Z'],
  shoulders: [
    'M86 74 Q62 72 52 84 Q46 96 50 112 L64 108 Q66 92 76 84 Z',
    'M114 74 Q138 72 148 84 Q154 96 150 112 L136 108 Q134 92 124 84 Z',
  ],
  chest: ['M76 84 Q88 76 100 78 Q112 76 124 84 Q134 92 136 108 L134 130 Q118 138 100 134 Q82 138 66 130 L64 108 Q66 92 76 84 Z'],
  arms: [
    'M50 112 L64 108 L57 160 L46 212 L30 210 L40 160 Z',
    'M150 112 L136 108 L143 160 L154 212 L170 210 L160 160 Z',
    'M30 213 L46 215 L45 230 Q38 238 31 230 Z',
    'M170 213 L154 215 L155 230 Q162 238 169 230 Z',
  ],
  waist: ['M66 130 Q82 138 100 134 Q118 138 134 130 L130 168 Q128 186 130 196 L70 196 Q72 186 70 168 Z'],
  hips: ['M70 196 L130 196 Q138 210 138 226 L100 236 L62 226 Q62 210 70 196 Z'],
  legs: [
    'M62 226 L99 236 L97 316 L70 316 Q63 280 62 226 Z',
    'M138 226 L101 236 L103 316 L130 316 Q137 280 138 226 Z',
    'M70 320 L96 320 L93 382 L76 382 Q68 352 70 320 Z',
    'M130 320 L104 320 L107 382 L124 382 Q132 352 130 320 Z',
    'M76 386 L93 386 L95 396 L70 396 Z',
    'M124 386 L107 386 L105 396 L130 396 Z',
  ],
}

// Draw order: arms behind the shoulders so the deltoid caps sit on top.
const ORDER: RegionId[] = ['arms', 'legs', 'hips', 'waist', 'chest', 'head', 'shoulders']

/**
 * Front body map for V1: shoulders and waist (what LiftLens measures) in lime,
 * every other part grey as "not measured". Each part is a button; tapping it
 * shows what LiftLens does with that part and the latest ratio.
 */
export function BodyMap({ ratio }: { ratio: number | null }) {
  const [selected, setSelected] = useState<RegionId | null>(null)
  const chosen = selected ? region(selected) : null

  function onKey(id: RegionId, event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelected(id)
    }
  }

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,14rem)_1fr]">
      <svg viewBox="0 0 200 400" className="mx-auto h-72 w-auto sm:h-80" role="group" aria-label="Front body map">
        {ORDER.map((id) => {
          const r = region(id)
          const isSelected = selected === id
          const fill = r.measured
            ? isSelected ? 'fill-signal' : 'fill-signal/85 hover:fill-signal'
            : isSelected ? 'fill-graphite-500' : 'fill-graphite-700 hover:fill-graphite-500'
          return (
            <g
              key={id}
              role="button"
              tabIndex={0}
              aria-label={`${r.label}: ${r.measured ? 'measured' : 'not measured in V1'}`}
              aria-pressed={isSelected}
              onClick={() => setSelected(id)}
              onKeyDown={(e) => onKey(id, e)}
              className={`cursor-pointer outline-none transition-colors ${fill} [&:focus-visible>path]:stroke-graphite-100`}
            >
              {SHAPES[id].map((d) => (
                <path key={d} d={d} strokeWidth="2.5" strokeLinejoin="round" className="stroke-graphite-900" />
              ))}
            </g>
          )
        })}
        {/* Where the two widths are taken: edge to edge across the shoulders and the waist. */}
        <g aria-hidden className="pointer-events-none stroke-graphite-950" strokeWidth="1.5" strokeDasharray="4 3">
          <line x1="47" x2="153" y1="98" y2="98" />
          <line x1="70" x2="130" y1="168" y2="168" />
        </g>
      </svg>

      <div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-graphite-300">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-signal" /> Measured
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-graphite-700" /> Not measured in V1
          </span>
        </div>

        <div aria-live="polite" className="mt-4 min-h-28 rounded-md border border-graphite-800 bg-graphite-950 p-4">
          {!chosen && <p className="text-sm text-graphite-300">Tap a part of the body to see what LiftLens measures.</p>}
          {chosen && (
            <>
              <p className="font-mono text-xs uppercase tracking-wider text-graphite-300">{chosen.label}</p>
              {chosen.measured && (
                <p className="mt-1 font-mono text-2xl font-medium text-signal">
                  {ratio !== null ? ratio.toFixed(2) : '—'}
                  <span className="ml-2 font-sans text-xs font-normal text-graphite-300">shoulder-to-waist</span>
                </p>
              )}
              <p className="mt-1 text-sm leading-relaxed text-graphite-100">{chosen.detail}</p>
              {chosen.measured && ratio === null && (
                <p className="mt-1 text-sm text-graphite-300">Take your first check-in to get your ratio.</p>
              )}
            </>
          )}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-graphite-500">
          LiftLens V1 measures your shoulder-to-waist ratio from a front photo. Other muscle groups aren't rated.
        </p>
      </div>
    </div>
  )
}
