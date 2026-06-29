import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import GenerationStatusBadge from '../components/GenerationStatusBadge'

export default function GenerationProgress() {
  const { id } = useParams()
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let intervalId

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/generation/${id}/status`)

        if (!response.ok) {
          throw new Error(`Failed to fetch status: ${response.statusText}`)
        }

        const json = await response.json()

        if (json.success) {
          setJobData(json.data)

          // Stop polling if we reached a terminal state
          if (json.data.status === 'COMPLETED' || json.data.status === 'FAILED') {
            clearInterval(intervalId)
          }
        } else {
          throw new Error(json.message || 'Error parsing job status')
        }
      } catch (err) {
        setError(err.message)
        // Clear interval on a hard fetch error to avoid spiraling network requests
        clearInterval(intervalId)
      } finally {
        setLoading(false)
      }
    }

    // Trigger immediate fetch to avoid the 3000ms delay on first load
    fetchStatus()

    // Begin interval polling
    intervalId = setInterval(fetchStatus, 3000)

    // Strict Memory Cleanup: Clear the interval when component unmounts
    return () => clearInterval(intervalId)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500 mb-4" />
        <p className="text-slate-600 font-medium">Fetching job details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-red-200 p-8 space-y-4 text-center">
          <h2 className="text-xl font-bold text-red-700">Unable to Load Job</h2>
          <p className="text-slate-600">{error}</p>
          <Link
            to="/dashboard/generation"
            className="inline-block mt-4 px-4 py-2 bg-slate-200 text-slate-800 text-sm font-medium rounded-md hover:bg-slate-300"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          {jobData?.Song?.title || 'Unknown Project'}
        </h2>

        <div className="flex justify-center py-4">
          <GenerationStatusBadge
            status={jobData?.status}
            errorMessage={jobData?.errorMessage}
            className="scale-110"
          />
        </div>

        {/* Dynamic Context Description based on current status */}
        <p className="text-slate-600 text-sm">
          {jobData?.status === 'NOT_STARTED' && 'Waiting in queue to begin generation...'}
          {jobData?.status === 'IN_PROGRESS' &&
            'AI is currently rendering frames and stitching audio. This might take a minute...'}
          {jobData?.status === 'COMPLETED' &&
            'Your cinematic video has been assembled successfully.'}
          {jobData?.status === 'FAILED' &&
            'The generation pipeline encountered a fatal error during assembly.'}
        </p>

        <div className="pt-4">
          <Link
            to="/dashboard/generation"
            className="inline-block px-6 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
