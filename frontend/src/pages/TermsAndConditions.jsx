import { useEffect, useState } from 'react'
import Reveal from '../components/Reveal'

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms', content: <><p>By visiting Shades of SG, creating an account, or using any of our songs, learning activities, games, or community features, you agree to these Terms &amp; Conditions.</p><p>If you are using the platform on behalf of a school or organisation, you confirm that you are authorised to accept these terms for them. If you do not agree, please do not use the platform.</p></> },
  { id: 'community-guidelines', title: 'Community Guidelines', content: <><p>Shades of SG is a shared space for learning about Singapore through music, memory, and culture. Help us keep it welcoming, thoughtful, and safe for learners of different ages and backgrounds.</p><ul><li>Engage respectfully with other members and the stories they share.</li><li>Do not post hateful, threatening, discriminatory, misleading, or sexually explicit material.</li><li>Do not bully, impersonate, spam, or deliberately disrupt learning activities.</li><li>Be culturally sensitive when discussing traditions, communities, and personal memories.</li></ul><p>We may review, hide, or remove content and restrict accounts when needed to protect the community.</p></> },
  { id: 'user-accounts', title: 'User Accounts', content: <><p>Provide accurate information when you register and keep your login details private. You are responsible for activity performed through your account and should contact us promptly if you believe it has been accessed without permission.</p><p>Learners who are not old enough to consent to online services in their location should use Shades of SG only with permission and guidance from a parent, guardian, or participating school. We may suspend accounts that are unsafe, fraudulent, or used in breach of these terms.</p></> },
  { id: 'reflections-content', title: 'Reflections & User Content', content: <><p>You retain ownership of the reflections, comments, and original material you share. By submitting content, you grant Shades of SG a non-exclusive, worldwide, royalty-free licence to host, display, reproduce, and moderate it for operating, promoting, and improving the platform.</p><p>Only share material you have the right to use. Avoid including private information about yourself or others. Public reflections may be visible to learners, educators, and visitors; content marked anonymous may hide your display name but can still be associated with your account for safety and moderation.</p></> },
  { id: 'intellectual-property', title: 'Intellectual Property', content: <><p>The Shades of SG name, visual identity, learning materials, game design, original recordings, illustrations, and platform software belong to Shades of SG or its licensors. They are protected by applicable intellectual property laws.</p><p>You may use platform materials for personal, non-commercial learning. Educators may present activities in their own classes, provided attribution is retained. You may not sell, republish, scrape, or create a competing resource from our materials without written permission. Third-party songs and cultural materials remain subject to their respective owners' rights.</p></> },
  { id: 'privacy', title: 'Privacy', content: <><p>We use account, activity, and contribution data to provide features, remember progress, moderate the community, and improve learning experiences. We aim to collect only what is reasonably needed and to protect it with appropriate safeguards.</p><p>Please review our Privacy Statement for more information about the data we collect, how it is used, and the choices available to you. Do not submit sensitive personal information through reflections or other public areas.</p></> },
  { id: 'limitation-liability', title: 'Limitation of Liability', content: <><p>Shades of SG is provided for education, cultural discovery, and entertainment. We work to keep information accurate and the service reliable, but we cannot promise that every feature will always be available, error-free, or suitable for every learning objective.</p><p>To the fullest extent permitted by law, Shades of SG and its contributors are not liable for indirect, incidental, or consequential loss arising from use of the platform. Nothing in these terms excludes rights or liabilities that cannot legally be excluded.</p></> },
  { id: 'contact', title: 'Contact', content: <><p>Questions about these terms, content rights, or community safety are welcome. Email us at <a href="mailto:shadesofsg@gmail.com?subject=Terms%20and%20Conditions%20Enquiry">shadesofsg@gmail.com</a>.</p><p>We may update these terms as the platform and its learning experiences evolve. Material changes will be reflected by the updated date at the top of this page.</p></> },
]

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState(sections[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.2, 0.5] },
    )

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="terms-page">
      <Reveal as="section" className="terms-hero legal-reveal-hero">
        <div className="terms-hero-copy">
          <p className="terms-eyebrow">Our shared agreement</p>
          <h1>Terms &amp; Conditions</h1>
          <div className="terms-title-rule" aria-hidden="true" />
          <p className="terms-intro">Keeping Shades of SG a respectful, safe and inspiring community where music and memories can be shared by everyone.</p>
          <p className="terms-updated"><span aria-hidden="true">●</span> Last updated: July 2026</p>
        </div>
        <span className="terms-hero-note" aria-hidden="true">♪</span>
      </Reveal>

      <Reveal as="nav" aria-label="Quick navigation" className="terms-quick-nav legal-reveal-nav">
        <strong>Quick Navigation</strong>
        <div>{sections.map((section) => <a aria-current={activeSection === section.id ? 'location' : undefined} className={activeSection === section.id ? 'active' : ''} href={`#${section.id}`} key={section.id}>{section.title}</a>)}</div>
      </Reveal>

      <div className="terms-sections">
        {sections.map((section, index) => (
          <Reveal as="section" className="terms-card legal-reveal-card" delay={(index % 2) * 80} id={section.id} key={section.id}>
            <div className="terms-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
            <div className="terms-card-copy"><h2>{section.title}</h2><div className="terms-heading-rule" aria-hidden="true" />{section.content}</div>
          </Reveal>
        ))}
      </div>

      <Reveal as="aside" className="terms-acceptance-note legal-reveal-note"><span aria-hidden="true">♪</span><p>Continued use of the platform indicates acceptance of these Terms &amp; Conditions.</p></Reveal>
    </div>
  )
}
