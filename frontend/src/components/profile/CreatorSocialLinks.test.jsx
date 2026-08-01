import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CreatorSocialLinks from './CreatorSocialLinks'

describe('CreatorSocialLinks', () => {
  afterEach(cleanup)

  it('renders only a provided valid Instagram link', () => {
    render(<CreatorSocialLinks displayName="Ferlyn Ng" socialLinks={{ instagram: 'https://instagram.com/ferlyn' }} />)

    const instagram = screen.getByRole('link', { name: "Visit Ferlyn Ng's Instagram" })
    expect(instagram).toHaveAttribute('href', 'https://instagram.com/ferlyn')
    expect(instagram).toHaveAttribute('target', '_blank')
    expect(instagram).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('link', { name: /Website/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /YouTube/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /TikTok/ })).not.toBeInTheDocument()
  })

  it('renders all four supported links and filters blank, placeholder, and unsafe values', () => {
    const { rerender } = render(<CreatorSocialLinks displayName="Rose" socialLinks={{
      instagram: 'https://instagram.com/Rose', tiktok: 'https://tiktok.com/@Rose',
      website: 'https://Rose.example', youtube: 'https://youtube.com/@Rose',
    }} />)
    expect(screen.getAllByRole('link')).toHaveLength(4)

    rerender(<CreatorSocialLinks displayName="Rose" socialLinks={{ instagram: 'javascript:alert(1)', website: 'https://', youtube: '   ' }} />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
