import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TranslationProvider } from '../context/TranslationContext'
import LanguageSwitcher from './LanguageSwitcher'

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear()
    window.google = {
      translate: {
        TranslateElement: class {
          constructor(_options, targetId) {
            const select = document.createElement('select')
            select.className = 'goog-te-combo'
            for (const value of ['en', 'zh-CN', 'ms', 'ta']) {
              const option = document.createElement('option')
              option.value = value
              select.appendChild(option)
            }
            document.getElementById(targetId).appendChild(select)
          }
        },
      },
    }
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    delete window.google
    delete window.googleTranslateElementInit
    document.documentElement.lang = 'en'
  })

  it('offers Singapore official languages and persists the selection', async () => {
    render(<TranslationProvider><LanguageSwitcher /></TranslationProvider>)

    fireEvent.click(screen.getByRole('button', { name: 'Change language' }))
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: '中文（简体）' })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'தமிழ்' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Bahasa Melayu' }))

    await waitFor(() => expect(localStorage.getItem('shadesLanguage')).toBe('ms'))
    expect(document.documentElement.lang).toBe('ms')
    await waitFor(() => expect(document.querySelector('.goog-te-combo')).toHaveValue('ms'))
  })
})
