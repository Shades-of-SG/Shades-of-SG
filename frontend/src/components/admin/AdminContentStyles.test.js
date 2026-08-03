import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/components/admin/AdminUI.css', 'utf8')

describe('Admin Content responsive CSS contract', () => {
  it('contains long values and desktop tables inside the content area', () => {
    expect(css).toMatch(/\.admin-content \{ overflow-x: clip; \}/)
    expect(css).toMatch(/\.admin-content__panel \.admin-table \{ min-width: 1040px; table-layout: fixed; \}/)
    expect(css).toMatch(/\.admin-content__wrap,\.admin-content__creator-link \{ overflow-wrap: anywhere; word-break: break-word; \}/)
  })

  it('switches tables to labelled mobile cards without a forced minimum width', () => {
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*\.admin-content__panel \.admin-table \{ min-width: 0; table-layout: auto; \}/)
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*\.admin-table td::before \{[^}]*content: attr\(data-label\)/)
  })

  it('keeps media and membership controls within narrow drawers', () => {
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*\.admin-content__media \{ grid-template-columns: 1fr; \}/)
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*\.admin-content__membership \{ grid-template-columns: 1fr; \}/)
    expect(css).toMatch(/\.admin-content__media audio,\.admin-content__media video \{[^}]*max-width: 100%/)
  })
})
