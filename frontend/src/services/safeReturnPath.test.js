import { beforeEach, describe, expect, it } from 'vitest'
import { clearScoreClaimReturn, isNewAccountScoreClaim, markNewAccountScoreClaim, readRegistrationReturn, safeReturnPath, storeRegistrationReturn } from './safeReturnPath'

describe('safeReturnPath', () => {
  beforeEach(() => sessionStorage.clear())
  it('preserves internal locations and rejects external or protocol-relative destinations', () => {
    expect(safeReturnPath({ hash: '#saved', pathname: '/rhythm-game/claim', search: '?source=result' })).toBe('/rhythm-game/claim?source=result#saved')
    expect(safeReturnPath('https://evil.example/claim')).toBe('')
    expect(safeReturnPath('//evil.example/claim')).toBe('')
    expect(safeReturnPath('/\\evil.example/claim')).toBe('')
  })

  it('preserves a validated registration claim across reload-style reads until explicitly cleared', () => {
    storeRegistrationReturn('/rhythm-game/claim')
    markNewAccountScoreClaim('/rhythm-game/claim')
    storeRegistrationReturn('//evil.example/claim')

    expect(readRegistrationReturn()).toBe('/rhythm-game/claim')
    expect(isNewAccountScoreClaim()).toBe(true)
    clearScoreClaimReturn()
    expect(readRegistrationReturn()).toBe('')
    expect(isNewAccountScoreClaim()).toBe(false)
  })
})
