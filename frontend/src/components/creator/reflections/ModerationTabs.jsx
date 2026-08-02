const TABS = [
  { label: 'Pending', status: 'PENDING' },
  { label: 'Approved', status: 'APPROVED' },
  { label: 'Flagged', status: 'FLAGGED' },
  { label: 'Rejected', status: 'REJECTED' },
]

export default function ModerationTabs({ activeStatus, counts, onChange }) {
  return (
    <div aria-label="Reflection status" className="crm-tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          aria-selected={activeStatus === tab.status}
          className={activeStatus === tab.status ? 'is-active' : ''}
          key={tab.status}
          onClick={() => onChange(tab.status)}
          role="tab"
          type="button"
        >
          {tab.label}<span>{counts[tab.status.toLowerCase()] || 0}</span>
        </button>
      ))}
    </div>
  )
}
