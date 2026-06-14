import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

export default function NotFound() {
  return (
    <main className="not-found-page">
      <SectionCard>
        <PageHeader description="This route is not part of the current Shades of SG shell." eyebrow="404" title="Page Not Found" />
        <Link className="primary-link" to="/">Return Home</Link>
      </SectionCard>
    </main>
  )
}
