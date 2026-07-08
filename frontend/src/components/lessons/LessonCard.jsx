import useLessonProgress from '../../hooks/useLessonProgress'

export default function LessonCard({ lesson, onSelect }) {
  const { progress } = useLessonProgress(lesson.id)

  if (!lesson.isBuilt) {
    return (
      <article className="lesson-card lesson-card--locked">
        <div className="lesson-card__art" aria-hidden="true">
          <span>🔒</span>
        </div>
        <div className="lesson-card__body">
          <span className="lesson-card__difficulty">{lesson.difficulty}</span>
          <h3>{lesson.title}</h3>
          <p className="lesson-card__description">{lesson.description}</p>
        </div>
        <span className="lesson-card__locked-label">Coming Soon</span>
      </article>
    )
  }

  const totalSections = lesson.sections.length
  const percentComplete = Math.round((progress.completedSections / totalSections) * 100)

  return (
    <article className="lesson-card">
      <div className="lesson-card__art" aria-hidden="true">
        <span>{lesson.icon}</span>
      </div>

      <div className="lesson-card__body">
        <span className="lesson-card__difficulty">{lesson.difficulty}</span>
        <h3>{lesson.title}</h3>
        <p className="lesson-card__description">{lesson.description}</p>
        <p className="lesson-card__meta">⏱ {lesson.duration}</p>
      </div>

      <div className="lesson-card__progress">
        <div className="progress-track">
          <span style={{ width: `${percentComplete}%` }} />
        </div>
        <small>
          {progress.isComplete
            ? '✓ Completed'
            : `${progress.completedSections} / ${totalSections} sections`}
        </small>
      </div>

      <button className="lesson-card__cta" onClick={() => onSelect(lesson.id)} type="button">
        {progress.isComplete
          ? 'Replay Lesson'
          : progress.completedSections > 0
            ? 'Continue Learning'
            : 'Start Lesson'}
      </button>
    </article>
  )
}
