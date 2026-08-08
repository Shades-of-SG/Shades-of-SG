# AI Music Video Platform - Public-Facing Use Cases

**Platform Purpose:** Transform Singapore-themed songs into cinematic visual experiences, enabling community members to explore cultural heritage through music, interactive games, and storytelling.

**Target Users:** Community organisations, schools, educators, elderly engagement programmes, cultural event organisers.

**Scope:** Public-facing features for Guest and Registered Users (NOT creator-side production tools).

---

## Use Case Distribution by Team Member

| Team Member | Feature Domain | Use Cases |
|---|---|---|
| **Member 1** | Song Discovery & Exploration | UC-P01, UC-P02, UC-P03, UC-P04 |
| **Member 2** | Song Experience & Content Consumption | UC-P05, UC-P06, UC-P07, UC-P08 |
| **Member 3** | Interactive Learning (Instrument Playground & Trivia) | UC-P09, UC-P10, UC-P11, UC-P12 |
| **Member 4** | Rhythm Game, Reflection Wall & Account Management | UC-P13, UC-P14, UC-P15, UC-P16 |

---

# MEMBER 1: SONG DISCOVERY & EXPLORATION

## UC-P01: Access Landing Page and Choose Session Mode

**Use Case Name:** Platform Entry - Access Landing Page and Select Guest or Login

**Primary Actor:** New Visitor (Guest or Registered User)

**Secondary Actors:**
- Session Management Service
- Authentication Service
- Database (User Records)

**Preconditions:**
- User accessing platform for first time or returning
- User has not logged in to active session
- Landing page is accessible
- Platform has published songs available

**Triggers:**
- User navigates to platform URL (https://platform.com)
- User clicks link from community organisation or school outreach
- User returns to platform after session expiry

**Goal:**
New or returning user can quickly choose to continue as guest (immediate access) or log in (registered user features) without friction, enabling rapid entry into platform experience.

**Main Flow:**

1. System detects user is unauthenticated (no valid session token)
2. System displays landing page with:
   - **Platform Header:**
     - Platform name and tagline: "Preserve Singapore's Stories Through Music"
     - Logo and branding
   - **Hero Section:**
     - Headline: "Discover Singaporean Music & Stories"
     - Short description: "Explore AI-generated music videos, learn instruments, and share memories inspired by our cultural heritage"
     - Visual: Thumbnail/preview of featured song or hero image
   - **Call-to-Action Buttons (Prominent):**
     - Primary button: "Continue as Guest" (blue/highlighted)
     - Secondary button: "Log In" (standard style)
     - Tertiary link: "Create Account" (small link)
   - **Feature Overview (Optional):**
     - 3-4 cards describing key features:
       - "Watch AI Music Videos"
       - "Play Rhythm Games"
       - "Learn Instruments"
       - "Share Your Stories"
3. User can click one of three paths:

   **Path A: Continue as Guest**
   - User clicks "Continue as Guest" button
   - System generates temporary guest_session_id (UUID)
   - System stores guest session in browser localStorage/cookie:
     - `guest_session_id`: temporary token
     - `session_created_at`: current timestamp
     - `session_expires_at`: current timestamp + 2 hours
   - System grants read-only access to:
     - Songs Library (UC-P02)
     - Song Experience pages (UC-P05)
     - Instrument Playground (UC-P09)
     - Rhythm Game (UC-P13)
     - Reflection Wall (UC-P14) - view only, anonymous submit
   - System redirects to Songs Library page (UC-P02)
   - Guest user can now browse without login requirement

   **Path B: Log In (Registered User)**
   - User clicks "Log In" button
   - System redirects to login page (UC-P16 for account management)
   - User enters email and password
   - On success, user gains full registered features
   - On failure, user shown error and remains on login page

   **Path C: Create Account (New User)**
   - User clicks "Create Account" link
   - System redirects to registration page
   - User completes registration form (name, email, password)
   - On success, user becomes registered user (UC-P16)
   - On failure, user shown error and can retry

4. **Landing Page Analytics (Optional):**
   - System logs landing page view (anonymous)
   - System tracks which CTA button clicked (for analytics)
   - Data used to understand user flow and optimize landing

5. User proceeds to next step based on chosen path

**Alternate Flows:**

**AF-01: User Already Logged In**
- User navigates to landing page while already logged in (valid session)
- System detects active session_id in cookie
- System skips landing page and redirects directly to Songs Library (UC-P02)
- Logged-in user never sees CTA buttons

**AF-02: User Accessing from Direct Link**
- User receives direct link to specific song or feature (e.g., /library/{song_id})
- User not authenticated
- System detects unauthenticated user on restricted page
- System redirects to landing page
- After choosing guest or login, user is redirected to originally requested page

**AF-03: Landing Page Slow to Load**
- Landing page takes >3 seconds to load (network slowness)
- System displays loading spinner
- System shows cached landing page content if available
- User sees content while full page loads in background

**AF-04: Session Expired While on Landing Page**
- User had previous session that expired
- User sees "Your session has expired" notification
- Buttons still available to "Continue as Guest" or "Log In"
- User can proceed without disruption

**AF-05: Mobile vs Desktop Responsive**
- Landing page viewed on mobile device
- System detects mobile viewport (width <768px)
- Layout adjusts:
  - Stack CTA buttons vertically
  - Reduce image sizes
  - Simplify feature cards
  - Optimize for touch interaction
- User experience remains smooth on all devices

**Success Outcome:**
- Landing page displays with clear CTA options
- User can choose guest or login path immediately
- Guest session created and active
- User redirected to Songs Library (UC-P02)
- Session persists across page navigation
- User can begin exploring content

**Error Conditions:**
- Landing page fails to load → Display error, offer retry or reload
- Session creation fails → Display error, suggest clearing cookies and retry
- Redirect fails → Show manual navigation links to main pages
- Database unavailable → Display degraded landing page (cached version)

**Key Acceptance Criteria:**
- ✓ Landing page loads within 2 seconds
- ✓ CTA buttons clearly visible and clickable
- ✓ Guest session created immediately (no delay)
- ✓ User redirected to correct next page based on choice
- ✓ Mobile-responsive layout works smoothly
- ✓ Loading states shown if page slow
- ✓ Error states handled gracefully

---

## UC-P02: Browse Songs Library with Filters and Search

**Use Case Name:** Songs Library - Browse, Search, and Filter Published Songs

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Database (Published Song Records)
- Search Service (optional)

**Preconditions:**
- User has chosen guest mode (UC-P01) or logged in
- User has active session (guest or registered)
- Songs library has at least one published song
- User has access to Songs Library page

**Triggers:**
- User clicks "Explore Songs" or "Browse Library"
- User lands on /library URL
- User returns from song detail page (UC-P05)
- User refreshes library page

**Goal:**
User can discover available songs by browsing, filtering by theme/genre, and searching by keyword, enabling efficient discovery of relevant cultural content for their interest or occasion.

**Main Flow:**

1. System detects user session (guest or registered) is valid
2. System queries database for all published songs:
   - SELECT: song_id, title, artist_name, theme, language, thumbnail_url, description, duration, published_date
   - WHERE: publish_status = "PUBLISHED"
   - ORDER BY: published_date DESC (newest first by default)
3. System displays Songs Library page with layout:
   - **Header:**
     - "Explore Singaporean Music" title
     - User profile icon (if registered) or "Guest" label
   - **Search & Filter Section:**
     - Search bar: "Search songs by title, artist, or keyword..."
     - Filter dropdown: **Theme**
       - Options: All Themes, National Day, Chinese New Year, Heritage, Celebration, Reflection, Other
     - Filter dropdown: **Language**
       - Options: All Languages, English, Mandarin, Malay, Tamil, Mixed
     - Filter dropdown: **Mood**
       - Options: All Moods, Nostalgic, Celebratory, Reflective, Energetic, Peaceful, Emotional
     - "Clear Filters" button (appears when filters applied)
   - **Sort Options:**
     - Radio buttons or dropdown:
       - Newest First (default)
       - Most Popular (view count, if tracking)
       - A-Z (title alphabetical)
       - Oldest First
   - **Results Display:**
     - Song grid (responsive: 3 columns desktop, 2 tablet, 1 mobile)
     - Each song card shows:
       - Thumbnail/album art
       - Title (bold, clickable)
       - Artist name
       - Theme badge (e.g., "🎆 National Day")
       - Duration (e.g., "3:45")
       - Language tag (e.g., "🇨🇳 Mandarin")
       - Description preview (truncated to 2 lines)
       - "Watch Video" button (prominent)
     - Pagination: "Show more" button or page numbers (20 songs per page)

4. **User Interaction - Search:**
   - User types in search bar (e.g., "heartland")
   - System performs search as user types (debounced, 300ms delay):
     - Query: title LIKE "%heartland%" OR artist_name LIKE "%heartland%" OR description LIKE "%heartland%"
     - Results filtered in real-time
   - System displays matching songs (highlighting search term in title)
   - If no results: "No songs found matching 'heartland'. Try different keywords"

5. **User Interaction - Filter by Theme:**
   - User clicks theme dropdown and selects "Chinese New Year"
   - System applies filter:
     - Query: WHERE theme = "Chinese New Year" AND publish_status = "PUBLISHED"
   - Results update to show only CNY songs
   - Filter badge shows "Theme: Chinese New Year" as active filter

6. **User Interaction - Filter by Language:**
   - User selects language "Mandarin"
   - System applies language filter
   - Combined filters: theme = "CNY" AND language = "Mandarin"
   - Results show CNY songs in Mandarin only

7. **User Interaction - Sort:**
   - User selects "Most Popular"
   - System re-queries with ORDER BY view_count DESC
   - Results reordered by popularity
   - Sort indicator shows "Most Popular" selected

8. **User Interaction - Pagination:**
   - User scrolls to end of current page
   - "Load More" button displayed
   - User clicks "Load More"
   - System fetches next 20 songs and appends to page
   - Pagination counter updates (e.g., "Showing 20 of 45 songs")

9. **User Clicks on Song:**
   - User clicks "Watch Video" or song title
   - System navigates to Song Experience page (UC-P05)
   - Song detail and AI video player loads

10. **Registered User Bookmarking (Optional):**
    - User clicks heart/star icon on song card
    - System saves bookmark to user profile (if registered)
    - Heart icon fills in (visual feedback)
    - Bookmark persists in database

**Alternate Flows:**

**AF-01: No Published Songs**
- Database query returns zero results
- System displays empty state:
  - Message: "No songs available yet"
  - Icon: Music note or friendly message
  - Suggestion: "Check back soon as we add more songs to the library"
  - Optional: Redirect to landing page or contact link

**AF-02: Search Returns Multiple Pages of Results**
- User searches "Singapore" and gets 150 results
- System displays first 20 results
- "Load More" button available
- User can load next 20 results repeatedly
- Total result count shown: "Showing 1-20 of 150 songs"

**AF-03: Filter Combination Returns No Results**
- User filters: Theme = "National Day" AND Language = "Tamil"
- Database returns 0 results
- System displays: "No songs found with your filters. Try adjusting criteria"
- Suggestions: "Try National Day songs in all languages" (link to reset language filter)

**AF-04: User Removes Filter**
- User has applied Theme filter
- User clicks "Clear Filters" or deselects theme option
- System re-queries with filter removed
- All songs displayed again

**AF-05: Guest Session Expires While Browsing**
- Guest browsing library for >2 hours
- Session token expires
- System detects expired session on next interaction (click, scroll, etc.)
- System displays notification: "Your session has expired. Continue as new guest?"
- System creates new guest session if user confirms
- Library view retained (or resets with all songs)

**AF-06: Database Query Timeout**
- Filter + search query takes >5 seconds
- System shows loading spinner: "Loading songs..."
- Query retried if timeout detected
- If persists, displays error: "Search temporarily slow. Please try again"

**AF-07: Responsive Mobile Layout**
- User viewing library on mobile phone
- Song cards stack in single column
- Search bar spans full width
- Filter dropdowns remain accessible (possibly in collapsible menu)
- Pagination as "Load More" button (easier on mobile)

**AF-08: Registered User with Bookmarks**
- Registered user viewing library
- Previously bookmarked songs show filled heart icons
- User can see at a glance which songs they've favorited
- Clicking filled heart removes bookmark

**Success Outcome:**
- Songs Library displays with all published songs
- User can search and filter results effectively
- Each song card shows essential metadata (title, artist, theme, duration)
- User can navigate paginated results smoothly
- User can click on song to view details (UC-P05)
- Filters applied accurately
- Search results relevant to query
- Page responsive on all devices
- User experience smooth without excessive loading

**Error Conditions:**
- No published songs → Show empty state with message
- Search/filter timeout → Show loading, retry, or error message
- Database unavailable → Display error, offer retry
- Session expired → Create new session or redirect to landing page
- Mobile rendering broken → Gracefully degrade layout

**Key Acceptance Criteria:**
- ✓ Library loads within 2 seconds
- ✓ Search works in real-time (debounced)
- ✓ Filters accurate (theme, language, mood)
- ✓ Sorting options function correctly
- ✓ Pagination loads smoothly
- ✓ Responsive on mobile, tablet, desktop
- ✓ No layout shift when loading results
- ✓ Song cards display all relevant info
- ✓ Bookmarking (if enabled) persists for registered users

---

## UC-P03: Filter and Sort Songs by Theme and Occasion

**Use Case Name:** Advanced Filtering - Sort Songs by Theme and Occasion for Relevant Content Discovery

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Database (Song Metadata)
- Search/Filter Engine

**Preconditions:**
- User is on Songs Library page (UC-P02)
- Songs library populated with published songs
- Songs have theme and mood metadata assigned

**Triggers:**
- User clicks theme filter dropdown
- User selects multiple filter criteria
- User clicks "Sort by" option
- User needs songs for specific occasion (e.g., National Day event)

**Goal:**
User can quickly filter songs by theme (National Day, CNY, Heritage) and occasion to find culturally relevant content suitable for community events, classroom settings, or elderly engagement programmes.

**Main Flow:**

1. User on Songs Library page (UC-P02) sees filter panel
2. **Theme Filtering:**
   - User clicks "Theme" dropdown filter
   - System displays theme options:
     - [ ] All Themes (pre-checked)
     - [ ] National Day
     - [ ] Chinese New Year
     - [ ] Heritage & Culture
     - [ ] Celebration & Joy
     - [ ] Reflection & Nostalgia
     - [ ] Other
   - User selects one or more themes (checkbox behavior)
   - Example: User selects "National Day" for August event planning
3. System applies theme filter:
   - Query: WHERE theme IN ("National Day") AND publish_status = "PUBLISHED"
   - Results update immediately (live filter feedback)
   - Song count updates: "12 National Day songs found"
4. **Occasion-Based Sub-Filtering (Optional):**
   - Below theme, system shows occasion tags:
     - [ ] School Setting
     - [ ] Elderly Engagement
     - [ ] Family Gathering
     - [ ] Large Event/Community
     - [ ] Quiet Reflection
   - User selects relevant occasion
   - Combined filter: theme = "National Day" AND occasion = "School Setting"
5. **Language Filter (Complementary):**
   - User filters by language (e.g., "English" or "Mandarin")
   - Useful for matching language capabilities of audience
   - Combined filter: theme + occasion + language
6. **Mood/Tone Filter:**
   - User selects mood tags:
     - Energetic (for upbeat events)
     - Reflective (for quieter settings)
     - Nostalgic (for heritage focus)
     - Celebratory (for festive occasions)
   - Combined filter applied
7. **Sort Order:**
   - User selects sort preference:
     - **Newest First:** Recently published songs (default)
     - **Most Popular:** By view count (if tracking engagement)
     - **Longest Duration:** For extended events
     - **Shortest Duration:** For quick activities
     - **A-Z Title:** Alphabetical ordering
   - Results reordered per selection
8. **Active Filters Display:**
   - System shows active filters as removable badges:
     - "✕ Theme: National Day"
     - "✕ Occasion: School Setting"
     - "✕ Language: English"
     - "Clear All Filters" button
   - User can click X to remove individual filter or "Clear All"
9. **Results Refinement:**
   - User browses filtered results
   - Sees only songs matching all selected criteria
   - Result count shows: "5 National Day songs in English for school settings"
10. **Save Filter (Registered Users Only):**
    - Registered user clicks "Save This Filter" (optional feature)
    - System saves filter preferences to user profile
    - User can load "My Saved Filters" on future visits
    - Example: "My National Day Event Filter"

**Alternate Flows:**

**AF-01: No Songs Match Filter Combination**
- User filters: National Day + Elderly Engagement + Tamil language
- Database returns 0 songs
- System displays: "No songs match your filters"
- Suggestions displayed:
  - "Try removing 'Elderly Engagement' tag"
  - "View all National Day songs in other languages"
- User can adjust filters

**AF-02: User Selects Multiple Themes**
- User selects both "National Day" AND "Chinese New Year"
- System queries: WHERE theme IN ("National Day", "Chinese New Year")
- Results show songs from either theme
- Filter badge shows: "Theme: National Day, Chinese New Year"

**AF-03: User Removes Individual Filter**
- User has 3 active filters
- User clicks X on "Language: Mandarin" filter
- System removes language filter, keeps other two
- Results update to show more songs
- Filter badge count decreases

**AF-04: Filter Preset for Event Type (Shortcut)**
- System offers quick-filter buttons:
  - "National Day Events" → Pre-selects theme + celebratory mood
  - "Classroom Setting" → Pre-selects appropriate duration + themes
  - "Elderly Engagement" → Pre-selects reflective/nostalgic songs
  - "Family Gathering" → Pre-selects variety of themes
- User clicks preset
- All relevant filters applied at once

**AF-05: Registered User's Saved Filter**
- Registered user previously saved filter "School Events"
- User clicks "My Saved Filters" dropdown
- System displays saved filters
- User selects "School Events"
- Filters automatically applied: theme, language, duration, mood
- User views school-appropriate songs immediately

**AF-06: Filter State Persists on Page Reload**
- User applies filters and refreshes page
- System detects active filter parameters in URL query string
- Filters reapplied automatically
- User sees same filtered results
- Filter badges still visible

**AF-07: Guest Session Filter Preservation**
- Guest user applies filters
- Guest navigates away and returns
- System stores filter preferences in localStorage (guest browser storage)
- Filter state restored
- User sees previously applied filters

**Success Outcome:**
- Filters display clearly and intuitively
- User can select single or multiple themes
- Occasion tags provide context-specific filtering
- Results update dynamically as filters applied
- Active filters shown as removable badges
- No results shows helpful suggestions
- Registered users can save filters for reuse
- Filter state persists across navigation/reload
- Results count accurate and updated

**Error Conditions:**
- No songs match filter combo → Show helpful suggestions
- Filter dropdown fails to load → Display error, offer manual entry
- Database query times out → Show loading state, retry
- URL query parsing fails → Reset filters, show default results

**Key Acceptance Criteria:**
- ✓ Theme filter displays all theme options
- ✓ Multiple selections allowed and work correctly
- ✓ Filters combine logically (AND logic for different types, OR for same type)
- ✓ Results update immediately as filters change
- ✓ Active filters shown as removable badges
- ✓ Sort order applies correctly
- ✓ No results shows contextual suggestions
- ✓ Filters persist on page reload
- ✓ Registered users can save filters
- ✓ Performance remains smooth with multiple filters applied

---

## UC-P04: Search for Specific Songs by Keyword

**Use Case Name:** Song Search - Discover Songs by Title, Artist, or Keyword

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Database (Song Records)
- Search Engine (optional, for advanced search)

**Preconditions:**
- User is on Songs Library page (UC-P02)
- User has specific song in mind or searching for related keywords
- User is not using advanced filters (UC-P03)

**Triggers:**
- User clicks search bar on library page
- User begins typing keyword
- User presses Enter to search
- User navigates to library with search query in URL

**Goal:**
User can quickly find specific songs by typing keywords (title, artist name, song description) without needing to browse entire library, enabling efficient discovery for targeted searches.

**Main Flow:**

1. User on Songs Library page sees search bar with placeholder:
   - "Search songs by title, artist, or keyword..."
2. User clicks search bar and begins typing
3. System implements debounced search (300-500ms delay) to avoid excessive queries:
   - User types: "h"
   - Waits 300ms, then queries (if user stops typing)
   - If user continues typing, timer resets
4. **Real-time Search Results:**
   - User types: "heartland"
   - System queries database with fuzzy matching:
     - WHERE (title LIKE "%heartland%" OR artist_name LIKE "%heartland%" OR description LIKE "%heartland%" OR lyrics LIKE "%heartland%")
     - AND publish_status = "PUBLISHED"
   - System returns matching songs (e.g., 3 results)
5. **Search Results Display:**
   - Results shown in same library grid (UC-P02)
   - Song cards matching search term displayed
   - Search term highlighted in yellow/bold in title and description
   - Example results:
     - "Heartland Memories" by Artist A
     - "Singapore Heartland Stories" by Artist B
     - "From Our Heartland" by Artist C
   - Result count shown: "3 songs found for 'heartland'"
6. **User Sees No Results:**
   - User searches for term with no matching songs
   - System displays: "No songs found for 'heartland'. Try different keywords"
   - Suggestions displayed:
     - "Popular searches: National Day, Memories, Singapore"
     - Link to "View all songs" (clear search, show library)
7. **User Clears Search:**
   - User clicks X in search bar
   - Search term cleared
   - All library songs displayed again (filters may still apply)
   - Focus returns to search bar
8. **Search Case Insensitivity:**
   - User searches "SINGAPORE" or "singapore" or "SiNgApOrE"
   - System performs case-insensitive search
   - Results identical regardless of case used
9. **Partial Matching:**
   - User types "heart"
   - System returns songs with "Heartland", "Heartfelt", "Wholehearted"
   - User types "mem"
   - System returns "Memory", "Memories", "Memento"
   - Partial matches enable discovery even with typos
10. **Search with Filters (Combined):**
    - User applies theme filter: "National Day"
    - User also searches: "celebration"
    - System combines criteria: theme = "National Day" AND (title/artist/description LIKE "%celebration%")
    - Results show National Day songs mentioning celebration
11. **Popular Search Suggestions (Optional):**
    - Search bar shows dropdown with popular search terms or recently searched:
      - "National Day" (most popular)
      - "Memories" (trending)
      - "Heritage" (often searched)
    - User can click suggestion to search immediately
    - User's search history saved (if registered)

**Alternate Flows:**

**AF-01: User Searches with Special Characters**
- User types: "Singapore's Stories"
- System handles apostrophe gracefully (common issue)
- Query searches for both "Singapore's" and "Singapore" matches
- Results return relevant songs

**AF-02: Typo in Search**
- User types: "singaproe" (typo)
- System could implement fuzzy matching:
  - Levenshtein distance algorithm
  - Returns: "Did you mean: Singapore?"
  - Shows results for "Singapore" with suggestion
- Optional: Helps user correct typo

**AF-03: Search Across Languages**
- User searches: "新年" (Chinese for New Year)
- System performs Chinese character search
- Returns songs with "Chinese New Year" theme or similar keywords
- Enables multi-language search

**AF-04: User Searches Their Own Bookmarks (Registered)**
- Registered user has bookmarked songs
- User types in search bar
- System can optionally highlight or filter to "Search my bookmarks"
- User finds previously saved songs quickly

**AF-05: Empty Search Query**
- User focuses search bar then clicks elsewhere without typing
- No search performed (empty query)
- Library shows all published songs (default state)

**AF-06: Search Bar Loses Focus**
- User typing in search bar clicks elsewhere
- Search results remain displayed
- User can click back in search bar to continue searching
- Results don't disappear (persistent)

**AF-07: Very Long Search Term**
- User pastes large block of text into search
- System limits search query to reasonable length (e.g., 200 characters)
- Excess characters ignored
- Search performs on first 200 characters

**AF-08: Search Performance on Large Library**
- Library has 500+ published songs
- User types keyword
- System implements efficient indexing (database full-text search or Elasticsearch)
- Results return within 500ms even with large dataset
- No noticeable lag for user

**Success Outcome:**
- Search bar accepts user input smoothly
- Real-time results displayed as user types (debounced)
- Matching songs highlighted in results
- Search is case-insensitive and handles partial matches
- Combined search + filters work seamlessly
- No results shows helpful suggestions
- User can clear search and return to full library
- Search results accurate and relevant

**Error Conditions:**
- Search query malformed → Ignore special characters or show error
- Database search timeout → Show loading spinner, retry
- No results found → Display helpful message with suggestions
- Search service unavailable → Display error, suggest using filters instead

**Key Acceptance Criteria:**
- ✓ Search bar responsive and visible
- ✓ Results update in real-time as user types (with debounce)
- ✓ Matching songs displayed in grid
- ✓ Search term highlighted in results
- ✓ Case-insensitive and handles partial matches
- ✓ Combined with filters works correctly
- ✓ Search clears quickly and resets library view
- ✓ Performance smooth even with 500+ songs
- ✓ No results shows actionable suggestions
- ✓ Search history available for registered users (optional)

---

# MEMBER 2: SONG EXPERIENCE & CONTENT CONSUMPTION

## UC-P05: Watch AI-Generated Music Video with Synced Lyrics

**Use Case Name:** Song Experience - Watch AI-Generated Music Video with Embedded Lyrics

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Video Streaming Service
- Subtitle/Lyric Service
- Database (Song & Video Records)

**Preconditions:**
- User has selected a song from library (UC-P02)
- Song has published video available
- User has active session (guest or registered)
- Video file accessible and playable

**Triggers:**
- User clicks "Watch Video" on song card in library
- User clicks song title or thumbnail in library
- User navigates to /songs/{song_id} URL directly
- User returns from another feature (e.g., rhythm game) to watch video

**Goal:**
User can watch a complete, engaging AI-generated music video that matches the song's mood and lyrics, with synchronized subtitles providing lyric context and enhancing emotional impact.

**Main Flow:**

1. System detects user session (guest or registered) is valid
2. System retrieves song_id from URL or click context
3. System queries database for song and video records:
   - Song: song_id, title, artist_name, theme, language, description, lyrics, duration
   - Video: video_id, video_url, duration, resolution, subtitle_file_path, generation_date
4. System displays Song Experience page with layout:
   - **Header:**
     - "Back to Library" link (navigation)
     - Song title and artist name (centered)
   - **Video Player Section:**
     - Embedded HTML5 video player or streaming player
     - Video dimensions: responsive (fills container on mobile, 16:9 on desktop)
     - Controls: Play/Pause, Volume, Seek bar, Fullscreen, Quality selector (if available)
     - Progress bar showing current playback position
     - Time display: "2:30 / 3:45" (current / total)
     - Subtitle toggle button (CC icon) - enabled by default
   - **Video Content:**
     - Video plays with original song audio
     - Subtitles display synchronized with lyrics
       - Subtitle text color: white with semi-transparent black background
       - Font size: readable (14-18px base)
       - Position: bottom of video (15-20px margin)
       - Display timing: each lyric line appears and disappears at correct timestamp
     - Visual quality: consistent throughout video
     - No loading/buffering issues (or minimal)
   - **Metadata Section (Below Player):**
     - Theme badge: "🎆 National Day" or "🎊 Chinese New Year"
     - Language tag: "🇨🇳 Mandarin" or "🇬🇧 English"
     - Duration: "3:45"
     - Published date: "Published 2 weeks ago"
     - View count (if tracking): "1,245 views"
   - **Description Section:**
     - Song description (provided by creator)
     - Context about song's theme or inspiration
     - Expandable if long (max 200 chars shown, "Read more" link)
   - **Engagement Options (Below Content):**
     - Heart/Like button (if registered): "♡ Add to favorites" or "♥ Favorited"
     - Share button: "Share this song" (social media, link copy)
     - (Optional) Comments or reflection prompt: "How does this song make you feel?"

5. **Video Playback Experience:**
   - User clicks Play button
   - Video begins from 0:00
   - Audio and video synchronized (no lag)
   - Subtitles appear at correct timestamps:
     - Lyric line 1: "0:00 - 0:05: [First verse lyrics]"
     - Lyric line 2: "0:05 - 0:10: [Second verse lyrics]"
   - User can pause, resume, scrub to any position
   - Seeking maintains subtitle sync
   - If user scrubs to 1:30, video resumes at 1:30 with correct subtitle

6. **Subtitle Control:**
   - User clicks CC (subtitle toggle) button
   - If subtitles ON: Subtitles display, CC button highlighted
   - If subtitles OFF: No subtitles shown, CC button dimmed
   - User preference saved to session (guest) or profile (registered)
   - Next video defaults to user's preference

7. **Quality Selection (Optional):**
   - User clicks quality dropdown (if available)
   - Options: 720p, 480p, 360p (adaptive based on connection)
   - User selects preferred quality
   - Video re-streams at selected quality
   - Quality selection saved to session

8. **Full-Screen Viewing:**
   - User clicks fullscreen button
   - Video expands to fill screen
   - Player controls remain accessible
   - User clicks fullscreen button again to exit
   - Playback continues smoothly

9. **Video Completion:**
   - Video plays to end (3:45)
   - Player shows "Video ended" or loops back to 0:00
   - Below video, "Next Steps" section displayed:
     - "Learn Instruments in This Song" button (links to UC-P09)
     - "Test Your Knowledge" button (links to rhythm game UC-P13)
     - "Share Your Reflection" button (links to UC-P14)
     - "Explore Similar Songs" button (related themes or artists)

10. **Registered User Interactions:**
    - User clicks heart icon: System saves song to user's favorites
    - User clicks share: System generates shareable link
    - User can return later to "My Favorites" to rewatch

**Alternate Flows:**

**AF-01: Video Player Error or Codec Not Supported**
- Video fails to load or browser doesn't support video codec
- System displays error message in player:
  - "Unable to play video. Please try refreshing or using a different browser"
  - "Refresh" button provided
- User can refresh page to retry
- Fallback: Offer to download video file instead (if enabled)

**AF-02: Subtitles Fail to Load**
- Subtitle file missing or corrupted
- System displays video without subtitles
- CC button shows as disabled with tooltip: "Subtitles not available"
- Video still fully playable, just without lyrics displayed
- No error shown to user (graceful degradation)

**AF-03: Video Buffering (Slow Connection)**
- User on slow internet connection
- Video buffering during playback
- System shows loading spinner and buffering indicator
- Video quality auto-reduced to maintain playback (adaptive bitrate)
- User sees notification: "Adjusting video quality for your connection"

**AF-04: User Navigates Away During Playback**
- User clicks back button while video playing
- System confirms: "Stop watching this video?"
- User can confirm to leave or cancel to keep watching
- Playback position not saved for guests (resets)
- Playback position saved for registered users (resume later)

**AF-05: Subtitle Timing Misaligned**
- Subtitles appear slightly ahead or behind sung lyrics
- User clicks "CC" to toggle subtitles off
- User watches video without lyrics
- Optional: User can report issue via feedback button

**AF-06: Mobile Video Viewing**
- User watching video on mobile phone (small screen)
- Video player scales to fit screen width
- Subtitles remain readable at smaller size
- Player controls touch-friendly (larger hit areas)
- Fullscreen viewing optimized for mobile landscape

**AF-07: Autoplay on Song Completion (Optional)**
- Video completes and next related song auto-plays (if enabled)
- User sees countdown: "Playing next song in 5 seconds..."
- User can click "Skip" or video title to cancel autoplay
- Or system shows suggestions for next song instead

**AF-08: Audio Issues or Speaker Muted**
- User clicks play but no audio heard
- Could be: Browser muted, system sound off, speaker issue
- System checks audio status
- Displays helpful message: "Check that your device volume is on"
- Volume control slider visible in player for user to adjust

**Success Outcome:**
- Video player loads and plays smoothly
- Audio and video perfectly synchronized
- Subtitles display at correct timestamps
- User controls (play, pause, seek, volume) work reliably
- Fullscreen viewing works smoothly
- Subtitles readable and well-positioned
- User can engage with next steps upon completion
- Registered users can favorite video
- Experience works across desktop, tablet, mobile

**Error Conditions:**
- Video codec not supported → Display error, suggest browser change
- Subtitles fail to load → Play video without subtitles (graceful)
- Buffering on slow connection → Auto-reduce quality, show indicator
- Player controls unresponsive → Refresh or reload page
- Audio sync off → Display notification, allow subtitle toggle

**Key Acceptance Criteria:**
- ✓ Video player loads within 3 seconds
- ✓ Audio and video synchronized (<100ms deviation)
- ✓ Subtitles display at correct timestamps
- ✓ Play/pause/seek controls responsive
- ✓ Fullscreen works smoothly
- ✓ Quality adapts to connection speed
- ✓ Subtitles readable (font size, color, contrast)
- ✓ Video plays to completion without errors
- ✓ Mobile responsiveness smooth
- ✓ Next steps suggestions appear after completion

---

## UC-P06: Read AI-Generated Song Summary and Learn Context

**Use Case Name:** Song Context - Read AI-Generated Summary and Cultural Information

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Database (Song Records)
- AI Summary Service (if summaries generated dynamically)

**Preconditions:**
- User is on Song Experience page (UC-P05)
- Song has AI-generated summary or cultural context available
- User is interested in understanding song's background or meaning

**Triggers:**
- User scrolls down from video player to summary section
- User clicks "Learn More" or "Read Summary" link
- User clicks "Context" or "About This Song" tab
- Summary auto-displays below video player

**Goal:**
User can understand the cultural context, historical background, and emotional significance of the song without needing external resources, deepening engagement and learning for community members and educators.

**Main Flow:**

1. User on Song Experience page (UC-P05) scrolls down below video player
2. System displays Summary and Context Section with:
   - **Section Title:** "About This Song" or "Song Context"
   - **AI-Generated Summary:**
     - 2-3 paragraph overview written in accessible language
     - Describes:
       - Song's theme and main message
       - Cultural or historical context (e.g., "This song celebrates Singapore's independence...")
       - Emotional tone and audience connection
       - How song relates to event (National Day, CNY, etc.)
     - Example summary for National Day song:
       - "This heartfelt tribute celebrates Singapore's journey to nationhood, reflecting on the resilience and unity that have defined our nation. The lyrics evoke memories of early Singapore while inspiring hope for future generations..."
   - **Key Themes (Bullet Points):**
     - "Heritage and Continuity"
     - "Unity and Community"
     - "Gratitude and Reflection"
   - **Cultural Context (Optional):**
     - "Did You Know?" callout box with cultural fact
     - Example: "Singapore's National Day is celebrated on August 9th, commemorating Singapore's separation from Malaysia in 1965..."
   - **Lyric Translation (If Non-English):**
     - If song in Mandarin, Malay, Tamil, etc.
     - Section shows translated lyrics alongside original
     - Enables non-speakers to understand meaning
     - English translation in italic gray text
   - **Artist/Creator Note (Optional):**
     - Brief note from creator about song's inspiration
     - Personal anecdote or creative process insight

3. **Summary Readability:**
   - Text formatted for easy reading:
     - Single column layout on mobile/tablet
     - Max line length ~60-80 characters (readable)
     - Font: sans-serif, 16px base size
     - Line height: 1.6 (comfortable reading)
     - Color: dark text on light background (good contrast)
   - Expandable sections if summary long:
     - "Read Full Summary" link expands longer text
     - Collapses back with "Show Less"

4. **Educational Use Case - Teacher/Educator:**
   - Teacher at school uses platform to teach about song
   - Teacher can:
     - Display summary to class
     - Print summary for distribution
     - Use as discussion starter: "What themes do you notice?"
   - Summary aligns with cultural/heritage curriculum

5. **Elderly Engagement Use Case:**
   - Elderly user watching nostalgic song
   - Summary helps contextualize song's cultural significance
   - Large font option available (accessibility)
   - Simple language avoids jargon

6. **Translation and Accessibility:**
   - User viewing song in Mandarin
   - System displays:
     - Original Chinese lyrics/title
     - English translation below
     - Cultural notes explaining symbolism or idioms that don't translate directly
   - User can toggle between original and translation

7. **Share Summary (Optional):**
   - User clicks "Share Summary" button
   - System generates shareable text
   - User can copy/paste into email, messaging, or social media
   - Helps user share cultural knowledge with others

**Alternate Flows:**

**AF-01: Summary Not Available**
- Song uploaded without AI summary or creator summary
- System displays placeholder: "Summary coming soon"
- Shows basic metadata instead (title, artist, theme)
- User can still engage with other features (video, games)

**AF-02: Lyric Translation Unavailable**
- Non-English song doesn't have translation
- System displays original lyrics only
- Suggests: "Would you like to contribute a translation?" (user-generated content option)
- Or: Shows phonetic guide for pronunciation

**AF-03: User Wants More Context**
- User reads summary but wants deeper learning
- "Learn More" or "Explore Related Content" link displayed
- Links to:
   - Educational resources or documentaries (external)
   - Similar songs with related themes
   - Related reflections or community stories (UC-P14)

**AF-04: Accessibility - Font Size Adjustment**
- User clicks accessibility menu (A+ icon)
- Options to increase font size
- Summary text enlarges for better readability
- Preference saved to session or user profile (registered)

**AF-05: Mobile View - Summary Readability**
- Summary on mobile phone
- Text reformatted to single column
- Font size maintained or increased
- Smooth scrolling through summary content

**AF-06: Cultural Sensitivity Review**
- Summary contains potentially sensitive historical context
- System includes disclaimer: "This summary contains references to historical events"
- Tone remains respectful and educational
- Multiple perspectives acknowledged if relevant

**Success Outcome:**
- Summary displays clearly below video
- Text is accessible and well-formatted
- Cultural context provided in understandable language
- Lyric translation available (if non-English song)
- Educational value supports learning objectives
- User gains deeper understanding of song's significance
- Summary shareable for educational use
- Accessibility features support diverse users

**Error Conditions:**
- Summary generation failed → Show placeholder, offer to revisit
- Lyric translation unavailable → Show original with note
- Font size adjustment fails → Use browser default zoom
- Summary too long → Implement expandable sections

**Key Acceptance Criteria:**
- ✓ Summary displays clearly and is readable
- ✓ Content accurate and culturally appropriate
- ✓ Translation provided for non-English songs
- ✓ Educational context supports learning
- ✓ Accessible font and contrast
- ✓ Mobile-responsive formatting
- ✓ Summary shareable and copyable
- ✓ Accessibility features functional (font size, contrast)

---

## UC-P07: View Instruments Used in Song

**Use Case Name:** Song Instrumentation - View and Learn About Instruments Used

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Database (Song-Instrument Mapping)
- Media Service (instrument images/recordings)

**Preconditions:**
- User is on Song Experience page (UC-P05)
- Song has instruments documented
- Instrument images and audio samples available

**Triggers:**
- User scrolls to Instruments section on Song Experience page
- User clicks "Instruments" tab or link
- User clicks "Learn Instruments" button after video ends
- System auto-navigates from video to instruments section

**Goal:**
User can discover and learn about traditional and modern instruments featured in the song, supporting music education and cultural learning, especially for younger users and classroom settings.

**Main Flow:**

1. User on Song Experience page (UC-P05) scrolls down to Instruments section
2. System displays Instruments Section with:
   - **Section Title:** "Instruments in This Song"
   - **Instrument Cards Grid:**
     - Each instrument shown in separate card (3 columns on desktop, 2 on tablet, 1 on mobile)
     - Card displays:
       - **Instrument Image:** Photo or illustration of instrument
       - **Instrument Name:** Bold heading (e.g., "Guzheng" or "Piano")
       - **Brief Description:** 1-2 sentences about instrument
         - Example: "Traditional Chinese plucked string instrument. Known for its warm, resonant sound."
       - **Origin/Culture:** Cultural background (e.g., "Traditional Chinese" or "Western Classical")
       - **Listen Button:** "🔊 Hear This Instrument" - user can click to hear sample
       - **Learn More Link:** "Explore [Instrument]" - leads to more details (UC-P09 Instrument Playground)

3. **User Clicks "Hear This Instrument":**
   - Button click triggers audio playback
   - System plays 3-5 second sample of instrument sound
   - User can identify instrument's unique tone
   - Audio player appears inline: Play/Pause, Volume control
   - Multiple clicks replay sample

4. **Instrument Lineup and Roles:**
   - System shows which instruments play which parts:
     - "Lead Vocals: Chinese Vocals"
     - "Main Melody: Guzheng"
     - "Rhythm: Erhu"
     - "Background: Piano"
     - "Percussion: Chinese Drums"
   - Visual timeline showing when each instrument enters song
   - User understands composition structure

5. **Interactive Instrument Discovery (Optional):**
   - User clicks on instrument card
   - Expanded view shows:
     - Larger image of instrument
     - Extended description
     - Historical context
     - Example of how it sounds (audio sample)
     - "Play With This Instrument" button (links to UC-P09 Playground)
   - User can collapse and explore other instruments

6. **Educational Context:**
   - Below instruments, short educational callout:
     - "Did You Know?" fact about instruments
     - Example: "The Guzheng has been played in China for over 2,500 years. Its name means 'instrument of conflict' but it's actually known for its peaceful, meditative sound."

7. **Classroom/Educational Use:**
   - Teacher using this feature for music education
   - Teacher can:
     - Show each instrument to class
     - Play audio samples for students to identify
     - Use as springboard for "Learn Instruments" activity
   - Supports Music curriculum objectives

8. **Connect to Instrument Playground:**
   - User interested in specific instrument
   - Clicks "Play [Instrument]" or "Learn to Play"
   - System navigates to Instrument Playground (UC-P09)
   - User can freely experiment with that instrument

**Alternate Flows:**

**AF-01: No Instruments Listed**
- Song has no documented instruments (rare)
- System displays: "Instrument information not available for this song"
- User can still engage with other features
- Optional: "Add Instrument Info" for user contributions

**AF-02: Audio Sample Fails to Load**
- Instrument audio sample doesn't load
- Button click shows loading spinner
- After 5 seconds, displays error: "Sample unavailable"
- User can still view instrument info without audio

**AF-03: Mobile Audio Autoplay Blocked**
- Mobile browser has autoplay restrictions
- System detects and displays: "Tap to play instrument sound"
- User explicitly clicks to play (required by mobile browser)
- User can control playback

**AF-04: Multiple Instruments, Long List**
- Song uses 10+ instruments
- Instrument cards paginated or scrollable
- "Load More Instruments" button if not all visible
- Or: Carousel/swiper interface for mobile

**AF-05: Instrument Comparison**
- User clicks "Compare Instruments" (optional feature)
- Shows two instruments side-by-side
- Can hear both simultaneously or separately
- Helps user understand instrument differences

**AF-06: Accessibility - Text-Only Instrument Info**
- User with visual impairment uses screen reader
- Instrument image has alt text
- Audio sample playable without image needed
- Description text comprehensive and detailed

**Success Outcome:**
- Instruments section displays prominently on Song Experience page
- Each instrument shown with image, name, description
- Audio samples play correctly and are helpful
- User understands which instruments play in song
- Educational context provided
- User can navigate to Instrument Playground to experiment
- Works smoothly on desktop, tablet, mobile
- Supports music education objectives

**Error Conditions:**
- Instruments not documented → Display placeholder
- Audio sample fails → Show error, allow retry
- Autoplay blocked (mobile) → Require user click
- Image fails to load → Show alt text and description

**Key Acceptance Criteria:**
- ✓ Instruments section loads and displays smoothly
- ✓ Each instrument has image, name, description
- ✓ Audio samples play with good sound quality
- ✓ Mobile responsive layout works well
- ✓ Educational content accurate and helpful
- ✓ Navigation to Instrument Playground functional
- ✓ Accessibility features support diverse users
- ✓ "Learn More" links functional and helpful

---

## UC-P08: Participate in Song Trivia Quiz or Survey

**Use Case Name:** Song Trivia - Test Knowledge and Engage with Interactive Quizzes

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Database (Quiz Questions & User Responses)
- Quiz Engine

**Preconditions:**
- User is on Song Experience page (UC-P05)
- Song has trivia quiz or survey associated
- Quiz content appropriate for all audiences

**Triggers:**
- User scrolls to Trivia section below Instruments (UC-P07)
- User clicks "Test Your Knowledge" button
- User clicks "Try the Quiz" call-to-action
- System suggests quiz after video completion

**Goal:**
User can engage with interactive quizzes to test knowledge about song's cultural context, lyrics, and themes, providing learning reinforcement and entertainment while tracking engagement metrics.

**Main Flow:**

1. User on Song Experience page scrolls to Trivia/Quiz section
2. System displays Quiz Invitation with:
   - **Section Title:** "Test Your Knowledge" or "Song Trivia"
   - **Brief Description:** "How well do you know this song and its cultural context?"
   - **Start Button:** "Take Quiz" or "Play Trivia"
   - **Quiz Preview (Optional):** First question teaser
3. User clicks "Take Quiz" button
4. System displays Quiz Interface:
   - **Question Display:**
     - Question text clearly readable (large font)
     - Progress indicator: "Question 1 of 5"
     - Progress bar showing quiz completion %
   - **Question Content Examples:**
     - Multiple choice: "In what year did this cultural event occur?" (4 options)
     - True/False: "This song uses traditional instruments only" (True/False)
     - Fill-in-the-blank: "The artist's name is ___" (text input)
     - Matching: Connect song lyrics to their English translation
   - **Answer Options:**
     - Clearly labeled and spaced
     - Easy to tap on mobile (large hit areas)
     - Radio buttons (single select) or checkboxes (multi-select) as appropriate
   - **Help Features:**
     - "Hint" button (optional) - provides subtle clue without revealing answer
     - "Skip" button (optional) - advance to next question
     - No "Back" button to prevent cheating

5. **User Selects Answer:**
   - User clicks/taps answer option
   - Selection highlights visually
   - User clicks "Next" button to proceed
6. **Immediate Feedback:**
   - System displays: ✓ "Correct!" or ✗ "Not quite..."
   - Shows correct answer if user answered incorrectly
   - Brief explanation or fun fact:
     - "Correct! The Guzheng produces sound by plucking its 21 strings. This song features it prominently!"
     - "The answer is B. Traditional Chinese instruments often use pentatonic scales, different from Western music!"
   - Feedback displayed for 2 seconds, then automatically advances
   - User can click "Next" to speed up

7. **Quiz Progression:**
   - After each question, progress bar updates
   - User progresses through 5-10 questions
   - Quiz covers topics:
     - Song lyrics and meaning
     - Cultural context and history
     - Instruments featured
     - Themes and emotions

8. **Quiz Completion:**
   - User completes all questions
   - System displays **Quiz Results Screen:**
     - **Score:** "You scored 4 out of 5! Great job!"
     - **Score Percentage:** "80% Correct"
     - **Performance Badge (Optional):**
       - "🌟 Expert" (90-100%)
       - "⭐ Proficient" (70-89%)
       - "✓ Learner" (50-69%)
       - "→ Keep Trying" (<50%)
     - **Summary:**
       - Questions you got right
       - Questions you missed (with explanations)
     - **Next Steps Buttons:**
       - "Retake Quiz" - user can try again
       - "Share Your Score" - share results (if registered)
       - "Learn More" - link to educational resources or Instrument Playground
       - "Back to Song" - return to Song Experience page

9. **Registered User Features:**
   - Quiz score saved to user profile
   - Score appears in user's activity history
   - Badge earned and displayed on profile
   - User can compare scores over time (progression tracking)
   - System tracks: "You've completed 8 quizzes this month!"

10. **Guest User Features:**
    - Quiz score shown immediately after completion
    - Score NOT saved (no persistent storage for guests)
    - User can retake quiz but score resets
    - No profile history or badges for guests

**Alternate Flows:**

**AF-01: User Skips Questions**
- User clicks "Skip" button on difficult question
- Question skipped, counter shows: "Question 2 of 5 (skipped 1)"
- At quiz end, skipped questions don't count toward score
- Final score: "4 out of 4 answered correctly (1 skipped)"

**AF-02: User Requests Hint**
- User clicks "Hint" button on multiple-choice question
- System displays subtle hint: "Think about traditional vs. modern instruments..."
- Hint doesn't reveal answer
- User can still select any answer
- Hint used or not doesn't affect scoring

**AF-03: Quiz Takes Too Long**
- User stuck on question for extended time (>30 seconds)
- System suggests: "Not sure? You can skip this question"
- Or: Optional auto-advance after 60 seconds (varies by quiz)

**AF-04: User Abandons Quiz Mid-Way**
- User clicks back button or navigates away during quiz
- System confirms: "Exit quiz? Your progress will be lost"
- User can confirm to exit or continue quiz
- Quitting clears progress (must restart from beginning)

**AF-05: Mobile Quiz Layout**
- Quiz viewed on mobile phone (small screen)
- Question and options stack vertically
- Large tap targets for answer options
- Progress indicator visible at top
- Smooth scrolling through questions

**AF-06: Quiz Difficulty Levels (Optional)**
- System offers difficulty selection at start:
  - "Easy" - basic questions, more familiar knowledge
  - "Medium" - balanced difficulty
  - "Hard" - challenging, requires deeper knowledge
- User selects difficulty, quiz adjusts questions accordingly
- Different badges/scores for different difficulties

**AF-07: Survey Instead of Quiz**
- Song has survey instead of traditional trivia
- Questions: "How did this song make you feel?" (emotions)
- Rating scales: "Rate this song's emotional impact (1-5)"
- Open-ended (optional): "Share your thoughts" (text input)
- Results displayed as community sentiment (e.g., "87% found this song moving")

**AF-08: Leaderboard (Optional, Registered Users)**
- Registered users can view leaderboard of top quiz scores
- Shows: User name, score, date completed
- User can see how they rank among community
- Encourages friendly competition

**Success Outcome:**
- Quiz loads and displays smoothly
- Questions clear and answerable
- Immediate feedback provided after each question
- Quiz completion shows score and results
- Registered users' scores saved to profile
- Quiz supports learning objectives
- Works smoothly on all devices
- Optional hints and skip options available
- Engaging and non-punitive experience

**Error Conditions:**
- Quiz questions fail to load → Display error, offer retry
- Answer submission fails → Show error, let user resubmit
- Quiz timeout → End quiz and show partial results
- Leaderboard unavailable → Show score without leaderboard comparison

**Key Acceptance Criteria:**
- ✓ Quiz interface clear and usable
- ✓ Questions load quickly
- ✓ Answer options clearly presented
- ✓ Immediate feedback provided
- ✓ Score calculated accurately
- ✓ Results screen displays all relevant info
- ✓ Mobile responsive layout
- ✓ Registered users' scores persist
- ✓ Guest users can participate (no save)
- ✓ Quiz supports learning objectives

---

# MEMBER 3: INTERACTIVE LEARNING (INSTRUMENTS & TRIVIA)

## UC-P09: Access and Play Instrument Playground

**Use Case Name:** Instrument Playground - Freely Experiment with Instruments Using Keyboard

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Audio Synthesis Service
- Instrument Sample Library
- Database (User Instrument Sessions - optional for registered users)

**Preconditions:**
- User has accessed Song Experience page (UC-P05) or navigated directly to Playground
- User has clicked "Learn Instruments" or "Play Instruments"
- Playground page loaded successfully
- Audio context enabled in browser

**Triggers:**
- User clicks "Learn Instruments in This Song" button after video ends (UC-P05)
- User clicks "Instrument Playground" from navigation menu
- User clicks "Play [Instrument Name]" from Instruments section (UC-P07)
- System navigates from Rhythm Game (UC-P13) to Instrument Playground

**Goal:**
User can freely experiment with and "play" the instruments featured in songs using keyboard keys, gaining familiarity with instrument sounds, supporting music education and cultural learning through interactive play.

**Main Flow:**

1. User navigates to Instrument Playground page
2. System displays Playground Interface:
   - **Page Title:** "Instrument Playground" or "[Song Name] Instruments"
   - **Instrument Selector:**
     - Dropdown or button grid showing available instruments
     - Options: "Guzheng", "Erhu", "Piano", "Chinese Drums", etc.
     - Currently selected instrument highlighted
   - **Keyboard Map Display:**
     - Visual display showing keyboard key-to-note mapping
     - Example layout for Guzheng:
       ```
       Q   W   E   R   T   Y   U   I   O   P
       C   D   E   F   G   A   B   C   D   E
       ```
     - Each key labeled with corresponding musical note
     - Keys color-coded (optional, for visual learning)
     - Range: Typically 1-2 octaves (12-18 keys)
   - **Instructions:**
     - "Press any key to play a note"
     - "Use keys Q through P to play notes C through E"
     - "Try playing melodies or just experimenting!"
   - **Volume Control:**
     - Slider to adjust instrument volume
     - Mute/Unmute button
   - **Audio Playback Indicator:**
     - Visual feedback when note plays (key highlights or note duration bar)
     - Current note name displayed (e.g., "Playing: C")

3. **User Plays Instrument:**
   - User presses key "Q" on keyboard
   - System triggers audio sample or synthesized note for that instrument
   - Sound plays for duration of key press
   - Visual feedback: Key highlights on keyboard map
   - User hears authentic instrument sound
   - Note: C played in instrument's tone (Guzheng sound, not generic beep)

4. **User Plays Multiple Notes:**
   - User presses "Q" (C), then "W" (D), then "E" (E)
   - System plays each note sequentially
   - User hears C-D-E melody in instrument's voice
   - User can experiment with melodies

5. **Key Release Behavior:**
   - User holds "Q" key down for 2 seconds
   - Sound continues while key pressed
   - User releases key
   - Sound stops
   - Natural piano-like behavior (pitch stops when key released)

6. **Multiple Simultaneous Notes (Optional):**
   - User presses "Q" and "W" together
   - System plays C and D simultaneously
   - Allows chord exploration
   - Depends on instrument type (pianos allow, flutes may not)

7. **Instrument Selection:**
   - User clicks dropdown or button to select different instrument
   - Dropdown shows: "Guzheng", "Erhu", "Piano", "Chinese Drums", etc.
   - User selects "Piano"
   - Keyboard map updates (if different range)
   - Instrument sound changes immediately
   - User presses keys and hears piano tones instead

8. **Musical Learning Features (Optional):**
   - Below keyboard map, system displays:
     - **Current Instrument Info:** "Guzheng - Traditional Chinese Plucked String Instrument"
     - **Note Names:** Corresponding musical notes (C, D, E, F, G, A, B, C)
     - **Try This:** Suggested melody to play
       - "Try playing 'Mary Had a Little Lamb': E D C D E E E"
       - User follows instructions and plays familiar melody on unfamiliar instrument

9. **Recording and Playback (Optional Advanced Feature):**
   - "Record" button allows user to record 10-second melody
   - User presses record, plays melody, presses stop
   - System saves recording temporarily (session only for guests)
   - "Playback" button replays recorded melody
   - User can compare their attempt to original song snippet (if available)

10. **Free Exploration Encouraged:**
    - No scoring, no right/wrong answers
    - User free to explore and experiment
    - Fun, low-pressure learning environment
    - Guest users especially benefit (no performance anxiety)

**Alternate Flows:**

**AF-01: Audio Context Blocked (Browser Security)**
- Browser requires user gesture to enable audio
- System displays: "Click here to enable sound"
- User clicks button
- Audio context activated
- Keyboard now produces sound

**AF-02: No Audio Output**
- User presses key but no sound heard
- Could be: System muted, volume at 0, speaker issue, browser problem
- System displays troubleshooting message:
  - "Check that your device volume is on"
  - "Mute button (🔇) is active. Click to unmute"
  - "Try a different browser"

**AF-03: Keyboard Key Already Used by Browser**
- User presses key that browser uses (e.g., F5 refresh)
- System catches event and prevents default browser action
- Only note plays, browser action doesn't occur
- Or: System maps to different keys that don't conflict

**AF-04: User Selects Instrument with No Sound**
- User selects drum instrument that can't sustain notes
- System adapts keyboard behavior
- Keys trigger short drum hits (percussive, not sustained)
- User experience adjusts to instrument type

**AF-05: Multiple Instruments in Song**
- Song uses Guzheng, Piano, and Drums
- User can select which instrument to play
- Dropdown shows all three options
- User can switch between them, learning each separately

**AF-06: Mobile Device (Touch, No Physical Keyboard)**
- User accessing Playground on mobile phone
- Physical keyboard unavailable
- System provides alternative: **On-screen Keyboard**
  - Virtual keys displayed on screen
  - User taps keys to trigger notes
  - Keys arranged in piano-keyboard layout
  - Responsive to touch (larger hit areas)
  - Keyboard scrollable if many keys

**AF-07: Accessibility - Keyboard Navigation**
- User with mouse limitation uses keyboard only
- Tab key navigates through instruments and controls
- Enter key plays selected instrument
- Arrow keys adjust volume
- Screen reader announces notes and instructions

**AF-08: Save Playground Session (Registered Users)**
- Registered user clicks "Save This Session"
- System saves current instrument selection and any recorded melody
- Appears in user's activity: "Guzheng Exploration - 5 min session"
- User can return later and continue (optional feature)

**AF-09: Share Playground Recording (Registered Users)**
- Registered user recorded a melody and wants to share
- "Share Recording" button generates shareable link
- Friend can listen to recorded melody
- Appears in reflection/activity stream (optional)

**Success Outcome:**
- Playground loads with selected instrument
- Keyboard map clearly displays
- Pressing keys triggers instrument sounds
- Sounds are authentic and representative of instrument
- User can switch instruments smoothly
- Free exploration encouraged and supported
- Works on desktop, tablet, mobile
- Low-pressure, educational environment
- Optional recording/sharing features available

**Error Conditions:**
- Audio context blocked → Show "enable sound" button
- No audio output → Display troubleshooting message
- Keyboard conflicts → Map to alternate keys
- Instrument sound missing → Display error, suggest retry

**Key Acceptance Criteria:**
- ✓ Playground loads quickly
- ✓ Keyboard keys map to notes as displayed
- ✓ Instrument sounds authentic and clear
- ✓ Multiple instruments available and switchable
- ✓ Volume control functional
- ✓ Mobile touch keyboard works smoothly
- ✓ No frustration or confusion in interface
- ✓ Optional recording/playback works
- ✓ Accessibility features support diverse users
- ✓ Session persists for registered users (optional)

---

## UC-P10: Participate in Guided Music Lesson (Future Optional Feature)

**Use Case Name:** Music Lessons - Follow Step-by-Step Guided Lessons to Learn Song or Instrument

**Primary Actor:** Registered User (primarily)

**Secondary Actors:**
- Lesson Database
- Audio Synthesis Service
- Database (User Progress Tracking)

**Preconditions:**
- User is registered and logged in
- Lessons available for specific songs or instruments
- User has navigated to Lesson page from Song or Playground
- User has time and inclination for structured learning

**Triggers:**
- User clicks "Take Lesson" from Song Experience page
- User clicks "Start Lesson" from Instrument Playground (UC-P09)
- User navigates to /lessons/{song_id} or /lessons/{instrument_id}
- System suggests lesson based on user's prior activities

**Goal:**
User can follow structured, step-by-step lessons to learn how to play songs on instruments or understand music theory, providing personalized learning paths that support music education objectives for schools and learners.

**Main Flow:**

1. User navigates to Music Lesson page
2. System displays Lesson Interface:
   - **Lesson Title:** "Learn to Play 'Heartland' on Guzheng" or "Guzheng Fundamentals"
   - **Lesson Overview:**
     - Duration: "5 minutes"
     - Difficulty: "Beginner"
     - Prerequisites: "None" (or "Familiarity with Guzheng recommended")
     - Learning Outcomes: "Learn to play opening melody of Heartland"
   - **Lesson Progress:**
     - Progress bar: "Step 1 of 5"
     - Completion percentage: "20%"
     - "Back" and "Next" buttons

3. **Lesson Structure:**
   - Each lesson organized into 3-8 steps
   - Each step includes:
     - **Instruction Text:** Clear, concise directions (e.g., "Place your fingers on keys Q, W, E")
     - **Visual Diagram:** Hand position or keyboard layout
     - **Audio Demo:** "Listen to how it sounds" (play example)
     - **Practice Section:** Interactive Instrument Playground (UC-P09) embedded
     - **Self-Check:** "Try it! Then press 'Check My Work'" button

4. **Step-by-Step Progression:**
   - **Step 1:** Learn correct hand position or starting note
   - **Step 2:** Learn first few notes of melody
   - **Step 3:** Play first phrase of song
   - **Step 4:** Connect to second phrase
   - **Step 5:** Play complete short melody
   - User progresses sequentially

5. **Interactive Practice Within Lesson:**
   - User reads instruction for Step 2: "Play notes C-D-E"
   - User practices on embedded keyboard
   - User presses "Check My Work" button
   - System listens for user's input
   - System compares user's played notes to expected notes:
     - ✓ "Correct! You played C-D-E. Well done!"
     - ✗ "Not quite. You played C-E-E. Listen to the demo again and try once more"
   - User can retry unlimited times (supportive, not punitive)

6. **Demo and Guidance:**
   - User uncertain about correct notes
   - User clicks "Play Demo" button
   - System plays the target notes on the instrument
   - User listens, then attempts to replicate
   - Comparison helps user learn by ear

7. **Progress Tracking (Registered Users):**
   - System tracks user's progression through lesson
   - Completed steps marked with checkmark: ✓
   - Current step highlighted
   - User can jump back to previous steps for review
   - Lesson progress saved to user profile

8. **Lesson Completion:**
   - User completes final step
   - System displays completion screen:
     - "🎉 Congratulations! You've learned to play [Song/Phrase]!"
     - "You completed this lesson in 7 minutes"
     - Badge earned (optional): "🎼 Melody Master"
     - "Your Progress: You've learned 5 melodies this month!"
     - Buttons: "Retake Lesson", "Next Lesson", "Back to Song"

9. **Next Steps:**
   - "Recommended Next Lesson" - suggests follow-up lesson
   - "Practice Challenge" - rhythm game using learned melody (UC-P13)
   - "Share Achievement" - share learning milestone with friends (if enabled)

**Alternate Flows:**

**AF-01: User Gets Stuck on a Step**
- User attempts step 5+ times without success
- System detects struggle
- System offers help:
  - "Hint: Pay attention to the timing between notes"
  - "Slow Demo" - plays demo at half speed
  - "Skip This Step" - advance to next (optional, for learning flexibility)
- User can return to difficult step later

**AF-02: User Takes Break During Lesson**
- User completes 3 of 5 steps, then closes window
- System saves progress to user profile
- User returns next day
- System displays: "Resume lesson? You were on step 3 of 5"
- User clicks resume and picks up where they left off

**AF-03: Guest User Attempts Lesson**
- Guests cannot access structured lessons (requires registration for progress tracking)
- System displays: "Log in or create account to save your lesson progress and earn badges"
- Guest offered option to: Log In, Create Account, or Continue to Playground instead

**AF-04: Lesson Audio Issues**
- Demo audio fails to play
- System displays error: "Demo audio unavailable. Read the instruction instead"
- Text description and keyboard diagram remain available
- User can still proceed with practice

**AF-05: User Wants Faster Pace**
- Lesson pacing too slow for advanced user
- System offers difficulty adjustment:
  - "Switch to Intermediate version" - skips basic steps
  - "Switch to Advanced version" - starts at harder melodies
- User can choose pace preference

**AF-06: Mobile Lesson Experience**
- Lesson viewed on mobile phone
- Text and diagrams scale appropriately
- Embedded keyboard (UC-P09) responsive to touch
- Buttons and controls touch-friendly
- Horizontal scroll if needed for wide keyboard

**AF-07: Accessibility - Large Fonts and Captions**
- User with low vision selects "Accessibility Mode"
- Font sizes increase
- Demo audio has on-screen captions showing notes played
- High contrast colors (dark text, light background)
- Screen reader compatible

**Success Outcome:**
- Lesson loads and displays clearly
- Instructions are clear and easy to follow
- Demo audio plays correctly
- Practice section responsive and functional
- User progress tracked and saved
- Completion rewards provided
- Can resume lesson if interrupted
- Works smoothly on all devices
- Supports diverse learning speeds and needs

**Error Conditions:**
- Lesson content fails to load → Display error, offer retry
- Audio demo unavailable → Show text description as fallback
- User progress save fails → Display error, try again
- Mobile rendering issues → Graceful degradation

**Key Acceptance Criteria:**
- ✓ Lesson interface clear and intuitive
- ✓ Instructions easy to understand
- ✓ Demo audio plays correctly
- ✓ Practice section responsive
- ✓ User progress saved automatically
- ✓ Completion acknowledged and rewarded
- ✓ Mobile responsive layout
- ✓ Accessibility features functional
- ✓ Can resume mid-lesson
- ✓ Supports diverse learning needs

---

## UC-P11: View Music Theory Information (Optional Educational Feature)

**Use Case Name:** Music Theory Hub - Learn Music Theory Concepts Related to Song or Instrument

**Primary Actor:** Guest User, Registered User, or Educator

**Secondary Actors:**
- Music Theory Database
- Educational Content Service

**Preconditions:**
- User interested in learning music theory
- Theory content available for song's musical style or instrument
- User navigated to theory page or clicked "Learn Theory" link

**Triggers:**
- User clicks "Music Theory" link from Instrument Playground (UC-P09)
- User clicks "Learn the Music Behind This Song" from Song Experience (UC-P05)
- System suggests theory content based on song's genre or instruments
- Educator navigates to Music Theory Hub for classroom use

**Goal:**
User can learn music theory concepts (scales, chords, harmony, rhythm) related to the song or instruments featured, supporting music education curriculum and deepening appreciation for musical composition.

**Main Flow:**

1. User navigates to Music Theory Hub page
2. System displays Theory Content organized by topic:
   - **Topics Menu (Left Sidebar or Dropdown):**
     - Pentatonic Scales
     - Major and Minor Scales
     - Chord Structures
     - Harmony and Counterpoint
     - Rhythm and Meter
     - Traditional vs. Modern Composition
     - (Contextual to song/instrument)

3. **User Selects Topic: "Pentatonic Scales"**
   - System displays content section with:
     - **Definition:** "A pentatonic scale consists of five notes (hence 'penta' = five). Many Asian traditional instruments use pentatonic scales..."
     - **Visual Example:** Staff notation showing the 5 notes of a pentatonic scale
     - **Audio Example:** Plays pentatonic scale on instrument (Guzheng, for instance)
     - **Comparison:** "Western major scale has 7 notes, but pentatonic omits some for a different emotional quality"
     - **Interactive Demonstration:**
       - Keyboard showing only pentatonic notes highlighted
       - User can play only the 5 available notes
       - Encourages exploration of pentatonic sound
     - **Cultural Context:** "Pentatonic scales are fundamental to Chinese, Indian, and African music traditions..."

4. **Content Presentation:**
   - Clear, accessible language (not overly technical)
   - Mix of text, images, audio, and interactive elements
   - Modular design (can understand each concept independently)
   - Links between related concepts (e.g., "Learn more about Major Scales")

5. **Interactive Learning Elements:**
   - **Embedded Instrument Demo:** User can "hear" concept explained
   - **Keyboard Experiments:** User can interact with highlighted keys for pentatonic scale
   - **Visual Diagrams:** Staff notation, frequency charts, chord visualizations
   - **Quiz Questions (Optional):** "Which cultures traditionally use pentatonic scales?" (multiple choice)

6. **Educator/Classroom Use:**
   - Educator can:
     - Display theory content to class
     - Use as teaching aid
     - Assign theory lessons as homework
     - Print content for handouts
   - Content supports music curriculum standards

7. **Personalized Learning Path (Registered Users):**
   - Recommended topics based on songs user explored
   - "Based on your interest in [Song Name], here's recommended theory: Harmony"
   - "Progress Tracking": User sees topics completed vs. remaining

8. **Assessment (Optional):**
   - After learning pentatonic scales, user takes optional quiz
   - "Test Your Knowledge: Pentatonic Scales"
   - Questions assess understanding
   - Badge earned: "🎵 Scales Master" (if scoring well)

**Alternate Flows:**

**AF-01: Theory Content Not Available**
- Requested theory topic not yet created
- System displays: "Content coming soon"
- Links to related available topics
- User directed to Instrument Playground instead (UC-P09)

**AF-02: User Wants Deeper Understanding**
- User wants to explore a topic in depth
- "Learn More" link leads to extended content or external educational resource
- Or: Suggests music theory textbook reference
- Or: Links to advanced lesson (UC-P10)

**AF-03: Mobile Theory Display**
- Theory diagrams and staff notation scale appropriately
- Staff notation readable on small screen
- Interactive demos remain functional
- Text wraps smoothly

**AF-04: Accessibility - Screen Reader Compatible**
- Theory content marked up semantically
- Staff notation has text descriptions (alt text)
- Audio examples clearly labeled
- Mathematical relationships explained in text, not just visually

**AF-05: Non-Musical Background User**
- User has no music training
- Content uses simple language and starts with basics
- No jargon without explanation
- Encourages learning progression from beginner

**Success Outcome:**
- Theory content displays clearly
- Concepts explained in accessible language
- Audio and visual aids support understanding
- Interactive demonstrations enhance learning
- Educator resources available
- Works smoothly on all devices
- Optional assessment tracks progress
- Supports music education objectives

**Error Conditions:**
- Content fails to load → Display error, suggest retry
- Audio demo unavailable → Show text description
- Interactive demo not responsive → Use fallback content
- Mobile rendering broken → Graceful degradation

**Key Acceptance Criteria:**
- ✓ Theory content accurate and educationally sound
- ✓ Language clear and appropriate for target audience
- ✓ Audio and visual examples support concepts
- ✓ Interactive elements functional and engaging
- ✓ Mobile responsive layout
- ✓ Educator resources available
- ✓ Accessibility features functional
- ✓ Related concepts linked appropriately
- ✓ Optional quizzes assess understanding

---

## UC-P12: Explore Cultural and Historical Context (Future Optional Feature)

**Use Case Name:** Cultural Explorer - Learn Historical and Cultural Background of Song or Tradition

**Primary Actor:** Guest User, Registered User, or Educator

**Secondary Actors:**
- Cultural History Database
- Educational Resources Service

**Preconditions:**
- User interested in cultural/historical context
- Song tagged with cultural significance
- User navigated to "Learn History" or cultural explorer page
- Content available for song's associated culture/event

**Triggers:**
- User clicks "Cultural Context" from Song Experience page (UC-P05)
- User clicks "Learn the Story" button
- System suggests cultural content based on song's theme
- Educator navigates to Cultural Explorer for heritage education

**Goal:**
User can learn historical facts, cultural significance, and community stories related to the song, supporting cultural preservation, heritage education, and meaningful community connection through storytelling.

**Main Flow:**

1. User navigates to Cultural Context page for song
2. System displays content organized by timeline and themes:
   - **Timeline View:**
     - Historical events arranged chronologically
     - Example for National Day song:
       - 1819: Sir Stamford Raffles arrives
       - 1942-1945: Japanese occupation
       - 1959: Self-government
       - 1965: Independence
       - 2024: Current Singapore
   - **Key Moments:** Selected with images and descriptions
   - **Interactive Timeline:** User clicks year to read event details

3. **Thematic Sections:**
   - **Historical Context:** "Singapore's Journey to Independence"
   - **Cultural Significance:** "Why This Song Matters to Singapore"
   - **Community Stories:** "How This Song Connects People"
   - **Heritage Elements:** "Traditional Practices Featured"

4. **Content Examples:**
   - **For National Day Song:**
     - Historical facts about Singapore independence
     - Photos/illustrations from different eras
     - Personal stories from early Singaporeans
     - Connection to current celebrations
   - **For Chinese New Year Song:**
     - History of CNY traditions
     - Significance of symbols and rituals
     - How Singaporean CNY differs from other regions
     - Photo gallery of celebrations

5. **Multimedia Content:**
   - **Text:** Historical narratives and explanations
   - **Images:** Historical photos, cultural artifacts, celebrations
   - **Maps:** Geographic context, cultural regions
   - **Videos (Optional):** Short documentaries or interviews
   - **Audio:** Ambient sounds, cultural music samples
   - **Quotes:** Historical figures or community members

6. **Educational Use:**
   - Educator using for heritage curriculum
   - Slideshow mode for classroom presentation
   - Printable resources for students
   - Discussion prompts: "What themes resonate with you?"
   - Lesson plans aligned with curriculum

7. **Interactive Elements (Optional):**
   - **Timeline Exploration:** User clicks to reveal events
   - **Photo Gallery:** Swipeable before/after photos of locations
   - **Quiz:** "When did Singapore gain independence?" (embedded knowledge check)
   - **Reflection Prompt:** "How has Singapore changed since independence?" (connects to UC-P14 Reflection Wall)

8. **Community Stories:**
   - User can read contributions from community members
   - Stories shared by elderly residents, immigrants, long-time citizens
   - Personal memories and connections to songs
   - User can submit own story (registered users, UC-P14)

**Alternate Flows:**

**AF-01: Limited Cultural Content Available**
- Song doesn't have extensive cultural documentation
- System displays available information plus links:
  - "Learn More" links to external cultural resources
  - Suggestions: National Museum, cultural organizations
  - Invitation: "Help us document this song's story. Share your knowledge"

**AF-02: Multiple Cultural Perspectives**
- Song relates to multiple communities (e.g., multicultural Singapore)
- System provides perspectives from different communities
- "Tamil Perspective", "Chinese Perspective", "Malay Perspective", "Eurasian Perspective"
- User can toggle between perspectives

**AF-03: Sensitive Historical Content**
- Historical context includes difficult history (e.g., wartime)
- System includes appropriate content warning
- Tone remains respectful and educational
- Encourages reflection: "This history shapes who we are today"

**AF-04: Non-Singaporean User Learning**
- Foreign user exploring Singaporean culture
- Content includes context for non-locals:
  - Geographic explanations
  - Comparative cultural notes
  - Definitions of unfamiliar concepts
  - Welcoming tone: "Discover Singapore's story"

**AF-05: Elder User Contribution**
- Elderly community member has lived through events described
- Option to contribute personal story
- "Share Your Memory" button (for UC-P14)
- Personal account enhances historical narrative

**AF-06: Mobile History Exploration**
- Timeline and photos display appropriately on mobile
- Swipeable gallery for photos
- Scrollable timeline
- Videos responsive and viewable on small screen

**Success Outcome:**
- Cultural/historical context displays engagingly
- Content accurate and respectfully presented
- Multiple perspectives acknowledged
- Educational resources support classroom use
- Community stories integrated
- Timeline provides historical context
- Works smoothly across devices
- Connects learning to community reflection

**Error Conditions:**
- Content fails to load → Display error, suggest external resources
- Images fail → Show alt text descriptions
- Videos unavailable → Provide text summary
- Mobile rendering issues → Graceful degradation

**Key Acceptance Criteria:**
- ✓ Cultural content accurate and respectful
- ✓ Historical timeline clear and informative
- ✓ Images and media load properly
- ✓ Multiple cultural perspectives included
- ✓ Educational resources available
- ✓ Mobile responsive layout
- ✓ Community stories integrated appropriately
- ✓ Sensitive content handled respectfully
- ✓ Content supports curriculum objectives

---

# MEMBER 4: RHYTHM GAMES, REFLECTION WALL, & ACCOUNT MANAGEMENT

## UC-P13: Play Rhythm Game with Multiple Difficulty Levels

**Use Case Name:** Rhythm Game - Play Rhythm-Based Music Game with Score Tracking

**Primary Actor:** Guest User or Registered User

**Secondary Actors:**
- Game Engine (rhythm detection)
- Database (Score Records)
- Audio Synchronization Service

**Preconditions:**
- User has accessed Rhythm Game from Song Experience page or navigation menu
- User has selected a song to play rhythm game for
- Game loaded successfully
- Audio context enabled in browser

**Triggers:**
- User clicks "Play Rhythm Game" button on Song Experience page (UC-P05)
- User navigates to /games/rhythm/{song_id}
- User clicks "Rhythm Game" from main navigation menu
- System suggests game after music video completion

**Goal:**
User can engage in interactive, music-based rhythm games that provide entertainment and skill-building, with score tracking for registered users, supporting music learning and community engagement.

**Main Flow:**

1. User navigates to Rhythm Game page
2. System displays Game Setup Screen:
   - **Game Title:** "[Song Name] Rhythm Challenge"
   - **Difficulty Selection (Radio Buttons):**
     - ⭕ Easy - Slower, fewer notes to hit, forgiving timing
     - ⭕ Medium - Standard speed, regular note patterns
     - ⭕ Hard - Faster, more complex patterns, strict timing
   - **Game Instructions:**
     - "When colored circles appear on screen, press the corresponding key"
     - "Hit notes on beat for points"
     - "Perfect: 100 pts | Good: 75 pts | Miss: 0 pts"
   - **"Start Game" Button**
   - **Preview:** Visual mockup showing how game will look

3. User selects difficulty (e.g., "Medium") and clicks "Start Game"
4. System loads game instance:
   - Game begins playing song audio from start
   - Rhythm notes "fall" from top of screen toward a target zone at bottom
   - Each falling note corresponds to a keyboard key
   - Target zone shows where user should hit notes
   - Score counter displays: "Score: 0"
   - Combo counter displays: "Combo: 0x"
   - Health/Life indicator (optional): Shows remaining misses allowed

5. **Gameplay Mechanics:**
   - **Note Falling:** Visual notes fall down screen in rhythm with song
   - **Timing Windows:**
     - Perfect: ±50ms from exact beat (very accurate hit)
     - Good: ±150ms from beat (reasonably accurate)
     - Miss: Outside timing window (no points, breaks combo)
   - **Player Input:** User presses keyboard key when note reaches target zone
   - **Scoring:**
     - Perfect hit: 100 points + combo multiplier
     - Good hit: 75 points + combo multiplier
     - Miss: 0 points, combo resets
     - Combo multiplier: Each consecutive hit increases (1x → 2x → 3x → etc.)

6. **Visual Feedback:**
   - **Hit Feedback:**
     - Perfect: "Perfect! 100 pts" (green text, fireworks animation)
     - Good: "Good! 75 pts" (yellow text, star animation)
     - Miss: "Miss" (red text, brief shake)
   - **Note Color Coding:**
     - Different keyboard keys assigned different colors
     - Q key (red), W key (blue), E key (green), R key (yellow)
     - Falling notes match color to key they correspond to
     - User learns key associations while playing

7. **Difficulty Differences:**
   - **Easy:**
     - Notes fall slowly (~3 seconds from top to target)
     - Fewer notes (maybe every 0.5 seconds)
     - Timing window wider (±200ms)
     - Good for children, beginners, first playthrough
   - **Medium:**
     - Notes fall at moderate speed (~2 seconds)
     - Regular note pattern (every 0.25-0.5 seconds)
     - Timing window standard (±150ms)
     - Balanced for most players
   - **Hard:**
     - Notes fall quickly (~1 second)
     - Frequent notes (every 0.2 seconds, sometimes simultaneous)
     - Tight timing window (±50ms)
     - Challenging for music gamers, experienced players

8. **Gameplay Progression:**
   - Game plays through first chorus or full short song
   - Duration typically 1-3 minutes depending on song length
   - Notes synchronized perfectly with song audio
   - Player attempts to hit as many notes as possible
   - Combo maintains if hitting consecutive notes perfectly

9. **Game Completion Screen:**
   - Song ends or player runs out of lives
   - Game Over / Completion screen displays:
     - **Final Score:** "1,450 points"
     - **Accuracy:** "92% accuracy (92 perfect, 8 good, 3 misses)"
     - **Max Combo:** "Highest streak: 12 notes"
     - **Rating:** Based on score performance
       - S Rank: 95-100% accuracy (amazing!)
       - A Rank: 85-94% accuracy (great!)
       - B Rank: 75-84% accuracy (good)
       - C Rank: 60-74% accuracy (ok)
       - D Rank: <60% accuracy (keep practicing)
   - **Badges Earned (Optional):** "Perfect Streak" or "Rhythm Master"
   - **Buttons:**
     - "Play Again" - restart same difficulty
     - "Try Higher Difficulty" - progress to harder level
     - "Share Score" (registered) - share result
     - "Back to Song" - return to Song Experience page

10. **Score Tracking (Registered Users Only):**
    - System saves score to user profile
    - Appears in user's game history: "Medium difficulty - 1,450 pts - 92%"
    - User can see score progression over time
    - Personal best tracked: "Your best: 1,925 pts (Hard)"
    - Monthly achievement: "You've played 12 rhythm games this month!"

11. **Guest User Gameplay:**
    - Guest can play same game
    - Score shown at end but NOT saved
    - Guest cannot track progress or earn badges
    - Encouraged to create account: "Create account to save scores and earn badges"

**Alternate Flows:**

**AF-01: Audio Sync Issues**
- Audio and visual notes falling out of sync
- Game detects and auto-calibrates
- User prompted: "Adjust timing if notes feel off (Early/Late)"
- User can increase/decrease hit timing window during game
- Recalibrates mid-game

**AF-02: Player Pauses Game**
- Player clicks pause button mid-game
- Song audio pauses, notes stop falling
- "Resume Game" and "Quit Game" buttons displayed
- Player can resume or exit without penalty

**AF-03: Player Gets Frustrated (Too Difficult)**
- Playing Hard difficulty, missing many notes
- System detects struggling player
- Optional: "Tip: Try Medium difficulty first" message
- Player can quit and retry on lower difficulty

**AF-04: Perfect Game (All Notes Hit)**
- Advanced player hits every note perfectly
- Combo reaches maximum and stays maxed
- Game completes with 100% accuracy
- Special completion message: "Perfect Performance! 🎵"
- Badge unlocked: "Rhythm Master"

**AF-05: Player Wants Leaderboard**
- Registered player wants to see top scores
- System displays global leaderboard (optional):
  - "Top Scores This Week" for this song
  - Shows top 10 players and scores
  - User's rank displayed if in top 10
  - Encourages friendly competition

**AF-06: Mobile Rhythm Game**
- Rhythm game on mobile phone with touch controls
- Falling notes displayed at correct size
- Touch zones replace keyboard keys
- Player taps touch zones to hit notes
- Responsive to touch input
- Works smoothly on 5-6 inch screens

**AF-07: Accessibility - Visual Impairment Support**
- High contrast colors for notes
- Screen reader announces notes and scores
- Audio cues for hits and misses
- Haptic feedback on mobile (vibration for hits)
- Adjustable note sizes

**AF-08: Accessibility - Hearing Impairment Support**
- Visual indicators for rhythm instead of only audio
- Bright flashes sync with beats
- Text descriptions of game events
- No reliance on audio cues alone

**Success Outcome:**
- Game loads smoothly without lag
- Notes fall in perfect sync with audio
- Player controls responsive to keyboard/touch
- Scoring system fair and rewarding
- Multiple difficulty levels accommodate different skill levels
- Completion screen displays accurate score and feedback
- Registered users' scores persist
- Game provides fun and engaging experience
- Supports music learning and rhythm development

**Error Conditions:**
- Audio/visual sync off → Auto-calibrate or offer manual adjustment
- Note detection fails → Allow manual retry or skip song
- Touch input unresponsive → Fall back to keyboard controls
- Score save fails (registered) → Display error, offer retry

**Key Acceptance Criteria:**
- ✓ Game loads within 3 seconds
- ✓ Audio and video perfectly synchronized
- ✓ Keyboard/touch controls responsive
- ✓ Scoring accurate and fair
- ✓ Difficulty levels appropriately challenging
- ✓ Multiple difficulty options available
- ✓ Visual and audio feedback clear
- ✓ Mobile touch controls work smoothly
- ✓ Registered user scores saved
- ✓ Game provides engaging, fun experience
- ✓ Accessibility features functional

---

## UC-P14: View and Submit Reflections on Reflection Wall

**Use Case Name:** Reflection Wall - View Public Reflections and Submit Anonymous or Named Stories

**Primary Actor:** Guest User (anonymous submit) or Registered User (named submit)

**Secondary Actors:**
- Database (Reflection Records)
- Moderation Service (optional, for content review)

**Preconditions:**
- User has watched song or engaged with other features
- User navigated to Reflection Wall from Song Experience or navigation menu
- Reflection Wall page loaded successfully
- Moderation system in place (if required)

**Triggers:**
- User clicks "Reflection Wall" from navigation menu
- User clicks "Share Your Story" button after Song Experience (UC-P05)
- System suggests reflection after game completion (UC-P13)
- User navigates to /reflections/{song_id} URL

**Goal:**
Users can view personal stories and reflections from community members inspired by songs, and can share their own stories, creating a digital "memory wall" that preserves community connection and meaningful engagement with cultural content.

**Main Flow:**

1. User navigates to Reflection Wall page for song
2. System displays Reflection Wall Interface:
   - **Page Title:** "[Song Name] - Reflection Wall"
   - **Tagline:** "Share your memories, stories, and reflections inspired by this song"
   - **Description:** "This is a space for our community to connect through shared stories and memories"

3. **Viewing Existing Reflections:**
   - System displays existing reflections in feed format:
     - Cards/blocks arranged vertically
     - Newest or most-upvoted reflections shown first
   - Each reflection shows:
     - **Reflection Text:** 1-3 paragraphs of user's story/memory
     - **Author Info:**
       - If registered user: User's name (optional to display)
       - If anonymous: "Anonymous" label
     - **Timestamp:** "Posted 2 days ago"
     - **Like Count (Optional):** "♥ 24 people found this meaningful"
     - **Tags/Themes:** "Nostalgia", "Family", "Heritage"
   - Example reflection:
     - "This song reminds me of celebrating National Day as a child, watching fireworks with my family at Marina Bay. We'd sing this together on the car ride home. Hearing it now brings back that sense of unity and joy. - Chen Wei"

4. **Browsing Reflections:**
   - User scrolls through feed
   - Load more reflections as user scrolls (pagination)
   - Reflections appear in feed naturally
   - User can "like" reflections (if registered, or just view if guest)
   - User can click on reflection for expanded view (if long)

5. **Filtering Reflections (Optional):**
   - Sort options:
     - Newest First
     - Most Liked
     - Most Commented (if commenting enabled)
   - Filter by theme/tag:
     - "Family Memories"
     - "Heritage"
     - "Emotional Impact"
   - User can customize feed view

6. **Submitting a Reflection - Guest User (Anonymous):**
   - Guest user clicks "Share Your Reflection" button
   - Modal or page displays reflection submission form:
     - **Text Area:** "What does this song mean to you?"
     - **Character Limit:** "Max 500 characters" (enforced)
     - **Preview:** Real-time preview of reflection
     - **Submit Button:** "Submit as Anonymous"
     - **Disclaimer:** "Your reflection will be displayed on Reflection Wall (anonymously)"
   - Guest user types reflection: "This song makes me feel proud to be Singaporean"
   - Guest clicks Submit
   - System displays confirmation: "Thank you! Your reflection has been added to the wall"
   - Reflection appears in feed within seconds
   - Guest can view but not edit or delete (no persistence)

7. **Submitting a Reflection - Registered User (Named):**
   - Registered user clicks "Share Your Story"
   - Reflection submission form displays:
     - **Text Area:** Larger, for more content (up to 1000 characters for registered)
     - **Name Display Setting:**
       - ⭕ Display my name (public attribution)
       - ⭕ Display as "Anonymous" (hide identity)
     - **Tags/Themes:** Optional checkboxes to tag reflection:
       - [ ] Family
       - [ ] Heritage
       - [ ] Personal Growth
       - [ ] Celebration
       - [ ] Nostalgia
       - [ ] Other
     - **Submit Button:** "Share Story"
   - User composes reflection and selects to display name
   - User adds relevant tags for discoverability
   - User clicks Submit
   - System saves reflection to database with:
     - reflection_id, user_id, song_id, text, author_name, tags, created_at
   - Reflection appears in feed with user's name attributed
   - User can edit or delete own reflection (UC-P15)

8. **Example Reflections on Wall:**
   - "This song captures the essence of growing up in Singapore - the mix of tradition and modernity. Every time I hear it, I'm reminded of my grandmother's stories about Singapore's journey. - Sarah Tan"
   - "As an educator, I use this song to teach my students about our cultural heritage. It's a beautiful way to connect with them emotionally about what it means to be Singaporean. - Mr. Lim (Teacher)"
   - "Anonymous: This made me cry - in a good way. It reminded me why I love this country."

9. **Community Interaction (Optional):**
   - Registered users can like reflections: ♥ "24 people found this meaningful"
   - User likes reflection by clicking heart icon
   - Like count increases
   - Liked reflections appear in user's activity (UC-P16 profile)

10. **Moderation (Behind the Scenes):**
    - System optionally reviews reflections before display (content moderation)
    - Flagged reflections held for review
    - Inappropriate content removed
    - Community guidelines enforced: respectful, on-topic, no spam

**Alternate Flows:**

**AF-01: No Reflections Yet**
- Reflection Wall empty (newly created)
- System displays: "No reflections yet. Be the first to share your story!"
- Prominent call-to-action to submit reflection
- Suggestion: "Share a memory inspired by this song"

**AF-02: User Reports Inappropriate Reflection**
- User clicks "Report" button on reflection
- Modal displays: "Why are you reporting this reflection?"
- Options: Offensive, Spam, Off-topic, Other
- User submits report
- System flags reflection for moderation review
- Reflection may be hidden or removed if violates guidelines

**AF-03: Registered User Edits Own Reflection**
- User clicks "Edit" on their own reflection
- Reflection text becomes editable
- User modifies text
- User clicks "Save Changes"
- System updates reflection in database
- Edit timestamp noted: "Last edited 1 day ago"

**AF-04: Registered User Deletes Own Reflection**
- User clicks "Delete" on their own reflection
- Confirmation dialog: "Delete this reflection? This cannot be undone"
- User confirms
- System deletes reflection from database
- Reflection removed from wall immediately

**AF-05: Mobile Reflection Wall**
- Reflections display in single-column feed on mobile
- Text cards wrap appropriately
- Like button and interactions touch-friendly
- Scrolling smooth through feed

**AF-06: Privacy Concern - User Wants Full Anonymity**
- Registered user wants to submit while staying completely anonymous
- User selects "Display as Anonymous" when submitting
- Reflection appears without user's name
- Even though registered, identity hidden from public
- User can manage own reflection (edit/delete) while anonymous to others

**AF-07: Accessibility - Screen Reader**
- Reflection text marked up semantically
- Like count announced by screen reader
- Timestamps accessible
- Submit button easily navigable
- Text input field labeled clearly

**Success Outcome:**
- Reflection Wall displays existing reflections in feed
- User can submit reflection (anonymous or named)
- Submission successful and appears in feed
- Existing reflections visible and accessible
- User can like and engage with reflections (if registered)
- Community stories preserved and celebrated
- Appropriate moderation in place
- Works smoothly across devices
- Meaningful community connection fostered

**Error Conditions:**
- Submission fails → Display error, allow retry
- Reflection fails to save → Display error, preserve user's text
- Moderation service fails → Queue for manual review
- Mobile rendering broken → Graceful degradation

**Key Acceptance Criteria:**
- ✓ Existing reflections display clearly
- ✓ Submission form simple and clear
- ✓ Anonymous submission works for guests
- ✓ Named submission works for registered users
- ✓ Reflections appear in feed quickly
- ✓ User can edit/delete own reflections
- ✓ Like functionality works (if enabled)
- ✓ Mobile responsive layout
- ✓ Moderation system functional
- ✓ Community guidelines enforced

---

## UC-P15: Manage User Profile and Activity (Registered Users)

**Use Case Name:** User Profile - View and Manage Personal Profile, Activity History, and Preferences

**Primary Actor:** Registered User

**Secondary Actors:**
- Database (User Profile, Activity Records)
- Preferences Service

**Preconditions:**
- User is registered and logged in
- User navigated to Profile page from navigation menu or account menu
- User profile exists in database

**Triggers:**
- User clicks profile icon in top-right navigation
- User clicks "My Profile" from account menu
- User navigates to /profile URL
- System redirects after login (first-time account setup)

**Goal:**
Registered users can view and manage their personal profile, track their activity (games played, reflections submitted, lessons completed), and customize preferences for personalized experience.

**Main Flow:**

1. User clicks profile icon or "My Profile" link
2. System displays User Profile Page:
   - **Profile Header Section:**
     - **Profile Photo:** User's avatar (default or uploaded)
     - **User Name:** Registered user's display name
     - **Member Since:** "Member since March 2024"
     - **Edit Profile Button:** "Edit Profile"
   - **Quick Stats (Dashboard):**
     - "🎮 Games Played: 24" (links to game history)
     - "💬 Reflections Shared: 8" (links to reflections)
     - "♥ Liked Reflections: 15"
     - "🎵 Songs Explored: 42"
     - "🏆 Badges Earned: 3"

3. **Profile Sections:**

   **A. My Activity:**
   - Tabs or expandable sections for:
     - **Rhythm Game Scores:** Recent games played with scores
       - "Medium difficulty - 1,450 pts - 92% accuracy - Today"
       - "Hard difficulty - 1,925 pts - 89% accuracy - Yesterday"
       - Score history sortable by date or score
       - Can view detailed stats for each game
     - **Reflections Shared:** Recent reflections and stories
       - Text preview of reflection
       - Date posted
       - Like count
       - Option to edit or delete
     - **Songs Explored:** List of songs viewed
       - Watched videos
       - Taken lessons
       - Played games for
     - **Lessons Completed:** Music lessons finished
       - "Learn to Play Guzheng - Completed 3 days ago"
       - Certificates or completion badges displayed
     - **Achievements & Badges:**
       - Visual badges earned
       - Example: "🎵 Rhythm Master" (100 perfect notes in game)
       - Example: "📚 Music Theory Expert" (completed all theory lessons)
       - Example: "💬 Story Teller" (shared 5+ reflections)
       - Date earned for each

4. **Profile Settings & Preferences:**
   - **Account Settings:**
     - Email address (changeable)
     - Password change link
     - Delete account option
   - **Privacy Settings:**
     - [ ] Display my name on reflections
     - [ ] Show my profile publicly
     - [ ] Allow notifications about new reflections
   - **Notification Preferences:**
     - [ ] Email notifications for activity
     - [ ] Notifications when someone likes my reflection
     - [ ] Weekly activity summary email
   - **Display Preferences:**
     - Font size adjustment (accessibility)
     - Color theme (light/dark mode)
     - Language preference (if multi-lingual)

5. **Edit Profile (Optional):**
   - User clicks "Edit Profile" button
   - Form appears with editable fields:
     - Display Name (changeable)
     - Bio/About Me (optional, short text)
     - Profile Photo (upload or change)
     - Interests/Themes (checkboxes for song themes user enjoys)
   - User makes changes and clicks "Save Changes"
   - Profile updates immediately

6. **Activity Timeline (Optional):**
   - Visual timeline showing user's activity over time
   - "Last 30 days of activity"
   - Events: Games played, reflections submitted, badges earned, lessons completed
   - Interactive: User can click events to see details

7. **Bookmarks/Favorites (Optional):**
   - Songs user marked as favorites
   - Easy access to re-watch or play games
   - Sortable by date added or theme
   - Remove bookmarks easily

8. **Download Data (Optional, for Privacy):**
   - "Download My Data" button
   - User can export all personal data in standard format
   - Includes: activity history, reflections, scores, preferences
   - Supports data portability rights

**Alternate Flows:**

**AF-01: First-Time Login (Account Setup)**
- Brand new registered user logs in for first time
- System redirects to Profile Setup page
- Prompts:
  - Upload profile photo (optional)
  - Add display name (confirm or edit)
  - Select interests (theme preferences)
  - "Get Started" button continues to profile

**AF-02: Change Email Address**
- User clicks "Change Email" in account settings
- Form displays: Enter new email, confirm password
- User enters new email
- System sends verification link to new email
- User clicks link to confirm change
- Email address updated

**AF-03: Change Password**
- User clicks "Change Password" in account settings
- Form displays:
  - Current password (verify identity)
  - New password (with strength requirements)
  - Confirm new password
- User enters and submits
- Password updated (user needs to log in again)

**AF-04: Delete Account**
- User clicks "Delete Account" in settings
- Warning dialog: "This action is permanent. All data will be deleted."
- User confirms by typing "DELETE"
- Account and all associated data deleted
- User logged out
- Redirected to landing page

**AF-05: No Activity Yet**
- Brand new registered user, hasn't played games or submitted reflections
- Profile shows: "No activity yet. Start exploring!" with quick links to games and songs

**AF-06: Mobile Profile View**
- Profile page viewed on mobile phone
- Stats cards stack vertically
- Tabs for activity sections remain accessible
- Responsive layout maintains readability

**AF-07: Privacy-Conscious User**
- User toggles "Show my profile publicly" OFF
- Profile not visible to other users
- Reflections still visible but not linked to user's public profile
- User remains pseudonymous or fully anonymous

**Success Outcome:**
- Profile page displays all user information and activity
- Activity history complete and accessible
- Preferences changeable and saved
- Profile photo and name editable
- Stats accurate and up-to-date
- Settings protect user privacy
- Works smoothly across devices
- User can manage account effectively

**Error Conditions:**
- Profile load fails → Display error, suggest refresh
- Email change verification fails → Offer to retry or contact support
- Password change fails → Display error, offer retry
- Account deletion fails → Display warning, suggest contacting support
- Data export fails → Display error, offer alternative download method

**Key Acceptance Criteria:**
- ✓ Profile page loads within 2 seconds
- ✓ All activity history displays accurately
- ✓ Stats updated in real-time or near real-time
- ✓ Profile settings save correctly
- ✓ Account management options functional
- ✓ Privacy controls work as expected
- ✓ Mobile responsive layout
- ✓ Data download works if enabled
- ✓ Account deletion irreversible (as intended)

---

## UC-P16: Register, Login, and Account Authentication

**Use Case Name:** User Authentication - Register Account, Log In, and Manage Session

**Primary Actor:** New User (Registration) or Returning User (Login)

**Secondary Actors:**
- Authentication Service
- Database (User Records)
- Email Service (for password reset)
- Session Management

**Preconditions:**
- User accessing landing page (UC-P01) or login page
- User not currently logged in
- User has email address and can create password
- Platform registration open (no waitlist)

**Triggers:**
- New user clicks "Create Account" on landing page
- Returning user clicks "Log In" on landing page
- User clicks account menu "Log In" link
- User navigates to /login or /register URL
- User's session expired and system prompts re-login

**Goal:**
New users can register an account quickly to save progress and earn badges, while returning users can securely log back in, enabling personalized experience and progress tracking.

**Main Flow:**

**A. Registration Flow:**

1. New user on landing page (UC-P01) clicks "Create Account"
2. System displays registration form with fields:
   - **Name:** "Your Name" (display name for profile)
   - **Email:** "Email Address" (unique identifier, used for login)
   - **Password:** "Create Password" (with strength indicator)
     - Requirements shown: 8+ characters, uppercase, number, symbol
   - **Confirm Password:** "Confirm Password" (verify match)
   - **Interests (Optional):** Checkboxes for theme preferences
     - [ ] National Day
     - [ ] Chinese New Year
     - [ ] Heritage & Culture
     - [ ] Music & Instruments
   - **Terms & Conditions:** Checkbox "I agree to Terms of Service and Privacy Policy"
   - **Buttons:** "Create Account" (primary), "Already have account? Log In" (secondary)

3. User fills in fields and clicks "Create Account"
4. System validates input:
   - Name not empty and <50 characters
   - Email valid format and not already registered
   - Password meets strength requirements
   - Passwords match
   - Terms agreed to
5. **On Validation Success:**
   - System creates user account:
     - Hashes password securely (bcrypt)
     - Generates unique user_id
     - Stores in database: user_id, email, password_hash, name, interests, created_at
   - System creates user profile (empty initially)
   - System sends confirmation email with:
     - Welcome message
     - Link to verify email (optional but recommended)
     - Quick start guide
   - System displays success screen:
     - "Welcome [Name]!"
     - "Account created successfully"
     - "Check your email to verify your address"
     - "Get Started" button → Redirects to Songs Library
   - User automatically logged in (session created)
   - User redirected to Songs Library (UC-P02)

6. **On Validation Failure:**
   - System displays error for first failed validation:
     - "Email already registered" → Suggest "Log In" instead
     - "Password doesn't meet requirements" → Show requirements
     - "Passwords don't match" → Ask to re-enter
     - "Terms must be agreed" → Highlight checkbox
   - User can correct and resubmit

7. **Email Verification (Optional Flow):**
   - User receives verification email
   - Email contains link: "Verify Your Email"
   - User clicks link
   - Email verified in database
   - User sees confirmation: "Email verified successfully!"

**B. Login Flow:**

1. Returning user on landing page (UC-P01) clicks "Log In"
2. System displays login form with fields:
   - **Email:** "Email Address"
   - **Password:** "Password"
   - **"Remember Me" Checkbox:** [ ] Keep me logged in
   - **Buttons:** "Log In" (primary), "Forgot Password?" (secondary link)

3. User enters email and password, clicks "Log In"
4. System validates credentials:
   - Email exists in database
   - Password matches stored password_hash
5. **On Authentication Success:**
   - System generates session token (JWT or secure session ID)
   - System stores session in database:
     - session_id, user_id, created_at, expires_at, ip_address, user_agent
   - System sets session cookie (secure, httpOnly, sameSite):
     - If "Remember Me" checked: 30-day expiry
     - If unchecked: 2-hour expiry
   - System displays success message: "Logging in..."
   - User automatically redirected to dashboard or songs library (UC-P02)
   - User now authenticated with full registered features

6. **On Authentication Failure:**
   - System does NOT reveal whether email or password incorrect (security)
   - System displays generic error: "Invalid email or password"
   - System logs failed attempt for security monitoring
   - User can retry or click "Forgot Password?"

**C. Password Reset Flow (Forgot Password):**

1. User on login page clicks "Forgot Password?"
2. System displays password reset form:
   - **Email:** "Enter your email address"
   - **Submit Button:** "Send Reset Link"
3. User enters email and clicks Submit
4. System checks if email exists:
   - **If exists:**
     - Generates one-time reset token (expires in 1 hour)
     - Stores token in database linked to user_id
     - Sends reset email with link: "Reset Password"
     - Displays message: "Password reset email sent. Check inbox (and spam folder)"
   - **If doesn't exist:**
     - Still displays same message (don't reveal if email registered)
     - No email actually sent (security: prevent account enumeration)

5. User receives reset email with link: /reset-password?token={reset_token}
6. User clicks link (valid for 1 hour)
7. System validates token and displays new password form:
   - **New Password:** Create new password (with strength requirements)
   - **Confirm Password:** Confirm new password
   - **Submit Button:** "Reset Password"
8. User enters new password and submits
9. System validates:
   - Password meets strength requirements
   - Passwords match
   - New password different from old password
10. **On Success:**
    - System updates password_hash in database
    - Marks reset token as used (consumed)
    - Invalidates all existing sessions (user logged out everywhere)
    - Displays success: "Password reset successfully. Log in with new password"
    - User redirected to login page
    - User logs in with new password

**D. Session Management:**

1. **Session Validation:** On each request, system validates session token
   - Token exists in database
   - Token not expired
   - IP/user-agent match (optional, for security)
2. **Session Timeout:**
   - If token expired:
     - System redirects to login page
     - Displays: "Your session expired. Log in again"
   - If token valid but near expiry (e.g., <5 min):
     - System silently renews token (new expiry)
     - User continues without interruption
3. **Logout:**
   - User clicks "Logout" from profile menu
   - System invalidates session_id in database
   - System clears session cookie
   - System redirects to login page
   - User must re-login to access account

**Alternate Flows:**

**AF-01: Email Already Registered**
- User attempts to register with existing email
- System displays error: "Email already registered. Log in instead"
- Link to login page provided

**AF-02: Email Already Verified (Returning User)**
- Returning user logs in with previously verified email
- Session created immediately, no re-verification needed

**AF-03: Account Lockout (Optional Security)**
- User fails login 5 times in a row
- Account temporarily locked (15 minutes)
- System displays: "Too many failed attempts. Try again in 15 minutes"
- User receives security alert email

**AF-04: New Device Login (Optional Security)**
- User logs in from new device/location
- System optionally sends verification email:
  - "New login detected from [City, Country] on [Device]"
  - "Confirm if this is you" link
- User confirms email, login completes
- Adds security against unauthorized access

**AF-05: Reset Token Already Used**
- User clicks same reset link twice
- First click: password reset successfully
- Second click: link already used
- System displays error: "This reset link has already been used"
- User must request new reset if needed

**AF-06: Session Invalidated on Password Change**
- User changes password while logged in
- System invalidates all existing sessions (security)
- User logged out from all devices
- User must re-login with new password on each device

**AF-07: Mobile Login**
- User logging in on mobile phone
- Login form responsive and touch-friendly
- Password field shows hide/show toggle (for visibility check)
- "Remember Me" checkbox easily tappable

**Success Outcome:**
- New user registration successful and account created
- Verification email received (if enabled)
- Returning user logs in successfully
- Session created and persists across navigation
- User can log out explicitly
- Forgotten password recoverable via email
- Session expires gracefully with re-login prompt
- All account management features secure and functional

**Error Conditions:**
- Invalid email/password → Display generic error (no account enumeration)
- Email already registered → Suggest login or recovery
- Weak password → Display requirements, ask to edit
- Reset token expired → Offer to request new reset
- Session expired → Redirect to login with message
- Database unavailable → Display error, suggest retry

**Key Acceptance Criteria:**
- ✓ Registration completes within 5 seconds
- ✓ Email validation prevents duplicates
- ✓ Password strength enforced
- ✓ Login completes within 3 seconds
- ✓ Session token secure (httpOnly, sameSite cookies)
- ✓ Password reset email sent within 10 seconds
- ✓ Reset link valid for 1 hour only
- ✓ Session expiry enforced consistently
- ✓ Logout immediately terminates session
- ✓ Error messages clear but don't reveal account details
- ✓ Mobile responsive layout
- ✓ Accessibility features functional

---

# Summary Table: Public-Facing Use Cases by Team Member

| Team | Feature Domain | Use Cases | Total |
|---|---|---|---|
| **Member 1** | Song Discovery & Exploration | UC-P01, UC-P02, UC-P03, UC-P04 | 4 |
| **Member 2** | Song Experience & Content | UC-P05, UC-P06, UC-P07, UC-P08 | 4 |
| **Member 3** | Interactive Learning | UC-P09, UC-P10, UC-P11, UC-P12 | 4 |
| **Member 4** | Games, Reflection, & Accounts | UC-P13, UC-P14, UC-P15, UC-P16 | 4 |
| | | **TOTAL** | **16** |

---

# Platform Architecture Overview (Public-Facing)

**Single Web Application Architecture:**
- Frontend: React/Vue single-page app
- Backend: RESTful API (Node.js, Python, or similar)
- Database: Centralized MySQL/PostgreSQL
- Session: Cookie-based authentication
- Storage: Cloud storage for videos, images
- Real-time: Not required (asynchronous operations)

**Key API Endpoints (Sample):**

| Feature | Endpoint | Method | Purpose |
|---|---|---|---|
| Landing | GET /api/landing | GET | Landing page data |
| Browse | GET /api/songs | GET | List published songs |
| Browse | GET /api/songs?theme=national_day&language=english | GET | Filtered songs |
| Browse | GET /api/songs?search=heartland | GET | Search songs |
| Song Detail | GET /api/songs/{song_id} | GET | Song + video + metadata |
| Instruments | GET /api/songs/{song_id}/instruments | GET | Instruments list |
| Trivia | POST /api/songs/{song_id}/trivia/submit | POST | Submit quiz answer |
| Playground | GET /api/instruments | GET | Available instruments |
| Rhythm Game | POST /api/games/rhythm/score | POST | Submit game score |
| Reflections | GET /api/songs/{song_id}/reflections | GET | List reflections |
| Reflections | POST /api/reflections | POST | Submit reflection |
| Auth | POST /api/auth/register | POST | Register user |
| Auth | POST /api/auth/login | POST | Login user |
| Auth | POST /api/auth/logout | POST | Logout user |
| Profile | GET /api/users/{user_id}/profile | GET | User profile data |
| Profile | PUT /api/users/{user_id}/profile | PUT | Update profile |

---

# Data Models Summary (Public-Facing)

| Model | Fields | Purpose |
|---|---|---|
| User | user_id, name, email, password_hash, interests, created_at | Account & profile |
| Session | session_id, user_id, created_at, expires_at, ip_address | Auth & session mgmt |
| Song | song_id, title, artist, theme, language, description, video_url, published_date | Published songs |
| GameScore | score_id, user_id, song_id, difficulty, score, accuracy, created_at | Rhythm game results |
| Reflection | reflection_id, user_id, song_id, text, author_name, is_anonymous, tags, created_at | Community stories |
| Badge | badge_id, user_id, badge_name, earned_at | User achievements |
| Instrument | instrument_id, name, description, audio_url, origin | Instrument info |
| Lesson | lesson_id, song_id, instrument_id, steps, content | Music lessons |

---

# Key Design Principles

✓ **Accessibility First:** All features designed for diverse users (elderly, children, educators)  
✓ **Low Barrier to Entry:** Guest mode encourages exploration without signup  
✓ **Educational Value:** Music learning and cultural context integrated throughout  
✓ **Community Connection:** Reflection Wall and shared experiences celebrated  
✓ **Responsive Design:** Works smoothly on all devices (mobile, tablet, desktop)  
✓ **Privacy-Conscious:** Guest anonymity respected, registered user data protected  
✓ **Performance:** All pages load within 2-3 seconds, smooth interactions  
✓ **Error Resilience:** Graceful degradation when services fail, clear user feedback  

---

**End of Public-Facing Use Cases Document**
