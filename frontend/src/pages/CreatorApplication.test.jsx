import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import CreatorApplication from './CreatorApplication'
import {
  getMyCreatorApplications, saveCreatorApplicationDraft, submitCreatorApplicationDraft,
} from '../services/applicationService'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ token: 'applicant-token', user: { email: 'mei@example.com', name: 'Mei Lin', role: 'REGISTERED' } }),
}))

vi.mock('../services/applicationService', () => ({
  downloadCreatorResume: vi.fn(),
  getMyCreatorApplications: vi.fn(),
  removeCreatorResume: vi.fn(),
  saveCreatorApplicationDraft: vi.fn(),
  submitCreatorApplicationDraft: vi.fn(),
  uploadCreatorResume: vi.fn(),
  withdrawCreatorApplication: vi.fn(),
}))

const draft = {
  createdAt: '2026-07-30T01:00:00.000Z', hasResume: false, history: [], id: '12345678-1234-1234-1234-123456789012',
  status: 'DRAFT', updatedAt: '2026-07-30T01:00:00.000Z',
}

describe('creator application journey', () => {
  beforeEach(() => {
    vi.stubGlobal('scrollTo', vi.fn())
    getMyCreatorApplications.mockResolvedValue([])
    saveCreatorApplicationDraft.mockImplementation(async (values) => ({ ...draft, ...values }))
    submitCreatorApplicationDraft.mockResolvedValue({
      application: { ...draft, status: 'SUBMITTED', submittedAt: '2026-07-30T02:00:00.000Z' },
      message: 'Application submitted.',
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('guides the applicant through saved steps, review, and submission confirmation', async () => {
    render(<MemoryRouter><CreatorApplication /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'Let’s start with you' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Mei Lin')).toBeDisabled()
    fireEvent.change(screen.getByLabelText(/^Short introduction/), { target: { value: 'I collect stories about the songs my family sings together.' } })
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }))

    expect(await screen.findByRole('heading', { name: 'Share your experience' })).toBeInTheDocument()
    expect(saveCreatorApplicationDraft).toHaveBeenCalledWith(expect.objectContaining({ introduction: expect.stringContaining('family sings') }), 'applicant-token')
    fireEvent.change(screen.getByLabelText(/^Relevant experience/), { target: { value: 'I volunteer at neighbourhood arts events and make short interview videos.' } })
    fireEvent.change(screen.getByLabelText(/Portfolio URL/), { target: { value: 'https://portfolio.example/work' } })
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }))

    expect(await screen.findByRole('heading', { name: 'What would you like to create?' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/^Why would you like to contribute\?/), { target: { value: 'I want to help younger audiences discover the memories and people behind familiar Singapore songs.' } })
    fireEvent.change(screen.getByLabelText(/^Proposed NDP-song or cultural content ideas/), { target: { value: 'A short oral-history series pairing NDP songs with neighbourhood memories.' } })
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }))

    expect(await screen.findByRole('heading', { name: 'Review your application' })).toBeInTheDocument()
    expect(screen.getByText(/oral-history series pairing/)).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText(/I agree to the creator guidelines/))
    fireEvent.click(screen.getByRole('button', { name: /Submit application/ }))

    expect(await screen.findByRole('heading', { name: /Thank you for applying, Mei!/ })).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    await waitFor(() => expect(submitCreatorApplicationDraft).toHaveBeenCalledWith(draft.id, 'applicant-token'))
  })

  it('shows inline validation before moving to the next step', async () => {
    render(<MemoryRouter><CreatorApplication /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Let’s start with you' })
    fireEvent.click(screen.getByRole('button', { name: /^Continue$/ }))
    expect(await screen.findByText('Please add a short introduction.')).toBeInTheDocument()
    expect(saveCreatorApplicationDraft).not.toHaveBeenCalled()
  })
})
