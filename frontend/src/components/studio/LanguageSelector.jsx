const defaultLanguages = ['English', 'Chinese', 'Malay', 'Tamil', 'Others']

export default function LanguageSelector({ selectedLanguages, otherLanguage, onOtherLanguageChange, onToggleLanguage }) {
  return (
    <section className="studio-languages">
      <div className="studio-card__section-heading">
        <h3>
          Languages Spoken <span aria-hidden="true"></span>
        </h3>
      </div>

      <div className="studio-languages__grid">
        {defaultLanguages.map((language) => {
          const checked = selectedLanguages.includes(language)

          return (
            <label className={`studio-option-chip ${checked ? 'is-selected' : ''}`} key={language}>
              <input checked={checked} onChange={() => onToggleLanguage(language)} type="checkbox" />
              <span>{language}</span>
            </label>
          )
        })}
      </div>

      <label className="studio-field studio-other-language">
        <span>Other language(s)/ dialect(s)</span>
        <input
          onChange={(event) => onOtherLanguageChange(event.target.value)}
          placeholder="e.g. Hokkien, Cantonese, Japanese"
          value={otherLanguage}
        />
      </label>
    </section>
  )
}
