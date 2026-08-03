import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/Settings.css', 'utf8')

describe('Safety & Account Status responsive CSS contract', () => {
  it('prevents horizontal overflow and safely wraps long moderation text', () => {
    expect(css).toMatch(/\.safety-account-status \{ overflow-x:clip; \}/)
    expect(css).toMatch(/\.safety-warning-card p \{[^}]*overflow-wrap:anywhere;/)
    expect(css).toMatch(/\.safety-notification-list a \{[^}]*overflow-wrap:anywhere;/)
  })

  it('uses text status labels and stacks access and warning headers on mobile', () => {
    expect(css).toMatch(/\.safety-access-grid span,\.safety-status-text \{[^}]*text-transform:uppercase;/)
    expect(css).toMatch(/@media\(max-width:700px\)[\s\S]*\.account-settings-grid,\.safety-access-grid\{grid-template-columns:1fr\}/)
    expect(css).toMatch(/@media\(max-width:700px\)[\s\S]*\.account-settings-account-row,\.safety-warning-card>header\{[^}]*flex-direction:column/)
  })
})
