export default function CharacterField({ error, help, label, maxLength, minLength, onChange, rows = 5, value }) {
  const fieldId = `creator-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const helpId = `${fieldId}-help`
  const errorId = `${fieldId}-error`
  return <label className={`creator-application-field${error ? ' has-error' : ''}`} htmlFor={fieldId}>
    <span>{label}</span>
    {help ? <small id={helpId}>{help}</small> : null}
    <textarea
      aria-describedby={`${help ? helpId : ''}${error ? ` ${errorId}` : ''}`.trim() || undefined}
      aria-invalid={Boolean(error)}
      id={fieldId}
      maxLength={maxLength}
      minLength={minLength}
      onChange={onChange}
      rows={rows}
      value={value}
    />
    <span className="creator-application-field__meta">
      {error ? <small className="creator-application-field__error" id={errorId}>{error}</small> : <span />}
      <output aria-live="polite">{value.length.toLocaleString()} / {maxLength.toLocaleString()}</output>
    </span>
  </label>
}
