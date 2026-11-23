import { Drum, Guitar, Music, Music2, Piano, SlidersVertical, Wind } from 'lucide-react'

const INSTRUMENT_ICONS = {
  angklung: SlidersVertical,
  dizi: Wind,
  erhu: Music,
  gambus: Guitar,
  kompang: Drum,
  piano: Piano,
  tabla: Drum,
  veena: Guitar,
}

export default function InstrumentIcon({ className = '', instrumentId = '', instrumentName = '', size = 24 }) {
  const normalizedId = String(instrumentId || '').trim().toLowerCase()
  const normalizedName = String(instrumentName || '').trim().toLowerCase()
  const matchedKey = Object.keys(INSTRUMENT_ICONS).find(
    (key) => key === normalizedId || normalizedName.includes(key)
  )
  const Icon = matchedKey ? INSTRUMENT_ICONS[matchedKey] : Music2

  return <Icon aria-hidden="true" className={className} size={size} />
}
