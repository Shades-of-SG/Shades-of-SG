import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/components/admin/AdminUI.css', 'utf8')

describe('admin motion and responsive safeguards', () => {
  it('disables non-essential entrances, transforms, and transitions for reduced motion', () => {
    const reducedMotion = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reducedMotion).toContain('.admin-page__inner')
    expect(reducedMotion).toContain('.admin-activity-detail__reveal')
    expect(reducedMotion).toContain('animation: none')
    expect(reducedMotion).toContain('transition: none')
    expect(reducedMotion).toContain('transform: none')
  })

  it('retains horizontal containment and mobile table safeguards', () => {
    expect(css).toMatch(/\.admin-tabs\s*\{[^}]*overflow-x:\s*auto/)
    expect(css).toMatch(/\.admin-table-wrap\s*\{[^}]*overflow-x:\s*auto/)
    expect(css).toContain('.admin-table .admin-activity-detail')
    expect(css).toContain('.admin-tab-panel > * { min-width: 0; }')
  })

  it('keeps Overview cards, attention actions, and activity metadata usable on mobile', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 520px)'))
    expect(mobile).toMatch(/\.admin-metrics\s*\{\s*grid-template-columns:\s*1fr/)
    expect(mobile).toContain('.admin-attention-assurance')
    expect(mobile).toContain('.admin-chart-summary')
    expect(mobile).toContain('.admin-activity-item time')
  })

  it('balances the Overview desktop panels without compressing the audit action', () => {
    expect(css).toMatch(/\.admin-overview-grid\s*\{[^}]*align-items:\s*start[^}]*grid-template-columns:\s*minmax\(0,3fr\)\s*minmax\(340px,2fr\)[^}]*min-width:\s*0/)
    expect(css).toMatch(/\.admin-panel--activity\s*>\s*header\s*\{[^}]*flex-wrap:\s*wrap/)
    expect(css).toMatch(/\.admin-panel--activity\s*>\s*header\s*\.admin-text-link\s*\{[^}]*flex:\s*0\s+0\s+auto[^}]*white-space:\s*nowrap/)

    const tablet = css.slice(css.indexOf('@media (max-width: 1050px)'), css.indexOf('@media (max-width: 900px)'))
    expect(tablet).toMatch(/\.admin-overview-grid\s*\{\s*grid-template-columns:\s*1fr/)
    expect(css).toMatch(/\.admin-activity-item\s*\{[^}]*min-width:\s*0/)
  })

  it('keeps dense Creator tables contained and converts them to readable mobile cards', () => {
    expect(css).toMatch(/\.admin-creators__panel\s+\.admin-table\s*\{[^}]*min-width:\s*1050px/)
    expect(css).toMatch(/\.admin-creators__panel\s+\.admin-table td\s*\{[^}]*overflow-wrap:\s*anywhere/)
    expect(css).toMatch(/\.admin-creators__row-action\s*\{[^}]*white-space:\s*normal/)

    const mobile = css.slice(css.indexOf('@media (max-width: 760px)'), css.indexOf('@media (max-width: 520px)'))
    expect(mobile).toMatch(/\.admin-creators__panel\s+\.admin-table\s*\{\s*min-width:\s*0/)
    expect(mobile).toMatch(/\.admin-creators__panel\s+\.admin-table td\s*\{[^}]*min-width:\s*0/)
    expect(mobile).toMatch(/\.admin-creator-links,\.admin-creator-decisions\s*\{[^}]*grid-template-columns:\s*1fr/)
  })
})
