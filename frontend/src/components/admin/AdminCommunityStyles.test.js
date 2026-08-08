import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/components/admin/AdminUI.css', 'utf8')

describe('Safety & Reports responsive CSS contract', () => {
  it('gives evidence review adequate desktop width while retaining an aligned queue', () => {
    expect(css).toMatch(/\.admin-report-layout \{[^}]*align-items: start;[^}]*grid-template-columns: minmax\(0,\.95fr\) minmax\(390px,1\.05fr\)/)
    expect(css).toMatch(/\.admin-report-detail \{[^}]*position: sticky;/)
  })

  it('contains long evidence, reasons, actors and timeline values', () => {
    expect(css).toMatch(/\.admin-community \{ overflow-x: clip; \}/)
    expect(css).toMatch(/\.admin-report-evidence blockquote \{[^}]*overflow-wrap: anywhere;[^}]*white-space: pre-wrap;/)
    expect(css).toMatch(/\.admin-case-timeline strong,\.admin-case-timeline time \{[^}]*overflow-wrap: anywhere;/)
    expect(css).toMatch(/\.admin-community__wrap \{[^}]*overflow-wrap: anywhere;/)
  })

  it('stacks the workspace and removes table minimums before mobile overflow can occur', () => {
    expect(css).toMatch(/@media \(max-width: 1050px\)[\s\S]*\.admin-report-layout \{ grid-template-columns: 1fr; \}/)
    expect(css).toMatch(/@media \(max-width: 760px\)[\s\S]*\.admin-community__users \.admin-table \{ min-width: 0; \}/)
    expect(css).toMatch(/@media \(max-width: 520px\)[\s\S]*\.admin-report-detail__actions,\.admin-report-detail__danger \{ display: grid; grid-template-columns: 1fr; \}/)
  })
})
