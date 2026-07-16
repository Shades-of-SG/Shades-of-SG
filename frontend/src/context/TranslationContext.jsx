import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const LANGUAGE_STORAGE_KEY = 'shadesLanguage'
const TranslationContext = createContext({
  language: 'en',
  selectLanguage() {},
  translationError: '',
})
let googleTranslatePromise = null

export const websiteLanguages = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '中文（简体）' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'ta', label: 'தமிழ்' },
]

function setGoogleTranslateCookie(value, expires = '') {
  const expiry = expires ? `;expires=${expires}` : ''
  document.cookie = `googtrans=${value};path=/${expiry};SameSite=Lax`

  if (window.location.hostname.includes('.')) {
    document.cookie = `googtrans=${value};path=/;domain=.${window.location.hostname}${expiry};SameSite=Lax`
  }
}

function clearGoogleTranslation() {
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT'
  setGoogleTranslateCookie('', expired)
}

function initializeGoogleTranslate(resolve) {
  if (!window.google?.translate?.TranslateElement) return false

  const target = document.getElementById('google_translate_element')
  if (target && !target.hasChildNodes()) {
    new window.google.translate.TranslateElement({
      autoDisplay: false,
      includedLanguages: websiteLanguages.map(({ code }) => code).join(','),
      pageLanguage: 'en',
    }, 'google_translate_element')
  }

  resolve()
  return true
}

function loadGoogleTranslate() {
  if (googleTranslatePromise) return googleTranslatePromise

  googleTranslatePromise = new Promise((resolve, reject) => {
    if (initializeGoogleTranslate(resolve)) return

    window.googleTranslateElementInit = () => initializeGoogleTranslate(resolve)

    const existingScript = document.querySelector('script[data-shades-translate]')
    if (existingScript) return

    const script = document.createElement('script')
    script.async = true
    script.dataset.shadesTranslate = 'true'
    script.onerror = () => {
      googleTranslatePromise = null
      reject(new Error('Translation service could not be loaded.'))
    }
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    document.head.appendChild(script)
  })

  return googleTranslatePromise
}

function chooseGoogleLanguage(language, attempt = 0) {
  const select = document.querySelector('.goog-te-combo')
  if (!select && attempt < 20) {
    window.setTimeout(() => chooseGoogleLanguage(language, attempt + 1), 100)
    return
  }

  if (select) {
    select.value = language
    select.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return websiteLanguages.some(({ code }) => code === storedLanguage) ? storedLanguage : 'en'
  })
  const [translationError, setTranslationError] = useState('')

  useEffect(() => {
    document.documentElement.lang = language
    if (language === 'en') return

    setGoogleTranslateCookie(`/en/${language}`)
    loadGoogleTranslate()
      .then(() => chooseGoogleLanguage(language))
      .catch(() => setTranslationError('Translation is temporarily unavailable.'))
  }, [language])

  const value = useMemo(() => ({
    language,
    translationError,
    selectLanguage(nextLanguage) {
      if (nextLanguage === language) return

      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
      setTranslationError('')

      if (nextLanguage === 'en') {
        clearGoogleTranslation()
        setLanguage('en')
        window.location.reload()
        return
      }

      setGoogleTranslateCookie(`/en/${nextLanguage}`)
      setLanguage(nextLanguage)
    },
  }), [language, translationError])

  return (
    <TranslationContext.Provider value={value}>
      {children}
      <div aria-hidden="true" className="google-translate-host" id="google_translate_element" />
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  return useContext(TranslationContext)
}
