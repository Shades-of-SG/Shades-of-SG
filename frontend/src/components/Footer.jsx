import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'
import Reveal from './Reveal'

export default function Footer() {
  return (
    <Reveal as="footer" className="site-footer footer-reveal">
      <div className="footer-intro">
        <Link aria-label="Shades of SG home" className="footer-brand" to="/">
          <BrandLogo className="brand-logo--footer" />
        </Link>
        <p className="footer-tagline">Music, Memory &amp; Culture</p>
        <p>Discover Singapore's culture through songs, stories, rhythm, and community memories.</p>
      </div>

      <nav aria-label="Explore" className="footer-column">
        <h2>Explore</h2>
        <Link to="/songs">Songs</Link>
        <Link to="/learning">Learning Hub</Link>
        <Link to="/rhythm-game">Rhythm Game</Link>
        <Link to="/reflections">Reflection Wall</Link>
      </nav>

      <div className="footer-column">
        <h2>About</h2>
        <a href="mailto:shadesofsg@gmail.com?subject=Shades%20of%20SG%20Enquiry">Contact Us</a>
        <a href="mailto:shadesofsg@gmail.com?subject=Shades%20of%20SG%20Feedback">Feedback</a>
      </div>

      <div className="footer-copy">
        <p>Copyright &copy; 2026, Shades of SG. All rights reserved.</p>
        <div aria-label="Legal information" className="footer-legal">
          <a href="mailto:shadesofsg@gmail.com?subject=Shades%20of%20SG%20Vulnerability%20Report">
            Report Vulnerability
          </a>
          <span aria-hidden="true">|</span>
          <Link to="/privacy">Privacy Policy</Link>
          <span aria-hidden="true">|</span>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </div>
      </div>
    </Reveal>
  )
}
