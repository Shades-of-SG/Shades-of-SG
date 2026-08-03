import { Headphones, LogOut, ShieldX } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AccountAccessSuspended() {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const leaveAccount = () => { signOut(); navigate('/', { replace: true }) }
  return <main className="creator-access-suspended" role="main"><section className="creator-access-suspended__card">
    <span className="creator-access-suspended__icon"><ShieldX /></span>
    <p className="eyebrow">Account suspended</p>
    <h1>Your Shades of SG account is unavailable</h1>
    <p className="creator-access-suspended__message">This full account suspension blocks regular-user and creator access. Stored profile, songs, scores, badges, applications, warnings and history remain preserved.</p>
    {user?.accountSuspensionReason ? <div className="creator-access-suspended__reason"><strong>Reason provided</strong><p>{user.accountSuspensionReason}</p></div> : null}
    <p className="creator-access-suspended__support"><Headphones />No in-product appeal route currently exists. Contact Shades of SG support for questions or restoration review.</p>
    <button className="primary-button" onClick={leaveAccount} type="button"><LogOut />Continue signed out</button>
  </section></main>
}
