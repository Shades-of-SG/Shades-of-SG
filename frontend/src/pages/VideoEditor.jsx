import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import mockJobData from '../data/mockJobData.json'

export default function VideoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [jobData] = useState(mockJobData)
  const [loading] = useState(false)
  // eslint-disable-next-line no-unused-vars
  const [song] = useState(mockJobData?.song || null)
  
  const [frames] = useState(() => {
    // Temporarily bypass real fetch and hydrate from mockData
    if (mockJobData?.song?.sceneSegments) {
      const allFrames = []
      const segments = [...mockJobData.song.sceneSegments].sort((a, b) => a.startTime - b.startTime)
      
      segments.forEach(segment => {
        if (segment.generatedFrames && segment.generatedFrames.length > 0) {
           const sortedFrames = [...segment.generatedFrames].sort((a, b) => a.frameOrder - b.frameOrder)
           allFrames.push(...sortedFrames)
        }
      })
      return allFrames
    }
    return []
  })
  const [currentFrameIndex] = useState(0)
  // eslint-disable-next-line no-unused-vars
  const [audioUrl] = useState(mockJobData?.song?.audioUrl || '')

  if (loading) {
    return (
      <CreatorPageShell breadcrumbs={['Video Editor']} title="Editor" description="Loading workspace...">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </CreatorPageShell>
    )
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks', 'Video Editor']}
      title="KindMaster Timeline Editor"
      description="Refine your scenes, adjust timings, and export the final masterpiece."
      actions={
        <div className="flex gap-4">
          <button
            className="studio-button studio-button--secondary"
            onClick={() => navigate(`/creator/generation/${id}`)}
          >
            Back to Job
          </button>
          <button
            className="studio-button studio-button--primary"
            onClick={() => alert('Export pipeline not yet integrated')}
          >
            Export Final Video
          </button>
        </div>
      }
    >
      <div className="flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl min-h-[70vh]">
        
        {/* Middle Canvas: Video Preview Placeholder */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
          <div className="aspect-video w-full max-w-5xl mx-auto overflow-hidden rounded-xl border border-slate-700/50 bg-black shadow-2xl relative flex items-center justify-center">
            {frames.length > 0 ? (
              <img 
                src={frames[currentFrameIndex]?.imageUrl} 
                alt="Current Frame" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center">
                <h3 className="text-slate-500 font-bold text-xl uppercase tracking-widest mb-2">Video Preview Canvas</h3>
                <p className="text-slate-600 text-sm">Main viewer will mount here</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Strip: Timeline Editor Placeholder */}
        <div className="bg-slate-900 h-64 border-t border-slate-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-400 font-medium uppercase text-xs tracking-wider">Frame Timeline</h4>
            <span className="text-violet-500 text-xs font-bold">{jobData?.song?.sceneSegments?.length || 0} Scenes</span>
          </div>
          
          <div className="w-full h-32 border border-dashed border-slate-700 rounded-lg flex items-center justify-center bg-slate-800/50">
            <p className="text-slate-500 text-sm">Drag & Drop track space</p>
          </div>
        </div>

      </div>
    </CreatorPageShell>
  )
}
