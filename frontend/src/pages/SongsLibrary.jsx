/*
import FilterBar from '../components/FilterBar'
import PageHeader from '../components/PageHeader'
import SongCard from '../components/SongCard'
import { sampleSongs } from './pageData'

/*
TODO - Lia

Implement search behavior.
Connect filters to song metadata.
Load song grid from API.
*/
/*
export default function SongsLibrary() {
  return (
    <div className="page-stack">
      <PageHeader
        description="Search and filter the songs that power experiences across learning, trivia, playground, and rhythm."
        eyebrow="Songs Library"
        title="Songs Library"
      />
      <FilterBar />
      <section className="responsive-grid" aria-label="Song grid">
        {sampleSongs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </section>
    </div>
  )
}
*/


import { useState, useEffect } from "react";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import SongCard from "../components/SongCard";

export default function SongsLibrary() {
  const [songs, setSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]); // keep original list

  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await fetch("/api/songs");
        const data = await res.json();
        if (Array.isArray(data)) {
          setSongs(data);
          setAllSongs(data);
        } else {
          console.error("Expected array, got:", data);
        }
      } catch (err) {
        console.error("Failed to fetch songs:", err);
      }
    }
    fetchSongs();
  }, []);


  return (
    <div className="page-stack">
      <PageHeader
        description="Search and filter the songs that power experiences across learning, trivia, playground, and rhythm."
        eyebrow="Songs Library"
        title="Songs Library"
      />

      {/* Pass both songs + setter so FilterBar can filter */}
      <FilterBar songs={allSongs} onResults={setSongs} />

      <section className="responsive-grid" aria-label="Song grid">
        {songs.length === 0 && <p>No songs found. Try removing some tags or using a different search.</p>}
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </section>
    </div>
  );
}
