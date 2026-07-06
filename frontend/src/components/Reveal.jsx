import useReveal from '../hooks/useReveal'

export default function Reveal({ as: Tag = 'div', children, className = '', delay = 0 }) {
  const { isVisible, nodeRef } = useReveal()

  return (
    <Tag
      className={`reveal ${isVisible ? 'is-visible' : ''} ${className}`.trim()}
      ref={nodeRef}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
