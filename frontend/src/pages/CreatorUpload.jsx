import { useState } from 'react'
import { FileAudio, Youtube, Loader2, CheckCircle2, AlertCircle, UploadCloud } from 'lucide-react'

export default function CreatorUpload() {
  // State Machine: Tabs
  const [activeTab, setActiveTab] = useState('file') // 'file' | 'youtube'

  // Form State
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [youtubeUrl, setYoutubeUrl] = useState('')

  // Submission & Status State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: 'idle', message: '' }) // 'idle' | 'success' | 'error'

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    // Clear the specific inputs when switching to avoid mismatched payload data
    if (tab === 'file') setYoutubeUrl('')
    if (tab === 'youtube') setFile(null)
    setStatus({ type: 'idle', message: '' })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      // Basic client-side validation
      const validTypes = ['audio/mpeg', 'audio/wav']
      if (!validTypes.includes(selectedFile.type)) {
        setStatus({
          type: 'error',
          message: 'Invalid file format. Please upload an .mp3 or .wav file.',
        })
        e.target.value = '' // Reset input
        setFile(null)
        return
      }
      setFile(selectedFile)
      setStatus({ type: 'idle', message: '' })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: 'idle', message: '' })

    // Build the FormData payload (Mandatory for multipart/form-data)
    const formData = new FormData()
    formData.append('title', title.trim())
    if (artist) formData.append('artist', artist.trim())
    if (description) formData.append('description', description.trim())

    if (activeTab === 'file') {
      if (!file) {
        setStatus({ type: 'error', message: 'Please select an audio file to upload.' })
        setIsSubmitting(false)
        return
      }
      formData.append('file', file)
    } else {
      if (!youtubeUrl) {
        setStatus({ type: 'error', message: 'Please enter a valid YouTube URL.' })
        setIsSubmitting(false)
        return
      }
      formData.append('youtubeUrl', youtubeUrl.trim())
    }

    try {
      // Using native fetch to avoid any axios dependency/version conflicts.
      // Note: Do NOT set the 'Content-Type' header. The browser automatically sets it
      // to 'multipart/form-data' along with the correct boundary when passing FormData.
      const response = await fetch('/api/songs', {
        method: 'POST',
        body: formData,
      })

      const responseData = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to process media. Please try again.')
      }

      // Handle Success Boundary
      setStatus({ type: 'success', message: 'Song successfully added to the database!' })

      // Clear the form
      setTitle('')
      setArtist('')
      setDescription('')
      setFile(null)
      setYoutubeUrl('')
    } catch (error) {
      // Handle Error Boundary
      setStatus({ type: 'error', message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-gray-900">Upload Background Tune</h1>
          <p className="mt-1 text-sm text-gray-500">
            Add a new song to the Shades of SG platform to begin the AI generation pipeline.
          </p>
        </div>

        <div className="p-8">
          {/* Status Alerts */}
          {status.type === 'error' && (
            <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-red-800 font-medium">{status.message}</div>
            </div>
          )}
          {status.type === 'success' && (
            <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 flex items-start">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-green-800 font-medium">{status.message}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Metadata Inputs */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Song Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Di Tanjong Katong"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-sm"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
                  Artist / Composer
                </label>
                <input
                  type="text"
                  id="artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="e.g. Traditional"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-sm"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Cultural Context / Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share the history or significance of this song..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-sm resize-none"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Media Ingestion State Machine Toggle */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Media Source <span className="text-red-500">*</span>
              </label>

              <div className="flex p-1 space-x-1 bg-gray-100 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('file')}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'file'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <FileAudio className="w-4 h-4 mr-2" />
                  Upload Audio File
                </button>
                <button
                  type="button"
                  onClick={() => handleTabSwitch('youtube')}
                  disabled={isSubmitting}
                  className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'youtube'
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                  }`}
                >
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube Link
                </button>
              </div>

              {/* Dynamic Media Input */}
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6">
                {activeTab === 'file' ? (
                  <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 mb-1">
                      Drag and drop your audio file here, or click to browse.
                    </p>
                    <p className="text-xs text-gray-500 mb-4">Supports .MP3 and .WAV up to 50MB</p>
                    <input
                      type="file"
                      accept=".mp3,audio/mpeg,.wav,audio/wav"
                      onChange={handleFileChange}
                      className="block w-full max-w-xs text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100 cursor-pointer transition-all"
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="youtubeUrl"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      YouTube Video URL
                    </label>
                    <input
                      type="url"
                      id="youtubeUrl"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors text-sm"
                      disabled={isSubmitting}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Uploading Media...
                  </>
                ) : (
                  'Ingest & Save Song'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
