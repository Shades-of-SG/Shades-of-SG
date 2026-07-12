import { Check, Languages } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation, websiteLanguages } from '../context/TranslationContext'
import '../Navbar.css'

export default function LanguageSwitcher({ className = '' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const { language, selectLanguage, translationError } = useTranslation()

  useEffect(() => {
    function closeMenu(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setIsOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div className={`language-switcher ${className}`.trim()} ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Change language"
        className="language-switcher__button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <Languages aria-hidden="true" size={22} />
      </button>

      {isOpen ? (
        <div className="language-switcher__menu" role="menu">
          <strong>LANGUAGE</strong>
          {websiteLanguages.map((option) => (
            <button
              aria-checked={language === option.code}
              key={option.code}
              onClick={() => { selectLanguage(option.code); setIsOpen(false) }}
              role="menuitemradio"
              type="button"
            >
              <span>{option.label}</span>
              {language === option.code ? <Check aria-hidden="true" size={17} /> : null}
            </button>
          ))}
          {translationError ? <p role="alert">{translationError}</p> : null}
          <small>Powered by Google Translate</small>
        </div>
      ) : null}
    </div>
  )
}
