import { useEffect, useRef, useState } from 'react'
import { Check, Languages } from 'lucide-react'
import '../Navbar.css'

const TRANSLATE_ELEMENT_ID = 'google_translate_element'
const TRANSLATE_SCRIPT_ID = 'google-translate-script'
const LANGUAGE_KEY = 'shadesOfSgLanguage'

const supportedLanguages = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ms', label: 'Bahasa Melayu' },
  { code: 'ta', label: 'Tamil' },
]

function applyGoogleLanguage(language) {
  const googleSelect = document.querySelector(`#${TRANSLATE_ELEMENT_ID} select`)
  if (!googleSelect) return false
  googleSelect.value = language
  googleSelect.dispatchEvent(new Event('change'))
  return true
}

export default function LanguageSwitcher({ className = '' }) {
  const [language, setLanguage] = useState(() => localStorage.getItem(LANGUAGE_KEY) || 'en')
  const [isOpen, setIsOpen] = useState(false)
  const languageRef = useRef(null)

  useEffect(() => {
    function closeLanguageMenu(event) {
      if (languageRef.current && !languageRef.current.contains(event.target)) setIsOpen(false)
    }

    function closeLanguageMenuOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', closeLanguageMenu)
    document.addEventListener('keydown', closeLanguageMenuOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeLanguageMenu)
      document.removeEventListener('keydown', closeLanguageMenuOnEscape)
    }
  }, [])

  useEffect(() => {
    function initialiseTranslate() {
      if (!window.google?.translate?.TranslateElement) return
      const host = document.getElementById(TRANSLATE_ELEMENT_ID)
      if (!host || host.querySelector('select')) return

      new window.google.translate.TranslateElement({
        autoDisplay: false,
        includedLanguages: supportedLanguages.map((item) => item.code).join(','),
        pageLanguage: 'en',
      }, TRANSLATE_ELEMENT_ID)
    }

    window.googleTranslateElementInit = initialiseTranslate
    if (window.google?.translate?.TranslateElement) initialiseTranslate()
    else if (!document.getElementById(TRANSLATE_SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = TRANSLATE_SCRIPT_ID
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      script.async = true
      document.body.appendChild(script)
    }

    let attempts = 0
    const restoreLanguage = window.setInterval(() => {
      attempts += 1
      if (applyGoogleLanguage(localStorage.getItem(LANGUAGE_KEY) || 'en') || attempts >= 40) {
        window.clearInterval(restoreLanguage)
      }
    }, 250)

    return () => window.clearInterval(restoreLanguage)
  }, [])

  function changeLanguage(nextLanguage) {
    setLanguage(nextLanguage)
    setIsOpen(false)
    localStorage.setItem(LANGUAGE_KEY, nextLanguage)
    applyGoogleLanguage(nextLanguage)
  }

  return (
    <div className={`navbar-language ${className}`.trim()} ref={languageRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Translate website"
        className="navbar-language__button"
        onClick={() => setIsOpen((current) => !current)}
        title="Translate website"
        type="button"
      >
        <Languages aria-hidden="true" size={22} />
      </button>
      {isOpen ? (
        <div aria-label="Choose a language" className="navbar-language__dropdown" role="menu">
          {supportedLanguages.map((item) => (
            <button
              aria-checked={language === item.code}
              className={language === item.code ? 'is-active' : undefined}
              key={item.code}
              onClick={() => changeLanguage(item.code)}
              role="menuitemradio"
              type="button"
            >
              <span>{item.label}</span>
              {language === item.code ? <Check aria-hidden="true" size={17} /> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div aria-hidden="true" className="google-translate-host" id={TRANSLATE_ELEMENT_ID} />
    </div>
  )
}
