import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AuthRequiredModal from '../components/AuthRequiredModal'
import GuestThankYouModal from '../components/GuestThankYouModal'
import ReflectionEmptyState from '../components/ReflectionEmptyState'
import ReflectionFilters from '../components/ReflectionFilters'
import ReflectionGrid from '../components/ReflectionGrid'
import ReflectionModal from '../components/ReflectionModal'
import ReflectionDiscussionModal from '../components/ReflectionDiscussionModal'
import { useAuth } from '../context/AuthContext'
import {
  clearPostLoginIntent,
  getPostLoginIntent,
  savePostLoginIntent,
  updatePostLoginIntent,
} from '../services/postLoginIntent'
import {
  createReflection,
  deleteReflection,
  getReflections,
  getReflectionSongs,
  likeReflection,
  unlikeReflection,
  updateReflection,
} from '../services/reflectionService'

export default function ReflectionWall() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedSongId = searchParams.get('song_id') || ''
  const shouldOpenComposer = searchParams.get('compose') === '1'
  const { token, user } = useAuth()
  const [reflections, setReflections] = useState([])
  const [songs, setSongs] = useState([])
  const [query, setQuery] = useState('')
  const [songId, setSongId] = useState('')
  const [sort, setSort] = useState('latest')
  const [modalReflection, setModalReflection] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [discussionReflection, setDiscussionReflection] = useState(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)
  const [showGuestThanks, setShowGuestThanks] = useState(false)
  const [reflectionDraft, setReflectionDraft] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [likeBusyIds, setLikeBusyIds] = useState(new Set())
  const likeRequests = useRef(new Set())

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(() => {
      if (!active) return
      setIsLoading(true)
      Promise.all([getReflections(token, shouldOpenComposer ? '' : requestedSongId), getReflectionSongs({ limit: 50 })])
        .then(([nextReflections, nextSongs]) => {
          if (!active) return
          setReflections(nextReflections)
          setSongs(nextSongs)
          if (requestedSongId) {
            const requestedSong = nextSongs.find((song) => song.id === requestedSongId)
            if (!requestedSong) {
              setSongId('')
              setError('The requested Song is unavailable or is not published.')
              return
            }
            setSongId(shouldOpenComposer ? '' : requestedSongId)
          }
          setError('')
        })
        .catch((nextError) => active && setError(nextError.message))
        .finally(() => active && setIsLoading(false))
    }, 0)
    return () => { active = false; window.clearTimeout(timer) }
  }, [requestedSongId, shouldOpenComposer, token])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!user || !token) return undefined
    const intent = getPostLoginIntent()
    if (intent?.returnTo === '/reflections' && intent.openReflectionModal) {
      const timer = window.setTimeout(() => {
        setReflectionDraft(intent.draftReflection || null)
        setModalReflection(null)
        setIsModalOpen(true)
      }, 0)
      return () => window.clearTimeout(timer)
    }
    return undefined
  }, [token, user])

  useEffect(() => {
    if (!shouldOpenComposer || isLoading) return undefined

    const timer = window.setTimeout(() => {
      const nextSearchParams = new URLSearchParams(searchParams)
      nextSearchParams.delete('compose')
      nextSearchParams.delete('song_id')
      setSearchParams(nextSearchParams, { replace: true })

      const composerSongId = requestedSongId || songId

      if (!user || !token) {
        savePostLoginIntent({
          action: 'create-reflection',
          draftReflection: { content: '', isAnonymous: false, songId: composerSongId },
          openReflectionModal: true,
          returnTo: '/reflections',
        })
        setIsAuthModalOpen(true)
        return
      }

      if (songs.length === 0) {
        setError('No songs are available yet. Publish a song before adding a reflection.')
        return
      }

      setModalReflection(null)
      setReflectionDraft({ content: '', isAnonymous: false, songId: composerSongId })
      setIsModalOpen(true)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [isLoading, requestedSongId, searchParams, setSearchParams, shouldOpenComposer, songId, songs, token, user])

  const visibleReflections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return reflections
      .filter((item) => !songId || item.songId === songId)
      .filter((item) => !normalizedQuery || [item.content, item.displayName, item.song?.title].some((value) => value?.toLowerCase().includes(normalizedQuery)))
      .sort((a, b) => {
        const difference = new Date(b.createdAt) - new Date(a.createdAt)
        if (sort === 'most_liked') return b.likeCount - a.likeCount || difference
        if (sort === 'most_discussed') return b.commentCount - a.commentCount || difference
        return sort === 'latest' ? difference : -difference
      })
  }, [query, reflections, songId, sort])

  function openCreate() {
    if (!user || !token) {
      savePostLoginIntent({
        action: 'create-reflection',
        draftReflection: { content: '', isAnonymous: false, songId },
        openReflectionModal: true,
        returnTo: '/reflections',
      })
      setIsAuthModalOpen(true)
      return
    }
    if (songs.length === 0) {
      setError('No songs are available yet. Publish a song before adding a reflection.')
      return
    }
    setModalReflection(null)
    setReflectionDraft({ content: '', isAnonymous: false, songId })
    setIsModalOpen(true)
  }

  function closeReflectionModal() {
    setIsModalOpen(false)
    setReflectionDraft(null)
    setIsGuestMode(false)
    if (!modalReflection) clearPostLoginIntent()
  }

  function updateReflectionDraft(draftReflection) {
    setReflectionDraft(draftReflection)
    updatePostLoginIntent({ draftReflection })
  }

  async function saveReflection(values) {
    setIsModalOpen(false)
    clearPostLoginIntent()

    if (modalReflection) {
      const previous = modalReflection
      const selectedSong = songs.find((song) => song.id === values.songId)
      setReflections((items) => items.map((item) => item.id === previous.id ? { ...item, ...values, displayName: values.isAnonymous ? 'Anonymous' : user.name, song: selectedSong } : item))
      try {
        const saved = await updateReflection(previous.id, values, token)
        setReflections((items) => items.map((item) => item.id === saved.id ? saved : item))
        setToast('Reflection updated.')
      } catch (nextError) {
        setReflections((items) => items.map((item) => item.id === previous.id ? previous : item))
        setError(nextError.message)
      }
      return
    }

    const temporaryId = `pending-${Date.now()}`
    const selectedSong = songs.find((song) => song.id === values.songId)
    const guestSubmission = isGuestMode || !user || !token
    const optimistic = { ...values, id: temporaryId, createdAt: new Date().toISOString(), displayName: values.isAnonymous ? 'Anonymous' : user?.name, isOwner: !guestSubmission, isPending: true, song: selectedSong }
    if (!guestSubmission) setReflections((items) => [optimistic, ...items])
    try {
      await createReflection(values, token)
      if (guestSubmission) {
        setShowGuestThanks(true)
      } else {
        setReflections((items) => items.filter((item) => item.id !== temporaryId))
        setToast('Reflection submitted for moderation.')
      }
      setIsGuestMode(false)
    } catch (nextError) {
      setReflections((items) => items.filter((item) => item.id !== temporaryId))
      setError(nextError.message)
    }
  }

  async function removeReflection(reflection) {
    if (!window.confirm('Delete this reflection? This cannot be undone.')) return
    setReflections((items) => items.filter((item) => item.id !== reflection.id))
    try {
      await deleteReflection(reflection.id, token)
      setToast('Reflection deleted.')
    } catch (nextError) {
      setReflections((items) => [reflection, ...items])
      setError(nextError.message)
    }
  }

  const closeDiscussion = useCallback(() => setDiscussionReflection(null), [])

  function updateDiscussionReflection(nextReflection) {
    setDiscussionReflection((current) => current?.id === nextReflection.id ? nextReflection : current)
    setReflections((items) => items.map((item) => item.id === nextReflection.id ? nextReflection : item))
  }

  function loginForDiscussion() {
    navigate('/login', { state: { from: { pathname: '/reflections' } } })
  }

  async function toggleReflectionLike(reflection) {
    if (likeRequests.current.has(reflection.id)) return
    likeRequests.current.add(reflection.id)
    setLikeBusyIds((current) => new Set(current).add(reflection.id))
    const optimistic = {
      ...reflection,
      isLiked: !reflection.isLiked,
      likeCount: Math.max(0, reflection.likeCount + (reflection.isLiked ? -1 : 1)),
    }
    updateDiscussionReflection(optimistic)
    try {
      const result = reflection.isLiked
        ? await unlikeReflection(reflection.id, token)
        : await likeReflection(reflection.id, token)
      updateDiscussionReflection({ ...optimistic, isLiked: result.liked, likeCount: result.likeCount })
    } catch (nextError) {
      updateDiscussionReflection(reflection)
      setError(nextError.message)
    } finally {
      likeRequests.current.delete(reflection.id)
      setLikeBusyIds((current) => { const next = new Set(current); next.delete(reflection.id); return next })
    }
  }

  return (
    <div className="rw-board-page">
      <section className="rw-heading">
        <h1>Reflection Wall</h1>
        <p>Share the memories, places, and feelings that Singapore's songs bring back to you.</p>
      </section>

      <ReflectionFilters onAdd={openCreate} query={query} setQuery={setQuery} setSongId={setSongId} setSort={setSort} showAdd={reflections.length > 0} songId={songId} songs={songs} sort={sort} />

      {error && <div className="rw-alert" role="alert"><span>{error}</span><button onClick={() => setError('')} type="button">Dismiss</button></div>}
      {isLoading ? <div className="rw-loading" role="status">Loading community memories…</div> : null}
      {!isLoading && (query.trim() || songId) && visibleReflections.length > 0 ? <p aria-live="polite" className="rw-results-count">{visibleReflections.length} {visibleReflections.length === 1 ? 'reflection' : 'reflections'} found</p> : null}
      {!isLoading && visibleReflections.length > 0 ? <ReflectionGrid likeBusyIds={likeBusyIds} onDelete={removeReflection} onEdit={(reflection) => { setModalReflection(reflection); setIsModalOpen(true) }} onLike={toggleReflectionLike} onOpen={setDiscussionReflection} reflections={visibleReflections} /> : null}
      {!isLoading && visibleReflections.length === 0 ? <ReflectionEmptyState filtered={Boolean(query || songId)} onAdd={openCreate} /> : null}

      {isModalOpen && <ReflectionModal draft={reflectionDraft} isGuest={isGuestMode} onClose={closeReflectionModal} onDraftChange={updateReflectionDraft} onSave={saveReflection} reflection={modalReflection} songs={songs} user={user} />}
      {discussionReflection ? <ReflectionDiscussionModal onClose={closeDiscussion} onLogin={loginForDiscussion} onReflectionChange={updateDiscussionReflection} reflection={discussionReflection} token={token} user={user} /> : null}
      {isAuthModalOpen && (
        <AuthRequiredModal
          onCancel={() => { setIsAuthModalOpen(false); clearPostLoginIntent() }}
          onGuest={() => { setIsAuthModalOpen(false); clearPostLoginIntent(); setIsGuestMode(true); setModalReflection(null); setReflectionDraft({ content: '', isAnonymous: true, songId }); setIsModalOpen(true) }}
          onLogin={() => navigate('/login', { state: { from: { pathname: '/reflections' } } })}
        />
      )}
      {showGuestThanks && <GuestThankYouModal onClose={() => setShowGuestThanks(false)} onRegister={() => navigate('/register', { state: { from: { pathname: '/reflections' } } })} />}
      {toast && <div className="rw-toast" role="status">{toast}</div>}
    </div>
  )
}
