import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'
import GenerationStatusBadge from '../components/GenerationStatusBadge'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../services/apiConfig'

const jobFilters = ['All', 'Processing', 'Completed', 'Failed']
const activeStatuses = new Set(['QUEUED', 'PROCESSING'])
const MAX_TITLE_LENGTH = 120
const MAX_ARTIST_LENGTH = 120

export default function CreatorGenerationJobs() {
  const navigate = useNavigate()
  const { token } = useAuth()

  // Dashboard State
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

  // Generation Form State
  const [isCreating, setIsCreating] = useState(false)
  const [isStartingJob, setIsStartingJob] = useState(false)

  // Delete Confirmation State
  const [deleteConfirmJob, setDeleteConfirmJob] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form Choices
  const [mediaSource, setMediaSource] = useState('youtube') // 'youtube' or 'upload'
  const [youtubeLink, setYoutubeLink] = useState('')
  const [audioFile, setAudioFile] = useState(null)

  // Track Details
  const [formData, setFormData] = useState({ title: '', artist: '' })

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  // --- INITIAL FETCH (ESLint Safe) ---
  useEffect(() => {
    let isMounted = true
    const loadInitialJobs = async () => {
      try {
        const response = await fetch(`${API_URL}/generation`, { headers: authHeader })
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Server returned an invalid response")
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
  }, [token])

  // --- INTERVAL POLLING FOR PROCESSING/QUEUED JOBS ---
  useEffect(() => {
    if (!jobs.some((job) => activeStatuses.has(job.status))) return undefined
    let isMounted = true
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_URL}/generation`, { headers: authHeader })
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const json = await response.json()
          if (response.ok && json.success && isMounted) {
            setJobs(json.data)
          }
        }
      } catch (err) {
        console.warn('Interval refresh failed:', err)
      }
    }, 3000)
    return () => {
      isMounted = false
      window.clearInterval(timer)
    }
  }, [jobs, token])

  // --- MANUAL REFRESH (Triggered after a new job starts) ---
  const refreshJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_URL}/generation`, { headers: authHeader })
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned an invalid response")
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

  // --- SUBMIT & GENERATE ---
  const handleStartGeneration = async (e) => {
    e.preventDefault()
    if (!formData.title) return alert("Please provide a Title.")
    if (mediaSource === 'youtube' && !youtubeLink) return alert("Please enter a YouTube link.")
    if (mediaSource === 'upload' && !audioFile) return alert("Please select an audio file.")

    setIsStartingJob(true)
    try {
      let songData
      if (mediaSource === 'upload' && audioFile) {
        const formDataObj = new FormData()
        formDataObj.append('title', formData.title)
        formDataObj.append('artist', formData.artist || 'Unknown Artist')
        formDataObj.append('lyrics', 'Instrumental / AI Transcribed')
        formDataObj.append('theme', 'Standard')
        formDataObj.append('description', 'AI Generated')
        formDataObj.append('file', audioFile)

        const songRes = await fetch(`${API_URL}/songs`, {
          method: 'POST',
          headers: authHeader,
          body: formDataObj,
        })
        const songContentType = songRes.headers.get("content-type")
        if (!songContentType || !songContentType.includes("application/json")) {
          throw new Error("Server returned an invalid response when creating song")
        }
        songData = await songRes.json()
        if (!songRes.ok) throw new Error(songData.message || 'Failed to create song record')
      } else {
        const songRes = await fetch(`${API_URL}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            title: formData.title,
            artist: formData.artist || 'Unknown Artist',
            lyrics: 'Instrumental / AI Transcribed',
            theme: 'Standard',
            description: 'AI Generated',
            youtubeUrl: youtubeLink,
          }),
        })
        const songContentType = songRes.headers.get("content-type")
        if (!songContentType || !songContentType.includes("application/json")) {
          throw new Error("Server returned an invalid response when creating song")
        }
        songData = await songRes.json()
        if (!songRes.ok) throw new Error(songData.message || 'Failed to create song record')
      }

      const songId = songData.data?.id || songData.song?.id
      const genRes = await fetch(`${API_URL}/generation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ songId }),
      })
      const genContentType = genRes.headers.get("content-type")
      if (!genContentType || !genContentType.includes("application/json")) {
        throw new Error("Server returned an invalid response when starting generation")
      }
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.message || 'Failed to start generation pipeline')

      setIsCreating(false)
      setFormData({ title: '', artist: '' })
      setYoutubeLink('')
      setAudioFile(null)

      await refreshJobs()

    } catch (err) {
      alert(err.message)
    } finally {
      setIsStartingJob(false)
    }
  }

  // --- DELETE JOB ---
  const handleDeleteJob = async () => {
    if (!deleteConfirmJob) return
    setIsDeleting(true)
    try {
      const response = await fetch(`${API_URL}/generation/${deleteConfirmJob.id}`, {
        method: 'DELETE',
        headers: authHeader,
      })
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned an invalid response')
      }
      const json = await response.json()
      if (!response.ok) throw new Error(json.message || `Failed to delete: ${response.status}`)
      setJobs((prev) => prev.filter((j) => j.id !== deleteConfirmJob.id))
      setDeleteConfirmJob(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setIsDeleting(false)
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
            <p style={{ margin: 0 }}>Configure your track details. Submitting initializes audio extraction & automatic Whisper lyric transcription.</p>
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

            {/* 2. Media Inputs */}
            {mediaSource === 'youtube' ? (
              <label className="studio-field">
                <span>YouTube Link <strong>*</strong></span>
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="Paste YouTube link here..."
                />
              </label>
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

            {/* 4. Generation Trigger */}
            <button
              onClick={handleStartGeneration}
              disabled={isStartingJob}
              className="studio-button studio-button--primary"
              style={{ width: '100%', minHeight: '48px', fontSize: '1rem', marginTop: '14px' }}
            >
              {isStartingJob ? 'Initializing Track & Lyrics...' : 'Initialize Track & Extract Lyrics'}
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
                <div className="creator-song-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    aria-label="Delete job"
                    className="creator-song-icon-button is-danger"
                    disabled={job.status.toLowerCase() === 'processing'}
                    onClick={() => setDeleteConfirmJob(job)}
                    title={job.status.toLowerCase() === 'processing' ? 'Cannot delete a processing job' : 'Delete job'}
                    type="button"
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                  <button className="studio-button studio-button--secondary" onClick={() => navigate(`/creator/generation/${job.id}`)} type="button">
                    View Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {deleteConfirmJob && (
        <div className="rw-modal-backdrop" onClick={() => { if (!isDeleting) setDeleteConfirmJob(null) }}>
          <div className="rw-modal bg-neutral-900" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center', backgroundColor: '#171717' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.25rem' }}>🗑️</div>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', color: '#f3f4f6' }}>Delete this job?</h2>
            <p style={{ color: '#d1d5db', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
              Are you sure you want to permanently delete the generation job for{' '}
              <strong className="text-gray-100">{deleteConfirmJob.song?.title || deleteConfirmJob.Song?.title || 'this song'}</strong>?
              This will remove all generated scenes and frames. This action cannot be undone.
            </p>
            <div className="rw-modal-actions">
              <button
                className="rw-modal-cancel text-gray-300 hover:text-white"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmJob(null)}
                type="button"
                style={{ color: '#d1d5db' }}
              >
                Cancel
              </button>
              <button
                className="studio-button studio-button--primary text-white bg-red-600 hover:bg-red-700"
                disabled={isDeleting}
                onClick={handleDeleteJob}
                style={{ background: '#dc2626', borderColor: '#dc2626', minWidth: '140px', color: '#ffffff' }}
                type="button"
              >
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CreatorPageShell>
  )
}
