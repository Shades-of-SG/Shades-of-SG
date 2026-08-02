export default function ProfileSkeleton() {
  return <div aria-label="Loading profile" className="profile-page" role="status"><span className="profile-skeleton profile-skeleton--hero" /><div className="profile-stats">{[1, 2, 3].map((value) => <span className="profile-skeleton profile-skeleton--stat" key={value} />)}</div></div>
}
