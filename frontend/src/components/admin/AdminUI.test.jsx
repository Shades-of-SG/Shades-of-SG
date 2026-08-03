import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminTabs, ConfirmationModal, Feedback, LoadingRows } from './AdminUI'

afterEach(cleanup)

describe('shared admin interaction primitives', () => {
  it('keeps tabs keyboard-focusable and reports the selected destination', () => {
    const onChange = vi.fn()
    render(<AdminTabs active="applications" items={[
      { count: 2, id: 'applications', label: 'Applications' },
      { count: 3, id: 'approved', label: 'Approved Creators' },
    ]} onChange={onChange} />)

    const approved = screen.getByRole('button', { name: 'Approved Creators: 3' })
    approved.focus()
    expect(approved).toHaveFocus()
    fireEvent.click(approved)
    expect(onChange).toHaveBeenCalledWith('approved')
    expect(screen.getByRole('button', { name: 'Applications: 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('disables both modal actions while pending and exposes the busy state', () => {
    const onConfirm = vi.fn()
    render(<ConfirmationModal busy confirmLabel="Approve creator" onCancel={vi.fn()} onConfirm={onConfirm} title="Approve application">
      <p>This action is recorded.</p>
    </ConfirmationModal>)

    const dialog = screen.getByRole('dialog')
    const confirm = screen.getByRole('button', { name: 'Working…' })
    expect(dialog).toHaveAttribute('aria-busy', 'true')
    expect(confirm).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    fireEvent.click(confirm)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('restores focus after a confirmation dialog closes', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return <><button onClick={() => setOpen(true)} type="button">Open review</button>{open ? <ConfirmationModal confirmLabel="Confirm" onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)} title="Review action"><p>Review this action.</p></ConfirmationModal> : null}</>
    }

    render(<Harness />)
    const trigger = screen.getByRole('button', { name: 'Open review' })
    trigger.focus()
    fireEvent.click(trigger)
    await waitFor(() => expect(screen.getByRole('dialog')).toContainElement(document.activeElement))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(trigger).toHaveFocus()
  })

  it('keeps keyboard focus inside a confirmation dialog', async () => {
    render(<ConfirmationModal confirmLabel="Confirm action" onCancel={vi.fn()} onConfirm={vi.fn()} title="Review action"><p>Review this action.</p></ConfirmationModal>)
    const cancel = screen.getByRole('button', { name: 'Cancel' })
    const confirm = screen.getByRole('button', { name: 'Confirm action' })
    await waitFor(() => expect(cancel).toHaveFocus())

    confirm.focus()
    fireEvent.keyDown(confirm, { key: 'Tab' })
    expect(cancel).toHaveFocus()
    fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true })
    expect(confirm).toHaveFocus()
  })

  it('announces success and failure feedback atomically', () => {
    const { rerender } = render(<Feedback message="Application approved." />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByRole('status')).toHaveAttribute('aria-atomic', 'true')

    rerender(<Feedback message="Approval failed." type="error" />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive')
  })

  it('marks skeleton rows as a busy loading state', () => {
    render(<LoadingRows count={3} />)
    expect(screen.getByRole('status', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status').children).toHaveLength(3)
  })
})
