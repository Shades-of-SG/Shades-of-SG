import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo'

function SocialIcon({ name }) {
  return <i aria-hidden="true" className={`bi bi-${name} footer-social-icon`} />
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-intro">
        <Link aria-label="Shades of SG home" className="footer-brand" to="/"><BrandLogo className="brand-logo--footer" /></Link>
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

      <div className="footer-column footer-socials">
        <h2>Socials</h2>
        <div className="footer-social-list">
          <a aria-label="Visit Facebook" href="https://www.facebook.com/" rel="noreferrer" target="_blank"><SocialIcon name="facebook" /></a>
          <a aria-label="Visit Instagram" href="https://www.instagram.com/" rel="noreferrer" target="_blank"><SocialIcon name="instagram" /></a>
          <a aria-label="Visit YouTube" href="https://www.youtube.com/" rel="noreferrer" target="_blank"><SocialIcon name="youtube" /></a>
          <a aria-label="Visit LinkedIn" href="https://www.linkedin.com/" rel="noreferrer" target="_blank"><SocialIcon name="linkedin" /></a>
        </div>
      </div>

      <div className="footer-copy">
        <p>Copyright &copy; 2026, Shades of SG. All rights reserved.</p>
        <div aria-label="Legal information" className="footer-legal">
          <a href="mailto:shadesofsg@gmail.com?subject=Shades%20of%20SG%20Vulnerability%20Report">Report Vulnerability</a>
          <span aria-hidden="true">|</span>
          <Link to="/privacy">Privacy Policy</Link>
          <span aria-hidden="true">|</span>
          <Link to="/terms">Terms &amp; Conditions</Link>
        </div>
      </div>
    </footer>
  )
}
