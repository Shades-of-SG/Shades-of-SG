import { ImagePlus } from 'lucide-react'
import { useRef } from 'react'

export default function CoverImageUpload({ coverFileName = '', coverImageUrl = '', onChange, onClear }) {
  const inputRef = useRef(null)

  function handleChange(event) {
    onChange(event)
  }

  function clearSelectedCover() {
    if (inputRef.current) inputRef.current.value = ''
    onClear()
  }

  return (
    <section className="studio-cover-upload">
      <div className="studio-card__section-heading">
        <h3>Cover Image <strong aria-hidden="true">*</strong></h3>
      </div>

      <div className="studio-cover-upload__panel">
        <div className="studio-media-upload__file-block">
          <div className="studio-media-upload__icon" aria-hidden="true"><ImagePlus /></div>
          <div>
            <strong>Upload Cover</strong>
            <p>JPG, PNG, or WebP, max 10MB</p>
          </div>
          <label className="studio-button studio-button--secondary studio-media-upload__choose">
            {coverImageUrl ? 'Choose Another' : 'Choose File'}
            <input aria-label="Upload cover image" accept="image/jpeg,image/png,image/webp" onChange={handleChange} ref={inputRef} type="file" />
          </label>
        </div>

        {coverFileName && <div className="studio-media-upload__filename">
          <span>{coverFileName}</span>
          <button aria-label="Remove selected cover image" className="studio-media-upload__remove" onClick={clearSelectedCover} type="button">×</button>
        </div>}

        {coverImageUrl && <div className="studio-cover-upload__preview-card">
          <img alt="Song cover preview" className="studio-cover-upload__preview" src={coverImageUrl} />
          <div><strong>{coverFileName ? 'New cover selected' : 'Current cover'}</strong><p>{coverFileName ? 'This image will be uploaded when you save the draft.' : 'Choose another image to replace this cover.'}</p></div>
        </div>}
      </div>
    </section>
  )
}
