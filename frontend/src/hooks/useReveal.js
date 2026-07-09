import { useEffect, useRef, useState } from 'react'

export default function useReveal() {
  const nodeRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = nodeRef.current

    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  return { isVisible, nodeRef }
}
