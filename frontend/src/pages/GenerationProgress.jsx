import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2, ChevronDown, CheckCircle2, Circle, AlertCircle, XCircle } from 'lucide-react'
import GenerationStatusBadge from '../components/GenerationStatusBadge'

/**
 * Reusable accordion step component for the vertical progress tracker.
 * The chevron rotates 180° on expand via inline transform.
 */
function ProgressStep({ title, status, description, children, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  // Sync with defaultExpanded changes when data loads (e.g., scenes arrive mid-poll)
  useEffect(() => {
    if (defaultExpanded) setExpanded(true)
  }, [defaultExpanded])

  const statusIcon = {
    completed: <CheckCircle2 className="text-emerald-500 w-6 h-6 flex-shrink-0" />,
    current:   <Loader2 className="text-violet-500 w-6 h-6 animate-spin flex-shrink-0" />,
    waiting:   <Circle className="text-zinc-600 w-6 h-6 flex-shrink-0" />,
    failed:    <XCircle className="text-rose-500 w-6 h-6 flex-shrink-0" />,
  }

  return (
    <div className="rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl transition-all duration-300">
      <button
        type="button"
        className={`w-full p-5 flex items-center justify-between text-left transition-colors hover:bg-zinc-800/80
          ${status === 'current' ? 'bg-violet-900/20' : ''}
          ${status === 'failed' ? 'bg-rose-900/20' : ''}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          {statusIcon[status] || statusIcon.waiting}
          <div>
            <h3 className={`font-semibold text-base ${status === 'waiting' ? 'text-zinc-500' : 'text-zinc-100'}`}>
              {title}
            </h3>
            <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-zinc-500 transition-transform duration-300 flex-shrink-0 ml-4 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && children && (
        <div className="border-t border-zinc-800/50 bg-zinc-950 p-6 text-sm">
          {children}
        </div>
      )}
    </div>
  )
}

export default function GenerationProgress() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Polling effect with proper cleanup to prevent memory leaks
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
          // Stop polling on terminal states
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

    // Immediate fetch, then poll every 3 seconds
    fetchStatus()
    intervalId = setInterval(fetchStatus, 3000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [id])

  // ── Loading State ──
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-6" />
        <p className="text-zinc-400 font-medium">Fetching job details...</p>
      </div>
    )
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950">
        <div className="w-full max-w-lg bg-zinc-900 rounded-2xl shadow-2xl border border-rose-900/50 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-rose-400">Unable to Load Job</h2>
          <p className="text-zinc-400 mt-2">{error}</p>
          <button
            onClick={() => navigate('/creator/generation')}
            className="mt-8 px-6 py-2.5 bg-zinc-800 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Back to Generation Jobs
          </button>
        </div>
      </div>
    )
  }

  // ── Derive phase statuses from real data ──
  const status = jobData?.status || 'NOT_STARTED'
  const isFailed = status === 'FAILED'
  const isCompleted = status === 'COMPLETED'
  const isRunning = status === 'IN_PROGRESS'

  const sceneSegments = jobData?.song?.sceneSegments || []
  const hasScenes = sceneSegments.length > 0
  const allFrames = sceneSegments.flatMap(s => s.generatedFrames || [])
  const hasFrames = allFrames.length > 0

  // Phase 1 (Audio): Always completed if the job exists (audio was validated before job creation)
  const step1Status = 'completed'

  // Phase 2 (Scene Planning): completed if we have scenes, failed if job failed with no scenes
  let step2Status = 'waiting'
  if (hasScenes) step2Status = 'completed'
  else if (isRunning) step2Status = 'current'
  else if (isFailed && !hasScenes) step2Status = 'failed'

  // Phase 3 (Frame Gen + Assembly): completed if job completed, current if scenes exist but job running
  let step3Status = 'waiting'
  if (isCompleted) step3Status = 'completed'
  else if (hasScenes && isRunning) step3Status = 'current'
  else if (isFailed && hasScenes) step3Status = 'failed'

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-zinc-950 font-sans">
      <div className="w-full max-w-3xl space-y-8">

        {/* Central Status Card */}
        <div className="bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-800 p-10 text-center relative overflow-hidden">
          {/* Subtle gradient background effect */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-rose-500"></div>
          
          <button
            onClick={() => navigate('/creator/generation')}
            className="absolute top-8 left-8 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            &larr; Back
          </button>

          <div className="space-y-4">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {jobData?.song?.title || 'Unknown Project'}
            </h2>
            {jobData?.song?.artist && (
              <p className="text-zinc-400 text-sm uppercase tracking-widest font-semibold">
                {jobData.song.artist}
              </p>
            )}
            <div className="flex justify-center pt-4">
              <GenerationStatusBadge status={status} errorMessage={jobData?.errorMessage} className="scale-110" />
            </div>
            
            {isFailed && jobData?.errorMessage && (
              <div className="mt-6 bg-rose-950/30 border border-rose-900/50 rounded-lg p-5 text-left max-w-2xl mx-auto">
                <p className="text-rose-400 text-sm font-mono break-words">{jobData.errorMessage}</p>
              </div>
            )}
            
            {isCompleted && (
              <p className="text-emerald-400 font-medium pt-4 text-sm tracking-wide">
                ✨ Your cinematic video has been assembled successfully!
              </p>
            )}
          </div>
        </div>

        {/* Vertical Step Tracker */}
        <div className="space-y-5">

          {/* Phase 1: Audio */}
          <ProgressStep
            title="Phase 1: Audio Extraction & Validation"
            description="Downloading MP3, verifying Cloudinary upload, and checking database constraints."
            status={step1Status}
          >
            <div className="flex items-center gap-3 text-emerald-400 bg-emerald-950/20 p-4 rounded-lg border border-emerald-900/30">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Audio successfully secured in cloud storage.</span>
            </div>
          </ProgressStep>

          {/* Phase 2: Scene Planning — Expandable Accordion */}
          <ProgressStep
            title="Phase 2: AI Scene Planning"
            description="GPT-4o reads lyrics and generates precise cinematic visual prompts."
            status={step2Status}
            defaultExpanded={hasScenes}
          >
            {hasScenes ? (
              <div className="space-y-4">
                <p className="font-medium text-violet-400 mb-4 px-1">
                  Generated {sceneSegments.length} scene{sceneSegments.length !== 1 ? 's' : ''}:
                </p>
                <div className="max-h-[32rem] overflow-y-auto space-y-4 pr-2">
                  {sceneSegments.map((scene, idx) => (
                    <div key={scene.id} className="bg-gray-800 rounded-xl p-5 border border-zinc-700/50 shadow-inner">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-violet-400 text-sm uppercase tracking-wider">Scene {idx + 1}</span>
                        <span className="text-xs font-mono bg-zinc-900 text-zinc-400 px-2.5 py-1 rounded-md border border-zinc-800">
                          {scene.startTime}s – {scene.endTime}s
                        </span>
                      </div>
                      
                      {scene.lyrics && (
                        <div className="mb-4 pl-4 border-l-2 border-violet-500/50">
                          <p className="italic text-zinc-400 text-sm leading-relaxed">
                            "{scene.lyrics}"
                          </p>
                        </div>
                      )}
                      
                      <div className="bg-gray-900 rounded-lg p-4 border border-zinc-800">
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-2">
                          Visual Prompt
                        </span>
                        <p className="text-white text-sm leading-relaxed font-medium">
                          {scene.visualPrompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                <p className="text-zinc-400 animate-pulse">
                  Waiting for the AI to finish analyzing lyrics...
                </p>
              </div>
            )}
          </ProgressStep>

          {/* Phase 3: Image Generation & Video Assembly */}
          <ProgressStep
            title="Phase 3: Image Generation & Video Assembly"
            description="Generating images with DALL-E and stitching everything together with FFmpeg."
            status={step3Status}
            defaultExpanded={isCompleted || (hasFrames && step3Status === 'current')}
          >
            {isCompleted ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-white font-bold text-xl mb-1">Generation Complete!</p>
                  <p className="text-zinc-400 text-sm">
                    {allFrames.length} frame{allFrames.length !== 1 ? 's' : ''} generated across {sceneSegments.length} scene{sceneSegments.length !== 1 ? 's' : ''}.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/creator/generation')}
                  className="mt-6 px-8 py-3 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/20"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : step3Status === 'failed' ? (
              <div className="flex flex-col items-center py-10 text-center space-y-3">
                <XCircle className="w-12 h-12 text-rose-500" />
                <p className="text-rose-400 font-medium">This phase encountered an error.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                <p className="text-zinc-400 font-medium">
                  {hasFrames
                    ? `Generated ${allFrames.length} frames so far... assembling video.`
                    : 'Generating frames with DALL-E... This is the longest step.'}
                </p>
              </div>
            )}
          </ProgressStep>
        </div>

      </div>
    </div>
  )
}
