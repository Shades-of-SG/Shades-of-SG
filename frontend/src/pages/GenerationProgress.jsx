import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Loader2, ChevronDown, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import GenerationStatusBadge from '../components/GenerationStatusBadge'
import { useAuth } from '../context/AuthContext'
import { getGenerationJob } from '../services/songService'

/*
TODO - Htet

Implement generation status polling.
Implement progress timeline.
Implement logs view.
*/
export default function GenerationProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [isPhase2Expanded, setIsPhase2Expanded] = useState(true)
  const [isPhase3Expanded, setIsPhase3Expanded] = useState(true)
  const [isPhase4Expanded, setIsPhase4Expanded] = useState(true)

  useEffect(() => {
    let timeoutId
    let isMounted = true

    const fetchStatus = async () => {
      try {
        const data = await getGenerationJob(id, token)
        if (!isMounted) return

        setJobData(data)
        setError(null)
        if (data.status !== 'COMPLETED' && data.status !== 'FAILED') {
          timeoutId = window.setTimeout(fetchStatus, 3000)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchStatus()

    return () => {
      isMounted = false
      window.clearTimeout(timeoutId)
    }
  }, [id, token])

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

  const status = jobData?.status || 'QUEUED'
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
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-3xl font-bold text-white mb-1">{jobData?.song?.title || 'Unknown Project'}</h1>
        <p className="text-violet-400 font-medium text-lg">{jobData?.song?.artist || 'Unknown Artist'}</p>
      </div>

      {/* 1. Status Card */}
      <section style={{ 
        marginBottom: '2.5rem', 
        background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
      }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1.5rem 2rem', 
          borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
          background: 'rgba(15, 23, 42, 0.4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>🎬</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Compilation Status</h2>
          </div>
          <GenerationStatusBadge status={status} errorMessage={jobData?.errorMessage} />
        </header>

        <div style={{ padding: '20px 30px' }}>
          {status === 'FAILED' && jobData?.errorMessage && (
            <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
               <p style={{ color: '#f87171', fontSize: '0.875rem', fontFamily: 'monospace' }}>{jobData.errorMessage}</p>
            </div>
          )}

          {status === 'COMPLETED' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <p style={{ color: '#34d399', fontWeight: 500, fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                ✨ Your cinematic video has been assembled successfully!
              </p>
              <Link 
                to={`/creator/editor/${jobData.id}`} 
                className="w-full block text-center bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-lg shadow-[0_0_15px_rgba(139,92,246,0.5)] transition-all"
              >
                Proceed to Video Editor
              </Link>
            </div>
          ) : (
            <p style={{ color: '#94a3b8' }}>Video is currently processing...</p>
          )}
        </div>
      </section>

      {/* Static Phase 1 */}
      <section className="studio-card studio-form-card" style={{ marginBottom: '2rem', padding: '1.5rem 30px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <CheckCircle className="w-8 h-8 text-emerald-500" />
        <div>
          <h3 className="text-white font-bold text-lg">Phase 1: Audio & Lyrics Extraction</h3>
          <p className="text-emerald-400 text-sm">Successfully completed.</p>
        </div>
      </section>

      {/* Phase 2 Accordion */}
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

      {/* Phase 3 Accordion */}
      <section className="studio-card studio-form-card" style={{ marginTop: '2rem' }}>
        <header 
          className="studio-card__header studio-card__header--spread"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsPhase3Expanded(!isPhase3Expanded)}
        >
          <div className="studio-card__title">
            <span aria-hidden="true">🖼️</span>
            <h2>Phase 3: Image Generation</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase3Expanded ? 'Collapse' : 'Expand'}</span>
            {isPhase3Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </header>

        {isPhase3Expanded && (
          <div style={{ padding: '20px 30px' }}>
            {sceneSegments && sceneSegments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {sceneSegments.map((segment, idx) => {
                  const frames = segment.generatedFrames || [];
                  return (
                    <div key={`p3-${segment.id}`} style={{
                      backgroundColor: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(51, 65, 85, 0.5)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 700, letterSpacing: '0.05em' }}>
                          SCENE {idx + 1}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '2px 6px', borderRadius: '4px' }}>
                          {frames.length} Frame(s)
                        </span>
                      </div>
                      
                      {frames.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {frames.map(frame => (
                            <div key={frame.id} style={{
                              width: '100%',
                              aspectRatio: '16/9',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#0f172a',
                              position: 'relative',
                              border: '1px solid rgba(139, 92, 246, 0.2)'
                            }}>
                              <img src={frame.imageUrl} alt={`Scene ${idx + 1} Frame`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{
                          width: '100%',
                          aspectRatio: '16/9',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(15, 23, 42, 0.6)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px dashed rgba(99, 102, 241, 0.3)',
                          gap: '0.5rem'
                        }}>
                          {status === 'COMPLETED' || status === 'FAILED' ? (
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>No frames</span>
                          ) : (
                            <>
                              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Generating...</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Waiting for scenes before generating frames...</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Phase 4 Accordion */}
      <section className="studio-card studio-form-card" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
        <header 
          className="studio-card__header studio-card__header--spread"
          style={{ cursor: 'pointer' }}
          onClick={() => setIsPhase4Expanded(!isPhase4Expanded)}
        >
          <div className="studio-card__title">
            <span aria-hidden="true">🎞️</span>
            <h2>Phase 4: Video Assembly</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{isPhase4Expanded ? 'Collapse' : 'Expand'}</span>
            {isPhase4Expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </div>
        </header>

        {isPhase4Expanded && (
          <div style={{ padding: '20px 30px' }}>
            {status === 'COMPLETED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <div>
                  <h3 className="text-white font-bold text-lg">FFmpeg Assembly Complete</h3>
                  <p className="text-emerald-400 text-sm">Video has been successfully stitched and is ready.</p>
                </div>
              </div>
            ) : status === 'FAILED' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-white font-bold text-lg">Assembly Failed</h3>
                  <p className="text-red-400 text-sm">There was an error stitching the video.</p>
                </div>
              </div>
            ) : (sceneSegments.length > 0 && sceneSegments.every(seg => seg.generatedFrames && seg.generatedFrames.length > 0)) ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '1rem' }}>
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Stitching MP4 with FFmpeg...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '1rem' }}>
                <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Waiting for image generation to complete...</p>
              </div>
            )}
          </div>
        )}
      </section>
    </CreatorPageShell>
  )
}
