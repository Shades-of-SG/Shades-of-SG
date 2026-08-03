import { CheckCircle2, Download, FileText, LoaderCircle, RefreshCw, Trash2, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function formatFileSize(bytes) {
  if (!Number.isFinite(Number(bytes))) return ''
  return `${(Number(bytes) / 1024 / 1024).toFixed(Number(bytes) >= 1024 * 1024 ? 1 : 2)} MB`
}

export default function ResumeUpload({ application, busy, error, onDownload, onRemove, onSelect, upload }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const stored = application?.hasResume

  const choose = (files) => {
    const file = files?.[0]
    if (file) onSelect(file)
  }

  return <section className="creator-resume" aria-labelledby="creator-resume-title">
    <div className="creator-resume__heading">
      <div><span className="creator-resume__icon"><UploadCloud /></span><div><h3 id="creator-resume-title">Resume upload</h3><p>PDF or DOCX · 5 MB maximum · stored privately</p></div></div>
    </div>
    <div
      className={`creator-resume__dropzone${dragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragLeave={(event) => { event.preventDefault(); setDragging(false) }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files) }}
    >
      <UploadCloud aria-hidden="true" />
      <strong>Drag and drop your resume here</strong>
      <span>or</span>
      <button disabled={busy || upload.state === 'uploading'} onClick={() => inputRef.current?.click()} type="button">Browse files</button>
      <input accept={ACCEPT} aria-label="Choose resume file" hidden onChange={(event) => { choose(event.target.files); event.target.value = '' }} ref={inputRef} type="file" />
    </div>
    {upload.state === 'uploading' ? <div className="creator-resume__status" role="status">
      <LoaderCircle className="is-spinning" /><div><strong>Uploading {upload.fileName}</strong><span>{upload.progress}% complete</span><span className="creator-resume__progress"><span style={{ width: `${upload.progress}%` }} /></span></div>
    </div> : null}
    {error ? <p className="creator-resume__error" role="alert">{error}</p> : null}
    {stored && upload.state !== 'uploading' ? <div className="creator-resume__file">
      <FileText aria-hidden="true" />
      <div><strong>{application.resumeFileName}</strong><span>{formatFileSize(application.resumeFileSize)} · Upload complete</span></div>
      <CheckCircle2 className="creator-resume__success" aria-label="Upload complete" />
      <div className="creator-resume__actions">
        <button aria-label={`Download ${application.resumeFileName}`} disabled={busy} onClick={onDownload} type="button"><Download />Download</button>
        <button disabled={busy} onClick={() => inputRef.current?.click()} type="button"><RefreshCw />Replace</button>
        <button className="is-danger" disabled={busy} onClick={onRemove} type="button"><Trash2 />Remove</button>
      </div>
    </div> : null}
  </section>
}
