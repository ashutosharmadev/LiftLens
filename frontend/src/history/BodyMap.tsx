import { useState, type KeyboardEvent } from 'react'
import { region, type RegionId } from './regions'

/**
 * Muscle shapes for a front-facing figure in a 200 x 400 box. `side` shapes are
 * drawn for the left of the figure and mirrored for the right, so the body is
 * exactly symmetric; `centre` shapes are drawn once.
 */
const SHAPES: Record<RegionId, { centre?: string[]; side?: string[] }> = {
  head: {
    centre: ['M100 13 C111 13 117 23 117 34 C117 46 110 55 100 55 C90 55 83 46 83 34 C83 23 89 13 100 13 Z'],
    side: ['M92 56 L99 60 L99 70 L84 72 Q90 66 92 56 Z'],
  },
  shoulders: { side: ['M77 74 Q60 74 51 87 Q46 100 50 117 Q57 105 64 97 Q70 89 79 83 Z'] },
  chest: { side: ['M99 80 L99 117 Q86 124 72 118 Q64 111 66 100 Q71 88 83 83 Q92 79 99 80 Z'] },
  arms: {
    side: [
      'M62 108 Q53 113 49 124 L45 151 Q50 159 56 156 L60 136 L64 117 Z',
      'M44 165 Q39 182 34 207 L42 211 L49 190 L55 167 Q50 161 44 165 Z',
    ],
  },
  waist: {
    side: [
      'M88 124 L98 124 L98 139 L87 139 Z',
      'M87 142 L98 142 L98 157 L87 157 Z',
      'M87 160 L98 160 L98 175 L88 175 Z',
      'M88 178 L98 178 L98 201 Q92 197 89 189 Z',
      'M84 124 L70 122 L70 140 L73 166 L72 184 L85 194 L85 160 Z',
    ],
  },
  hips: { side: ['M71 190 L86 198 L99 205 L99 236 Q88 222 74 214 L68 209 Z'] },
  legs: {
    side: [
      'M68 216 Q86 224 97 246 L95 292 Q86 300 76 294 Q66 262 68 216 Z',
      'M84 266 Q95 274 95 290 Q89 297 82 291 Q79 278 84 266 Z',
      'M71 308 Q67 326 70 341 L78 368 L82 368 L82 331 Q80 315 71 308 Z',
      'M86 312 L94 310 L94 340 L90 368 L85 368 L86 330 Z',
    ],
  },
}

/**
 * The whole body outline, left half (mirrored for the right). Drawn under the
 * muscles. It runs 1 unit past the centre so the two halves overlap with no seam.
 */
const SILHOUETTE =
  'M101 52 L92 52 L91 66 Q78 70 64 74 Q50 78 48 94 L46 114 L42 140 L39 164 L34 190 L30 214 Q26 228 31 238 ' +
  'Q37 243 41 234 L45 214 L50 190 L56 164 L60 140 L64 120 L66 112 L68 140 L72 168 L70 186 L66 206 L66 240 ' +
  'L72 300 L68 330 L74 360 L80 378 L74 394 L96 396 L94 378 L96 340 L96 300 L98 250 L101 240 Z'

const MIRROR = 'matrix(-1 0 0 1 200 0)'

/** A left-side shape plus its mirror image. */
function Pair({ d, className }: { d: string; className?: string }) {
  return (
    <>
      <path d={d} className={className} />
      <path d={d} transform={MIRROR} className={className} />
    </>
  )
}

const ORDER: RegionId[] = ['head', 'legs', 'hips', 'arms', 'waist', 'chest', 'shoulders']

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
      <svg viewBox="0 0 200 400" className="mx-auto h-80 w-auto sm:h-96" role="group" aria-label="Front body map">
        <g aria-hidden className="pointer-events-none fill-graphite-950">
          <Pair d={SILHOUETTE} />
        </g>
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
              strokeWidth="1.5"
              strokeLinejoin="round"
              className={`cursor-pointer stroke-graphite-950 outline-none transition-colors ${fill} [&:focus-visible>path]:stroke-graphite-100`}
            >
              {SHAPES[id].centre?.map((d) => <path key={d} d={d} />)}
              {SHAPES[id].side?.map((d) => <Pair key={d} d={d} />)}
            </g>
          )
        })}
        {/* Where the two widths are taken: edge to edge across the shoulders and the waist. */}
        <g aria-hidden className="pointer-events-none stroke-graphite-100/60" strokeWidth="1" strokeDasharray="3 3">
          <line x1="46" x2="154" y1="98" y2="98" />
          <line x1="71" x2="129" y1="168" y2="168" />
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
