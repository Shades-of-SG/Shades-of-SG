import { useRef } from 'react'

export default function SongMediaUpload({ audioFileName, onAudioFileChange, onAudioFileClear, youtubeLink, onYoutubeLinkChange }) {
  const audioInputRef = useRef(null)

  function clearAudioFile() {
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }

    onAudioFileClear()
  }

  return (
    <section className="studio-media-upload">
      <div className="studio-card__section-heading">
        <h3>
          Song Media <span aria-hidden="true">ⓘ</span>
        </h3>
      </div>

      <div className="studio-media-upload__panel">
        <div className="studio-media-upload__file-block">
          <div className="studio-media-upload__icon" aria-hidden="true">
            ♫
          </div>
          <div>
            <strong>Upload Media</strong>
            <p>MP3, WAV, M4A, WebM, or MP4, max 50MB</p>
          </div>
          <label className="studio-button studio-button--secondary studio-media-upload__choose">
            Choose File
            <input accept=".mp3,.wav,.m4a,.mpeg,.mpga,.webm,.mp4,audio/mpeg,audio/mp4,audio/wav,audio/x-wav,audio/webm,video/webm,video/mp4" onChange={onAudioFileChange} ref={audioInputRef} type="file" />
          </label>
        </div>
        {audioFileName && (
          <div className="studio-media-upload__filename">
            <span>{audioFileName}</span>
            <button aria-label="Remove uploaded media file" className="studio-media-upload__remove" onClick={clearAudioFile} type="button">
              x
            </button>
          </div>
        )}

        <div className="studio-media-upload__divider">or</div>

        <label className="studio-field studio-media-upload__link-field">
          <span>Paste YouTube link here</span>
          <input onChange={(event) => onYoutubeLinkChange(event.target.value)} placeholder="Paste YouTube link here" value={youtubeLink} />
        </label>
      </div>
    </section>
  )
}
