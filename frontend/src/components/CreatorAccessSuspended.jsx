import { ArrowRight, Headphones, Home, ShieldAlert, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CREATOR_SUSPENSION_MESSAGE } from '../utils/accessStatus'

export default function CreatorAccessSuspended() {
  const { user } = useAuth()
  return <main className="creator-access-suspended" role="main">
    <section className="creator-access-suspended__card">
      <span className="creator-access-suspended__icon"><ShieldAlert /></span>
      <p className="eyebrow">Creator access unavailable</p>
      <h1>Creator tools are temporarily unavailable</h1>
      <p className="creator-access-suspended__message">{CREATOR_SUSPENSION_MESSAGE} Existing songs, ownership and stored draft data remain preserved; publication status is managed separately.</p>
      {user?.creatorSuspensionReason ? <div className="creator-access-suspended__reason"><strong>Reason provided</strong><p>{user.creatorSuspensionReason}</p></div> : null}
      <p className="creator-access-suspended__support"><Headphones />No in-product appeal route currently exists. Contact Shades of SG support or your programme administrator for questions or restoration review.</p>
      <div className="creator-access-suspended__actions">
        <Link className="secondary-link" to="/settings/safety"><ShieldAlert />View Safety &amp; Account Status</Link>
        <Link className="primary-link" to="/profile"><UserRound />Continue to your profile <ArrowRight /></Link>
        <Link className="secondary-link" to="/"><Home />Return home</Link>
      </div>
    </section>
  </main>
}
