import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
import { clearAdminSummaryCache } from '../hooks/useAdminSummary'

function adminResponse(url) {
  const path = String(url)
  if (path.includes('/admin/analytics')) return {
    activitySeries: [], events: {}, generationJobs: 0, pending: {}, reflections: 0, scores: 0,
    songs: { published: 0, total: 9 },
    tabCounts: { collections: 5, creatorApplications: 12, creators: 4, placementRequests: 3, reports: 2, songs: 9, users: 6, warnings: 1 },
    users: { admins: 1, creators: 4, registered: 0, total: 5 },
  }
  if (path.includes('/admin/creator-applications')) return { applications: [], pagination: {} }
  if (path.includes('/admin/creators')) return { creators: [], pagination: {} }
  if (path.includes('/admin/users')) return { users: [], pagination: {} }
  if (path.includes('/admin/songs')) return { songs: [], pagination: {} }
  if (path.includes('/admin/folders')) return { folders: [], pagination: {} }
  if (path.includes('/admin/folder-song-proposals')) return { proposals: [], pagination: {} }
  if (path.includes('/admin/audit-logs')) return { auditLogs: [], pagination: {} }
  if (path.includes('/admin/moderation-actions')) return { actions: [], pagination: {} }
  if (path.includes('/admin/warnings')) return { warnings: [], pagination: {} }
  if (path.includes('/admin/safety-reports')) return { pagination: { page: 1, total: 0, totalPages: 0 }, reports: [] }
  if (path.includes('/reflections/moderation')) return { pagination: { limit: 8, page: 1, total: 0, totalPages: 0 }, reflections: [], stats: { approved: 0, flagged: 0, newToday: 0, newYesterday: 0, pending: 0, rejected: 0 } }
  if (path.includes('/songs')) return { songs: [] }
  return {}
}

describe('consolidated admin routes', () => {
  beforeEach(() => {
    clearAdminSummaryCache()
    localStorage.clear()
    localStorage.setItem('authToken', 'admin-token')
    localStorage.setItem('authUser', JSON.stringify({ email: 'admin@example.com', id: 'admin-1', name: 'Admin', role: 'ADMIN' }))
    vi.stubGlobal('fetch', vi.fn(async (url) => ({ json: async () => adminResponse(url), ok: true, status: 200 })))
  })

  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it.each([
    ['/admin', /Good (morning|afternoon|evening)/],
    ['/admin/users', 'Users'],
    ['/admin/creators', 'Creators'],
    ['/admin/content', 'Content'],
    ['/admin/community', 'Safety & Reports'],
    ['/admin/activity', 'Audit history'],
  ])('renders %s inside the shared admin shell', async (path, heading) => {
    window.history.pushState({}, '', path)
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).toBeInTheDocument()
  })

  it('lists the Users tab between Overview and Creators in the sidebar', async () => {
    window.history.pushState({}, '', '/admin')
    render(<AuthProvider><App /></AuthProvider>)
    const nav = await screen.findByRole('navigation', { name: 'Admin navigation' })
    const labels = within(nav).getAllByRole('link').map((link) => link.textContent)
    expect(labels.indexOf('Overview')).toBeLessThan(labels.indexOf('Users'))
    expect(labels.indexOf('Users')).toBeLessThan(labels.indexOf('Creators'))
  })

  it.each([
    ['/admin/applications', '/admin/creators', 'applications'],
    ['/admin/songs', '/admin/content', 'songs'],
    ['/admin/folders', '/admin/content', 'collections'],
    ['/admin/reflections', '/admin/community', 'reports'],
    ['/admin/governance', '/admin/activity', ''],
  ])('redirects legacy route %s', async (from, pathname, tab) => {
    window.history.pushState({}, '', from)
    render(<AuthProvider><App /></AuthProvider>)
    await waitFor(() => expect(window.location.pathname).toBe(pathname))
    expect(new URLSearchParams(window.location.search).get('tab') || '').toBe(tab)
  })

  it('loads only the server-owned open safety queue', async () => {
    window.history.pushState({}, '', '/admin/community?tab=reports')
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Safety & Reports' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/safety-reports'), expect.any(Object)))
    expect(fetch.mock.calls.some(([url]) => String(url).includes('status=PENDING'))).toBe(false)
  })

  it('limits Safety & Reports to the three platform-moderation views', async () => {
    window.history.pushState({}, '', '/admin/community?tab=reports')
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('button', { name: /^Reports/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Users/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Warnings & Actions/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pending reflections/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^users/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/users\?.*scope=safety/), expect.any(Object)))

    fireEvent.click(screen.getByRole('button', { name: /warnings & actions/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/moderation-actions\?.*scope=safety/), expect.any(Object)))
  })

  it('keeps audit history out of primary navigation and exposes it from the profile menu', async () => {
    window.history.pushState({}, '', '/admin')
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('navigation', { name: 'Admin navigation' })).toHaveTextContent('Safety & Reports')
    expect(screen.getByRole('navigation', { name: 'Admin navigation' })).not.toHaveTextContent('Audit history')
    expect(screen.queryByRole('link', { name: 'Audit history' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /admin@example.com/i }))
    expect(screen.getByRole('menuitem', { name: 'Audit history' })).toHaveAttribute('href', '/admin/activity')
  })

  it('shows server-backed counts for inactive tabs on initial load', async () => {
    window.history.pushState({}, '', '/admin/creators?tab=applications')
    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('button', { name: 'Applications: 12' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approved Creators: 4' })).toBeInTheDocument()
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/admin/creators?'))).toBe(false)
  })

  it('uses a count placeholder while loading and displays a resolved zero', async () => {
    let resolveSummary
    const summaryResponse = new Promise((resolve) => { resolveSummary = resolve })
    fetch.mockImplementation(async (url) => {
      if (String(url).includes('/admin/analytics')) return summaryResponse
      return { json: async () => adminResponse(url), ok: true, status: 200 }
    })
    window.history.pushState({}, '', '/admin/content')
    render(<AuthProvider><App /></AuthProvider>)

    const collections = await screen.findByRole('button', { name: 'Collections: count loading' })
    expect(collections).not.toHaveTextContent('0')
    expect(collections.querySelector('.admin-tab-count')).toHaveClass('is-loading')

    await act(async () => {
      resolveSummary({
        json: async () => ({ ...adminResponse('/admin/analytics'), tabCounts: { ...adminResponse('/admin/analytics').tabCounts, collections: 0 } }),
        ok: true,
        status: 200,
      })
      await summaryResponse
    })
    expect(await screen.findByRole('button', { name: 'Collections: 0' })).toBeInTheDocument()
  })

  it('does not request the shared summary again when tabs change', async () => {
    window.history.pushState({}, '', '/admin/content')
    render(<AuthProvider><App /></AuthProvider>)
    await screen.findByRole('button', { name: 'Collections: 5' })

    fireEvent.click(screen.getByRole('button', { name: 'Collections: 5' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/folders'), expect.any(Object)))
    fireEvent.click(screen.getByRole('button', { name: 'Placement Requests: 3' }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/admin/folder-song-proposals'), expect.any(Object)))

    expect(fetch.mock.calls.filter(([url]) => String(url).includes('/admin/analytics'))).toHaveLength(1)
  })

  it('refreshes tab counts after creating a collection', async () => {
    let analyticsCalls = 0
    fetch.mockImplementation(async (url, options = {}) => {
      const path = String(url)
      if (path.includes('/admin/analytics')) {
        analyticsCalls += 1
        const data = adminResponse(url)
        return { json: async () => ({ ...data, tabCounts: { ...data.tabCounts, collections: analyticsCalls } }), ok: true, status: 200 }
      }
      if (path.includes('/admin/folders') && options.method === 'POST') return { json: async () => ({ folder: { id: 'folder-2', name: 'Heritage' } }), ok: true, status: 201 }
      return { json: async () => adminResponse(url), ok: true, status: 200 }
    })
    window.history.pushState({}, '', '/admin/content?tab=collections')
    render(<AuthProvider><App /></AuthProvider>)
    await screen.findByRole('button', { name: 'Collections: 1' })

    fireEvent.click(screen.getAllByRole('button', { name: 'Create collection' })[0])
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Heritage' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Create collection' }))

    expect(await screen.findByRole('button', { name: 'Collections: 2' })).toBeInTheDocument()
    expect(analyticsCalls).toBe(2)
  })

  it('restores a URL-selected tab and preserves tab history navigation', async () => {
    window.history.pushState({}, '', '/admin/content?tab=collections')
    render(<AuthProvider><App /></AuthProvider>)
    const collections = await screen.findByRole('button', { name: 'Collections: 5' })
    expect(collections).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('button', { name: 'Placement Requests: 3' }))
    await waitFor(() => expect(new URLSearchParams(window.location.search).get('tab')).toBe('placements'))
    act(() => { window.history.back() })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Collections: 5' })).toHaveAttribute('aria-current', 'page'))
  })

  it('keeps loading content distinct from an empty tab state', async () => {
    let resolveFolders
    const foldersResponse = new Promise((resolve) => { resolveFolders = resolve })
    fetch.mockImplementation(async (url) => {
      if (String(url).includes('/admin/folders')) return foldersResponse
      return { json: async () => adminResponse(url), ok: true, status: 200 }
    })
    window.history.pushState({}, '', '/admin/content?tab=collections')
    render(<AuthProvider><App /></AuthProvider>)

    expect(await screen.findByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('heading', { name: 'No collections found' })).not.toBeInTheDocument()

    await act(async () => {
      resolveFolders({ json: async () => ({ folders: [], pagination: {} }), ok: true, status: 200 })
      await foldersResponse
    })
    expect(await screen.findByRole('heading', { name: 'No collections found' })).toBeInTheDocument()
  })

  it('prevents repeated collection submissions and announces success', async () => {
    let resolveCreate
    let createCalls = 0
    const createResponse = new Promise((resolve) => { resolveCreate = resolve })
    fetch.mockImplementation(async (url, options = {}) => {
      const path = String(url)
      if (path.includes('/admin/folders') && options.method === 'POST') {
        createCalls += 1
        return createResponse
      }
      return { json: async () => adminResponse(url), ok: true, status: 200 }
    })
    window.history.pushState({}, '', '/admin/content?tab=collections')
    render(<AuthProvider><App /></AuthProvider>)
    await screen.findByRole('heading', { name: 'No collections found' })

    fireEvent.click(screen.getAllByRole('button', { name: 'Create collection' })[0])
    const dialog = screen.getByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Name'), { target: { value: 'Heritage' } })
    const confirm = within(dialog).getByRole('button', { name: 'Create collection' })
    fireEvent.click(confirm)

    const pending = await within(dialog).findByRole('button', { name: 'Working…' })
    expect(pending).toBeDisabled()
    expect(pending).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(pending)
    expect(createCalls).toBe(1)

    await act(async () => {
      resolveCreate({ json: async () => ({ folder: { id: 'folder-2', name: 'Heritage' } }), ok: true, status: 201 })
      await createResponse
    })
    const feedback = await screen.findByRole('status')
    expect(feedback).toHaveTextContent('Collection created.')
    expect(feedback).toHaveAttribute('aria-live', 'polite')
  })

  it('keeps expanded audit rows keyboard-operable while animating their disclosure', async () => {
    fetch.mockImplementation(async (url) => {
      if (String(url).includes('/admin/audit-logs')) return { json: async () => ({ auditLogs: [{
        action: 'CREATOR_SUSPENDED', actor: { name: 'Admin', role: 'ADMIN' }, createdAt: '2026-08-03T01:00:00.000Z',
        entityId: 'creator-1', entityType: 'CREATOR', id: 'audit-1', metadata: { reason: 'Policy review' },
      }], pagination: {} }), ok: true, status: 200 }
      return { json: async () => adminResponse(url), ok: true, status: 200 }
    })
    window.history.pushState({}, '', '/admin/activity')
    render(<AuthProvider><App /></AuthProvider>)

    const expander = await screen.findByRole('button', { name: 'Show details for Creator Suspended' })
    expander.focus()
    expect(expander).toHaveFocus()
    expect(expander).toHaveAttribute('aria-expanded', 'false')
    const detail = document.getElementById(expander.getAttribute('aria-controls'))
    expect(detail).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(expander)
    expect(screen.getByRole('button', { name: 'Hide details for Creator Suspended' })).toHaveAttribute('aria-expanded', 'true')
    expect(detail).toHaveAttribute('aria-hidden', 'false')
    expect(screen.getByText('Additional details')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Hide details for Creator Suspended' }))
    expect(screen.getByRole('button', { name: 'Show details for Creator Suspended' })).toHaveAttribute('aria-expanded', 'false')
    expect(detail).toHaveAttribute('aria-hidden', 'true')
  })
})
