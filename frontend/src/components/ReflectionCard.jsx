import { Link } from "react-router-dom";

export default function ReflectionCard({ reflection }) {
  // Display name logic
  let displayName = "Anonymous";
  if (reflection.displayName) {
    displayName = reflection.displayName;
  } else if (reflection.user?.name) {
    displayName = reflection.user.name;
  } else if (reflection.userId) {
    displayName = "User";
  }

  return (
    <article className="reflection-card">
      <div>
        <p className="eyebrow">{reflection.song?.title || "Unknown Song"}</p>
        <h3>{displayName}</h3>
        <p>{reflection.content}</p>
      </div>
      <Link to={`/reflections/${reflection.id}`}>Explore Reflection</Link>
    </article>
  );
}
