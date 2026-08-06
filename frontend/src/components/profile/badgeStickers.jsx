// Original flat-vector "sticker/stamp" artwork for each badge in the catalog.
// Every sticker shares a die-cut white border (a gently scalloped ring, echoing a postage-stamp
// / sticker-pack edge) wrapped around a flat illustration. Locked/earned coloring is handled by
// the caller via CSS (grayscale filter), not in here — these always render in full color.

// Generates a smooth N-bump scalloped ring path around (cx, cy) — the "die-cut sticker" outline.
function scallopedRingPath(cx, cy, radius, bumps = 14, amplitude = 3.2) {
  const points = []
  const steps = bumps * 8
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2
    const wobble = Math.sin(angle * bumps) * amplitude
    const r = radius + wobble
    points.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join(' L')} Z`
}

function StickerFrame({ children, disc }) {
  const outer = scallopedRingPath(60, 60, 56)
  const inner = scallopedRingPath(60, 60, 47, 14, 2.6)
  return (
    <svg aria-hidden="true" className="badge-sticker-svg" viewBox="0 0 120 120">
      <path d={outer} fill="#fff" filter="url(#badge-sticker-shadow)" />
      <path d={inner} fill={disc} />
      <defs>
        <filter height="150%" id="badge-sticker-shadow" width="150%" x="-25%" y="-25%">
          <feDropShadow dx="0" dy="2" floodOpacity=".22" stdDeviation="2" />
        </filter>
      </defs>
      <g>{children}</g>
    </svg>
  )
}

const STICKERS = {
  merlion: () => (
    <StickerFrame disc="#c8332b">
      <circle cx="60" cy="60" fill="none" r="38" stroke="#f3c34d" strokeWidth="2" />
      <path d="M40 78c0-6 4-11 10-11h5V54c0-8 4-15 12-15s12 6 12 14c0 5-2 8-5 11l4 4-6 5 3 5-6 3-2 6-27 0z" fill="#f3c34d" />
      <path d="M67 39c4-4 10-6 15-4-2 5-6 8-11 9z" fill="#f3c34d" />
      <circle cx="63" cy="46" fill="#c8332b" r="1.6" />
      <path d="M45 77c1-9 6-15 6-15s3 8 1 15z" fill="#e8dcc0" opacity=".6" />
    </StickerFrame>
  ),
  'chicken-rice': () => (
    <StickerFrame disc="#f6efe0">
      <ellipse cx="60" cy="80" fill="#e2d9c2" rx="34" ry="8" />
      <ellipse cx="60" cy="66" fill="#fffdf6" rx="26" ry="17" />
      <ellipse cx="60" cy="62" fill="#ffffff" rx="21" ry="13" />
      <path d="M40 60c6-3 10 3 14 0s8-4 12 0 10-2 14 1" fill="none" stroke="#e2d9c2" strokeLinecap="round" strokeWidth="1.6" />
      <ellipse cx="45" cy="72" fill="#d98a4a" rx="9" ry="4.5" transform="rotate(-10 45 72)" />
      <ellipse cx="58" cy="76" fill="#e39a56" rx="9" ry="4.5" transform="rotate(4 58 76)" />
      <circle cx="80" cy="70" fill="#4c8c52" r="4.5" />
      <circle cx="30" cy="68" fill="#c0392b" r="3.2" />
    </StickerFrame>
  ),
  laksa: () => (
    <StickerFrame disc="#e8541f">
      <ellipse cx="60" cy="72" fill="#fdece0" rx="32" ry="16" />
      <ellipse cx="60" cy="68" fill="#e8541f" rx="27" ry="12" />
      <path d="M38 64c5 3 8-3 12 0s7 4 11 0 8-3 12 0 6 4 9 1" fill="none" stroke="#fbb27a" strokeLinecap="round" strokeWidth="2" />
      <circle cx="47" cy="70" fill="#fff6ea" r="6" />
      <path d="M47 65v10" stroke="#e8541f" strokeWidth="1.4" />
      <path d="M72 62c3-3 8-3 9 1-3 2-6 2-9-1z" fill="#d8433f" />
      <path d="M40 55c2-6 6-10 6-10s2 6-1 11z" fill="#4c8c52" />
    </StickerFrame>
  ),
  'kaya-toast': () => (
    <StickerFrame disc="#f8e0a6">
      <rect fill="#e9b45c" height="12" rx="2" width="40" x="40" y="52" />
      <rect fill="#5b3a1e" height="3" rx="1.4" width="34" x="43" y="56" />
      <rect fill="#e9b45c" height="12" rx="2" width="40" x="40" y="66" />
      <rect fill="#f6d67e" height="3" rx="1.4" width="34" x="43" y="70" />
      <ellipse cx="88" cy="72" fill="#fffdf6" rx="8" ry="9" />
      <rect fill="#fffdf6" height="6" rx="3" width="16" x="80" y="66" />
      <ellipse cx="88" cy="74" fill="#f4c948" rx="4.5" ry="5" />
      <path d="M33 58c-4 0-7 3-7 6s3 6 7 6" fill="none" stroke="#5b3a1e" strokeWidth="2.4" />
    </StickerFrame>
  ),
  supertree: () => (
    <StickerFrame disc="#e6f4ee">
      <rect fill="#2f6b4f" height="34" rx="3" width="6" x="57" y="52" />
      <path d="M45 46c5-6 25-6 30 0-6 4-24 4-30 0z" fill="#3f9468" />
      <path d="M40 58c8-5 32-5 40 0-8 4-32 4-40 0z" fill="#57ab7c" />
      <path d="M43 70c7-4 27-4 34 0-7 4-27 4-34 0z" fill="#3f9468" />
      <circle cx="52" cy="44" fill="#f4c948" r="2.2" />
      <circle cx="68" cy="50" fill="#f4c948" r="2.2" />
      <circle cx="60" cy="62" fill="#f4c948" r="2" />
      <path d="M60 86c-10 0-16-4-16-4h32s-6 4-16 4z" fill="#2f6b4f" />
    </StickerFrame>
  ),
  'national-gallery': () => (
    <StickerFrame disc="#efe6f6">
      <rect fill="#f4f0e6" height="8" rx="1.4" width="52" x="34" y="72" />
      <rect fill="#e4dcc9" height="26" width="44" x="38" y="46" />
      <path d="M35 46l25-14 25 14z" fill="#c9bda0" />
      {[42, 51, 60, 69].map((x) => (
        <rect fill="#f4f0e6" height="20" key={x} width="5" x={x} y="50" />
      ))}
      <rect fill="#8b5cf6" height="3" width="44" x="38" y="46" />
    </StickerFrame>
  ),
  'peranakan-tile': () => (
    <StickerFrame disc="#fff8ee">
      <rect fill="#2f7a6b" height="60" width="60" x="30" y="30" />
      <path d="M60 30 L90 60 L60 90 L30 60 Z" fill="#e8541f" />
      <circle cx="60" cy="60" fill="#f4c948" r="12" />
      <path d="M60 48c7 0 12 5 12 12s-5 12-12 12-12-5-12-12 5-12 12-12z" fill="none" stroke="#2f7a6b" strokeWidth="2.4" />
      <circle cx="60" cy="60" fill="#c8332b" r="4" />
    </StickerFrame>
  ),
  'raffles-hotel': () => (
    <StickerFrame disc="#f3eee2">
      <rect fill="#fffdf6" height="26" width="56" x="32" y="52" />
      <rect fill="#22262b" height="6" width="60" x="30" y="46" />
      {[38, 48, 58, 68, 78].map((x) => (
        <rect fill="#e7ddc3" height="26" key={x} width="4" x={x} y="52" />
      ))}
      <path d="M42 52v-8h36v8z" fill="#fffdf6" />
      <path d="M42 44l18-10 18 10z" fill="#22262b" />
      <rect fill="#c8332b" height="14" width="8" x="56" y="64" />
    </StickerFrame>
  ),
  orchid: () => (
    <StickerFrame disc="#fbeef6">
      {[0, 72, 144, 216, 288].map((rotation) => (
        <path
          d="M60 60c0-10 5-20 5-20s5 10 5 20-5 14-5 14-5-4-5-14z"
          fill="#c9539e"
          key={rotation}
          stroke="#8f2f74"
          strokeWidth="1"
          transform={`rotate(${rotation} 60 60)`}
        />
      ))}
      <circle cx="60" cy="60" fill="#f4c948" r="7" />
      <circle cx="60" cy="60" fill="#e8541f" r="2.6" />
    </StickerFrame>
  ),
  'peranakan-shophouse': () => (
    <StickerFrame disc="#fff4e3">
      {[
        { door: '#8f2f74', wall: '#f2c14e', x: 32 },
        { door: '#2f7a6b', wall: '#e8541f', x: 52 },
        { door: '#c8332b', wall: '#3f8580', x: 72 },
      ].map(({ door, wall, x }) => (
        <g key={x}>
          <rect fill={wall} height="26" width="18" x={x} y="56" />
          <rect fill="#fffdf6" height="10" width="10" x={x + 4} y="60" />
          <rect fill={door} height="10" width="6" x={x + 6} y="72" />
          <rect fill="#4a3524" height="4" width="22" x={x - 2} y="52" />
        </g>
      ))}
      <rect fill="#4a3524" height="3" width="66" x="28" y="82" />
    </StickerFrame>
  ),
  'marina-bay-sands': () => (
    <StickerFrame disc="#e3eef7">
      {[38, 60, 82].map((x) => (
        <rect fill="#8a97a6" height="30" key={x} width="10" x={x - 5} y="52" />
      ))}
      <path d="M30 52c6-6 54-6 60 0v8c-6-5-54-5-60 0z" fill="#5b6b7d" />
      <path d="M34 60c5 3 12 3 16-1 6 6 14 6 20 0 4 4 11 4 16 1v6c-5 3-12 3-16-1-6 6-14 6-20 0-4 4-11 4-16 1z" fill="#bcd7ea" opacity=".85" />
      <ellipse cx="60" cy="86" fill="#3f8580" rx="34" ry="4" />
    </StickerFrame>
  ),
  esplanade: () => (
    <StickerFrame disc="#dff1f0">
      <path d="M28 78c4-20 16-32 32-32s28 12 32 32z" fill="#5aa9a3" />
      {Array.from({ length: 11 }, (_, i) => 30 + i * 6).map((x, i) => (
        <path d={`M${x} 78 L${x + 3} ${44 + Math.abs(i - 5) * 4}`} key={x} stroke="#3f8580" strokeLinecap="round" strokeWidth="2.2" />
      ))}
      <circle cx="60" cy="78" fill="#dff1f0" r="3" />
      <path d="M82 40l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#f4c948" />
    </StickerFrame>
  ),
}

export default function BadgeSticker({ imageKey }) {
  const render = STICKERS[imageKey] || STICKERS.merlion
  return render()
}
