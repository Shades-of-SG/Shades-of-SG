import React, { useState, useRef, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Play, Pause, Volume2, Maximize, Subtitles, Sparkles, CheckCircle2, XCircle, ChevronRight, Music, CirclePlay } from 'lucide-react'

// MOCK DATA: Adapted for "Tomorrow's Here Today" but styled to match wireframe exactly.
const MOCK_SONG_DATA = {
  title: "Tomorrow's Here Today",
  artist: "53A",
  year: "2016",
  location: "Singapore",
  tags: ["National Day", "English Pop", "Upbeat"],
  videoUrl: "https://res.cloudinary.com/dep1fjics/video/upload/v1783766931/shades-of-sg/audio/ps0fkqa3vb0nvz4jmrrn.mp4",
  culturalSummary: "\"Tomorrow's Here Today\" is an upbeat, forward-looking anthem released for Singapore's National Day Parade in 2016. It embodies a modern, energetic vision of Singapore's future, encouraging unity and celebrating the diverse voices that make up the nation's fabric. The song resonates with a youthful energy and optimism.",
  instruments: [
    { name: "Acoustic Guitar", icon: "🎸" },
    { name: "Electric Bass", icon: "🎸" },
    { name: "Drum Kit", icon: "🥁" },
    { name: "Synthesizer", icon: "🎹" }
  ],
  trivia: {
    question: "In which year was 'Tomorrow's Here Today' released?",
    options: [
      { id: 'A', text: '2014' },
      { id: 'B', text: '2015' },
      { id: 'C', text: '2016' }, // Correct
      { id: 'D', text: '2017' }
    ],
    correctAnswerId: 'C'
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export default function SongExperience() {
  const { id = 'demo-song' } = useParams()
  
  // Video Player State
  const videoRef = useRef(null)
  const playerContainerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showCC, setShowCC] = useState(true)

  // Trivia State
  const [selectedAnswer, setSelectedAnswer] = useState(null)

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-6 font-sans">
      
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Top Section: Video (Left) + Instruments (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
          
          {/* Left Column: Video & Metadata */}
          <div className="flex flex-col gap-4">
            
            {/* Custom Video Player */}
            <div 
              ref={playerContainerRef}
              className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-xl group"
            >
              <video 
                ref={videoRef}
                src={MOCK_SONG_DATA.videoUrl}
                className="w-full h-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              
              {/* Note: Cloudinary/Assembler burns subtitles into the video directly, so we don't render a lyrics overlay here. The CC button just exists for aesthetic wireframe matching. */}

              {/* Controls Bar Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-4 text-white">
                  
                  {/* Play/Pause */}
                  <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                    {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                  </button>
                  
                  {/* Volume */}
                  <button className="hover:text-blue-400 transition-colors">
                    <Volume2 size={20} />
                  </button>
                  
                  {/* Time */}
                  <span className="text-xs font-mono text-slate-300">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  
                  {/* Scrubber */}
                  <input 
                    type="range" 
                    min="0" 
                    max={duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-grow h-1.5 bg-slate-600/50 rounded-full appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                  />
                  
                  {/* CC Button */}
                  <button 
                    onClick={() => setShowCC(!showCC)}
                    className={`transition-colors ${showCC ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    title="Captions are burned into the video"
                  >
                    <Subtitles size={20} />
                  </button>
                  
                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors">
                    <Maximize size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Metadata (Below Video) */}
            <div className="flex flex-col mt-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">{MOCK_SONG_DATA.title}</h1>
              <p className="text-slate-400 mt-1">
                {MOCK_SONG_DATA.artist} &middot; {MOCK_SONG_DATA.year} &middot; {MOCK_SONG_DATA.location}
              </p>
              
              <div className="flex gap-2 mt-4">
                {MOCK_SONG_DATA.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#1A1F2E] border border-slate-700/50 text-slate-300 text-xs rounded-md">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Featured Instruments */}
          <div className="bg-[#121622] border border-slate-800/80 rounded-xl p-6 shadow-lg flex flex-col h-full">
            <h2 className="text-lg font-serif italic text-slate-200 mb-6 flex items-center">
              Featured Instruments
            </h2>
            
            <div className="grid grid-cols-2 gap-4 flex-grow">
              {MOCK_SONG_DATA.instruments.map((inst, i) => (
                <div key={i} className="bg-[#1A1F2E] border border-slate-700/50 rounded-xl p-4 relative flex flex-col items-center justify-center hover:bg-[#1E2538] transition-colors cursor-pointer group">
                  
                  {/* Small Play Button Top Right */}
                  <button className="absolute top-3 right-3 text-slate-500 group-hover:text-white transition-colors">
                    <CirclePlay size={20} strokeWidth={1.5} />
                  </button>

                  <div className="text-4xl mb-3 opacity-80 group-hover:opacity-100 transition-opacity">
                    {inst.icon}
                  </div>
                  <span className="text-sm text-slate-300 group-hover:text-white">{inst.name}</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Bottom Section: About (Left) + Quiz (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6 mt-2">
          
          {/* About This Song */}
          <div className="bg-[#121622] border border-slate-800/80 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-medium text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-400" size={20} />
              About This Song
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              {MOCK_SONG_DATA.culturalSummary}
            </p>
          </div>

          {/* Knowledge Check */}
          <div className="bg-[#121622] border border-slate-800/80 rounded-xl p-6 shadow-lg">
            <p className="text-purple-400 text-xs font-medium mb-1">Knowledge Check (1/5)</p>
            <h2 className="text-lg font-medium text-slate-200 mb-4">
              {MOCK_SONG_DATA.trivia.question}
            </h2>
            
            <div className="flex flex-col gap-3">
              {MOCK_SONG_DATA.trivia.options.map((opt) => {
                const isSelected = selectedAnswer === opt.id
                const isCorrectAnswer = opt.id === MOCK_SONG_DATA.trivia.correctAnswerId
                
                // Determine styling based on selection state mimicking the wireframe
                let btnStyle = "bg-[#1A1F2E] border-slate-700 hover:bg-[#1E2538] text-slate-300"
                let icon = <div className="w-4 h-4 rounded-full border border-slate-500 mr-3"></div>
                
                if (selectedAnswer) {
                  if (isSelected && isCorrectAnswer) {
                    btnStyle = "bg-[#142921] border-green-600/50 text-green-400"
                    icon = <CheckCircle2 size={18} className="mr-3 text-green-500" />
                  } else if (isSelected && !isCorrectAnswer) {
                    btnStyle = "bg-[#3A1418] border-red-600/50 text-red-400"
                    icon = <XCircle size={18} className="mr-3 text-red-500" />
                  } else if (!isSelected && isCorrectAnswer) {
                    // Show the correct answer passively if they guessed wrong
                    btnStyle = "bg-[#1A1F2E] border-green-600/30 text-green-400/80"
                    icon = <CheckCircle2 size={18} className="mr-3 text-green-500/80" />
                  } else {
                    btnStyle = "bg-[#1A1F2E] border-slate-800 text-slate-600 opacity-50"
                  }
                }

                return (
                  <button 
                    key={opt.id}
                    onClick={() => !selectedAnswer && setSelectedAnswer(opt.id)}
                    disabled={selectedAnswer !== null}
                    className={`flex items-center text-left w-full p-3.5 border rounded-lg transition-all text-sm ${btnStyle}`}
                  >
                    {icon}
                    <span>{opt.id}. {opt.text}</span>
                  </button>
                )
              })}
            </div>
          </div>
          
        </div>

        {/* Learning Hub CTA */}
        <Link 
          to={`/learning`}
          className="w-full bg-[#4A1D96] hover:bg-[#5B25B3] transition-colors rounded-xl p-5 flex flex-col items-center justify-center group cursor-pointer shadow-[0_0_20px_rgba(74,29,150,0.3)] mt-2"
        >
          <div className="flex items-center gap-2 text-white font-medium text-lg">
            Take a Lesson in the Learning Hub 
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[#A78BFA] text-sm mt-1">
            (routes to /learning upon quiz completion)
          </p>
        </Link>
        
      </div>
    </div>
  )
}
