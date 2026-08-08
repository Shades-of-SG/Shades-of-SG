import { useEffect, useRef, useState } from 'react'

export default function useCountUp(target, duration = 1200) {
  const numericTarget = Number(target) || 0
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)
  const valueRef = useRef(0)

  useEffect(() => {
    if (numericTarget === valueRef.current) return undefined

    const start = performance.now()
    const from = valueRef.current

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(from + (numericTarget - from) * eased)
      valueRef.current = nextValue
      setValue(nextValue)
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [numericTarget, duration])

  return value
}
