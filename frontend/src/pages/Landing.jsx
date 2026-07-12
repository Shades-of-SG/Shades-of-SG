/*
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import SongCard from '../components/SongCard'
import { sampleSongs } from './pageData'

/*
TODO - Lia

Implement final landing copy.
Connect featured songs to backend data.
Add production-ready media assets.
*/
/*
export default function Landing() {
  return (
    <div className="page-stack landing-page">
      <section className="hero-panel">
        <PageHeader
          description="Explore Singapore stories through songs, rhythm play, cultural notes, and shared reflections."
          eyebrow="Public Experience"
          title="Shades of SG"
        />
        <div className="hero-actions">
          <Link className="primary-link" to="/songs">Browse Songs</Link>
          <Link className="secondary-link" to="/rhythm-game">Play Rhythm Game</Link>
        </div>
      </section>

      <section className="content-section">
        <h2>Featured Songs</h2>
        <div className="responsive-grid">
          {sampleSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
      </section>

      <section className="content-section two-column">
        <SectionCard title="Why Shades of SG" description="A shared base for music-led cultural discovery.">
          <p>Placeholder modules will support song stories, playable learning moments, and reflection prompts.</p>
        </SectionCard>
        <SectionCard title="Call To Action" description="Start with a song, then follow the cultural thread.">
          <Link className="inline-link" to="/learning">Open Learning Hub</Link>
        </SectionCard>
      </section>
    </div>
  )
}
*/

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import SongCard from "../components/SongCard";
import ReflectionCard from "../components/ReflectionCard";
import FeatureCard from "../components/FeatureCard";

export default function Landing() {
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  //Song Carousell
  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await fetch("/api/songs");
        const data = await res.json();
        if (Array.isArray(data)) {
          setSongs(data.slice(0, 5)); // ✅ limit to 5
        }
      } catch (err) {
        console.error("Failed to fetch songs:", err);
      }
    }
    fetchSongs();
  }, []);

  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    function updateVisibleCount() {
      if (window.innerWidth >= 1024) {
        setVisibleCount(3); // laptop
      } else {
        setVisibleCount(1); // split/mobile
      }
    }
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  function prevSlide() {
    setCurrentIndex(prev => prev === 0 ? songs.length - visibleCount : prev - 1);
  }

  function nextSlide() {
    setCurrentIndex(prev => prev >= songs.length - visibleCount ? 0 : prev + 1);
  }

  //Reflection Carousell
  const [reflections, setReflections] = useState([]);
  const [reflectionIndex, setReflectionIndex] = useState(0);

  useEffect(() => {
    async function fetchReflections() {
      try {
        const res = await fetch("/api/reflections");
        const data = await res.json();
        if (Array.isArray(data)) {
          setReflections(data.slice(0, 5));
        }
      } catch (err) {
        console.error("Failed to fetch reflections:", err);
      }
    }
    fetchReflections();
  }, []);

  function prevReflection() {
    setReflectionIndex((prev) =>
      prev === 0 ? reflections.length - 1 : prev - 1
    );
  }

  function nextReflection() {
    setReflectionIndex((prev) =>
      prev === reflections.length - 1 ? 0 : prev + 1
    );
  }

  //Stats stuff
  const [stats, setStats] = useState({ usersCount: 0, songsCount: 0, reflectionsCount: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    }
    fetchStats();
  }, []);


  return (
    <div className="page-stack landing-page"> {/* Hero Section */}
      <section className="hero-panel">
        <PageHeader
          description="Explore Singapore stories through songs, rhythm play, cultural notes, and shared reflections."
          eyebrow="Public Experience"
          title="Shades of SG"
        />
        <div className="hero-actions">
          <Link className="primary-link" to="/songs">Browse Songs</Link>
          <Link className="secondary-link" to="/rhythm-game">Play Rhythm Game</Link>
        </div>
      </section>

      {/* Features & Stats */}
      <section className="content-section">
        <h2>What you can do</h2>
        <div className="feature-row">
          <FeatureCard icon="🎥" title="Watch & Learn" description="Enjoy AI-enhanced music videos with stories and insights." />
          <FeatureCard icon="🎹" title="Play Instruments" description="Try piano tiles and explore traditional instruments in a fun way." />
          <FeatureCard icon="🥁" title="Rhythm Challenges" description="Test your timing, beat the high score and earn points!" />
          <FeatureCard icon="📝" title="Share & Reflect" description="Share your memories and read stories from our amazing community." />
        </div>

        <div className="feature-row stats-row">
          <FeatureCard icon="👥" title={`${stats.usersCount} Active Explorers`} description="Registered users engaging with Shades of SG." />
          <FeatureCard icon="🎶" title={`${stats.songsCount} Heritage Songs`} description="Songs available to explore." />
          <FeatureCard icon="📖" title={`${stats.reflectionsCount} Stories Shared`} description="Community reflections approved and published." />
        </div>
      </section>



      <section className="content-section"> {/* Song Section */}
        <h2>Featured Songs</h2>
        <div className="carousel-container">
          <button className="carousel-arrow left" onClick={prevSlide}>‹</button>
          {/* The back arrow is still not working */}

          {songs.length === 0 && <p>No songs loaded</p>}
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * (100 / visibleCount)}%)` }}
          >
            {songs.map((song) => (
              <div key={song.id} className="carousel-item">
                <SongCard song={song} />
              </div>
            ))}
          </div>

          <button className="carousel-arrow right" onClick={nextSlide}>›</button>
        </div>
        <Link className="inline-link" to="/songs">View all songs →</Link>
      </section>



      <section className="content-section"> {/* Reflection Section */}
        <h2>Featured Reflections</h2>
        <div className="carousel-container">
          <button className="carousel-arrow left" onClick={prevReflection}>‹</button>

          <div
            className="carousel-track"
            style={{ transform: `translateX(-${reflectionIndex * (100 / visibleCount)}%)` }}
          >
            {reflections.map((reflection) => (
              <div key={reflection.id} className="carousel-item">
                <ReflectionCard reflection={reflection} />
              </div>
            ))}
          </div>

          <button className="carousel-arrow right" onClick={nextReflection}>›</button> {/* Hiding behind the cards */}
        </div>
        <Link className="inline-link" to="/reflections">View all reflections →</Link>
      </section>


      <section className="content-section two-column">
        <SectionCard title="Why Shades of SG" description="A shared base for music-led cultural discovery.">
          <p>Placeholder modules will support song stories, playable learning moments, and reflection prompts.</p>
        </SectionCard>
        <SectionCard title="Call To Action" description="Start with a song, then follow the cultural thread.">
          <Link className="inline-link" to="/learning">Open Learning Hub</Link>
        </SectionCard>
      </section>
    </div>
  );
}
