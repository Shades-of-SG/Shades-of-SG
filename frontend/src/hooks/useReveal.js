import { useEffect, useRef, useState } from 'react'

const revealCallbacks = new Map()
let sharedObserver = null

if (typeof document !== 'undefined') {
  document.documentElement.classList.add('reveal-ready')
}

function getSharedObserver() {
  if (sharedObserver || typeof IntersectionObserver === 'undefined') return sharedObserver

  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        const reveal = revealCallbacks.get(entry.target)
        if (reveal) reveal()
        revealCallbacks.delete(entry.target)
        sharedObserver?.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  )

  return sharedObserver
}

function stopObserving(node) {
  revealCallbacks.delete(node)
  sharedObserver?.unobserve(node)

  if (revealCallbacks.size === 0 && sharedObserver) {
    sharedObserver.disconnect()
    sharedObserver = null
  }
}

export default function useReveal() {
  const nodeRef = useRef(null)
  const [isVisible, setIsVisible] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const node = nodeRef.current
    const observer = getSharedObserver()

    if (!node || !observer) return undefined

    revealCallbacks.set(node, () => setIsVisible(true))
    observer.observe(node)

    return () => stopObserving(node)
  }, [])

  return { isVisible, nodeRef }
}
