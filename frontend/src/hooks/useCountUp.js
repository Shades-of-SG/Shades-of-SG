import { useEffect, useRef, useState } from 'react'

export default function useCountUp(target, duration = 1200) {
  const numericTarget = Number(target) || 0
  const [value, setValue] = useState(0)
  const frameRef = useRef(null)

  useEffect(() => {
    const start = performance.now()
    const from = 0

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(from + (numericTarget - from) * eased))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [numericTarget, duration])

  return value
}
