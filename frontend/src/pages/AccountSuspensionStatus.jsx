import { useEffect, useState } from 'react'
import { Headphones, LogOut, ShieldX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getSuspensionStatus } from '../services/authApi'

const TOKEN_KEY = 'suspensionStatusToken'
const dateText = (value) => value ? new Intl.DateTimeFormat('en-SG', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded'

export default function AccountSuspensionStatus() {
  const [token] = useState(() => sessionStorage.getItem(TOKEN_KEY))
  const [data, setData] = useState(null)
  const [error, setError] = useState(() => token ? '' : 'Suspension status access has expired. Sign in again to view the current status.')
  useEffect(() => {
    if (!token) return
    getSuspensionStatus(token).then((response) => setData(response.suspension)).catch((nextError) => setError(nextError.message))
  }, [token])
  return <main className="creator-access-suspended" role="main"><section className="creator-access-suspended__card">
    <span className="creator-access-suspended__icon"><ShieldX aria-hidden="true" /></span>
    <p className="eyebrow">Account suspended</p><h1>Your Shades of SG account is unavailable</h1>
    {error ? <p role="alert">{error}</p> : null}
    {!data && !error ? <p aria-live="polite" role="status">Loading suspension status…</p> : null}
    {data ? <><p className="creator-access-suspended__message">Normal authenticated member and creator features are blocked while this action remains in effect.</p><div className="creator-access-suspended__reason"><strong>User-facing reason</strong><p>{data.reason}</p><strong>Action date</strong><p>{dateText(data.date)}</p><strong>Review state</strong><p>{data.reviewState === 'IN_EFFECT' ? 'Suspension remains in effect' : data.reviewState}</p></div><p>Stored profile, songs, scores, badges, applications, reflections, warnings and history remain preserved.</p><p>No in-product appeal route currently exists.</p><p className="creator-access-suspended__support"><Headphones aria-hidden="true" />Contact <a href={`mailto:${data.supportEmail}?subject=Account%20suspension%20support`}>{data.supportEmail}</a> for questions or restoration review.</p></> : null}
    <Link className="primary-link" onClick={() => sessionStorage.removeItem(TOKEN_KEY)} to="/login"><LogOut aria-hidden="true" />Return to sign in</Link>
  </section></main>
}
