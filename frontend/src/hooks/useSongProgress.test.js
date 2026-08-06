import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import useSongProgress from './useSongProgress'

describe('useSongProgress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with nothing complete', () => {
    const { result } = renderHook(() => useSongProgress('our-singapore'))

    expect(result.current.progress).toEqual({
      easy: { isComplete: false },
      hard: { isComplete: false },
      medium: { isComplete: false },
    })
  })

  it('marks a difficulty complete and persists it under songLessonProgress:<songId>', () => {
    const { result } = renderHook(() => useSongProgress('our-singapore'))

    act(() => result.current.markDifficultyComplete('easy'))

    expect(result.current.progress.easy.isComplete).toBe(true)
    expect(result.current.progress.medium.isComplete).toBe(false)

    const stored = JSON.parse(localStorage.getItem('songLessonProgress:our-singapore'))
    expect(stored.easy.isComplete).toBe(true)
    expect(typeof stored.easy.completedAt).toBe('string')
  })

  it('does not overwrite completedAt when marking an already-complete difficulty again', () => {
    const { result } = renderHook(() => useSongProgress('our-singapore'))

    act(() => result.current.markDifficultyComplete('hard'))
    const firstCompletedAt = result.current.progress.hard.completedAt

    act(() => result.current.markDifficultyComplete('hard'))
    expect(result.current.progress.hard.completedAt).toBe(firstCompletedAt)
  })

  it('reads previously persisted progress on mount', () => {
    localStorage.setItem(
      'songLessonProgress:home',
      JSON.stringify({ easy: { isComplete: true }, hard: { isComplete: false }, medium: { isComplete: false } })
    )

    const { result } = renderHook(() => useSongProgress('home'))
    expect(result.current.progress.easy.isComplete).toBe(true)
  })

  it('keeps each song id in its own key, independent of other songs', () => {
    const { result: songA } = renderHook(() => useSongProgress('our-singapore'))
    const { result: songB } = renderHook(() => useSongProgress('home'))

    act(() => songA.current.markDifficultyComplete('easy'))

    expect(songA.current.progress.easy.isComplete).toBe(true)
    expect(songB.current.progress.easy.isComplete).toBe(false)
  })
})
