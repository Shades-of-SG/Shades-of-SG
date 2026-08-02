import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { enrichInstrumentForPlayback, getSongInstruments } from '../data/songExperienceInstrumentFallbacks'
import { getPublishedSong } from '../services/publicSongService'

export default function InstrumentPlayground() {
  const { id } = useParams()
  const [song, setSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getPublishedSong(id).then((data) => active && setSong(data)).catch((nextError) => active && setError(nextError.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])
  if (loading) return <div className="page-stack"><p role="status">Loading song playground…</p></div>
  if (error || !song) return <div className="page-stack"><div className="state-box" role="alert">{error || 'Published song not found.'}</div><Link to="/songs">Choose another song</Link></div>
  const instruments = getSongInstruments(song)

  return (
    <div className="page-stack">
      <PageHeader
        description={`Instrument activities connected to ${song.title}.`}
        eyebrow="Instrument Playground"
        title={`${song.title} Playground`}
      />
      <section className="three-column">
        <SectionCard title="Instrument Selection">
          <div style={{ display: 'grid', gap: '12px' }}>
            {instruments.map((instrument, index) => {
              const displayInstrument = enrichInstrumentForPlayback(instrument)
              const iconImage = instrument.imageUrl || instrument.iconUrl
              return (
                <article
                  key={instrument.id || instrument.name || index}
                  style={{
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    display: 'grid',
                    gap: '10px',
                    gridTemplateColumns: '44px 1fr',
                    padding: '12px',
                  }}
                >
                  {iconImage ? (
                    <img
                      alt={instrument.name}
                      src={iconImage}
                      style={{ borderRadius: '8px', height: '44px', objectFit: 'cover', width: '44px' }}
                    />
                  ) : (
                    <span aria-hidden="true" style={{ fontSize: '2rem', textAlign: 'center' }}>
                      {displayInstrument.icon || '🎵'}
                    </span>
                  )}
                  <div>
                    <strong>{instrument.name}</strong>
                    <p style={{ fontSize: '0.82rem', lineHeight: 1.45, margin: '4px 0 0' }}>
                      {instrument.description || displayInstrument.description}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </SectionCard>
        <SectionCard title="Song Context">
          <p>{song.artist || 'Artist unavailable'}</p>
          <p>{song.theme || 'Theme unavailable'} · {(song.languages || []).join(', ') || 'Language unavailable'}</p>
        </SectionCard>
        <SectionCard title="Continue">
          <Link className="inline-link" to={`/songs/${song.id}`}>Back to Song Experience</Link>
        </SectionCard>
      </section>
    </div>
  )
}
