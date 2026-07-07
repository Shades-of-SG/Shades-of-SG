import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

export default function TotalPlays() {
  return (
    <div className="page-stack">
      <PageHeader description="Track overall play counts across the creator catalog." eyebrow="Analytics" title="Total Plays" />
      <section className="stats-grid">
        <SectionCard title="All-Time Plays"><strong>240</strong><p>Total plays across demo songs.</p></SectionCard>
        <SectionCard title="This Week"><strong>38</strong><p>Recent engagement trend.</p></SectionCard>
        <SectionCard title="Top Song"><strong>City Pulse</strong><p>Most played creator song.</p></SectionCard>
        <SectionCard title="Completion Rate"><strong>74%</strong><p>Average song finish rate.</p></SectionCard>
      </section>
    </div>
  )
}