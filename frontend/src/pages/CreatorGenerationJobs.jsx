import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'

const jobFilters = ['All', 'Processing', 'Completed', 'Failed']

export default function CreatorGenerationJobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')

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

  // Derived state for the UI
  const filteredJobs =
    activeFilter === 'All'
      ? jobs
      : jobs.filter((job) => job.status.toLowerCase() === activeFilter.toLowerCase())

  const activeJobsCount = jobs.filter((job) => job.status.toLowerCase() === 'processing').length
  const completedJobsCount = jobs.filter((job) => job.status.toLowerCase() === 'completed').length

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks']}
      description="Monitor and manage your AI video compilation tasks."
      title="Generation Tasks"
      actions={
        <Link className="studio-button studio-button--primary" to="/creator/studio">
          Compile New Video
        </Link>
      }
    >
      {/* 1. Stats Grid */}
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

      {/* 2. Filter Bar */}
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

      {/* 3. Loading / Error States */}
      {loading && (
        <div className="p-8 text-center text-slate-500 font-medium">
          Loading generation tasks...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200">
          Error: {error}
        </div>
      )}

      {/* 4. Main List or Empty State */}
      {!loading && !error && filteredJobs.length === 0 ? (
        <EmptyState
          description={`No ${activeFilter.toLowerCase()} generation tasks found.`}
          title="No tasks found"
        />
      ) : (
        <div className="creator-song-browser">
          <div className="creator-song-browser__list">
            {!loading &&
              !error &&
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="dashboard-song-item creator-song-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingRight: '1.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Mocking the thumbnail area from CreatorSongs */}
                    <div className="dashboard-song-art" aria-hidden="true">
                      🎵
                    </div>

                    <div className="dashboard-song-copy">
                      <h3>{job.Song?.title || 'Unknown Song'}</h3>
                      <span className={`dashboard-song-badge is-${job.status.toLowerCase()}`}>
                        {job.status}
                      </span>

                      {/* Show a progress bar if it is currently processing */}
                      {job.status.toLowerCase() === 'processing' && (
                        <div className="dashboard-song-progress" style={{ marginTop: '0.5rem' }}>
                          <div className="progress-track">
                            <span style={{ width: `${job.progress || 0}%` }} />
                          </div>
                          <small>{job.progress || 0}%</small>
                        </div>
                      )}

                      {/* Show error message inline if it failed */}
                      {job.status.toLowerCase() === 'failed' && job.errorMessage && (
                        <p style={{ color: 'var(--color-destructive)', marginTop: '0.25rem' }}>
                          {job.errorMessage}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right-aligned action button */}
                  <div className="creator-song-actions">
                    <button
                      className="studio-button studio-button--secondary"
                      onClick={() => navigate(`/generation/${job.id}`)}
                      type="button"
                    >
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
