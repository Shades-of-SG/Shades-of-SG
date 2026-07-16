import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import CreatorPageShell from '../components/CreatorPageShell'
import { useAuth } from '../context/AuthContext'
import { getGenerationJob } from '../services/songService'

export default function KindMasterEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setJobData(await getGenerationJob(id, token))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [id, token])

  if (loading) {
    return (
      <CreatorPageShell breadcrumbs={['KindMaster Editor']} title="Editor" description="Loading workspace...">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      </CreatorPageShell>
    )
  }

  return (
    <CreatorPageShell
      breadcrumbs={['Generation Tasks', 'KindMaster Editor']}
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
        <div className="flex-1 flex items-center justify-center bg-black relative min-h-[40vh]">
          <div className="text-center">
            <h3 className="text-slate-500 font-bold text-xl uppercase tracking-widest mb-2">Video Preview Canvas</h3>
            <p className="text-slate-600 text-sm">Main viewer will mount here</p>
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
