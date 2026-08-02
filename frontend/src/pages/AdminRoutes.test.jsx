import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'

function adminResponse(url) {
  const path = String(url)
  if (path.includes('/admin/analytics')) return { events: {}, generationJobs: 0, reflections: 0, scores: 0, songs: { published: 0, total: 0 }, users: { admins: 1, creators: 0, registered: 0, total: 1 } }
  if (path.includes('/admin/creator-applications')) return { applications: [], pagination: {} }
  if (path.includes('/admin/creators')) return { creators: [], pagination: {} }
  if (path.includes('/admin/users')) return { users: [], pagination: {} }
  if (path.includes('/admin/songs')) return { songs: [], pagination: {} }
  if (path.includes('/admin/folders')) return { folders: [], pagination: {} }
  if (path.includes('/admin/folder-song-proposals')) return { proposals: [], pagination: {} }
  if (path.includes('/admin/audit-logs')) return { auditLogs: [], pagination: {} }
  if (path.includes('/admin/moderation-actions')) return { actions: [], pagination: {} }
  if (path.includes('/admin/warnings')) return { warnings: [], pagination: {} }
  if (path.includes('/reflections/moderation')) return { pagination: { limit: 8, page: 1, total: 0, totalPages: 0 }, reflections: [], stats: { approved: 0, flagged: 0, newToday: 0, newYesterday: 0, pending: 0, rejected: 0 } }
  if (path.includes('/songs')) return { songs: [] }
  return {}
}

describe('consolidated admin routes', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('authToken', 'admin-token')
    localStorage.setItem('authUser', JSON.stringify({ email: 'admin@example.com', id: 'admin-1', name: 'Admin', role: 'ADMIN' }))
    vi.stubGlobal('fetch', vi.fn(async (url) => ({ json: async () => adminResponse(url), ok: true, status: 200 })))
  })

  afterEach(() => { cleanup(); vi.unstubAllGlobals() })

  it.each([
    ['/admin', /Good (morning|afternoon|evening)/],
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

  it('loads only flagged reports for the administrator escalation queue', async () => {
    window.history.pushState({}, '', '/admin/community?tab=reports')
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('heading', { level: 1, name: 'Safety & Reports' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringContaining('status=FLAGGED'), expect.any(Object)))
    expect(fetch.mock.calls.some(([url]) => String(url).includes('status=PENDING'))).toBe(false)
  })

  it('limits Safety & Reports to the three platform-moderation views', async () => {
    window.history.pushState({}, '', '/admin/community?tab=reports')
    render(<AuthProvider><App /></AuthProvider>)
    expect(await screen.findByRole('button', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Users/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Warnings & Actions/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pending reflections/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^users/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/users\?.*scope=safety/), expect.any(Object)))

    fireEvent.click(screen.getByRole('button', { name: /warnings & actions/i }))
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/moderation-actions\?.*scope=account/), expect.any(Object)))
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
})
