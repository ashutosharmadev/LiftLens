/**
 * Front-facing body guide, head to mid-thigh, arms slightly away from the body.
 * Drawn in a 100 x 160 box and centred over the camera picture or photo.
 */
export function BodyOutline({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 160"
      preserveAspectRatio="xMidYMid meet"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2.5 1.5" vectorEffect="non-scaling-stroke">
        <ellipse cx="50" cy="22" rx="9" ry="11" />
        {/* Left side: neck, shoulder, outer arm, hand, inner arm, torso, hip, thigh */}
        <path d="M46 32 L46 36 Q44 41 32 43 Q26 45 25 55 L21 84 L17 114 L21 118 L25 114 L29 86 L33 60 L36 88 Q35 100 32 114 L34 154" />
        {/* Right side, mirrored */}
        <path d="M66 154 L68 114 Q65 100 64 88 L67 60 L71 86 L75 114 L79 118 L83 114 L79 84 L75 55 Q74 45 68 43 Q56 41 54 36 L54 32" />
        <path d="M47 154 L49 126 Q50 123 51 126 L53 154" />
      </g>
    </svg>
  )
}
