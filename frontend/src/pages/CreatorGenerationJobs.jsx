import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GenerationStatusBadge from '../components/GenerationStatusBadge'

export default function CreatorGenerationJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/generation')
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
        }

        const json = await response.json()
        if (json.success) {
          setJobs(json.data)
        } else {
          throw new Error(json.message || 'Failed to retrieve jobs.')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        AI Video Generation Tasks
      </h1>

      {loading && <div className="text-slate-500 font-medium">Loading jobs...</div>}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          Error: {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-slate-500">No generation jobs found.</div>
      )}

      {!loading && !error && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-slate-800">
                  {job.Song?.title || 'Unknown Song'}
                </span>
                <span className="text-sm text-slate-500 mt-1">
                  {new Date(job.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center">
                <GenerationStatusBadge status={job.status} errorMessage={job.errorMessage} />
                <Link
                  to={`/generation/${job.id}`}
                  className="ml-4 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
                >
                  View Progress
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
