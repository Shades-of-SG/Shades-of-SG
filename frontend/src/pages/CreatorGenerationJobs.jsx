import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'
import GenerationStatusBadge from '../components/GenerationStatusBadge'
import { API_URL } from '../services/apiConfig'

const jobFilters = ['All', 'Processing', 'Completed', 'Failed']
const MAX_TITLE_LENGTH = 120
const MAX_ARTIST_LENGTH = 120

export default function CreatorGenerationJobs() {
  const navigate = useNavigate()

  // Dashboard State
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

  // Generation Form State
  const [isCreating, setIsCreating] = useState(false)
  const [isStartingJob, setIsStartingJob] = useState(false)

  // Form Choices
  const [mediaSource, setMediaSource] = useState('youtube') // 'youtube' or 'upload'
  const [youtubeLink, setYoutubeLink] = useState('')
  const [audioFile, setAudioFile] = useState(null)

  // Track Details
  const [formData, setFormData] = useState({ title: '', artist: '', lyrics: '' })

  // Extraction States
  const [isExtractingAudio, setIsExtractingAudio] = useState(false)
  const [extractedAudioUrl, setExtractedAudioUrl] = useState('')
  const [isExtractingLyrics, setIsExtractingLyrics] = useState(false)

  // --- INITIAL FETCH (ESLint Safe) ---
  useEffect(() => {
    let isMounted = true
    const loadInitialJobs = async () => {
      try {
        const response = await fetch(`${API_URL}/generation`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned an invalid response");
        }
        const json = await response.json()
        if (!response.ok) throw new Error(json.message || `Failed to fetch: ${response.status}`)
        if (json.success && isMounted) setJobs(json.data)
      } catch (err) {
        if (isMounted) setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadInitialJobs()
    return () => { isMounted = false }
  }, [])

  // --- MANUAL REFRESH (Triggered after a new job starts) ---
  const refreshJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/generation`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } })
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response");
      }
      const json = await response.json()
      if (!response.ok) throw new Error(json.message || `Failed to fetch: ${response.status}`)
      if (json.success) setJobs(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- MP3 EXTRACTION LOGIC ---
  const handleExtractAudio = async () => {
    if (!youtubeLink) return alert('Please enter a YouTube link to extract.')
    setIsExtractingAudio(true)
    try {
      const response = await fetch(`${API_URL}/songs/extract-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ youtubeUrl: youtubeLink })
      })
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response");
      }
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to extract audio')

      setExtractedAudioUrl(data.audioUrl)
      alert('MP3 Extracted and saved successfully!')
    } catch (err) {
      alert(err.message)
    } finally {
      setIsExtractingAudio(false)
    }
  }

  // --- LYRICS EXTRACTION LOGIC ---
  const handleExtractLyrics = async () => {
    if (mediaSource === 'youtube' && !youtubeLink) return alert('Please enter a YouTube link.')
    if (mediaSource === 'upload' && !audioFile) return alert('Please upload an audio file.')

    setIsExtractingLyrics(true)
    try {
      const payload = mediaSource === 'youtube'
        ? JSON.stringify({ youtubeUrl: youtubeLink })
        : JSON.stringify({ fileName: audioFile.name })

      const response = await fetch(`${API_URL}/transcriptions/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: payload
      })

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response");
      }

      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Failed to extract lyrics')

      // Auto-fills the text box beautifully
      setFormData(prev => ({ ...prev, lyrics: data.lyrics }))
    } catch (err) {
      alert(err.message)
    } finally {
      setIsExtractingLyrics(false)
    }
  }

  // --- SUBMIT & GENERATE ---
  const handleStartGeneration = async (e) => {
    e.preventDefault()
    if (!formData.title) return alert("Please provide a Title.")

    setIsStartingJob(true)
    try {
      const songRes = await fetch(`${API_URL}/songs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({
          title: formData.title,
          artist: formData.artist || 'Unknown Artist',
          lyrics: formData.lyrics,
          theme: 'Standard',
          description: 'AI Generated', // Dummy data for constraints
          ...(extractedAudioUrl ? { audioUrl: extractedAudioUrl } : { youtubeUrl: youtubeLink })
        })
      })
      const songContentType = songRes.headers.get("content-type");
      if (!songContentType || !songContentType.includes("application/json")) {
        throw new Error("Server returned an invalid response when creating song");
      }
      const songData = await songRes.json()
      if (!songRes.ok) throw new Error(songData.message || 'Failed to create song record')

      const genRes = await fetch(`${API_URL}/generation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        body: JSON.stringify({ songId: songData.data.id })
      })
      const genContentType = genRes.headers.get("content-type");
      if (!genContentType || !genContentType.includes("application/json")) {
        throw new Error("Server returned an invalid response when starting generation");
      }
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.message || 'Failed to start generation pipeline')

      setIsCreating(false)
      setFormData({ title: '', artist: '', lyrics: '' })
      setYoutubeLink('')
      setAudioFile(null)
      setExtractedAudioUrl('')

      await refreshJobs()

    } catch (err) {
      alert(err.message)
    } finally {
      setIsStartingJob(false)
    }
  }

  const filteredJobs = activeFilter === 'All' ? jobs : jobs.filter((job) => job.status.toLowerCase() === activeFilter.toLowerCase())
  const activeJobsCount = jobs.filter((job) => job.status.toLowerCase() === 'processing').length
  const completedJobsCount = jobs.filter((job) => job.status.toLowerCase() === 'completed').length

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks']}
      description="Monitor and manage your AI video compilation tasks."
      title="Generation Tasks"
      actions={
        <button
          className={`studio-button ${isCreating ? 'studio-button--secondary' : 'studio-button--primary'}`}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : 'Compile New Video'}
        </button>
      }
    >

      {/* --- PREMIUM STUDIO-STYLED FORM --- */}
      {isCreating && (
        <section className="studio-card studio-form-card" style={{ marginBottom: '2rem' }}>
          <header className="studio-card__header studio-card__header--spread">
            <div className="studio-card__title">
              <span aria-hidden="true">♫</span>
              <h2>Start New AI Generation</h2>
            </div>
            <p style={{ margin: 0 }}>Configure your track and extract lyrics to trigger the AI pipeline.</p>
          </header>

          <div className="studio-form-column">

            {/* 1. Media Source Chips */}
            <label className="studio-field">
              <span>Audio Source</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <label className={`studio-option-chip ${mediaSource === 'youtube' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="source"
                    checked={mediaSource === 'youtube'}
                    onChange={() => setMediaSource('youtube')}
                    style={{ display: 'none' }}
                  />
                  YouTube URL
                </label>
                <label className={`studio-option-chip ${mediaSource === 'upload' ? 'is-selected' : ''}`}>
                  <input
                    type="radio"
                    name="source"
                    checked={mediaSource === 'upload'}
                    onChange={() => setMediaSource('upload')}
                    style={{ display: 'none' }}
                  />
                  Upload MP3/WAV
                </label>
              </div>
            </label>

            {/* 2. Media Inputs & Extraction */}
            {mediaSource === 'youtube' ? (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <label className="studio-field" style={{ flex: 1 }}>
                  <span>YouTube Link <strong>*</strong></span>
                  <input
                    type="url"
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    placeholder="Paste YouTube link here..."
                  />
                </label>
                <button
                  type="button"
                  onClick={handleExtractAudio}
                  disabled={isExtractingAudio || !youtubeLink}
                  className="studio-button studio-button--secondary"
                  style={{ marginTop: '26px' }}
                >
                  {isExtractingAudio ? 'Extracting...' : extractedAudioUrl ? 'Audio Saved ✓' : 'Extract MP3'}
                </button>
              </div>
            ) : (
              <label className="studio-field">
                <span>Upload Audio File <strong>*</strong></span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setAudioFile(e.target.files[0])}
                  style={{ padding: '8px' }}
                />
              </label>
            )}

            {/* 3. Title and Artist Grid */}
            <div className="studio-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
              <label className="studio-field">
                <span>
                  Title <strong>*</strong>
                </span>
                <div className="studio-input-shell">
                  <input
                    maxLength={MAX_TITLE_LENGTH}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Song Title"
                    value={formData.title}
                  />
                  <small>{formData.title.length} / {MAX_TITLE_LENGTH}</small>
                </div>
              </label>

              <label className="studio-field">
                <span>Artist</span>
                <div className="studio-input-shell">
                  <input
                    maxLength={MAX_ARTIST_LENGTH}
                    onChange={(e) => setFormData({...formData, artist: e.target.value})}
                    placeholder="Artist Name"
                    value={formData.artist}
                  />
                  <small>{formData.artist.length} / {MAX_ARTIST_LENGTH}</small>
                </div>
              </label>
            </div>

            {/* 4. Lyrics Editor */}
            <label className="studio-field studio-description-field" style={{ marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <span>Lyrics (Required for Scenes) <strong>*</strong></span>
                <button
                  type="button"
                  onClick={handleExtractLyrics}
                  disabled={isExtractingLyrics}
                  className="studio-button studio-button--secondary"
                  style={{ minHeight: '32px', padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {isExtractingLyrics ? 'Generating...' : '✨ Auto-Extract Lyrics via AI'}
                </button>
              </div>
              <textarea
                onChange={(e) => setFormData({...formData, lyrics: e.target.value})}
                placeholder="Paste lyrics manually here, or click the AI Extract button above to auto-fill..."
                rows={9}
                value={formData.lyrics}
              />
            </label>

            {/* 5. Generation Trigger */}
            <button
              onClick={handleStartGeneration}
              disabled={isStartingJob}
              className="studio-button studio-button--primary"
              style={{ width: '100%', minHeight: '48px', fontSize: '1rem', marginTop: '14px' }}
            >
              {isStartingJob ? 'Compiling Video Pipeline...' : 'Generate AI Video Now'}
            </button>

          </div>
        </section>
      )}


      {/* --- DASHBOARD JOBS LIST (Unchanged) --- */}
      <section className="stats-grid stats-grid--two-col">
        <SectionCard title="Active Jobs">
          <strong>{loading ? '-' : activeJobsCount}</strong>
          <p>Tasks currently compiling.</p>
        </SectionCard>
        <SectionCard title="Completed">
          <strong>{loading ? '-' : completedJobsCount}</strong>
          <p>Ready for publication.</p>
        </SectionCard>
      </section>

      <div className="dashboard-filter-bar" aria-label="Job filters">
        {jobFilters.map((filter) => (
          <button
            key={filter}
            className={`dashboard-filter-pill ${filter === activeFilter ? 'is-selected' : ''}`}
            onClick={() => setActiveFilter(filter)}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      {loading && <div className="p-8 text-center text-slate-500 font-medium">Loading generation tasks...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">Error: {error}</div>}

      {!loading && !error && filteredJobs.length === 0 ? (
        <EmptyState description={`No ${activeFilter.toLowerCase()} tasks found.`} title="No tasks found" />
      ) : (
        <div className="creator-song-browser">
          <div className="creator-song-browser__list">
            {!loading && !error && filteredJobs.map((job) => (
              <div key={job.id} className="dashboard-song-item creator-song-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div className="dashboard-song-art" aria-hidden="true">🎵</div>
                  <div className="dashboard-song-copy">
                    <h3>{job.song?.title || job.Song?.title || 'Unknown Song'}</h3>
                    <p className="text-xs text-slate-500 mb-1">{job.song?.artist || job.Song?.artist || 'Unknown Artist'}</p>
                    <GenerationStatusBadge status={job.status} />
                    {job.status.toLowerCase() === 'processing' && (
                      <div className="dashboard-song-progress" style={{ marginTop: '0.5rem' }}>
                        <div className="progress-track"><span style={{ width: `${job.progress || 0}%` }} /></div>
                        <small>{job.progress || 0}%</small>
                      </div>
                    )}
                  </div>
                </div>
                <div className="creator-song-actions">
                  <button className="studio-button studio-button--secondary" onClick={() => navigate(`/creator/generation/${job.id}`)} type="button">
                    View Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
    </CreatorPageShell>
  )
}
