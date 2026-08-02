import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import CoverImageUpload from './CoverImageUpload'

describe('CoverImageUpload', () => {
  afterEach(cleanup)

  it('uses the same custom upload-card pattern as song media', () => {
    const onChange = vi.fn()
    render(<CoverImageUpload onChange={onChange} onClear={vi.fn()} />)
    expect(screen.getByText('Upload Cover')).toBeInTheDocument()
    expect(screen.getByText('JPG, PNG, or WebP, max 10MB')).toBeInTheDocument()
    expect(screen.getByText('Choose File')).toBeInTheDocument()

    const file = new File(['cover'], 'heritage-cover.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Upload cover image'), { target: { files: [file] } })
    expect(onChange).toHaveBeenCalled()
  })

  it('shows the selected filename and preview with a removable pending selection', () => {
    const onClear = vi.fn()
    render(<CoverImageUpload coverFileName="heritage-cover.png" coverImageUrl="blob:cover" onChange={vi.fn()} onClear={onClear} />)
    expect(screen.getByText('heritage-cover.png')).toBeInTheDocument()
    expect(screen.getByAltText('Song cover preview')).toHaveAttribute('src', 'blob:cover')
    expect(screen.getByText('New cover selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remove selected cover image' }))
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})
