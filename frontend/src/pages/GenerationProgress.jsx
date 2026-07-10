import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import GenerationStatusBadge from '../components/GenerationStatusBadge'

export default function GenerationProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isPhase2Expanded, setIsPhase2Expanded] = useState(true)

  useEffect(() => {
    let intervalId
    let isMounted = true

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/generation/${id}/status`)
        if (!response.ok) throw new Error(`Failed to fetch status: ${response.statusText}`)

        const json = await response.json()
        if (!isMounted) return

        if (json.success) {
          setJobData(json.data)
          if (json.data.status === 'COMPLETED' || json.data.status === 'FAILED') {
            clearInterval(intervalId)
          }
        } else {
          throw new Error(json.message || 'Error parsing job status')
        }
      } catch (err) {
        if (!isMounted) return
        setError(err.message)
        clearInterval(intervalId)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStatus()
    intervalId = setInterval(fetchStatus, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [id])

  if (loading) {
    return (
      <CreatorPageShell breadcrumbs={['Generation Progress']} title="Generation Progress" description="Loading...">
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ margin: '0 auto', color: '#6366f1' }} />
          <p style={{ marginTop: '1rem', color: '#94a3b8' }}>Fetching job details...</p>
        </div>
      </CreatorPageShell>
    )
  }

  if (error) {
    return (
      <CreatorPageShell breadcrumbs={['Generation Progress']} title="Generation Progress" description="Error loading job.">
        <section className="studio-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle className="w-12 h-12" style={{ margin: '0 auto', color: '#ef4444' }} />
          <h2 style={{ color: '#ef4444', marginTop: '1rem' }}>Unable to Load Job</h2>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>{error}</p>
          <button
            onClick={() => navigate('/creator/generation')}
            className="studio-button studio-button--secondary"
            style={{ marginTop: '2rem' }}
          >
            Back to Dashboard
          </button>
        </section>
      </CreatorPageShell>
    )
  }

  const status = jobData?.status || 'NOT_STARTED'
  const sceneSegments = jobData?.song?.sceneSegments || []

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks', 'Progress']}
      description="Monitor the real-time compilation of your AI video."
      title="Generation Progress"
      actions={
        <button
          className="studio-button studio-button--secondary"
          onClick={() => navigate('/creator/generation')}
        >
          Back to Jobs
        </button>
      }
    >
      {/* 1. Status Card */}
      <section className="studio-card studio-form-card" style={{ marginBottom: '2rem' }}>
        <header className="studio-card__header studio-card__header--spread">
          <div className="studio-card__title">
            <span aria-hidden="true">🎬</span>
            <h2>{jobData?.song?.title || 'Unknown Project'}</h2>
          </div>
          <GenerationStatusBadge status={status} errorMessage={jobData?.errorMessage} />
        </header>

        <div style={{ padding: '20px 30px' }}>
          {jobData?.song?.artist && (
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              By {jobData.song.artist}
            </p>
          )}

          {status === 'FAILED' && jobData?.errorMessage && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
               <p style={{ color: '#f87171', fontSize: '0.875rem', fontFamily: 'monospace' }}>{jobData.errorMessage}</p>
            </div>
          )}

          {status === 'COMPLETED' && (
            <p style={{ color: '#34d399', fontWeight: 500, marginTop: '1rem' }}>
              ✨ Your cinematic video has been assembled successfully!
            </p>
          )}
        </div>
      </section>

      {/* 2. Phase 2 Accordion */}
      <section className="studio-card studio-form-card">
        <header 
          className="studio-card__header studio-card__header--spread"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsPhase2Expanded(!isPhase2Expanded)}
        >
          <div className="studio-card__title">
            <span aria-hidden="true">📝</span>
            <h2>Phase 2: AI Scene Planning</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase2Expanded ? 'Collapse' : 'Expand'}</span>
            {isPhase2Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </header>

        {isPhase2Expanded && (
          <div style={{ padding: '20px 30px' }}>
            {sceneSegments && sceneSegments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sceneSegments.map((segment, idx) => (
                  <div key={segment.id} style={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.5)', 
                    border: '1px solid rgba(51, 65, 85, 0.5)', 
                    borderRadius: '12px', 
                    padding: '1rem' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#818cf8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Scene {idx + 1}
                      </strong>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        fontFamily: 'monospace', 
                        backgroundColor: 'rgba(15, 23, 42, 0.8)', 
                        color: '#94a3b8', 
                        padding: '2px 8px', 
                        borderRadius: '4px' 
                      }}>
                        {segment.startTime}s - {segment.endTime}s
                      </span>
                    </div>

                    {segment.lyrics && (
                      <p style={{ color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.875rem', marginBottom: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid rgba(99, 102, 241, 0.3)' }}>
                        "{segment.lyrics}"
                      </p>
                    )}

                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(51, 65, 85, 0.4)' }}>
                      <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: '0.25rem', fontWeight: 700 }}>
                        Visual Prompt
                      </span>
                      <p style={{ color: '#f8fafc', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {segment.visualPrompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Waiting for AI Scene Generation...</p>
              </div>
            )}
          </div>
        )}
      </section>

    </CreatorPageShell>
  )
}
