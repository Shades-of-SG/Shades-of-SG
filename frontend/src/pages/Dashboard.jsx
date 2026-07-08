import { useState } from 'react'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import EmptyState from '../components/EmptyState'
import { Link } from 'react-router-dom'
import { creatorSongs, songFilterStatusMap, songStatusFilters } from './pageData'

/*
TODO - Shermaine

Implement song statistics.
Implement creator song grid.
*/

const weeklyPlays = [
  { day: 'Mon', minutes: 18 },
  { day: 'Tue', minutes: 28 },
  { day: 'Wed', minutes: 22 },
  { day: 'Thu', minutes: 36 },
  { day: 'Fri', minutes: 30 },
  { day: 'Sat', minutes: 40 },
  { day: 'Sun', minutes: 34 },
]

const generationJobs = [
  { id: 'song-1', status: 'Queued', title: 'Song #1' },
  { id: 'song-2', status: 'Rendering frame set', title: 'Song #2' },
]

export default function Dashboard() {
  const [activeFilter, setActiveFilter] = useState('All')

  const filteredSongs =
    activeFilter === 'All'
      ? creatorSongs
      : creatorSongs.filter((song) => song.status === songFilterStatusMap[activeFilter])

  return (
    <CreatorPageShell
      breadcrumbs={['Dashboard']}
      className="creator-page--hero"
      description="Creator overview for song health, moderation needs, and publishing actions."
      title="Dashboard"
      actions={
        <>
          <Link className="studio-button studio-button--secondary" to="/creator/songs">Open Songs</Link>
          <Link className="studio-button studio-button--primary" to="/creator/reflections">Review Queue</Link>
        </>
      }
    >
      <section className="stats-grid">
        <SectionCard title="Total Songs"><strong>12</strong><span>songs</span><p>All tracks in your studio</p><Link className="inline-link" to="/creator/songs">Open songs <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Published"><strong>8</strong><span>live</span><p>Available in the library</p><Link className="inline-link" to="/creator/songs">See published <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Processing"><strong>3</strong><span>jobs</span><p>AI generating right now</p><Link className="inline-link" to="/creator/generation">View generation <span aria-hidden="true">→</span></Link></SectionCard>
        <SectionCard title="Total Plays"><strong>1,240</strong><span>mins</span><p>All-time song plays</p><Link className="inline-link" to="/creator/plays">View plays <span aria-hidden="true">→</span></Link></SectionCard>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-grid__main">
          <SectionCard title="My Songs">
            <div className="dashboard-filter-bar" aria-label="Song filters">
              {songStatusFilters.map((filter) => (
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

            {filteredSongs.length === 0 ? (
              <EmptyState
                description={`No ${activeFilter.toLowerCase()} songs yet.`}
                title="No songs found"
              />
            ) : (
              <div className="dashboard-song-list">
                {filteredSongs.map((song) => (
                  <article key={song.id} className="dashboard-song-item">
                    <div className="dashboard-song-art" aria-hidden="true">
                      {song.initials}
                    </div>

                    <div className="dashboard-song-copy">
                      <h3>{song.title}</h3>
                      <p>{song.description}</p>
                      <span className={`dashboard-song-badge is-${song.status.toLowerCase()}`}>
                        {song.badge}
                      </span>

                      {song.progress ? (
                        <div className="dashboard-song-progress">
                          <div className="progress-track">
                            <span style={{ width: `${song.progress}%` }} />
                          </div>
                          <small>{song.progress}%</small>
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="dashboard-grid__aside">
          <SectionCard title="Plays this week:">
            <div className="dashboard-chart" aria-label="Plays this week graph">
              {weeklyPlays.map((entry) => (
                <div key={entry.day} className="dashboard-chart__bar-group">
                  <button
                    className="dashboard-chart__bar"
                    type="button"
                    aria-label={`${entry.day}, ${entry.minutes} minutes total`}
                  >
                    <span style={{ height: `${entry.minutes}%` }} />
                  </button>
                  <span className="dashboard-chart__tooltip">
                    <strong className="dashboard-chart__tooltip-value">{entry.minutes} mins</strong>
                  </span>
                  <span className="dashboard-chart__label">{entry.day}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Generation Jobs:">
            <div className="dashboard-job-list">
              {generationJobs.map((job, index) => (
                <article key={job.id} className="dashboard-job-item">
                  <strong>{job.title}</strong>
                  <span>{job.status}</span>
                  {index === 0 ? <div className="progress-track"><span style={{ width: '42%' }} /></div> : null}
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </section>
    </CreatorPageShell>
  )
}
