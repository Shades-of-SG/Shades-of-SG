import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getReflections, likeReflection, likeReflectionComment, unlikeReflection,
  unlikeReflectionComment,
} from './reflectionService'

describe('reflectionService guest likes', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ likeCount: 1, liked: true, reflections: [] }),
      ok: true,
      status: 200,
    }))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('includes the HTTP-only guest cookie on list, like, and unlike requests', async () => {
    await getReflections(null)
    await likeReflection('reflection-1', null)
    await unlikeReflection('reflection-1', null)

    expect(fetch).toHaveBeenCalledTimes(3)
    for (const [, options] of fetch.mock.calls) {
      expect(options).toEqual(expect.objectContaining({ credentials: 'include' }))
      expect(options.headers?.Authorization).toBeUndefined()
    }
    expect(fetch.mock.calls[1][1].method).toBe('POST')
    expect(fetch.mock.calls[2][1].method).toBe('DELETE')
  })

  it('uses authenticated persisted endpoints for individual comment likes', async () => {
    await likeReflectionComment('reflection-1', 'comment-1', 'token')
    await unlikeReflectionComment('reflection-1', 'comment-1', 'token')

    expect(fetch.mock.calls[0][0]).toMatch('/reflections/reflection-1/comments/comment-1/like')
    expect(fetch.mock.calls[0][1]).toEqual(expect.objectContaining({
      credentials: 'include', headers: { Authorization: 'Bearer token' }, method: 'POST',
    }))
    expect(fetch.mock.calls[1][1]).toEqual(expect.objectContaining({
      credentials: 'include', headers: { Authorization: 'Bearer token' }, method: 'DELETE',
    }))
  })
})
