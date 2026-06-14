import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

/*
TODO - Ferlyn

Implement song metadata form.
Implement preview area.
Implement publish controls.
*/
export default function Studio() {
  return (
    <div className="page-stack">
      <PageHeader description="Creator workspace for drafting song metadata, previews, and publication state." eyebrow="Creator Studio" title="Studio" />
      <section className="studio-grid">
        <SectionCard title="Song Metadata Form">
          <label className="field-stack"><span>Title</span><input placeholder="Song title" /></label>
          <label className="field-stack"><span>Cultural Theme</span><input placeholder="Theme" /></label>
        </SectionCard>
        <SectionCard title="Preview Area"><div className="video-frame">Preview</div></SectionCard>
        <SectionCard title="Publish Controls"><div className="button-row"><button type="button">Save Draft</button><button type="button">Publish</button></div></SectionCard>
      </section>
    </div>
  )
}
