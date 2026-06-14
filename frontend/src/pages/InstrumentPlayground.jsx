import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'

/*
TODO - Shermaine

Implement instrument selection.
Implement keyboard mapping.
Implement audio controls.
*/
export default function InstrumentPlayground() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Experiment with instrument sounds and keyboard mappings for the selected song."
        eyebrow="Instrument Playground"
        title="Instrument Playground"
      />
      <section className="three-column">
        <SectionCard title="Instrument Selection">
          <div className="pill-list"><span>Angklung</span><span>Kompang</span><span>Erhu</span></div>
        </SectionCard>
        <SectionCard title="Keyboard Mapping Display">
          <div className="key-grid"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><kbd>F</kbd></div>
        </SectionCard>
        <SectionCard title="Audio Controls">
          <div className="control-strip"><button type="button">Play</button><button type="button">Stop</button></div>
        </SectionCard>
      </section>
    </div>
  )
}
