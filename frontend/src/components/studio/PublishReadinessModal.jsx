import { useEffect, useRef } from 'react'
import { Sparkles, Upload, X } from 'lucide-react'

const FIELD_LABELS = {
  artist: 'Add the artist name.',
  audioUrl: 'Upload the song audio.',
  coverImageUrl: 'Upload cover artwork.',
  description: 'Add a short song description.',
  languages: 'Choose at least one language.',
  rawLyrics: 'Add or extract the song lyrics.',
  theme: 'Choose a cultural theme.',
  title: 'Add a song title.',
}

const DETAIL_FIELDS = new Set(['artist', 'audioUrl', 'coverImageUrl', 'description', 'languages', 'theme', 'title'])
const VIDEO_FIELDS = new Set(['videoUrl', 'status READY', 'completed generation job'])

export default function PublishReadinessModal({ busy = false, missing = [], onClose, onGenerateVideo, onGoToStep, onUploadVideo }) {
  const uploadRef = useRef(null)
  const needsDetails = missing.some((field) => DETAIL_FIELDS.has(field))
  const needsLyrics = missing.includes('rawLyrics')
  const needsVideo = missing.some((field) => VIDEO_FIELDS.has(field))
  const tasks = [
    ...missing.filter((field) => FIELD_LABELS[field]).map((field) => FIELD_LABELS[field]),
    ...(needsVideo ? ['Add a finished video before publishing.'] : []),
  ]

  useEffect(() => {
    function closeOnEscape(event) { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [busy, onClose])

  return <div className="studio-publish-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }} role="presentation">
    <section aria-labelledby="publish-assistant-title" aria-modal="true" className="studio-publish-modal" role="dialog">
      <header>
        <div><span>Almost ready</span><h2 id="publish-assistant-title">Complete these tasks before publishing</h2></div>
        <button aria-label="Close publishing assistant" disabled={busy} onClick={onClose} type="button"><X aria-hidden="true" /></button>
      </header>
      <p>Your draft is safe. Choose where you would like to continue.</p>
      <ul>{[...new Set(tasks)].map((task) => <li key={task}>{task}</li>)}</ul>

      {needsVideo ? <div className="studio-publish-video-choice">
        <h3>How would you like to add the video?</h3>
        <p>Generate an AI video from the song, or upload your own finished MP4/WebM video.</p>
        <div>
          <button className="studio-button studio-button--primary" disabled={busy} onClick={onGenerateVideo} type="button"><Sparkles aria-hidden="true" /> Generate AI Video</button>
          <button className="studio-button studio-button--secondary" disabled={busy} onClick={() => uploadRef.current?.click()} type="button"><Upload aria-hidden="true" /> Upload Video</button>
          <input accept="video/mp4,video/webm,.mp4,.webm" aria-label="Upload finished video" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) onUploadVideo(file) }} ref={uploadRef} type="file" />
        </div>
      </div> : null}

      <footer>
        {needsDetails ? <button className="studio-button studio-button--secondary" disabled={busy} onClick={() => onGoToStep(1)} type="button">Complete Song Details</button> : null}
        {needsLyrics ? <button className="studio-button studio-button--secondary" disabled={busy} onClick={() => onGoToStep(2)} type="button">Add Lyrics</button> : null}
        <button className="studio-button studio-button--ghost" disabled={busy} onClick={onClose} type="button">Keep Editing</button>
      </footer>
    </section>
  </div>
}
