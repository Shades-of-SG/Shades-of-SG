import { useState } from 'react'
import { Link } from 'react-router-dom'
import VaultFolder from '../components/vault/VaultFolder'
import Reveal from '../components/Reveal'

/*
TODO - Shermaine

Replace placeholder photo/video/audio tiles with real archival media when available.
*/

const collections = [
  {
    id: 'before-independence',
    items: [
      {
        caption: 'Bumboats crowd the Singapore River, once the beating heart of a busy trading port.',
        icon: '🚤',
        id: 'before-independence-photo',
        title: 'Singapore River, 1950s',
        type: 'photo',
      },
      {
        excerpt:
          'Overcrowded housing, rising unemployment, and calls for self-government dominate the headlines as Singapore pushes for a say in its own future.',
        headline: 'Calls for Self-Rule Grow Louder',
        id: 'before-independence-clipping',
        masthead: 'The Straits Times · Illustrative excerpt',
        type: 'newspaper',
      },
      {
        attribution: 'A former shipyard worker, recalling the 1950s',
        id: 'before-independence-quote',
        text: 'We worked hard and dreamed of a Singapore we could call truly our own.',
        type: 'quote',
      },
      {
        id: 'before-independence-fact',
        text: 'Singapore joined the Federation of Malaysia in 1963, two years before becoming a fully independent nation.',
        type: 'fact',
      },
    ],
    number: '01',
    question: 'What challenges did Singapore face before independence?',
    reflection: 'Independence did not arrive overnight — it was shaped by years of struggle, negotiation, and hope.',
    title: 'Before Independence',
  },
  {
    id: 'independence-1965',
    items: [
      {
        excerpt: 'Singapore is now an independent, sovereign nation, a Prime Minister tells a stunned nation.',
        headline: 'Singapore Stands Alone',
        id: 'independence-clipping',
        masthead: 'Front page · 9 August 1965 (illustrative recreation)',
        type: 'newspaper',
      },
      {
        caption: 'A radio announcer informs citizens that Singapore has become a sovereign, independent nation.',
        duration: 'Illustrative recording · 0:42',
        id: 'independence-audio',
        title: 'Radio Announcement, 9 August 1965',
        type: 'audio',
      },
      {
        caption: 'Crowds gather at the Padang as word of independence spreads across the island.',
        icon: '🏟️',
        id: 'independence-photo',
        title: 'The Padang, 1965',
        type: 'photo',
      },
      {
        id: 'independence-fact',
        text: "Singapore's founding Prime Minister, Lee Kuan Yew, led the country through this turning point.",
        type: 'fact',
      },
    ],
    number: '02',
    question: 'Why was 1965 such an important turning point?',
    reflection: "In a single moment, Singapore's future became its own to write.",
    title: '1965: Independence',
  },
  {
    id: 'multicultural-nation',
    items: [
      {
        caption: 'Chinatown, Kampong Glam, and Little India each grew as distinct cultural enclaves.',
        icon: '🗺️',
        id: 'multicultural-map',
        title: 'Ethnic Enclaves, 1960s',
        type: 'map',
      },
      {
        id: 'multicultural-story',
        text: 'New public housing brought Chinese, Malay, Indian, and other families into the same blocks and void decks — turning neighbours into a shared national story.',
        title: 'One Roof, Many Cultures',
        type: 'story',
      },
      {
        attribution: 'A retiree, remembering growing up in a HDB estate',
        id: 'multicultural-quote',
        text: "My best friend's Hari Raya was my Hari Raya too. We celebrated everything together.",
        type: 'quote',
      },
      {
        id: 'multicultural-fact',
        text: 'Singapore has four official languages: English, Malay, Mandarin, and Tamil.',
        type: 'fact',
      },
    ],
    number: '03',
    question: 'How did people from different cultures build one nation together?',
    reflection: 'Unity did not erase differences — it wove them into a single, shared identity.',
    title: 'Building a Multicultural Nation',
  },
  {
    id: 'national-day-traditions',
    items: [
      {
        caption: 'Footage from an early National Day Parade march-past.',
        id: 'traditions-video',
        title: 'NDP Parade Footage',
        type: 'video',
      },
      {
        excerpt: 'Thousands gather for the very first National Day Parade, a display of unity and pride.',
        headline: 'A Nation Celebrates, Together',
        id: 'traditions-clipping',
        masthead: 'Illustrative front page · 1966',
        type: 'newspaper',
      },
      {
        caption: 'A verse from one of Singapore\'s best-loved National Day songs.',
        duration: 'Illustrative excerpt · 0:30',
        id: 'traditions-audio',
        title: 'National Day Song Excerpt',
        type: 'audio',
      },
      {
        id: 'traditions-fact',
        text: 'The National Day Parade has been held at the Padang, Marina Bay, and the National Stadium over the decades.',
        type: 'fact',
      },
    ],
    number: '04',
    question: 'Why do we celebrate National Day every year?',
    reflection: "Each parade is more than a show — it's a shared act of remembering and celebrating together.",
    title: 'National Day Traditions',
  },
  {
    id: 'singapore-today',
    items: [
      {
        caption: 'The Marina Bay skyline today, built on the foundations of the generations before it.',
        icon: '🌃',
        id: 'today-photo',
        title: 'Marina Bay Skyline, Today',
        type: 'photo',
      },
      {
        id: 'today-story',
        text: "Modern Singapore has grown into a global city, but its story is still written by the same spirit that carried it through 1965 — resilience, unity, and reinvention.",
        title: 'A Living Story',
        type: 'story',
      },
      {
        attribution: 'A student, reflecting on National Day',
        id: 'today-quote',
        text: 'History isn\'t just something we read about — it\'s something we get to continue.',
        type: 'quote',
      },
      {
        id: 'today-fact',
        text: "Singapore's National Day is celebrated on 9 August every year.",
        type: 'fact',
      },
    ],
    number: '05',
    question: "What does Singapore's story mean for us today?",
    reflection: 'The story continues — written by every generation that calls Singapore home.',
    title: 'Singapore Today',
  },
]

const reflectionPrompts = [
  'What does National Day mean to you?',
  'Why do you think National Day continues to matter today?',
  'Which story from the archives resonated with you the most, and why?',
  'How has exploring these stories changed your perspective on Singapore?',
]

export default function HeritageVault() {
  const [openCollectionId, setOpenCollectionId] = useState(collections[0].id)
  const [reflectionPrompt] = useState(
    () => reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]
  )

  function toggleCollection(id) {
    setOpenCollectionId((current) => (current === id ? null : id))
  }

  return (
    <div className="vault-page">
      <section className="vault-hero">
        <p className="vault-hero__badge">The Heritage Vault</p>
        <h1>Step Into The Heritage Vault</h1>
        <p className="vault-hero__intro">
          Preserved photographs, recordings, and documents — piece together the story of a
          nation, one vault collection at a time.
        </p>
        <a className="vault-hero__cta" href="#vault-collections">
          Begin Exploring the Vault <span aria-hidden="true">↓</span>
        </a>
      </section>

      <section className="vault-collections" id="vault-collections">
        <Reveal as="div" className="learning-section-heading">
          <h2>The Vault Collections</h2>
          <p>Open a folder to uncover what's inside.</p>
        </Reveal>

        <ol className="vault-folder-list">
          {collections.map((collection) => (
            <VaultFolder
              collection={collection}
              isOpen={openCollectionId === collection.id}
              key={collection.id}
              onToggle={toggleCollection}
            />
          ))}
        </ol>
      </section>

      <Reveal as="section" className="vault-reflection">
        <div className="vault-reflection__desk">
          <p className="vault-reflection__eyebrow">Final Exhibit</p>
          <h2>The Living Archive</h2>

          <p className="vault-reflection__lead">
            Every photograph, clipping, and recording you've uncovered preserves a piece of
            Singapore's past.
          </p>
          <p className="vault-reflection__lead">
            But history isn't only kept in archives — it lives on in the memories, experiences,
            and voices of the people who continue to celebrate it.
          </p>

          <p className="vault-reflection__prompt">{reflectionPrompt}</p>

          <div className="vault-reflection__actions">
            <Link className="vault-reflection__primary" to="/reflections?compose=1">
              <span aria-hidden="true">✍️</span> Share Your Reflection
            </Link>
            <Link className="vault-reflection__secondary" to="/reflections">
              <span aria-hidden="true">💬</span> Read Community Reflections
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal as="section" className="vault-continue">
        <p className="vault-continue__eyebrow">Continue Exploring</p>
        <h2>Singapore's Multicultural Heritage</h2>

        <div className="vault-continue__grid">
          <Link className="vault-continue__card" to="/learning/instrument-lab">
            <span aria-hidden="true">🥁</span>
            <strong>Instrument Discovery Lab</strong>
            <p>Learn about the traditional instruments used across Singapore's diverse communities.</p>
          </Link>

          <Link className="vault-continue__card" to="/learning/guided-lessons">
            <span aria-hidden="true">🎼</span>
            <strong>Guided Music Lessons</strong>
            <p>Discover the songs that continue to unite Singaporeans every National Day.</p>
          </Link>
        </div>
      </Reveal>
    </div>
  )
}
