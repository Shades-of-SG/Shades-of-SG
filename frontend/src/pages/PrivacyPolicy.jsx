import { useEffect, useState } from 'react'
import Reveal from '../components/Reveal'

const sections = [
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: <><p>We collect information that helps Shades of SG provide a safe and useful learning experience. This may include:</p><ul><li>Account details such as your name, email address, and login credentials.</li><li>Profile information and preferences you choose to provide.</li><li>Reflections, comments, and other community contributions.</li><li>Learning activity, rhythm-game scores, lesson progress, and saved preferences.</li><li>Basic analytics and technical information such as browser type, device type, IP address, and pages visited.</li></ul><p>Please avoid sharing sensitive personal information in public reflections or community areas.</p></>,
  },
  {
    id: 'how-we-use-data',
    title: 'How We Use Your Data',
    content: <><p>We use information to operate the platform, authenticate accounts, save learning progress, personalise relevant experiences, and make Shades of SG easier to use.</p><p>Information also helps us maintain performance, understand how features are used, respond to support enquiries, prevent misuse, and moderate community content. We do not sell your personal information.</p></>,
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: <><p>Shades of SG may use cookies and similar browser storage to keep you signed in, remember preferences, preserve your session, and understand platform performance.</p><p>You can manage cookies through your browser settings. Disabling essential cookies or storage may prevent account, progress, or preference features from working correctly.</p></>,
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    content: <><p>We rely on trusted service providers to operate parts of Shades of SG. These may include Cloudinary for media storage and delivery, database and infrastructure providers for account and platform data, and YouTube when linked or embedded media is used.</p><p>These providers may process limited information under their own terms and privacy policies. We encourage you to review those policies when interacting with their services.</p></>,
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: <><p>We use reasonable administrative and technical safeguards designed to protect user information. These include authenticated access, encrypted connections where supported, access controls, and secure cloud infrastructure.</p><p>No online system can guarantee absolute security. Please use a strong, unique password and contact us promptly if you suspect unauthorised access to your account.</p></>,
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: <><p>Depending on where you live, you may have rights over your personal information. Within Shades of SG, you may be able to:</p><ul><li>View and update your profile information.</li><li>Edit or delete reflections you have submitted.</li><li>Ask what personal information we hold about you.</li><li>Request correction or deletion of your account and associated information.</li></ul><p>Some information may be retained where reasonably necessary for security, legal compliance, or resolving disputes.</p></>,
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    content: <><p>Shades of SG supports learning and community engagement across different age groups. Younger users should use the platform with appropriate permission and supervision from a parent, guardian, educator, or participating school where required.</p><p>If you believe a child has provided personal information without appropriate permission, please contact us so we can review and address the situation.</p></>,
  },
  {
    id: 'contact',
    title: 'Contact',
    content: <><p>If you have questions about this Privacy Policy, want to exercise a privacy right, or wish to report a concern, email us at <a href="mailto:shadesofsg@gmail.com?subject=Privacy%20Policy%20Enquiry">shadesofsg@gmail.com</a>.</p><p>We may update this policy as Shades of SG evolves. Any changes will be reflected by the updated date at the top of this page.</p></>,
  },
]

export default function PrivacyPolicy() {
  const [activeSection, setActiveSection] = useState(sections[0].id)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-22% 0px -62% 0px', threshold: [0, 0.2, 0.5] })

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className="terms-page privacy-page">
      <Reveal as="section" className="terms-hero privacy-hero legal-reveal-hero">
        <div className="terms-hero-copy">
          <p className="terms-eyebrow">Your privacy matters</p>
          <h1>Privacy Policy</h1>
          <div className="terms-title-rule" aria-hidden="true" />
          <p className="terms-intro">Your privacy matters. Learn how Shades of SG collects, uses and protects your information while you explore Singapore's stories through music and community.</p>
          <p className="terms-updated"><span aria-hidden="true">●</span> Last updated: July 2026</p>
        </div>
        <span className="privacy-hero-shield" aria-hidden="true"><i className="bi bi-shield-lock" /></span>
      </Reveal>

      <Reveal as="nav" aria-label="Quick navigation" className="terms-quick-nav legal-reveal-nav">
        <strong>Quick Navigation</strong>
        <div>{sections.map((section) => <a aria-current={activeSection === section.id ? 'location' : undefined} className={activeSection === section.id ? 'active' : ''} href={`#${section.id}`} key={section.id}>{section.title}</a>)}</div>
      </Reveal>

      <div className="terms-sections">
        {sections.map((section, index) => <Reveal as="section" className="terms-card legal-reveal-card" delay={(index % 2) * 80} id={section.id} key={section.id}><div className="terms-card-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div><div className="terms-card-copy"><h2>{section.title}</h2><div className="terms-heading-rule" aria-hidden="true" />{section.content}</div></Reveal>)}
      </div>

      <Reveal as="aside" className="terms-acceptance-note privacy-footer-note legal-reveal-note"><span aria-hidden="true"><i className="bi bi-lock" /></span><p>We believe transparency builds trust. If you have any questions about how your information is handled, please contact us.</p></Reveal>
    </div>
  )
}
