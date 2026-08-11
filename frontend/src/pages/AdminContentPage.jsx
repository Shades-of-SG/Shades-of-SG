import { Archive, FolderPlus, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AdminPageHeader, AdminSummaryError, AdminTabPanel, AdminTabs, ConfirmationModal, DataTable, DetailDrawer, EmptyState, Feedback, FilterBar, LoadingRows, Pagination, Panel, StatusBadge } from '../components/admin/AdminUI'
import ContextAuditHistory from '../components/admin/ContextAuditHistory'
import { useAuth } from '../context/AuthContext'
import useAdminSummary from '../hooks/useAdminSummary'
import {
  archiveAdminSong, assignSongToFolder, createPlatformFolder, deleteAdminFolder, getAdminFolders, getAdminSongs,
  publishAdminSong, removeSongFromFolder, restoreAdminSong, unpublishAdminSong, updateAdminFolder,
} from '../services/adminService'
import { formatDate, labelFor, useTab } from './adminUtils'

function CreatorLink({ creator }) {
  if (!creator) return <span>Creator unavailable</span>
  return <Link className="admin-content__creator-link" rel="noopener noreferrer" target="_blank" to={`/creators/${creator.id}`}>{creator.name || creator.email}</Link>
}

function decisionLabel(status) {
  if (status === 'APPROVED') return 'Approve'
  if (status === 'REJECTED') return 'Reject'
  if (status === 'CHANGES_REQUESTED') return 'Request changes'
  if (status === 'ARCHIVED') return 'Archive'
  return labelFor(status)
}

function SongActions({ onAction, onView, song }) {
  const secondary = (song.availableActions || []).filter((action) => !['VIEW_DETAILS'].includes(action))
  return <div className="admin-table__actions admin-content__row-actions">
    <button className="admin-button admin-button--ghost" onClick={onView} type="button">View details</button>
    {secondary.length ? <details className="admin-action-menu"><summary aria-label={`More actions for ${song.title}`} role="button"><MoreHorizontal /></summary><div>
      {secondary.map((action) => <button key={action} onClick={() => onAction(action, song)} type="button">{action === 'PREVIEW' ? 'Preview' : labelFor(action)}</button>)}
    </div></details> : null}
  </div>
}

function MediaPreview({ song }) {
  if (!song.audioUrl && !song.videoUrl) return <p>No audio or video is available for preview.</p>
  return <div className="admin-content__media">
    {song.coverImageUrl ? <img alt={`Artwork for ${song.title}`} decoding="async" loading="lazy" src={song.coverImageUrl} /> : <div className="admin-content__artwork-empty">No artwork</div>}
    <div>
      {song.videoUrl ? <video aria-label={`Video preview for ${song.title}`} controls preload="metadata" src={song.videoUrl} /> : null}
      {song.audioUrl ? <audio aria-label={`Audio preview for ${song.title}`} controls preload="metadata" src={song.audioUrl} /> : null}
    </div>
  </div>
}

function SongDetail({ onAction, song, token }) {
  const missing = song.publishReadiness?.missingFields || []
  return <>
    <section className="admin-detail-drawer__section admin-content__identity">
      {song.coverImageUrl ? <img alt="" src={song.coverImageUrl} /> : null}
      <div><h3>Song</h3><p><strong>{song.title}</strong><br />{song.artist || 'Artist not set'}</p><div className="admin-content__badges"><StatusBadge status={song.status} /> <StatusBadge status={song.publiclyVisible ? 'PUBLIC' : 'NOT_PUBLIC'}>{song.publiclyVisible ? 'Public' : 'Not public'}</StatusBadge></div></div>
    </section>
    <section className="admin-detail-drawer__section"><h3>Creator ownership</h3><p><CreatorLink creator={song.creator} /><br />{song.creator?.email}</p><p className="admin-content__assurance">Administrative actions do not transfer creator ownership.</p></section>
    <section className="admin-detail-drawer__section"><h3>Description</h3><p className="admin-content__prose">{song.description || 'No description provided.'}</p></section>
    <section className="admin-detail-drawer__section"><h3>Preview</h3><MediaPreview song={song} /></section>
    <section className="admin-detail-drawer__section"><h3>Publication readiness</h3>{song.status === 'READY' && !missing.length ? <p>Required metadata and media are complete. Publishing makes this song available in the public library.</p> : missing.length ? <><p>This song cannot be published yet.</p><ul className="admin-content__missing">{missing.map((field) => <li key={field}>{field}</li>)}</ul></> : <p>Publishing is not available while the song is {labelFor(song.status).toLowerCase()}.</p>}</section>
    <section className="admin-detail-drawer__section"><h3>Collections</h3><p>{(song.folders || []).map((folder) => folder.name).join(', ') || 'Not currently placed in a collection.'}</p></section>
    <section className="admin-detail-drawer__section"><h3>Processing and metadata</h3><dl className="admin-detail-list"><div><dt>Generation</dt><dd>{song.generationStatus ? labelFor(song.generationStatus) : 'No generation record'}</dd></div><div><dt>Theme</dt><dd>{song.theme || 'Not set'}</dd></div><div><dt>Languages</dt><dd>{Array.isArray(song.languages) && song.languages.length ? song.languages.join(', ') : 'Not set'}</dd></div><div><dt>Updated</dt><dd>{formatDate(song.updatedAt)}</dd></div><div><dt>Published</dt><dd>{song.publishedDate ? formatDate(song.publishedDate) : 'Not currently published'}</dd></div></dl></section>
    <section className="admin-detail-drawer__section"><h3>Available actions</h3><div className="admin-content__drawer-actions">{(song.availableActions || []).filter((action) => !['VIEW_DETAILS', 'PREVIEW'].includes(action)).map((action) => <button className={`admin-button ${['UNPUBLISH', 'ARCHIVE'].includes(action) ? 'admin-button--danger' : 'admin-button--primary'}`} key={action} onClick={() => onAction(action, song)} type="button">{action === 'RESTORE' ? <RotateCcw /> : action === 'ARCHIVE' ? <Archive /> : null}{labelFor(action)}</button>)}</div></section>
    <ContextAuditHistory entityId={song.id} key={`${song.id}-${song.updatedAt}`} token={token} />
  </>
}

function CollectionDetail({ eligiblePagination, eligibleSearch, eligibleSongs, membershipSongId, onAdd, onDelete, onEdit, onEligibleSearch, onLoadMoreEligible, onMembershipChoice, onRemove, onTransition, folder, token }) {
  const assignedIds = new Set((folder.songs || []).map((song) => song.id))
  const availableSongs = eligibleSongs.filter((song) => !assignedIds.has(song.id))
  return <>
    <section className="admin-detail-drawer__section"><h3>Collection</h3><p><strong>{folder.name}</strong><br />{folder.description || 'No description provided.'}</p><div className="admin-content__badges"><StatusBadge status={folder.status} /> <StatusBadge status={folder.publiclyVisible ? 'PUBLIC' : 'NOT_PUBLIC'}>{folder.publiclyVisible ? 'Public' : 'Not public'}</StatusBadge></div></section>
    <section className="admin-detail-drawer__section"><h3>Ownership model</h3><p>{folder.origin === 'PLATFORM' ? 'Platform-owned collection created by an administrator.' : `Creator-proposed collection${folder.proposer?.name ? ` from ${folder.proposer.name}` : ''}.`}</p></section>
    <section className="admin-detail-drawer__section"><h3>Included songs ({folder.membershipCount ?? folder.songs?.length ?? 0})</h3><p>Collection membership does not publish or transfer ownership of a song.</p>{folder.songs?.length ? <ul className="admin-content__members">{folder.songs.map((song) => <li key={song.id}><span><strong>{song.title}</strong><small>{song.artist || 'Artist not set'} · {song.creator?.name || 'Unknown creator'}</small></span><button aria-label={`Remove ${song.title} from ${folder.name}`} className="admin-button admin-button--ghost" onClick={() => onRemove(song)} type="button">Remove</button></li>)}</ul> : <p>No songs assigned.</p>}
      {folder.status === 'APPROVED' ? <div className="admin-content__membership"><label>Search published songs<input aria-label="Search published songs to add" onChange={(event) => onEligibleSearch(event.target.value)} placeholder="Title, artist, or creator" type="search" value={eligibleSearch} /></label><label>Add a published song<select onChange={(event) => onMembershipChoice(event.target.value)} value={membershipSongId}><option value="">Choose a song</option>{availableSongs.map((song) => <option key={song.id} value={song.id}>{song.title} — {song.creator?.name || song.artist || 'Unknown creator'}</option>)}</select></label>{eligiblePagination.hasNextPage ? <button className="admin-button admin-button--ghost" onClick={onLoadMoreEligible} type="button">Load more songs</button> : null}<button className="admin-button admin-button--primary" disabled={!membershipSongId} onClick={onAdd} type="button">Add song</button></div> : <p>Only approved collections can receive songs.</p>}
    </section>
    <section className="admin-detail-drawer__section"><h3>Collection actions</h3><div className="admin-content__drawer-actions">{folder.origin === 'PLATFORM' ? <button className="admin-button admin-button--ghost" onClick={onEdit} type="button"><Pencil />Edit metadata</button> : null}{(folder.allowedTransitions || []).map((status) => <button className={`admin-button ${['ARCHIVED', 'REJECTED'].includes(status) ? 'admin-button--danger' : 'admin-button--primary'}`} key={status} onClick={() => onTransition(status)} type="button">{status === 'APPROVED' && folder.status === 'ARCHIVED' ? 'Show collection' : status === 'ARCHIVED' ? 'Hide collection' : decisionLabel(status)}</button>)}<button className="admin-button admin-button--danger" onClick={onDelete} type="button"><Trash2 />Delete collection</button></div></section>
    <ContextAuditHistory entityId={folder.id} key={`${folder.id}-${folder.updatedAt}`} token={token} />
  </>
}

export default function AdminContentPage() {
  const { token } = useAuth()
  const { data: summary, error: summaryError, loading: summaryLoading, refresh: refreshSummary } = useAdminSummary(token)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useTab(params, setParams, ['songs', 'collections'], 'songs')
  const requestedSongId = tab === 'songs' ? (params.get('songId') || '') : ''
  const [songs, setSongs] = useState([])
  const [folders, setFolders] = useState([])
  const [eligibleSongs, setEligibleSongs] = useState([])
  const [eligibleSearch, setEligibleSearch] = useState('')
  const [eligiblePagination, setEligiblePagination] = useState({ page: 1, hasNextPage: false })
  const [statusOptions, setStatusOptions] = useState([])
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 })
  const [filters, setFilters] = useState({ search: '', status: '', visibility: '' })
  const [selected, setSelected] = useState(null)
  const [membershipSongId, setMembershipSongId] = useState('')
  const [modal, setModal] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'songs') {
        const data = await getAdminSongs(token, { limit: 25, page, search: filters.search, songId: requestedSongId, status: filters.status, visibility: filters.visibility })
        const rows = data.songs || []
        setSongs(rows); setPagination(data.pagination || { page: 1, totalPages: 1 }); setStatusOptions(data.songStatuses || [])
        setSelected((current) => requestedSongId ? rows.find((item) => item.id === requestedSongId) || null : current ? rows.find((item) => item.id === current.id) || null : null)
      } else if (tab === 'collections') {
        const [data, published] = await Promise.all([
          getAdminFolders(token, { limit: 25, page, search: filters.search, status: filters.status }),
          getAdminSongs(token, { limit: 20, page: 1, search: eligibleSearch, status: 'PUBLISHED' }),
        ])
        const rows = data.folders || []
        setFolders(rows); setEligibleSongs(published.items || published.songs || []); setEligiblePagination(published.pagination || { page: 1, hasNextPage: false }); setPagination(data.pagination || { page: 1, totalPages: 1 }); setStatusOptions(data.folderStatuses || [])
        setSelected((current) => current ? rows.find((item) => item.id === current.id) || null : null)
      }
    } catch (error) {
      setFeedback({ message: `Content could not be refreshed. Existing rows may be stale. ${error.message}`, type: 'error' })
    } finally { setLoading(false) }
  }, [eligibleSearch, filters.search, filters.status, filters.visibility, page, requestedSongId, tab, token])

  useEffect(() => {
    const timer = window.setTimeout(refresh, filters.search ? 220 : 0)
    return () => window.clearTimeout(timer)
  }, [filters.search, refresh])

  const currentRows = tab === 'songs' ? songs : folders
  async function loadMoreEligibleSongs() {
    if (!eligiblePagination.hasNextPage) return
    try {
      const data = await getAdminSongs(token, { limit: 20, page: eligiblePagination.page + 1, search: eligibleSearch, status: 'PUBLISHED' })
      const known = new Set(eligibleSongs.map((song) => song.id))
      setEligibleSongs((current) => [...current, ...(data.items || data.songs || []).filter((song) => !known.has(song.id))])
      setEligiblePagination(data.pagination)
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) }
  }
  const hasFilters = Boolean(filters.search || filters.status || filters.visibility)
  const selectedSongForMembership = useMemo(() => eligibleSongs.find((song) => song.id === membershipSongId), [eligibleSongs, membershipSongId])

  function openCreateCollection() {
    const currentTotal = Number(pagination.totalItems ?? summary?.tabCounts?.collections ?? folders.length)
    setModal({ description: '', displayOrder: currentTotal + 1, entity: 'collection', name: '' })
  }

  function applySong(song) {
    setSongs((rows) => rows.map((item) => item.id === song.id ? song : item))
    setSelected((current) => current?.id === song.id ? song : current)
  }

  function changeFilter(name, value) {
    setPage(1)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  function openSongAction(action, song) {
    if (action === 'VIEW_DETAILS' || action === 'PREVIEW') { setSelected(song); return }
    setModal({ action, entity: 'song-action', note: '', reason: '', song })
  }

  async function submitSongAction() {
    const { action, song } = modal
    if (['UNPUBLISH', 'ARCHIVE'].includes(action) && !modal.reason.trim()) { setFeedback({ message: `A reason is required to ${action.toLowerCase()} this song.`, type: 'error' }); return }
    setBusy(true)
    try {
      let data
      if (action === 'PUBLISH') data = await publishAdminSong(song.id, modal.note, token)
      if (action === 'UNPUBLISH') data = await unpublishAdminSong(song.id, modal.reason, token)
      if (action === 'ARCHIVE') data = await archiveAdminSong(song.id, modal.reason, token)
      if (action === 'RESTORE') data = await restoreAdminSong(song.id, token)
      applySong(data.song)
      const outcome = action === 'PUBLISH' ? 'published and made public' : action === 'UNPUBLISH' ? 'unpublished; creator data and ownership were preserved' : action === 'ARCHIVE' ? 'archived without deletion' : 'restored'
      setFeedback({ message: `${song.title} was ${outcome}.`, type: 'status' }); setModal(null); await refreshSummary()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitCollection() {
    if (modal.name.trim().length < 2) { setFeedback({ message: 'Collection name must contain at least two characters.', type: 'error' }); return }
    setBusy(true)
    try {
      if (modal.id) await updateAdminFolder(modal.id, { description: modal.description, displayOrder: Number(modal.displayOrder || 0), name: modal.name }, token)
      else await createPlatformFolder({ description: modal.description, displayOrder: Number(modal.displayOrder || 0), name: modal.name }, token)
      setFeedback({ message: modal.id ? 'Collection updated.' : 'Collection created. It is visible with any published member songs.', type: 'status' }); setModal(null); await Promise.all([refresh(), refreshSummary()])
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitFolderTransition() {
    if (['ARCHIVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(modal.status) && !modal.reviewNote.trim()) { setFeedback({ message: 'A reason is required for this collection action.', type: 'error' }); return }
    setBusy(true)
    try {
      await updateAdminFolder(modal.folder.id, { reviewNote: modal.reviewNote, status: modal.status }, token)
      setFeedback({ message: `Collection moved to ${labelFor(modal.status).toLowerCase()}. Existing song ownership and membership were preserved.`, type: 'status' }); setModal(null); await Promise.all([refresh(), refreshSummary()])
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitCollectionDelete() {
    setBusy(true)
    try {
      await deleteAdminFolder(modal.folder.id, token)
      setSelected(null)
      setFeedback({ message: `${modal.folder.name} was permanently deleted.`, type: 'status' })
      setModal(null)
      await Promise.all([refresh(), refreshSummary()])
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function addMembership() {
    if (!selected || !selectedSongForMembership) return
    setBusy(true)
    try { await assignSongToFolder(selected.id, selectedSongForMembership.id, selected.songs?.length || 0, token); setMembershipSongId(''); setFeedback({ message: `${selectedSongForMembership.title} added to ${selected.name}.`, type: 'status' }); await refresh() }
    catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function removeMembership(song) {
    if (!selected) return
    setBusy(true)
    try { await removeSongFromFolder(selected.id, song.id, token); setFeedback({ message: `${song.title} was removed from the collection. The song remains published and creator-owned.`, type: 'status' }); await refresh() }
    catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  return <div className="admin-page admin-content"><div className="admin-page__inner">
    <AdminPageHeader actions={tab === 'collections' ? <button className="admin-button admin-button--primary" onClick={openCreateCollection} type="button"><Plus />Create collection</button> : null} description="Review creator-owned songs and curate the collections shown in the Heritage Vault." title="Content" />
    <AdminTabs active={tab} items={[
      { id: 'songs', label: 'Songs', count: summary?.tabCounts?.songs, countLoading: summaryLoading },
      { id: 'collections', label: 'Collections', count: summary?.tabCounts?.collections, countLoading: summaryLoading },
    ]} onChange={(next) => { setLoading(true); setFilters({ search: '', status: '', visibility: '' }); setPage(1); setSelected(null); setMembershipSongId(''); setStatusOptions([]); setTab(next) }} />
    <AdminSummaryError message={summaryError} onRetry={refreshSummary} />
    <Feedback {...feedback} />
    <AdminTabPanel key={tab}>
      <FilterBar onClear={() => { setPage(1); setFilters({ search: '', status: '', visibility: '' }) }} showClear={hasFilters}>
        <label>Search<input aria-label="Search content" onChange={(event) => changeFilter('search', event.target.value)} placeholder={tab === 'songs' ? 'Title, artist, or creator' : 'Collection name'} value={filters.search} /></label>
        <label>Status<select disabled={!statusOptions.length} onChange={(event) => changeFilter('status', event.target.value)} value={filters.status}><option value="">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></label>
        {tab === 'songs' ? <label>Visibility<select onChange={(event) => changeFilter('visibility', event.target.value)} value={filters.visibility}><option value="">All visibility</option><option value="PUBLIC">Public</option><option value="NOT_PUBLIC">Not public</option></select></label> : null}
      </FilterBar>
      <Panel className="admin-content__panel" subtitle={tab === 'songs' ? 'Public visibility is shown separately from workflow state.' : 'These are the collections shown on Learning Hub > Heritage Vault.'} title={tab === 'songs' ? 'All creator songs' : 'Heritage Vault collections'}>
        {loading && !currentRows.length ? <LoadingRows /> : tab === 'songs' ? (songs.length ? <DataTable caption="All creator songs" columns={['Song', 'Creator', 'Workflow', 'Visibility', 'Collections', 'Updated', 'Action']}>
          {songs.map((song) => <tr className={selected?.id === song.id ? 'is-selected' : ''} key={song.id}><td data-label="Song"><button className="admin-row-button" onClick={() => setSelected(song)} type="button"><strong>{song.title}</strong><small>{song.artist || 'Artist not set'}</small></button></td><td data-label="Creator"><CreatorLink creator={song.creator} /><small>{song.creator?.email}</small></td><td data-label="Workflow"><StatusBadge status={song.status}>{labelFor(song.status)}</StatusBadge></td><td data-label="Visibility"><StatusBadge status={song.publiclyVisible ? 'PUBLIC' : 'NOT_PUBLIC'}>{song.publiclyVisible ? 'Public' : 'Not public'}</StatusBadge></td><td data-label="Collections" className="admin-content__wrap">{(song.folders || []).map((folder) => folder.name).join(', ') || 'None'}</td><td data-label="Updated">{formatDate(song.updatedAt, false)}</td><td data-label="Action"><SongActions onAction={openSongAction} onView={() => setSelected(song)} song={song} /></td></tr>)}
        </DataTable> : <EmptyState description={hasFilters ? 'Try changing or clearing the filters.' : 'Creator songs will appear here after they are created.'} title="No songs found" />) : (folders.length ? <DataTable caption="Collections" columns={['Collection', 'Ownership', 'Songs', 'Visibility', 'Order', 'Status', 'Action']}>
          {folders.map((folder) => <tr className={selected?.id === folder.id ? 'is-selected' : ''} key={folder.id}><td data-label="Collection"><button className="admin-row-button" onClick={() => setSelected(folder)} type="button"><strong>{folder.name}</strong><small>{folder.description || 'No description'}</small></button></td><td data-label="Ownership">{folder.origin === 'PLATFORM' ? 'Platform-owned' : 'Creator proposal'}</td><td data-label="Songs">{folder.membershipCount ?? folder.songs?.length ?? 0}</td><td data-label="Visibility">{folder.publiclyVisible ? 'Public' : 'Not public'}</td><td data-label="Order">{folder.displayOrder}</td><td data-label="Status"><StatusBadge status={folder.status}>{labelFor(folder.status)}</StatusBadge></td><td data-label="Action"><button className="admin-button admin-button--ghost" onClick={() => setSelected(folder)} type="button">{folder.allowedTransitions?.length ? 'Review details' : 'View details'}</button></td></tr>)}
        </DataTable> : <EmptyState action={!hasFilters ? <button className="admin-button admin-button--primary" onClick={openCreateCollection} type="button"><FolderPlus />Create collection</button> : null} description={hasFilters ? 'Try changing or clearing the filters.' : 'Create the first collection for the Heritage Vault.'} title="No collections found" />)}
        {!loading && currentRows.length ? <Pagination onNext={() => setPage((value) => value + 1)} onPrevious={() => setPage((value) => Math.max(value - 1, 1))} page={pagination.page || page} totalPages={pagination.totalPages || 1} /> : null}
      </Panel>
    </AdminTabPanel>
    <DetailDrawer onClose={() => { setSelected(null); setMembershipSongId(''); if (requestedSongId) { const next = new URLSearchParams(params); next.delete('songId'); setParams(next) } }} open={Boolean(selected)} title={tab === 'songs' ? 'Song review' : 'Collection details'}>
      {selected && tab === 'songs' ? <SongDetail onAction={openSongAction} song={selected} token={token} /> : null}
      {selected && tab === 'collections' ? <CollectionDetail eligiblePagination={eligiblePagination} eligibleSearch={eligibleSearch} eligibleSongs={eligibleSongs} folder={selected} membershipSongId={membershipSongId} onAdd={addMembership} onDelete={() => setModal({ entity: 'collection-delete', folder: selected })} onEdit={() => setModal({ ...selected, entity: 'collection' })} onEligibleSearch={(value) => { setEligibleSearch(value); setMembershipSongId('') }} onLoadMoreEligible={loadMoreEligibleSongs} onMembershipChoice={setMembershipSongId} onRemove={removeMembership} onTransition={(status) => setModal({ entity: 'folder-transition', folder: selected, reviewNote: '', status })} token={token} /> : null}
    </DetailDrawer>
    {modal?.entity === 'collection' ? <ConfirmationModal busy={busy} confirmLabel={modal.id ? 'Save changes' : 'Create collection'} onCancel={() => setModal(null)} onConfirm={submitCollection} title={modal.id ? 'Edit collection' : 'Create collection'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><label>Name<input autoFocus maxLength="255" onChange={(event) => setModal((value) => ({ ...value, name: event.target.value }))} required value={modal.name} /></label><label>Vault prompt / description<textarea maxLength="2000" onChange={(event) => setModal((value) => ({ ...value, description: event.target.value }))} value={modal.description || ''} /></label><label>Collection number<input min="1" onChange={(event) => setModal((value) => ({ ...value, displayOrder: event.target.value }))} required type="number" value={modal.displayOrder ?? 1} /></label></form></ConfirmationModal> : null}
    {modal?.entity === 'folder-transition' ? <ConfirmationModal busy={busy} confirmLabel={modal.status === 'APPROVED' && modal.folder.status === 'ARCHIVED' ? 'Show collection' : modal.status === 'ARCHIVED' ? 'Hide collection' : labelFor(modal.status)} danger={['ARCHIVED', 'REJECTED'].includes(modal.status)} onCancel={() => setModal(null)} onConfirm={submitFolderTransition} title={`${modal.status === 'ARCHIVED' ? 'Hide' : modal.status === 'APPROVED' && modal.folder.status === 'ARCHIVED' ? 'Show' : labelFor(modal.status)} ${modal.folder.name}?`}><p>{modal.status === 'ARCHIVED' ? 'The collection will be hidden from the Heritage Vault. Its data and song memberships remain intact.' : modal.status === 'APPROVED' ? 'The collection will appear in the Heritage Vault again.' : 'The proposal and creator data will be retained with this decision.'}</p><label>Reason or review note<textarea autoFocus maxLength="2000" onChange={(event) => setModal((value) => ({ ...value, reviewNote: event.target.value }))} required={['ARCHIVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(modal.status)} value={modal.reviewNote} /></label></ConfirmationModal> : null}
    {modal?.entity === 'collection-delete' ? <ConfirmationModal busy={busy} confirmLabel="Delete permanently" danger onCancel={() => setModal(null)} onConfirm={submitCollectionDelete} title={`Delete ${modal.folder.name}?`}><p>This permanently removes the collection from Admin and the Heritage Vault, including its song memberships. The songs themselves remain unchanged. Use Hide collection instead if you may want to restore it later.</p></ConfirmationModal> : null}
    {modal?.entity === 'song-action' ? <ConfirmationModal busy={busy} confirmLabel={modal.action === 'PUBLISH' ? 'Publish song' : modal.action === 'UNPUBLISH' ? 'Unpublish song' : modal.action === 'ARCHIVE' ? 'Archive song' : 'Restore song'} danger={['UNPUBLISH', 'ARCHIVE'].includes(modal.action)} onCancel={() => setModal(null)} onConfirm={submitSongAction} title={`${labelFor(modal.action)} ${modal.song.title}?`}>
      {modal.action === 'PUBLISH' ? <><p>This makes the song visible in the public library. Creator ownership and existing scores, reflections, analytics, generation records, and collection links remain unchanged.</p><label>Publication note (optional)<textarea autoFocus maxLength="2000" onChange={(event) => setModal((value) => ({ ...value, note: event.target.value }))} value={modal.note} /></label></> : null}
      {modal.action === 'UNPUBLISH' ? <><p>Public access will be removed. The song returns to Ready; creator ownership, draft data, scores, reflections, analytics, generation records, and collection links remain intact.</p><label>Reason<textarea autoFocus maxLength="2000" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></> : null}
      {modal.action === 'ARCHIVE' ? <><p>The song will be hidden from public access and marked Archived, but it remains visible to its creator in Studio. Ownership, history, dependent records, and collection links remain intact. This is not deletion.</p><label>Reason<textarea autoFocus maxLength="2000" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></> : null}
      {modal.action === 'RESTORE' ? <p>The song will return to Ready when finished video exists, otherwise Draft. It will not be published automatically.</p> : null}
    </ConfirmationModal> : null}
  </div></div>
}
