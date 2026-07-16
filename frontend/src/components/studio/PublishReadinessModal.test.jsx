import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PublishReadinessModal from './PublishReadinessModal'

describe('PublishReadinessModal', () => {
  afterEach(cleanup)

  it('shows human-friendly tasks and routes creators to the relevant step', () => {
    const onGenerateVideo = vi.fn()
    const onGoToStep = vi.fn()
    render(<PublishReadinessModal missing={['coverImageUrl', 'rawLyrics', 'videoUrl', 'status READY']} onClose={vi.fn()} onGenerateVideo={onGenerateVideo} onGoToStep={onGoToStep} onUploadVideo={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Complete these tasks before publishing' })).toBeInTheDocument()
    expect(screen.getByText('Upload cover artwork.')).toBeInTheDocument()
    expect(screen.getByText('Add or extract the song lyrics.')).toBeInTheDocument()
    expect(screen.getByText('Add a finished video before publishing.')).toBeInTheDocument()
    expect(screen.queryByText(/videoUrl|status READY/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Complete Song Details' }))
    expect(onGoToStep).toHaveBeenCalledWith(1)
    fireEvent.click(screen.getByRole('button', { name: 'Add Lyrics' }))
    expect(onGoToStep).toHaveBeenCalledWith(2)
    fireEvent.click(screen.getByRole('button', { name: 'Generate AI Video' }))
    expect(onGenerateVideo).toHaveBeenCalled()
  })

  it('passes a selected final video to the upload action', () => {
    const onUploadVideo = vi.fn()
    render(<PublishReadinessModal missing={['videoUrl']} onClose={vi.fn()} onGenerateVideo={vi.fn()} onGoToStep={vi.fn()} onUploadVideo={onUploadVideo} />)
    const file = new File(['video'], 'violet-final.mp4', { type: 'video/mp4' })

    fireEvent.change(screen.getByLabelText('Upload finished video'), { target: { files: [file] } })

    expect(onUploadVideo).toHaveBeenCalledWith(file)
  })
})
