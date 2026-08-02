export default function BrandLogo({ className = '', compact = false }) {
  return (
    <span className={`brand-logo${compact ? ' brand-logo--compact' : ''}${className ? ` ${className}` : ''}`}>
      <img alt="Shades of SG" src="/images/Brand Logo.png" />
    </span>
  )
}
