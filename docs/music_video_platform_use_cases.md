# AI Music Video Generation Platform - Use Cases

**Platform Purpose:** Transform Singapore-themed songs into cinematic visual experiences for community storytelling and education.

**Architecture:** Single web application, centralized database, session-based auth, no real-time sync required.

---

## Use Case Distribution by Team Member

| Team Member | Feature Domain | Use Cases |
|---|---|---|
| **Member 1** | AI Music Video Generation (Core) | UC-01, UC-02, UC-03, UC-04 |
| **Member 2** | Creator Dashboard & Song Management | UC-05, UC-06, UC-07, UC-08 |
| **Member 3** | Song Metadata & Publishing | UC-09, UC-10, UC-11, UC-12 |
| **Member 4** | Guest/Public Interactions & Error Handling | UC-13, UC-14, UC-15, UC-16 |

---

# MEMBER 1: AI MUSIC VIDEO GENERATION (Core)

## UC-01: Upload and Process Song for Video Generation

**Use Case Name:** Upload Song and Initialize AI Video Generation

**Primary Actor:** Registered Creator

**Secondary Actors:** 
- AI Video Generation Service
- Database
- Storage Service (for song files)

**Preconditions:**
- Creator is logged in and authenticated
- Creator has valid account with upload permissions
- Song file is in supported format (MP3, WAV, M4A) or YouTube URL is valid
- File size is within limits (max 50MB for audio, YouTube metadata retrievable)

**Triggers:**
- Creator clicks "Upload Song" in Dashboard
- Creator provides song source (file upload or YouTube URL)
- Creator confirms upload initiation

**Goal:** 
Creator can upload a song (file or YouTube source) and initialize the AI music video generation process, with the system extracting audio, duration, and basic metadata.

**Main Flow:**

1. Creator navigates to upload interface
2. Creator selects upload method (file or YouTube URL)
3. **If file upload:**
   - Creator selects audio file from device
   - System validates file format and size
   - System extracts audio metadata (duration, bitrate, format)
   - System stores file in cloud storage with unique ID
4. **If YouTube upload:**
   - Creator pastes YouTube URL
   - System validates URL and checks accessibility
   - System extracts audio stream from YouTube
   - System extracts available metadata (title, description, duration)
   - System stores extracted audio in cloud storage
5. System creates song record in database with extracted metadata
6. System generates audio waveform visualization for creator preview
7. System displays upload success confirmation with song duration and audio preview
8. System transitions to Song Metadata entry screen (UC-09)

**Alternate Flows:**

**AF-01: File Validation Failure**
- File format unsupported or corrupt
- System displays error: "Unsupported file format. Use MP3, WAV, or M4A"
- Creator can retry with different file

**AF-02: File Size Exceeds Limit**
- Uploaded file exceeds 50MB threshold
- System displays error: "File too large. Maximum 50MB allowed"
- Creator prompted to compress or trim audio

**AF-03: YouTube URL Invalid**
- URL is malformed or video is unavailable
- System displays error: "Unable to access YouTube URL. Check link or try again"
- Creator can retry with different URL

**AF-04: Network Interruption**
- Upload interrupted mid-process
- System detects incomplete upload and cleans up partial files
- Creator shown option to resume or retry upload

**AF-05: Storage Service Unavailable**
- Cloud storage temporarily unavailable
- System displays error: "Upload service unavailable. Try again later"
- Creator can attempt retry

**Success Outcome:**
- Song file successfully stored in cloud storage
- Song record created in database with unique song_id
- Audio metadata (duration, format) extracted and stored
- Creator sees confirmation and waveform preview
- Creator proceeds to add song metadata (lyrics, theme, etc.)

**Error Conditions:**
- Unsupported file format → Display format error, allow retry
- File exceeds size limit → Display size error, recommend compression
- YouTube URL invalid → Display URL error, allow new URL input
- Network failure during upload → Display connection error, offer resume
- Storage service down → Display service error, offer retry with exponential backoff

**Key Acceptance Criteria:**
- ✓ Audio files uploaded successfully in <5 seconds per MB
- ✓ YouTube extraction works for publicly accessible videos
- ✓ Audio duration and format correctly identified
- ✓ Partial uploads cleaned up automatically
- ✓ Creator receives clear feedback on success or failure

---

## UC-02: Generate Scene Plan from Song and Lyrics

**Use Case Name:** AI Scene Planning - Generate Visual Outline from Song Lyrics and Audio

**Primary Actor:** Registered Creator

**Secondary Actors:**
- AI Scene Planning Service
- Lyrics Database
- Song Metadata (from UC-01 or UC-09)

**Preconditions:**
- Song has been uploaded (UC-01 complete)
- Song metadata including lyrics has been entered or extracted (UC-09 complete)
- Song duration is known and stored
- Creator has proceeded to "Generate Video" workflow

**Triggers:**
- Creator clicks "Generate Video" button on song detail page
- Creator confirms scene generation preferences (mood, style, visual themes)
- System initiates AI scene planning process

**Goal:**
AI analyzes song lyrics, mood, duration, and theme to generate a detailed scene plan that maps specific moments, emotions, and visual themes to precise timestamps, creating a blueprint for AI video generation.

**Main Flow:**

1. System retrieves song lyrics and metadata (duration, theme, mood, language)
2. System detects chorus/repetition patterns in lyrics
3. System segments song into time intervals (e.g., 5-second chunks for short songs, 10-15 second for longer)
4. **For each segment, AI performs:**
   - Emotional analysis of lyrics (joy, nostalgia, celebration, reflection)
   - Theme extraction (nature, urban, cultural, historical references)
   - Visual scene suggestions (e.g., "sunrise over city skyline", "family gathering", "street parade")
   - Recommended visual style/aesthetics
   - Color palette and tone suggestions
5. System identifies chorus/repetition sections and marks for potential visual reuse
6. System creates scene plan JSON with:
   - Start timestamp (e.g., 0:00, 0:10, 0:20)
   - End timestamp
   - Segment lyrics
   - Suggested scenes (3-5 options per segment)
   - Emotion tags
   - Estimated duration for segment
   - Reuse flag (for choruses)
7. System displays scene plan preview to creator as timeline
8. Creator reviews proposed scenes and can:
   - Accept AI suggestions
   - Edit individual scenes
   - Reorder scenes
   - Add custom scene descriptions
9. Creator confirms or modifies scene plan
10. System saves finalized scene plan to database linked to song_id

**Alternate Flows:**

**AF-01: Lyrics Not Available**
- System cannot extract lyrics from uploaded song
- System displays warning: "Lyrics not provided. Generate scenes based on audio mood only?"
- Creator can:
  - Upload/paste lyrics manually
  - Proceed with mood-only analysis
  - Cancel and re-enter song (UC-09)

**AF-02: Song Duration Too Long**
- Song exceeds 15 minutes
- System still segments but may suggest scene reuse more heavily
- System displays: "Long song detected. Will reuse visual sequences for repeated sections to manage generation time"
- Creator can proceed or trim song

**AF-03: Ambiguous or Non-English Lyrics**
- AI struggles with non-English lyrics (e.g., Chinese, Malay)
- System generates scenes based on audio mood analysis only
- Creator can provide English translations to improve accuracy
- System re-analyzes with translations

**AF-04: AI Scene Planning Service Fails**
- Scene planning API returns error or timeout
- System retries up to 3 times with exponential backoff
- If continues to fail, displays error: "Scene generation temporarily unavailable. Try again in 5 minutes"
- Creator can retry later

**AF-05: Creator Rejects All AI Suggestions**
- Creator marks all suggested scenes as unsuitable
- System offers option to regenerate with different mood/style parameters
- Creator can manually input custom scenes for each segment
- System saves manually-entered scene plan

**Success Outcome:**
- Scene plan successfully generated with timestamp-mapped segments
- Each segment has 3-5 visual scene suggestions
- Chorus/repetition sections identified and flagged for reuse
- Creator can review, edit, and finalize scene plan
- Scene plan saved to database with scene_plan_id
- Creator proceeds to frame generation (UC-03)

**Error Conditions:**
- Lyrics missing → Offer manual input or mood-only analysis
- Song too long → Suggest scene reuse strategy, proceed with caution
- Language unsupported → Fall back to audio mood analysis, allow translation upload
- AI service unavailable → Retry with backoff, inform creator of delay
- Creator input invalid → Validate and reject, ask for correction

**Key Acceptance Criteria:**
- ✓ Scene plan generated within 30 seconds for songs <5 minutes
- ✓ Each time segment has 3-5 distinct scene suggestions
- ✓ Chorus sections correctly identified and marked for reuse
- ✓ Creator can edit and save custom scenes
- ✓ Scene plan persists in database and can be retrieved
- ✓ Error messages clear and actionable

---

## UC-03: Generate Frames with Scene Visuals and Duration Mapping

**Use Case Name:** AI Frame Generation - Create Cinematic Visuals Synced to Time Intervals

**Primary Actor:** Registered Creator

**Secondary Actors:**
- AI Video Generation Service (text-to-image or similar)
- Scene Plan (from UC-02)
- Song Audio (from UC-01)
- Frame Storage Service

**Preconditions:**
- Scene plan has been finalized (UC-02 complete)
- Song audio is stored and accessible
- Creator has confirmed frame generation parameters (resolution, aspect ratio, style)
- Creator has sufficient generation credits/quota

**Triggers:**
- Creator clicks "Generate Frames" on finalized scene plan
- Creator confirms generation preferences (quality level, visual style filters)
- System initiates frame generation batch process

**Goal:**
AI generates individual visual frames for each time segment, creating a sequence of cinematic scenes that can be stitched together into a complete music video, with each frame precisely timed to the song's audio.

**Main Flow:**

1. System retrieves finalized scene plan with segments and timestamps
2. System retrieves song audio file
3. **For each scene segment in the plan:**
   - System retrieves segment description and visual suggestions from scene plan
   - System prepares AI generation prompt (scene description + mood + theme context)
   - System calls AI image generation service with prompt
   - AI service generates image frame
   - System stores generated frame with metadata:
     - frame_id (unique identifier)
     - scene_id (linked to scene plan segment)
     - start_timestamp
     - end_timestamp
     - duration_seconds
     - visual_description
     - generation_timestamp
   - System retrieves next segment and repeats
4. **For repeated sections (choruses):**
   - System identifies if segment marked for reuse from scene plan
   - System retrieves previously generated frame from storage instead of regenerating
   - System links frame_id to current segment with same timing
5. System monitors generation progress and displays to creator:
   - Progress bar showing frames generated vs. total
   - Current segment being processed
   - Estimated time remaining
6. Once all frames generated:
   - System creates frame sequence manifest (ordered list of frame IDs with timestamps)
   - System stores manifest linked to song_id
   - System displays frame preview gallery to creator
   - Creator can:
     - View each frame with its timing
     - Regenerate individual frames if unsatisfied
     - Proceed to frame-to-video stitching (UC-04)
7. System saves frame generation metadata to database

**Alternate Flows:**

**AF-01: AI Generation Service Rate-Limited**
- AI service returns rate limit error mid-batch
- System pauses generation and waits for rate limit reset
- System resumes from last successful frame
- Creator sees notification: "Generation paused. Resuming in [X] seconds"

**AF-02: Individual Frame Generation Fails**
- AI service fails on specific segment (e.g., offensive prompt detection)
- System logs error with segment details
- System skips segment or uses fallback generic scene
- Creator shown warning: "Frame [X] failed to generate. Using fallback."
- Creator can manually edit scene description and retry individual frame

**AF-03: Creator Requests Frame Regeneration**
- Creator is unsatisfied with generated frame quality
- Creator clicks "Regenerate" on specific frame
- System re-runs AI generation for that segment only
- Previous frame replaced with new generation
- Other segments unchanged

**AF-04: Insufficient Generation Credits**
- Creator reaches quota limit mid-generation
- System pauses and displays: "Generation quota exceeded. Upgrade account or retry later"
- System saves progress so far
- Creator can upgrade and resume, or edit scene plan to reduce scope

**AF-05: Frame Storage Service Failure**
- Generated frames cannot be stored due to service outage
- System retries frame storage up to 3 times
- If continues to fail, displays error and pauses generation
- Creator can retry once service recovers

**Success Outcome:**
- All frames successfully generated for all song segments
- Frames stored with unique frame_ids and precise timestamps
- Repeated sections reuse previously generated frames
- Frame manifest created with ordered sequence and timings
- Creator sees preview gallery of all generated frames
- Frame generation metadata saved to database
- Creator can proceed to video stitching (UC-04)

**Error Conditions:**
- AI service rate limited → Pause, wait, resume from last success
- Individual frame fails → Skip, use fallback, allow regeneration
- Insufficient credits → Pause, inform creator, allow retry after upgrade
- Storage unavailable → Retry with backoff, pause if unresolved
- Offensive prompt detected → Skip segment, ask creator to modify scene description

**Key Acceptance Criteria:**
- ✓ Frames generated with consistent quality and resolution
- ✓ Frame timing matches song segments precisely
- ✓ Chorus frames reused correctly without regeneration
- ✓ Progress tracking updated in real-time
- ✓ Creator can regenerate individual frames on demand
- ✓ Generation completes within reasonable timeframe (e.g., <5 min for 5-min song)
- ✓ All frames persisted and retrievable by frame_id

---

## UC-04: Stitch Frames into Video and Sync Lyrics

**Use Case Name:** Video Assembly - Stitch Frames into Complete Music Video with Lyric Synchronization

**Primary Actor:** Registered Creator

**Secondary Actors:**
- Video Encoding Service
- Subtitle Generation Service
- Song Audio (from UC-01)
- Frame Sequence (from UC-03)
- Video Storage Service

**Preconditions:**
- All frames have been generated and stored (UC-03 complete)
- Song audio is accessible and original duration confirmed
- Creator has confirmed subtitle/lyric display preferences
- Frame manifest with ordered sequence and timestamps exists in database

**Triggers:**
- Creator clicks "Assemble Video" after reviewing generated frames
- Creator confirms video assembly parameters (resolution, frame rate, subtitle style)
- System initiates video encoding and assembly process

**Goal:**
System stitches generated frames in sequence with the original song audio, synchronizes lyrics to display on-screen at precise timestamps, and produces a complete, playable music video artifact.

**Main Flow:**

1. System retrieves frame manifest with ordered frames and timestamps
2. System retrieves original song audio file
3. System retrieves song lyrics and timing data (from UC-09)
4. **Video Assembly Phase:**
   - System iterates through frame manifest in order
   - For each frame:
     - System retrieves frame image from storage
     - System calculates display duration based on segment timing:
       - If segment 0:00-0:10, display frame for 10 seconds
       - If reused frame, maintain same duration as original segment
     - System applies frame to video at correct timing
   - System inserts song audio track starting at 0:00
   - System generates video artifact (temporary file)
5. **Lyric Synchronization Phase:**
   - System retrieves lyric data with line timings (e.g., "Line 1: 0:00-0:05", "Line 2: 0:05-0:10")
   - System generates subtitle file (SRT format) with lyric text and timestamps
   - System embeds subtitles into video at calculated positions
   - Subtitle styling applied (font, size, color, background based on creator preferences or theme)
   - **Subtitle positioning:** Subtitles appear at bottom of frame, adjusting for lyric length and character count
6. System encodes final video to standard format (MP4, H264, AAC audio)
7. System performs quality check:
   - Audio and video sync verified (lip-sync alignment check if applicable)
   - Subtitle timing verified (no overlaps, proper display duration)
   - Video duration matches song duration within 1 second tolerance
   - Video resolution and frame rate match specified parameters
8. System stores final video with metadata:
   - video_id (unique identifier)
   - song_id (linked to original song)
   - duration_seconds
   - resolution
   - frame_rate
   - subtitle_language
   - creation_timestamp
9. System displays video preview to creator
10. Creator can:
    - Play video preview to verify quality
    - Make adjustments if needed (return to UC-02 or UC-03 for regeneration)
    - Publish video (UC-12)
    - Export video file
11. System saves final video record to database

**Alternate Flows:**

**AF-01: Audio-Video Sync Drift**
- Generated video plays but audio falls out of sync
- System detects drift during quality check (>500ms deviation)
- System re-encodes with audio sync correction
- Creator notified: "Audio sync corrected. Reprocessing..."
- Video re-assembled with corrected timing

**AF-02: Lyric Timing Misalignment**
- Subtitle timings don't align with actual song performance
- Creator receives warning: "Subtitle timing appears offset from audio"
- Creator can:
  - Accept timing as-is
  - Manually adjust lyric timing data
  - Request automatic lyric re-sync (attempts to detect sung lyrics)
- Video re-assembled with updated timing

**AF-03: Subtitle Display Overflow**
- Lyric text is too long to display on single line
- System automatically:
  - Splits lyric across 2 lines
  - Reduces font size to fit
  - Extends display duration to allow reading
- Creator can manually edit lyric display settings

**AF-04: Video Encoding Failure**
- Video encoding service returns error (unsupported codec, memory limit)
- System retries with fallback codec (e.g., H264 → VP9)
- If continues to fail, displays error: "Video encoding failed. Try again or contact support"
- Creator can retry or export frames as image sequence instead

**AF-05: Video Too Large**
- Final video file exceeds storage or upload limits
- System compresses video further (reduce bitrate, resolution)
- Creator offered options:
  - Accept compressed version (lower quality)
  - Split video into parts (if >20 minutes)
  - Reduce scene complexity
- Creator confirms compression preference

**AF-06: Storage Service Unavailable**
- Final video cannot be stored due to service outage
- System displays error: "Video storage temporarily unavailable. Try again in 5 minutes"
- System retains video artifact in temporary cache
- Creator can retry once service recovers

**Success Outcome:**
- Complete music video file generated successfully
- Video duration matches song duration precisely
- Lyrics synchronized and displayed at correct timestamps
- Audio and video in sync (verified by quality check)
- Video stored with video_id and linked to song_id
- Creator sees playable video preview
- Creator can publish, export, or make further edits
- Video record persisted in database

**Error Conditions:**
- Audio-video sync drift → Re-encode with sync correction
- Lyric timing misaligned → Offer manual adjustment or auto-resync
- Subtitle overflow → Auto-split, reduce font, or extend duration
- Encoding fails → Retry with fallback codec, offer alternative export
- File too large → Compress with creator approval
- Storage unavailable → Retry with backoff, inform creator of delay

**Key Acceptance Criteria:**
- ✓ Video playable with correct audio-video sync (<100ms deviation)
- ✓ Lyrics display at precise timestamps matching song
- ✓ Video duration matches song duration within 1 second
- ✓ Subtitles readable and properly positioned
- ✓ Video quality consistent across all frames
- ✓ Final video file generated within reasonable timeframe (<10 min for 5-min song)
- ✓ Video stored and retrievable by video_id

---

# MEMBER 2: CREATOR DASHBOARD & SONG MANAGEMENT

## UC-05: Creator Registration and Account Setup

**Use Case Name:** Creator Registration and Initial Account Setup

**Primary Actor:** New Creator (Guest transitioning to Registered)

**Secondary Actors:**
- Authentication Service
- Database (User Records)
- Email Service (optional for confirmation)

**Preconditions:**
- User accessing platform for first time
- User is not already registered
- Platform registration is open (no waitlist restrictions)

**Triggers:**
- New user clicks "Create Creator Account" from login page
- New user completes registration form
- New user submits registration

**Goal:**
New creator can register with platform, create secure account credentials, and set up profile to begin uploading songs and generating videos.

**Main Flow:**

1. System displays registration form with fields:
   - Email address
   - Password (with strength requirements: min 8 chars, uppercase, number, symbol)
   - Creator Name (display name for public profile)
   - Theme Preference (select primary interest: National Day, Chinese New Year, General, Other)
2. Creator fills in all required fields
3. Creator submits registration form
4. System validates:
   - Email format is valid
   - Email not already registered
   - Password meets strength requirements
   - Creator name not empty and <50 characters
5. System creates user account:
   - Hashes password using bcrypt or similar
   - Generates unique user_id
   - Stores user record in database with:
     - user_id, email, password_hash, creator_name, theme_preference, created_at, account_status (ACTIVE)
6. System creates initial user profile:
   - Creates empty song library
   - Initializes generation quota (if applicable)
   - Sets default preferences (video quality, subtitle style, theme)
7. System sends confirmation email (if enabled) with account activation link
8. Creator confirms email (or skips if email confirmation optional)
9. System transitions creator to authenticated state
10. System displays dashboard welcome screen
11. Creator now has access to:
    - Song upload (UC-01)
    - Dashboard (UC-06)
    - Settings (profile management)

**Alternate Flows:**

**AF-01: Email Already Registered**
- System detects email exists in database
- System displays error: "Email already registered. Login or use different email"
- Creator can:
  - Use login form with existing email
  - Use different email to register new account
  - Click "Forgot Password" if existing account

**AF-02: Password Doesn't Meet Requirements**
- Password missing uppercase, number, or symbol
- System displays error: "Password must contain uppercase, number, and symbol. Min 8 characters"
- Creator can edit password and resubmit

**AF-03: Email Confirmation Fails**
- Email service unavailable when sending confirmation
- System displays message: "Account created. Confirmation email failed to send. Try resending or skip confirmation"
- Creator can:
  - Retry email send
  - Skip confirmation and access account
  - Update email address

**AF-04: Registration Service Unavailable**
- Database or auth service temporarily down
- System displays error: "Registration temporarily unavailable. Please try again in a few minutes"
- Creator's input may be retained in form for retry

**AF-05: Creator Name Already Taken**
- Duplicate creator names not allowed in system
- System displays error: "Creator name taken. Choose a different name"
- Creator can edit name and retry

**Success Outcome:**
- User account successfully created with unique user_id
- Email confirmed (if required) or account activated immediately
- Creator profile initialized with default preferences
- Creator logged in automatically post-registration
- Creator can access dashboard and upload first song
- Account record persisted in database

**Error Conditions:**
- Email already registered → Suggest login or alternative email
- Weak password → Display requirements, ask for edit
- Email confirmation failed → Offer retry or skip
- Registration service down → Inform of delay, offer retry
- Duplicate creator name → Ask for alternative name

**Key Acceptance Criteria:**
- ✓ Registration form accepts valid input within 2 seconds
- ✓ Password strength validation clear and helpful
- ✓ Account created successfully in database
- ✓ Creator automatically logged in post-registration
- ✓ Error messages actionable and user-friendly
- ✓ Account can be reactivated if deactivated

---

## UC-06: View Creator Dashboard and Manage Song Library

**Use Case Name:** Creator Dashboard - View, Organize, and Manage Song Library

**Primary Actor:** Registered Creator

**Secondary Actors:**
- Database (Song Records)
- Session Management

**Preconditions:**
- Creator is logged in and authenticated
- Creator has at least one uploaded song (or empty dashboard on first visit)
- Creator's user_id and session token are valid

**Triggers:**
- Creator logs in successfully and lands on dashboard
- Creator clicks "Dashboard" from navigation menu
- Creator navigates to /dashboard URL

**Goal:**
Creator can view all uploaded songs in organized library, see generation status, access song management tools, and quickly initiate new uploads or video generation workflows.

**Main Flow:**

1. System retrieves creator's user_id from session token
2. System queries database for all songs associated with user_id
3. System retrieves for each song:
   - song_id, title, artist_name, theme, upload_date, duration
   - video_generation_status (NOT_STARTED, IN_PROGRESS, COMPLETED, FAILED)
   - thumbnail (if video generated)
   - last_modified_date
4. System displays dashboard with layout:
   - Header: Creator name and profile menu
   - "Upload New Song" button (prominent)
   - Filter/sort options:
     - Filter by theme (All, National Day, CNY, General, Other)
     - Filter by status (All, In Progress, Completed, Failed)
     - Sort by: Date Added, Title, Theme, Status
   - Song library grid/list view with:
     - Song thumbnail or album art (if available)
     - Song title and artist name
     - Theme tag
     - Duration
     - Video status indicator (not started / in progress / completed / error)
     - Quick action buttons: Generate Video, Edit Metadata, Preview, Delete, Publish
5. Creator can interact with songs:
   - Click on song to view detail page (UC-07)
   - Click "Generate Video" to start video generation workflow (UC-02-UC-04)
   - Click "Edit Metadata" to modify song details (UC-09)
   - Click "Publish" to make song/video public (UC-12)
   - Click "Delete" to remove song
   - Hover for preview/more info
6. System displays dashboard statistics:
   - Total songs uploaded
   - Videos completed
   - Videos in progress
   - Generation quota usage (if applicable)
7. Creator can access:
   - Settings (profile, preferences)
   - Account management
   - Logout

**Alternate Flows:**

**AF-01: No Songs Uploaded Yet**
- Creator's song library is empty
- Dashboard displays empty state message: "No songs yet. Upload your first song to get started"
- Dashboard shows "Upload New Song" button prominently
- Dashboard suggests example workflow

**AF-02: Filter Applied**
- Creator filters songs by theme or status
- System re-queries database with WHERE clause (theme = X AND status = Y)
- Dashboard updates to show only matching songs
- Filter badges remain visible to show active filters

**AF-03: Sort Applied**
- Creator selects sort option (e.g., "Newest First")
- System re-queries and orders results accordingly
- Sorted results displayed in dashboard

**AF-04: Song Generation in Progress**
- Creator views dashboard while video generation running for a song
- System shows progress indicator on song: "Generating... 45% complete"
- Dashboard auto-refreshes status every 10 seconds
- Creator can click progress indicator to see more details
- Creator can cancel in-progress generation if desired

**AF-05: Database Query Timeout**
- Dashboard fails to load songs due to slow database response
- System displays error: "Dashboard loading. Please wait..."
- System retries database query with timeout of 30 seconds
- If persists, displays: "Unable to load dashboard. Refresh page or try again later"

**AF-06: Session Expired**
- Creator's session token expired
- System detects invalid session and redirects to login
- Previous dashboard state lost
- Creator logs in again to re-access dashboard

**Success Outcome:**
- Dashboard loads with all creator's songs displayed
- Song library organized and filterable by theme/status
- Creator can see video generation status at a glance
- Creator can quickly access song management tools
- Creator can initiate new workflows (upload, generate, publish)
- Dashboard remains current with live status updates
- Creator can efficiently manage entire song library

**Error Conditions:**
- No songs in library → Show empty state with upload prompt
- Database query slow → Show loading state, retry, or error message
- Session expired → Redirect to login
- Filter/sort query fails → Show error, reset filters

**Key Acceptance Criteria:**
- ✓ Dashboard loads within 3 seconds
- ✓ All user's songs displayed with correct metadata
- ✓ Filter and sort functions work accurately
- ✓ Video generation status updates in real-time
- ✓ Quick action buttons accessible for all songs
- ✓ Empty state messaging helpful and clear
- ✓ Session management prevents unauthorized access

---

## UC-07: View Song Detail Page and Generation History

**Use Case Name:** Song Detail Page - View Complete Song Information and Generation History

**Primary Actor:** Registered Creator

**Secondary Actors:**
- Database (Song, Video, and Generation Records)
- Session Management

**Preconditions:**
- Creator is logged in
- Creator owns the song being viewed (song_id associated with their user_id)
- Song exists in database

**Triggers:**
- Creator clicks on song from dashboard (UC-06)
- Creator navigates to /songs/{song_id} URL
- Creator clicks "View Details" on any song

**Goal:**
Creator can view complete song information, metadata, generated videos, and generation history with ability to manage individual video versions and generation attempts.

**Main Flow:**

1. System retrieves song_id from URL or click context
2. System validates that creator owns this song
3. System queries database for song record:
   - song_id, title, artist_name, theme, language, description
   - upload_date, duration, file_path, file_size
   - lyrics (full text, if available)
   - thumbnail_url (if video exists)
4. System queries database for all videos generated from this song:
   - video_id, generation_date, status, duration, resolution, subtitle_language
   - video_url (playable link)
   - scene_plan_id, frame_manifest_id (for traceability)
5. System queries database for generation history:
   - All generation attempts (successful and failed)
   - Attempt timestamp, status, error message (if failed)
   - Duration of generation process
   - Parameters used (quality level, style, etc.)
6. System displays song detail page with sections:
   - **Song Information:**
     - Title, artist, theme, language, description
     - Duration, upload date
     - Thumbnail/album art
     - Lyrics (expandable)
   - **Video Library:**
     - List of generated videos with thumbnails
     - For each video:
       - Video player preview
       - Generation date
       - Status (published/draft)
       - Download button
       - Delete button
       - Publish/unpublish toggle (UC-12)
   - **Generation History:**
     - Table of all generation attempts
     - Columns: Attempt #, Date, Status, Duration, Parameters, Action (retry/delete)
   - **Song Management Actions:**
     - Edit metadata (UC-09)
     - Generate new video (UC-02-UC-04)
     - Delete song
     - Export song
7. Creator can perform actions:
   - View individual videos with embedded player
   - Delete specific video version
   - Download video file
   - Publish video to public library (UC-12)
   - Retry failed generation (returns to UC-02 or specific failure point)
   - Edit song metadata (UC-09)
   - Upload new version of song audio

**Alternate Flows:**

**AF-01: Creator Not Owner of Song**
- Creator attempts to view song they don't own
- System detects ownership mismatch
- System returns 403 Forbidden error: "You don't have permission to view this song"
- Creator redirected to dashboard

**AF-02: Song Has No Videos**
- Song uploaded but no video generated yet
- Video library section shows empty state: "No videos generated yet"
- Prominent "Generate Video" button displayed
- Generation history table empty or shows no attempts

**AF-03: Multiple Videos Exist**
- Creator has generated multiple video versions (e.g., different styles, attempts)
- All videos listed in video library
- Creator can compare, download, or delete individual versions
- Creator can mark one as "primary" for publishing

**AF-04: Song File Deleted or Lost**
- Original song file no longer exists in storage
- System shows warning: "Original audio file not available"
- Previously generated videos still playable
- Creator cannot regenerate videos but can delete and re-upload song

**AF-05: Generation History Long**
- Creator has made many generation attempts
- History table paginated (show 10 per page)
- Pagination controls allow navigation
- Oldest attempts archived but accessible

**AF-06: Database Query Fails**
- Song detail page fails to load due to database error
- System displays error: "Unable to load song details. Try again later"
- Creator can retry or return to dashboard

**Success Outcome:**
- Song detail page displays all song metadata correctly
- All generated videos listed with playable previews
- Generation history shows complete record of attempts
- Creator can manage individual video versions
- Creator can retry failed generations or edit and regenerate
- Creator can publish videos to public library
- All information persists and retrievable

**Error Conditions:**
- Creator not song owner → Return 403 error, redirect to dashboard
- Song file missing → Display warning, disable regeneration, keep videos
- Database query fails → Display error, offer retry
- Page not found → Return 404 error, redirect to dashboard

**Key Acceptance Criteria:**
- ✓ Song detail page loads within 3 seconds
- ✓ All metadata displayed accurately
- ✓ Video previews playable directly on page
- ✓ Generation history complete and sortable
- ✓ Creator can perform all management actions
- ✓ Ownership validation prevents unauthorized access

---

## UC-08: Delete or Archive Song

**Use Case Name:** Delete Song and Associated Artifacts

**Primary Actor:** Registered Creator

**Secondary Actors:**
- Database (Song, Video Records)
- Storage Service (for file cleanup)

**Preconditions:**
- Creator is logged in and owns the song
- Song exists in database
- Creator has navigated to song detail page (UC-07) or dashboard (UC-06)

**Triggers:**
- Creator clicks "Delete Song" button on song detail page
- Creator clicks delete icon next to song on dashboard
- Creator confirms deletion in confirmation dialog

**Goal:**
Creator can permanently remove a song and optionally its generated videos from the platform, freeing up storage and cleaning up library.

**Main Flow:**

1. Creator clicks "Delete" or "Delete Song" button
2. System displays confirmation dialog:
   - Message: "Are you sure you want to delete [Song Title]?"
   - Warning: "This action cannot be undone"
   - Sub-options (radio buttons or checkboxes):
     - "Delete song only (keep generated videos)"
     - "Delete song AND all generated videos"
   - Cancel and Confirm buttons
3. Creator selects option and clicks Confirm
4. System performs validation:
   - Confirms creator ownership of song
   - Checks if any videos are published publicly (UC-12)
   - If published videos exist, displays warning: "This song has published videos. Deleting will remove them from public library."
   - Creator must re-confirm if published content exists
5. **If "Delete Song Only":**
   - System retains all video records (video_id, metadata)
   - System deletes song record (song_id, audio file)
   - System updates song_id reference in video records to NULL (or marks as orphaned)
   - System deletes audio file from storage
6. **If "Delete Song AND Videos":**
   - System queries for all videos linked to song_id
   - System marks all related videos as DELETED
   - System deletes all video files from storage
   - System deletes all scene plans and frame manifests linked to video
   - System deletes song record
   - System deletes audio file from storage
7. System removes song from creator's library
8. System performs garbage collection on related files
9. System displays success message: "Song deleted successfully"
10. System redirects creator to dashboard (UC-06)
11. Song no longer appears in creator's library

**Alternate Flows:**

**AF-01: Published Videos Exist**
- Song has videos published to public library
- System displays warning: "This song has [X] published videos that will be removed from public library"
- Creator given option to:
  - Cancel deletion
  - Unpublish videos first (UC-12), then delete song
  - Proceed with deletion (videos removed from public)
- If proceed, videos removed from public library before deletion

**AF-02: Deletion in Progress**
- Creator has videos currently generating for this song
- System displays warning: "Video generation in progress for this song. Proceed?"
- Creator can:
  - Cancel deletion and wait for generation to complete
  - Proceed (generation canceled, song deleted)
- If proceed, active generation jobs canceled

**AF-03: Storage Deletion Fails**
- System fails to delete files from storage service
- System logs error but continues with database cleanup
- Song and video records deleted from database
- Storage cleanup retried asynchronously later
- Creator shown success message, unaware of storage lag
- Storage files eventually cleaned up by background job

**AF-04: Creator Cancels Deletion**
- Creator clicks Cancel in confirmation dialog
- System closes dialog without making changes
- Creator remains on song detail page or dashboard
- Song record unchanged

**AF-05: Deletion Service Unavailable**
- Database unavailable during deletion attempt
- System displays error: "Unable to delete song. Try again later"
- Song record unchanged
- Creator can retry deletion once service recovers

**Success Outcome:**
- Song successfully deleted from database
- Song removed from creator's library
- Audio files cleaned up from storage
- Creator redirected to dashboard
- Song no longer accessible or visible to creator
- All associated records properly cleaned up
- Creator can verify deletion on dashboard

**Error Conditions:**
- Published videos exist → Display warning, require confirmation
- Generation in progress → Offer cancellation, proceed with deletion
- Storage deletion fails → Continue with database cleanup, retry storage async
- Database unavailable → Display error, retain song, offer retry
- Creator cancels → Close dialog, no changes

**Key Acceptance Criteria:**
- ✓ Confirmation dialog prevents accidental deletion
- ✓ Warning displayed if published videos exist
- ✓ Files properly cleaned from storage
- ✓ Records properly deleted from database
- ✓ Creator cannot recover deleted songs
- ✓ Dashboard reflects deletion immediately
- ✓ Error handling graceful and informative

---

# MEMBER 3: SONG METADATA & PUBLISHING

## UC-09: Enter and Edit Song Metadata

**Use Case Name:** Song Metadata Entry and Editing

**Primary Actor:** Registered Creator

**Secondary Actors:**
- Database (Song Metadata Records)

**Preconditions:**
- Creator has uploaded a song (UC-01 complete)
- Creator is on song metadata entry form or edit screen
- Song exists in database with initial upload metadata

**Triggers:**
- System redirects to metadata form after song upload (UC-01)
- Creator clicks "Edit Metadata" on song detail page (UC-07)
- Creator navigates to /songs/{song_id}/edit URL

**Goal:**
Creator can enter and manage complete song metadata including title, artist, theme, lyrics, language, and description, enabling proper categorization and AI scene planning for video generation.

**Main Flow:**

1. System displays song metadata form with fields:
   - **Title** (required, max 100 characters)
     - Pre-filled if extracted from YouTube or song tags
   - **Artist/Creator Name** (required, max 50 characters)
     - Pre-filled with uploader's creator name, editable
   - **Theme/Category** (required, dropdown)
     - Options: National Day, Chinese New Year, General, Heritage, Celebration, Other
   - **Language** (required, dropdown)
     - Options: English, Mandarin Chinese, Malay, Tamil, Mixed
   - **Description** (optional, max 500 characters)
     - Summary of song content or inspiration
   - **Lyrics** (optional, large text area, max 5000 characters)
     - Full song lyrics for AI analysis and subtitle generation
     - Can be pasted or uploaded from file
   - **Duration** (auto-filled, read-only)
     - Extracted from uploaded audio
   - **Mood/Tone Tags** (optional, checkboxes)
     - Options: Nostalgic, Celebratory, Reflective, Energetic, Peaceful, Emotional, Playful, Inspirational
   - **Key Themes** (optional, tags)
     - Creator can add custom tags (e.g., "family", "heartland", "tradition")
2. Creator fills in required fields:
   - Title, artist, theme, language are mandatory
   - Lyrics recommended but not required
   - Other fields optional
3. Creator can upload lyrics from file (.txt, .docx, .pdf) instead of pasting
4. System validates input:
   - Title not empty and under 100 chars
   - Artist name not empty and under 50 chars
   - Theme selected from dropdown
   - Language selected from dropdown
   - Description under 500 chars if provided
   - Lyrics under 5000 chars if provided
5. Creator submits form (Save)
6. System saves metadata to database:
   - Updates song record with: title, artist_name, theme, language, description, lyrics, mood_tags, custom_themes
   - Updates modified_date timestamp
   - Links metadata to song_id
7. System displays success message: "Metadata saved successfully"
8. Creator can:
   - Proceed to video generation (UC-02)
   - Return to dashboard (UC-06)
   - Make further edits to metadata
9. Metadata persists in database for future reference

**Alternate Flows:**

**AF-01: Lyrics Upload Fails**
- File upload for lyrics fails or file format unsupported
- System displays error: "Unable to read file. Paste lyrics directly or try .txt format"
- Creator can manually paste lyrics or retry with different file
- Existing metadata not affected

**AF-02: Lyrics Auto-Detection**
- System attempts to extract lyrics from song audio (if OCR/Shazam integration available)
- If successful, system populates lyrics field with detected text
- Creator can review and edit before saving
- If unsuccessful, lyrics field remains empty for manual entry

**AF-03: Creator Changes Theme Mid-Editing**
- Creator selects different theme from dropdown
- Form updates to suggest relevant mood tags for new theme
- Previously selected mood tags cleared (or kept with confirmation)
- Creator can re-select or keep existing tags

**AF-04: Character Limit Exceeded**
- Creator pastes description or lyrics exceeding limits
- System displays error: "Description too long. Maximum 500 characters. Current: [X]"
- Creator can edit text to fit limit or choose to truncate
- System does not save until corrected

**AF-05: Validation Error**
- Creator submits form with missing required field
- System displays error: "Title is required"
- Form highlights missing field
- Creator cannot submit until corrected

**AF-06: Session Expires During Edit**
- Creator editing metadata for extended period
- Session token expires
- System detects expiration and displays: "Your session expired. Log in to continue"
- Creator's form data is lost
- Creator logs in and retries

**Success Outcome:**
- Metadata successfully saved to database
- Title, artist, theme, language correctly stored
- Lyrics stored for AI scene planning
- Mood tags and custom themes associated with song
- Creator can proceed to video generation with metadata context
- Metadata retrievable for future edits
- All fields properly validated and persisted

**Error Conditions:**
- File upload fails → Offer manual paste or retry
- Character limits exceeded → Display error, require correction
- Required fields missing → Highlight field, prevent submission
- Session expires → Redirect to login, retain form (if possible)
- Database save fails → Display error, offer retry

**Key Acceptance Criteria:**
- ✓ Metadata form loads and submits within 3 seconds
- ✓ All required fields properly validated
- ✓ Character limits enforced
- ✓ File uploads (for lyrics) work for .txt format
- ✓ Metadata persists in database correctly
- ✓ Creator can edit metadata multiple times
- ✓ Mood tags and themes properly associated with song

---

## UC-10: View and Manage Published Song in Public Library

**Use Case Name:** Public Song Library - Browse, Filter, and Interact with Published Songs

**Primary Actor:** Guest User or Registered Creator (viewer role)

**Secondary Actors:**
- Database (Published Song Records)
- Public Library Service

**Preconditions:**
- At least one song has been published to public library (UC-12 complete)
- User accessing public library
- Public library is enabled and accessible

**Triggers:**
- User clicks "Public Library" or "Explore Songs" link
- User navigates to /library or /public-songs URL
- User searches for songs through search interface

**Goal:**
Users can discover published songs from the community, filter by theme/mood/language, view song details and generated videos, and engage with community content without needing to upload their own.

**Main Flow:**

1. System displays public song library landing page
2. System queries database for all songs with publish_status = "PUBLISHED"
3. System retrieves for each published song:
   - song_id, title, artist_name, theme, language, description, lyrics
   - published_date, publish_count (views)
   - linked_video (primary published video)
   - mood_tags, custom_themes
   - thumbnail_url (from published video)
4. System displays library UI with:
   - **Search bar** (search by title, artist, theme)
   - **Filter options:**
     - Theme (National Day, Chinese New Year, General, Heritage, etc.)
     - Language (English, Mandarin, Malay, Tamil, Mixed)
     - Mood (Nostalgic, Celebratory, Reflective, Energetic, Peaceful, etc.)
   - **Sort options:**
     - Most Recent, Most Popular (views), A-Z, Highest Rated
   - **Song grid/list display:**
     - Song thumbnail or album art
     - Title and artist name
     - Theme and mood tags
     - View count and rating/hearts (if enabled)
     - "View" button to open song detail
5. User can:
   - Click on song to view detail page (UC-11)
   - Apply filters to narrow library
   - Sort results
   - Search by keyword
6. System updates library results based on user filters/search:
   - Database query filtered by: theme, language, mood_tags
   - Database query searched by: title LIKE %, artist_name LIKE %
   - Results sorted by: published_date DESC, view_count DESC, or title ASC
7. System displays pagination if >20 results (20 per page)
8. User can navigate pages or load more results

**Alternate Flows:**

**AF-01: No Published Songs**
- Database query returns empty result set
- System displays empty state message: "No songs in library yet. Check back soon!"
- System encourages user to become creator: "Want to share your music? Create an account"

**AF-02: Search Returns No Results**
- User searches for term not matching any published song
- System displays empty results: "No songs found matching '[search term]'"
- System suggests: "Try different keywords or explore by theme"
- System shows popular songs as alternative

**AF-03: Filter Combination Returns Few Results**
- User combines multiple filters (e.g., Tamil language + CNY theme)
- Database returns <5 results
- System displays results with note: "Only [X] songs match your filters"
- System suggests relaxing filters to see more

**AF-04: User is Registered Creator Viewing Own Published Song**
- Registered creator viewing song they published
- System identifies creator ownership
- Song displays with additional action buttons: "Manage", "Edit", "Unpublish"
- Creator can edit or unpublish directly from library view

**AF-05: Database Query Timeout**
- Public library query taking too long (>5 seconds)
- System displays loading state: "Loading library..."
- System retries with simplified query (fewer filters)
- If persists, displays error: "Library temporarily unavailable. Try again later"

**AF-06: Pagination Navigation**
- User navigates to page 5 of results
- System calculates OFFSET for database query: (page - 1) × 20
- System retrieves next 20 results and displays
- Page navigation shows current page and total pages

**Success Outcome:**
- Public library displays all published songs
- Users can filter, search, and sort results
- Each song shows title, artist, theme, preview thumbnail
- Users can click through to song detail page (UC-11)
- Library remains discoverable and navigable
- Results accurate and up-to-date
- Pagination works smoothly for large library

**Error Conditions:**
- No published songs → Show empty state
- Search returns nothing → Show empty results, suggest alternatives
- Query timeout → Show loading state, retry, or display error
- Database unavailable → Display error, offer retry

**Key Acceptance Criteria:**
- ✓ Library loads within 3 seconds
- ✓ Filters work accurately (theme, language, mood)
- ✓ Search returns relevant results
- ✓ Pagination works for large result sets
- ✓ Creator can manage own published songs from library
- ✓ Empty states handled gracefully

---

## UC-11: View Public Song Detail and Watch Generated Video

**Use Case Name:** Public Song Detail Page - View Song Information and Watch Generated Video

**Primary Actor:** Guest User or Registered User (viewer role)

**Secondary Actors:**
- Database (Published Song, Video Records)
- Video Streaming Service

**Preconditions:**
- Song is published (publish_status = "PUBLISHED")
- Video has been generated and published with the song
- User has accessed public library (UC-10) or direct URL

**Triggers:**
- User clicks "View" on song in public library (UC-10)
- User navigates to /library/{song_id} URL
- User receives direct link to published song

**Goal:**
User can view published song metadata, watch the AI-generated music video, read lyrics, and learn about the song's theme and cultural context.

**Main Flow:**

1. System retrieves song_id from URL
2. System queries database for published song record:
   - song_id, title, artist_name, theme, language, description
   - published_date, view_count
   - Lyrics (if available)
   - Mood tags and custom themes
3. System queries for linked published video:
   - video_id, video_url (streaming link), duration, resolution
   - subtitle_language, generation_date
4. System displays song detail page with:
   - **Video Player:**
     - Embedded video player (HTML5 or streaming service)
     - Play/pause, volume, fullscreen controls
     - Progress bar with seek capability
     - Subtitle toggle (CC button)
   - **Song Information:**
     - Title, artist name, theme badge
     - Published date and view count
     - Description (if provided)
     - Mood tags displayed as pills/badges
   - **Lyrics Display:**
     - Full lyrics (if available) with expandable section
     - Lyrics highlighted/synced to video playback (if available)
   - **Creator Attribution:**
     - Creator name linked to public profile (if applicable)
     - "More from this creator" link
   - **Interaction Options:**
     - Heart/Like button (optional, if engagement tracking enabled)
     - Share button (social media, link copy)
     - Download video button (if enabled for this platform)
5. User can:
   - Click play to watch video
   - Read and expand lyrics
   - Toggle subtitles
   - Share video via social or link
   - Like/heart the song
   - View other songs by same creator
   - Return to library
6. System tracks view:
   - Increments view_count for song in database
   - Records view timestamp (for analytics)
7. Video plays from start to end with synchronized audio and visuals

**Alternate Flows:**

**AF-01: Song Published But No Video Generated**
- Song is in public library but video_id is NULL or absent
- System displays song metadata and message: "Video not yet available. Check back soon"
- Video player space shows placeholder or static image
- User can still read lyrics and song info

**AF-02: Video Player Error**
- Video fails to load or stream (codec not supported, URL broken)
- System displays error: "Unable to play video. Try refreshing or using different browser"
- User offered alternative: "Download video" or "Try again"
- Video player shows error state

**AF-03: Subtitles Not Available**
- Subtitle toggle clicked but no subtitle file available
- CC button shows as disabled or click shows message: "Subtitles not available for this video"
- Video continues to play without subtitles
- No error displayed

**AF-04: User is Original Creator**
- Registered creator views their own published song
- System detects creator ownership
- Song detail shows additional buttons: "Manage", "Unpublish", "Edit Metadata"
- Creator can manage song directly from public page

**AF-05: User Attempts Download (If Restricted)**
- Download button clicked but feature disabled for this song
- System displays message: "Download not available for this content"
- User can still watch and share

**AF-06: Video Large File, Streaming Slow**
- Video quality auto-downgraded due to slow connection
- System displays loading indicator during buffering
- Video continues to play at lower quality
- User can manually select quality if controls available

**AF-07: Song Unpublished While Viewing**
- Song unpublished by creator while user viewing
- System detects publish_status change
- Page displays error or redirects: "This song is no longer available"
- User returned to library

**Success Outcome:**
- Song detail page loads within 3 seconds
- All song metadata displayed accurately
- Video plays with synchronized audio and visuals
- Lyrics display correctly (if available)
- Subtitles toggleable if available
- User can share video and interact with content
- View count incremented
- Creator attribution visible

**Error Conditions:**
- Video fails to stream → Display error, offer refresh/alternative
- No video generated → Show metadata, display placeholder
- Subtitles unavailable → Disable CC button gracefully
- Song unpublished → Display error, redirect to library

**Key Acceptance Criteria:**
- ✓ Page loads and video plays within 5 seconds
- ✓ Audio and video synchronized
- ✓ Subtitles display correctly when available
- ✓ View count increments on each page load
- ✓ Creator attribution links to creator profile
- ✓ Share button works for major platforms
- ✓ Video quality adapts to connection speed

---

## UC-12: Publish Song and Video to Public Library

**Use Case Name:** Publish Song - Make Song and Video Publicly Visible

**Primary Actor:** Registered Creator

**Secondary Actors:**
- Database (Song, Video, Publish Records)
- Public Library Service

**Preconditions:**
- Creator owns the song
- Video has been successfully generated (UC-04 complete)
- Creator is on song detail page (UC-07) or video detail page
- Song metadata is complete (UC-09)

**Triggers:**
- Creator clicks "Publish" or "Publish to Library" button on song detail page
- Creator confirms publish action in dialog
- Creator has unpublished song and clicks "Publish Again"

**Goal:**
Creator can make their song and generated video publicly visible in the community library, enabling community members to discover, watch, and engage with the content.

**Main Flow:**

1. Creator clicks "Publish" button on song detail page or video
2. System displays publish confirmation dialog with:
   - Message: "Publish [Song Title] to Public Library?"
   - Warning: "Your song and video will be visible to all users"
   - Checkbox (optional): "Allow community to download video"
   - Checkbox (optional): "Allow community to remix/reuse audio"
   - Cancel and Confirm buttons
3. Creator reviews options and clicks Confirm
4. System performs pre-publish validation:
   - Confirms creator ownership of song
   - Confirms video exists and is valid
   - Confirms song metadata complete (title, artist, theme set)
   - Checks if song already published (to avoid duplicates)
5. System creates publish record in database:
   - Updates song record: publish_status = "PUBLISHED"
   - Sets published_date = current timestamp
   - Creates publish_config record with creator's checkbox selections
   - Links video_id to published_song_id
6. System makes song and video queryable in public library:
   - Song now appears in UC-10 public library queries
   - Video now accessible via UC-11 public song detail page
7. System performs post-publish actions:
   - Generates public URL for song: https://platform.com/library/{song_id}
   - Increments creator's "published_count" metric
   - Sends confirmation email to creator (optional)
   - Displays shareable link to creator
8. System displays success message:
   - "Song published successfully!"
   - "View in library: [link]"
   - "Share with others: [shareable URL]"
   - "Share buttons" for social media
9. Creator can:
   - View published song in library (UC-10)
   - Copy shareable link
   - Share on social media
   - Return to dashboard
   - Unpublish later if desired (AF-02)

**Alternate Flows:**

**AF-01: Video Not Generated**
- Creator attempts to publish song without generated video
- System displays error: "Cannot publish song without video. Generate video first (UC-04)"
- Creator directed back to song detail to initiate video generation
- Song not published

**AF-02: Unpublish (Creator Changes Mind)**
- Creator clicks "Unpublish" on published song
- System displays confirmation: "Unpublish [Song Title]?"
- Creator confirms
- System updates publish_status = "UNPUBLISHED"
- Song immediately removed from public library queries
- Song no longer appears in UC-10 browse or search
- URL still accessible (if direct link known) but marked as private
- Creator can republish later if desired

**AF-03: Song Already Published**
- Creator clicks publish on song already in public library
- System detects existing published_status = "PUBLISHED"
- System displays message: "This song is already published"
- Offers options:
  - "View in library" (link to UC-10)
  - "Unpublish" (to remove from library)
  - "Update" (to refresh metadata, UC-09)
- No duplicate publish record created

**AF-04: Metadata Incomplete**
- Song missing required metadata (title, artist, theme)
- System displays error: "Complete metadata before publishing (UC-09)"
- Creator directed to edit metadata
- Song not published

**AF-05: Database Publish Transaction Fails**
- Publish database transaction fails mid-process
- System rolls back all changes
- Song remains unpublished
- System displays error: "Publish failed. Please try again"
- Creator can retry

**AF-06: Creator Publishes Multiple Videos**
- Creator has generated multiple video versions
- Creator selects which video to publish with song
- System confirms: "Publish [Video Version] as primary?"
- Only selected video linked to published song
- Other video versions remain private/draft

**AF-07: Creator Sets Download Restrictions**
- Creator unchecks "Allow download" in publish dialog
- System sets download_enabled = false for published song
- Video player does not show download button for public users
- Creator still has access to download on own dashboard

**Success Outcome:**
- Song publish_status updated to "PUBLISHED" in database
- Song now visible in public library (UC-10)
- Public song detail page (UC-11) accessible
- Published date recorded
- Shareable URL generated and provided to creator
- Creator receives confirmation with share options
- Song discoverable by community members
- Video plays for public audience

**Error Conditions:**
- Video not generated → Display error, redirect to generate
- Metadata incomplete → Display error, redirect to edit
- Song already published → Display info, offer view/unpublish options
- Publish transaction fails → Rollback, display error, allow retry
- Database unavailable → Display error, offer retry

**Key Acceptance Criteria:**
- ✓ Publish process completes within 5 seconds
- ✓ Song immediately appears in public library queries
- ✓ Public URL generated and functional
- ✓ Shareable link works for social media
- ✓ Unpublish immediately removes from library
- ✓ Creator can republish after unpublishing
- ✓ Download/remix restrictions respected

---

# MEMBER 4: GUEST/PUBLIC INTERACTIONS & ERROR HANDLING

## UC-13: Guest User Browse Public Library Without Registration

**Use Case Name:** Guest User Access - Browse Public Library Without Account

**Primary Actor:** Guest User (unauthenticated)

**Secondary Actors:**
- Database (Published Song Records)
- Session Management (temporary guest session)

**Preconditions:**
- Public library is enabled and has published songs
- User has not logged in
- User accessing platform via web browser

**Triggers:**
- New user clicks "Explore Library" or "Browse Songs" without logging in
- New user navigates directly to /library URL
- New user arrives from external link to public song

**Goal:**
Guest users can browse published songs and watch generated music videos without requiring registration, lowering barrier to community engagement while potentially encouraging future creator signup.

**Main Flow:**

1. System detects user is unauthenticated (no valid session token)
2. System creates temporary guest session:
   - Generates guest_session_id (temporary token)
   - Sets session expiry (e.g., 2 hours or session end)
   - Stores in browser localStorage or HTTP cookie
   - Guest_session_id does NOT grant creation/publish permissions
3. System grants read-only access to:
   - Public library (UC-10)
   - Public song detail pages (UC-11)
   - Video playback
   - BUT NOT: song upload, video generation, publishing
4. Guest user can:
   - Browse public library (UC-10)
   - View published songs and metadata
   - Watch generated music videos (UC-11)
   - Search and filter by theme/language/mood
   - Read lyrics
   - Share songs via link or social media
5. Navigation available to guest:
   - Public library link/menu
   - Explore songs
   - NO Dashboard link
   - NO Upload link
   - "Sign Up" or "Log In" button (prominent)
6. When guest interacts with creation features:
   - Guest clicks "Upload Song" or "Generate Video"
   - System redirects to login page with message: "Sign up or log in to upload and create videos"
   - Guest can register (UC-05) or log in to gain creation access
7. Guest session persists across page navigation
8. Guest user tracked as anonymous for analytics (optional)

**Alternate Flows:**

**AF-01: Guest Session Expires**
- Guest session token expires (e.g., after 2 hours inactivity)
- Guest attempting action triggers session check
- System displays message: "Your session expired. Refreshing..."
- System creates new guest session automatically
- Guest can continue browsing without interruption
- No login required (unless attempting creation action)

**AF-02: Guest Attempts to Perform Creator Action**
- Guest clicks "Upload Song", "Generate Video", or "Publish"
- System detects guest_session_id (not user_id)
- System blocks action and displays modal:
  - Message: "Create an account to upload and generate videos"
  - "Sign Up" and "Log In" buttons
  - "Continue Browsing" option
- Guest can sign up (UC-05), log in, or continue as guest

**AF-03: Guest Shares Song via Link**
- Guest copies URL of public song detail page
- Guest shares link in email, social media, etc.
- Recipient (guest or registered user) clicks link
- System displays song detail page (UC-11)
- Recipient can watch and interact as guest or logged-in user

**AF-04: Guest Clears Browser Cache/Cookies**
- Browser data cleared, guest_session_id cookie deleted
- Guest returns to platform
- System detects no valid session
- System creates new guest session
- Guest can continue browsing (no history retained, but platform access not blocked)

**AF-05: Multiple Browser Tabs/Windows**
- Guest opens library in multiple tabs
- Each tab maintains same guest_session_id (from shared cookie)
- Session state consistent across tabs
- Single logout/session end affects all tabs

**AF-06: Guest Database Query Performance**
- Large number of guests simultaneously browsing library
- Public library query (UC-10) may be slow
- System implements caching for public library data:
  - Cache published songs list (refreshed hourly or when new song published)
  - Cache song detail pages (refreshed on update)
- Guest queries hit cache, reducing database load

**Success Outcome:**
- Guest session created and maintained across browsing session
- Guest can freely browse public library and watch videos
- Guest sees clear call-to-action to sign up/log in for creation
- Guest access does not interfere with registered users
- Guest session expires gracefully without data loss
- Guest can become registered user at any time
- Analytics track guest engagement (optional)

**Error Conditions:**
- Session creation fails → Display error, offer retry or continue as stateless guest
- Session expires → Create new session, continue browsing
- Guest attempts creation action → Redirect to login/signup
- Database cache stale → Refresh cache on demand

**Key Acceptance Criteria:**
- ✓ Guest can browse library immediately without signup
- ✓ Guest session persists across page navigation
- ✓ Videos playable for guest users
- ✓ Clear prompts to sign up when attempting creation
- ✓ Guest session expires gracefully
- ✓ No data loss on session expiration
- ✓ Guest can seamlessly convert to registered user

---

## UC-14: Error Handling - Network Failure and Retry Logic

**Use Case Name:** Network Error Resilience - Graceful Handling and User-Driven Retry

**Primary Actor:** Any User (Guest or Registered)

**Secondary Actors:**
- Backend Services (API, Database, Storage)
- Error Monitoring/Logging Service

**Preconditions:**
- User is interacting with any platform feature
- Network connectivity may be unstable or services temporarily unavailable
- Error could occur at any point in workflow

**Triggers:**
- Network connection lost mid-operation
- API service returns 5xx error (server error)
- Database query timeout (>30 seconds)
- Storage service unavailable
- Backend service rate limit exceeded
- Any unplanned fault during user operation

**Goal:**
System gracefully handles network and service failures, informs users clearly about what went wrong, provides recovery options (retry, alternative action, or helpful suggestions), and prevents data loss or inconsistent states.

**Main Flow:**

1. **Error Detection:**
   - Frontend detects network error (fetch fails, timeout)
   - Backend returns error status (500, 503, 429, etc.)
   - Timeout threshold exceeded (e.g., 30 seconds for DB query)
2. **Error Logging:**
   - System logs error with context:
     - Error type and message
     - User_id (if logged in) or guest_session_id
     - Timestamp
     - Operation being performed
     - API endpoint or database query
   - Error forwarded to monitoring service for alerting
3. **User-Facing Error Display:**
   - System displays error message appropriate to error type:
     - **Network Error:** "Connection lost. Please check your internet and try again"
     - **Server Error (500):** "Something went wrong. Our team has been notified. Try again in a moment"
     - **Service Unavailable (503):** "Service temporarily unavailable. Please try again in 5 minutes"
     - **Rate Limited (429):** "Too many requests. Please wait a moment and try again"
     - **Timeout:** "Operation taking longer than expected. Try again or contact support"
   - Error message displayed in clear, non-technical language
   - Modal or banner with error details (not technical stack trace)
4. **Recovery Options Presented:**
   - **"Retry" button** - allows user to reattempt operation
   - **"Go Back" button** - return to previous screen
   - **"Contact Support" link** - optional, for persistent errors
   - **Operation-specific alternative** (e.g., if video generation fails, offer "Edit scene and retry")
5. **Retry Logic with Backoff:**
   - User clicks "Retry" (or automatic retry triggered)
   - System checks if error is retryable (network, timeout, 5xx) vs. permanent (validation, 4xx)
   - If retryable:
     - System waits before retrying (exponential backoff: 1s, 2s, 4s)
     - Maximum 3 automatic retry attempts
     - System retries operation
   - If permanent error (validation, client error):
     - System does NOT retry automatically
     - Offers user corrective action or guidance
6. **Success Recovery:**
   - After successful retry, system displays success message
   - User workflow continues as normal
   - User can confirm operation completed or accept result
7. **Persistent Failure Handling:**
   - If 3 retry attempts all fail
   - System displays message: "Operation failed after multiple attempts. Try again later or contact support"
   - Offers: "Contact Support" link or "Return to Dashboard"
   - User directed to safe state (dashboard, library)
8. **Data Preservation:**
   - During long operations (video generation), system periodically saves progress
   - On failure, previous progress saved and can resume
   - Example: "Video generation interrupted at frame 150/200. Resume?"
   - User not required to restart from scratch

**Alternate Flows:**

**AF-01: Partial Operation Completed**
- Operation partially succeeds before failure (e.g., 5 of 10 frames generated)
- System detects partial state
- User displayed: "Video generation paused at 50%. Resume?"
- User can resume or start over
- Partial data retained, not lost

**AF-02: Client-Side Validation Error**
- User input invalid (not a network/service issue)
- System displays validation error immediately (not network error)
- Example: "Password must contain uppercase letter"
- User corrects input and resubmits
- No retry logic needed (user responsibility to fix)

**AF-03: Authentication Token Expired**
- User session/token expired during operation
- System detects 401 Unauthorized response
- System displays: "Your session expired. Log in to continue"
- System redirects to login page
- After login, user can retry operation

**AF-04: Quota Exceeded**
- User quota/limit exceeded (e.g., max videos per month)
- System displays: "You've reached your video generation limit. Upgrade account or try next month"
- Retry not applicable (user action required)
- Offer "Upgrade" or "Return to Dashboard" options

**AF-05: File Too Large**
- Upload fails because file exceeds size limit
- System displays: "File too large (>50MB). Try a smaller file"
- User must compress file or upload different file
- Not a network error; user action required

**AF-06: User Cancels Operation**
- User clicks "Cancel" during long operation (e.g., video generation)
- System initiates graceful cancellation:
   - Stops processing
   - Cleans up temporary files
   - Displays confirmation: "Operation canceled"
   - Returns to previous screen or dashboard
- No error shown (user-initiated cancellation is expected)

**AF-07: Cascade Failure**
- Multiple dependent services fail (e.g., database AND storage both down)
- System detects cascade and displays general message: "Platform experiencing issues. Stand by"
- System may offer degraded functionality if available
- User notified when services recovered

**Success Outcome:**
- Error clearly communicated to user in plain language
- User offered recovery options (retry, go back, contact support)
- Retry logic automatically attempts recovery up to 3 times
- Partial progress preserved and resumable
- User not left in broken/inconsistent state
- Data not lost due to network issues
- User can safely proceed or request help
- System logs error for monitoring and debugging

**Error Conditions Handled:**
- Network disconnected → Display connection error, offer retry
- API service down (5xx) → Display service error, retry with backoff
- Database timeout → Display timeout error, offer retry or go back
- Rate limit (429) → Display rate limit message, wait before retry
- Authentication expired → Display login prompt, redirect to auth
- Invalid user input → Display validation error (not network error)
- Quota exceeded → Display quota error, offer upgrade
- Partial operation → Offer resume option
- Cascade failure → Display general error, notify when recovered

**Key Acceptance Criteria:**
- ✓ Error messages clear, non-technical, and actionable
- ✓ Retry button prominently displayed
- ✓ Retry logic with exponential backoff (max 3 attempts)
- ✓ Partial progress saved and resumable
- ✓ Session expiration handled gracefully with re-auth option
- ✓ User never left in broken/inconsistent state
- ✓ Errors logged for monitoring and debugging
- ✓ User can always navigate back safely
- ✓ All error messages have recovery path

---

## UC-15: Browser Storage Management for Guest Sessions

**Use Case Name:** Guest Session State Management - Persistent Browser Storage Without Backend Account

**Primary Actor:** Guest User (unauthenticated)

**Secondary Actors:**
- Browser Local Storage / Session Storage
- Browser IndexedDB (optional, for larger data)

**Preconditions:**
- Guest user browsing platform without registration
- Browser cookies/storage enabled (not incognito/private mode ideal)
- Guest performing actions that benefit from state preservation

**Triggers:**
- Guest opens public library (UC-13)
- Guest views song detail and returns to library (navigation)
- Guest applies filters and refreshes page
- Guest bookmarks/saves songs locally
- Guest returns to platform on different day (optional feature)

**Goal:**
System preserves guest browsing state (filters, sort preferences, search history, bookmarked songs) in browser storage without requiring backend login, improving user experience and retention.

**Main Flow:**

1. **Guest Session Storage Initialized:**
   - User creates guest session (UC-13)
   - System generates temporary guest_session_id
   - System stores in browser localStorage or sessionStorage:
     - `guest_session_id`: UUID
     - `session_created_at`: timestamp
     - `session_expires_at`: timestamp (e.g., 2 hours from now)
2. **Guest Browsing Preferences Saved:**
   - Guest applies filters in public library (UC-10):
     - Theme filter: "National Day"
     - Language filter: "English"
     - Sort: "Most Recent"
   - System saves preferences to localStorage:
     - `guest_filters`: {theme: "National Day", language: "English", sort: "Most Recent"}
   - System also saves search history:
     - `guest_search_history`: ["heartland", "celebration", "nostalgia"]
3. **State Persistence on Navigation:**
   - Guest navigates away (e.g., clicks song detail, UC-11)
   - Guest clicks back to library
   - System retrieves stored filters from localStorage
   - System re-applies filters on library page load
   - Library displays same filtered results guest left off with
4. **Bookmarks/Favorites Feature (Optional):**
   - Guest clicks heart/star icon on song
   - System saves to localStorage:
     - `guest_bookmarks`: [song_id_1, song_id_2, ...]
   - Guest can view "My Bookmarks" section
   - Bookmarks persist across sessions (until localStorage cleared)
5. **Session Expiry Management:**
   - Guest session_expires_at timestamp stored in localStorage
   - System checks on each page load if session expired
   - If expired (>2 hours since creation):
     - System clears guest_session_id
     - System creates NEW guest session
     - Old browsing data (filters, history) optionally cleared
     - New session starts fresh OR preserves historical data (optional)
6. **Storage Size Management:**
   - Guest_session_data limited to reasonable size (<5MB)
   - Search history limited to last 20 searches
   - Bookmarks limited to reasonable number (e.g., 100 songs)
   - System clears oldest entries if limits exceeded (FIFO)
7. **Privacy and Security:**
   - Guest data stored locally, NOT sent to backend
   - LocalStorage is browser-origin scoped (safe from other sites)
   - No personal identifiable information stored locally (only song IDs, preference strings)
   - If user clears browser cache/cookies, data wiped (no recovery)
8. **Conversion to Registered User:**
   - Guest converts to registered user (UC-05)
   - System copies guest browsing history to user account:
     - Bookmarked songs migrated to user's saved list
     - Search history optionally migrated
     - Preferences saved to user account
   - Registered user can now access saved data across devices/browsers
9. **Cross-Tab Consistency:**
   - Guest opens library in Tab A and Tab B simultaneously
   - Applies filters in Tab A
   - Switches to Tab B (filters not yet applied)
   - System uses SharedWorker or storage events (if available) to sync
   - Tab B detects storage change and updates dynamically
   - Filters consistent across tabs (optional modern feature)

**Alternate Flows:**

**AF-01: Private/Incognito Mode**
- Guest browsing in private/incognito mode
- Browser may block or limit localStorage
- System detects unavailable storage
- System falls back to in-memory state (persists only for current tab/window)
- When tab closed, in-memory state lost
- Next tab start fresh (expected behavior for incognito)

**AF-02: Browser Storage Quota Exceeded**
- Guest has many bookmarks and search history
- localStorage quota exceeded (typically 5-10MB per origin)
- System detects QuotaExceededError
- System automatically clears oldest entries (search history first, then oldest bookmarks)
- System displays non-intrusive notification: "Storage cleared to make room"
- Guest continues browsing without interruption

**AF-03: Bookmarks on Non-Bookmarked Song**
- Guest clicks heart/star on song
- System attempts to save to localStorage
- Storage unavailable due to privacy mode
- System displays local toast: "Unable to save bookmark in private mode"
- Guest can still view and interact with song
- Bookmark feature silently fails gracefully

**AF-04: Guest Clears Browser Data**
- Guest manually clears browser cache/cookies/storage
- localStorage data deleted
- Guest returns to platform
- System detects no guest_session_id in storage
- System creates new guest session (fresh start)
- Previous browsing data, bookmarks, history lost (expected)

**AF-05: Guest Returns After 1 Week (Long Session)**
- Guest browsed platform, closed browser
- 1 week later, guest returns to same browser
- System checks session_expires_at timestamp in localStorage
- Session long expired (>2 hours)
- System creates new guest session
- Optional: System preserves bookmarks (permanent storage) but clears search history (temporary)

**AF-06: Guest Uses Multiple Devices**
- Guest browses on Desktop (bookmarks songs)
- Guest switches to Mobile
- Mobile has different localStorage (browser-origin scoped)
- Mobile shows empty bookmarks/history (no sync across devices)
- Expected behavior for guest (no backend account to sync)
- If guest registers, future devices can sync via account

**Success Outcome:**
- Guest browsing preferences persisted in localStorage
- Guest can navigate and return to previous filters/state
- Bookmarks available for guest across sessions (same device/browser)
- Search history retained for autocomplete suggestions
- Session expiry managed gracefully
- Storage limits enforced without disrupting user
- Guest data remains local and private
- Seamless conversion from guest to registered user

**Error Conditions Handled:**
- Storage unavailable (private mode) → Fall back to in-memory state
- Storage quota exceeded → Auto-clear oldest data
- Session expired → Create new session, optionally preserve bookmarks
- Browser cleared data → Create fresh session
- Cross-tab sync fails → Accept tab-level state isolation

**Key Acceptance Criteria:**
- ✓ Guest preferences persisted across navigation
- ✓ Bookmarks persist across browser sessions (same device)
- ✓ Search history available for autocomplete
- ✓ Session expiry managed without disrupting user
- ✓ Storage limits enforced without data loss
- ✓ Private mode gracefully degraded (in-memory only)
- ✓ Guest data can be migrated to registered account
- ✓ All data remains local (no backend sync for guests)

---

## UC-16: Account Recovery and Session Management

**Use Case Name:** Account Recovery and Session Management - Login, Password Reset, Session Timeout

**Primary Actor:** Registered User (Creator)

**Secondary Actors:**
- Authentication Service
- Email Service
- Database (User Records, Session Records)

**Preconditions:**
- User has registered account (UC-05)
- User may have forgotten password or session may have expired
- Email service functional for password reset

**Triggers:**
- User clicks "Login" on login page
- User clicks "Forgot Password" on login page
- User's session token expires during activity
- User logs out explicitly
- User attempts action after session timeout

**Goal:**
Users can securely log back into their account, recover forgotten passwords without compromising security, manage multiple sessions, and maintain session integrity throughout platform use.

**Main Flow:**

**A. Login Flow:**

1. User navigates to login page
2. System displays login form:
   - Email address field
   - Password field
   - "Remember me" checkbox (optional)
   - "Forgot Password?" link
   - "Create Account" link (for new users)
3. User enters email and password
4. User clicks "Login"
5. System validates input:
   - Email format valid
   - Email exists in database
   - Password provided (not empty)
6. System queries database for user record by email
7. System retrieves password_hash from user record
8. System hashes submitted password using same algorithm
9. System compares hashes:
   - **If match:** Authentication successful
   - **If mismatch:** Authentication failed
10. **On Authentication Success:**
    - System generates session token (JWT or secure session ID)
    - System stores session in database:
      - session_id, user_id, created_at, expires_at, ip_address, user_agent
    - System sets session token in HTTP cookie (secure, httpOnly, sameSite)
    - System redirects user to dashboard (UC-06)
    - User now authenticated and can access creator features
11. **On Authentication Failure:**
    - System does NOT reveal whether email or password incorrect (security best practice)
    - System displays error: "Invalid email or password"
    - System logs failed login attempt (for security monitoring)
    - User can retry or click "Forgot Password"

**B. Password Reset Flow:**

1. User clicks "Forgot Password?" on login page
2. System displays password reset form:
   - Email address field
   - Submit button
3. User enters email and clicks Submit
4. System validates:
   - Email format valid
   - Email exists in database
5. **If email exists:**
   - System generates reset token (unique, one-time, expires in 1 hour)
   - System stores reset_token in database linked to user_id
   - System sends reset email with link:
     - Link: https://platform.com/reset-password?token={reset_token}
     - Email includes: "Click link to reset password. Link expires in 1 hour"
     - Email includes security note: "If you didn't request this, ignore email"
   - System displays message: "Password reset email sent. Check inbox (and spam folder)"
6. **If email not found:**
   - System still displays message: "Password reset email sent" (security: don't reveal if email registered)
   - No email actually sent (but user sees same message)
   - Attacker cannot enumerate registered emails
7. User receives email and clicks reset link
8. System validates reset token:
   - Token exists in database
   - Token not expired (created <1 hour ago)
   - Token not already used
9. **If token valid:**
   - System displays new password form:
     - New password field (with strength requirements)
     - Confirm password field
     - Submit button
10. User enters new password (must meet strength requirements) and submits
11. System validates:
    - Password meets requirements (8+ chars, uppercase, number, symbol)
    - Password != old password
    - Both passwords match
12. System updates user password in database:
    - Hashes new password
    - Replaces password_hash in user record
    - Marks reset_token as used (consumed)
    - Invalidates all existing sessions (user must re-login)
13. System displays success: "Password reset successfully. Log in with new password"
14. User redirected to login page
15. User logs in with new password

**C. Session Management & Timeout:**

1. **Session Creation:** On successful login, system creates session with expiry
   - Default session duration: 30 days (for "Remember Me" checked)
   - Or: 2 hours (standard session without "Remember Me")
2. **Session Validation:** On each request, system validates session token:
   - Token exists in database
   - Token not expired
   - IP address matches (optional, for security)
3. **Session Timeout:**
   - If session token expired:
     - System detects expired session on page load or request
     - System displays message: "Your session expired. Log in again"
     - System clears session cookie
     - System redirects to login page
4. **Session Renewal (Optional):**
   - If session valid but approaching expiry (e.g., <5 min left):
     - System issues new token with fresh expiry
     - User continues without interruption
5. **User Logout:**
   - User clicks "Logout" button
   - System invalidates session_id in database
   - System clears session cookie
   - System redirects to login page
   - User must re-login to access account
6. **Multiple Sessions (Optional):**
   - User can log in from multiple devices (phone, desktop)
   - Each device gets separate session_id
   - User can view "Active Sessions" and "Log out other devices"
   - If security concern, user can invalidate all sessions except current

**Alternate Flows:**

**AF-01: Reset Token Expired**
- User clicks reset link after >1 hour
- System validates token and detects expiration
- System displays error: "Reset link expired. Request new reset email"
- User redirected to "Forgot Password" page
- User must request new reset email

**AF-02: Reset Token Already Used**
- User clicks same reset link twice
- First click consumes token and resets password
- Second click attempts to use same token
- System detects token already used
- System displays error: "This reset link has already been used"
- Attacker cannot reuse link

**AF-03: Account Lockout (Optional Security Feature)**
- User fails login 5 times in a row
- System temporarily locks account (15 minutes)
- System displays message: "Account temporarily locked. Try again in 15 minutes"
- System sends email alert: "Multiple failed login attempts detected"
- After 15 minutes, account unlocked automatically
- User can also unlock via email link

**AF-04: Unrecognized Login Location**
- User logs in from new IP address/location (optional feature)
- System detects unusual login
- System sends verification email: "New login from [City, Country]. Confirm if this is you"
- Email includes: "Confirm" and "Not me / compromised" links
- User confirms email, login completes
- Provides additional security against account takeover

**AF-05: Session Invalidation on Password Change**
- User changes password (logged in)
- System invalidates all existing sessions
- User logged out from all devices
- User must re-login from each device with new password
- Prevents attackers from maintaining access if password compromised

**AF-06: Database Unavailable During Login**
- Database connection fails during authentication attempt
- System displays error: "Login service temporarily unavailable. Try again in a moment"
- User can retry
- System implements circuit breaker (falls back to in-memory cache if available)

**Success Outcome:**
- User successfully authenticates with email and password
- Session created and managed securely
- User remains logged in across requests
- Forgotten password recoverable via email reset
- Session expires gracefully with re-login prompt
- User can explicitly logout
- Multiple sessions manageable (optional)
- Account secure from unauthorized access

**Error Conditions Handled:**
- Invalid email/password → Display generic error (no account enumeration)
- Email not found → Still send message (no account enumeration)
- Reset token expired → Request new reset email
- Reset token already used → Prevent reuse
- Session expired → Redirect to login with message
- Weak password → Display strength requirements, ask for edit
- Database unavailable → Display error, offer retry
- Account locked (optional) → Display timeout, send security alert

**Key Acceptance Criteria:**
- ✓ Login completes within 5 seconds
- ✓ Authentication secure (no password in logs, HTTPS enforced)
- ✓ Password reset email sent within 10 seconds
- ✓ Reset link valid for 1 hour only
- ✓ Password reset invalidates old sessions
- ✓ Session token secure (httpOnly, secure, sameSite cookies)
- ✓ Session expiry enforced consistently
- ✓ Logout immediately terminates session
- ✓ Error messages don't reveal account status (security)
- ✓ Account recovery accessible but secure

---

# Summary Table: Use Cases by Team Member

| Team | Feature Domain | Use Cases | Scope |
|---|---|---|---|
| **Member 1** | AI Music Video Generation | UC-01, UC-02, UC-03, UC-04 | Upload song, plan scenes, generate frames, stitch video with lyrics |
| **Member 2** | Creator Dashboard & Song Management | UC-05, UC-06, UC-07, UC-08 | Register, view dashboard, song detail, delete song |
| **Member 3** | Song Metadata & Publishing | UC-09, UC-10, UC-11, UC-12 | Enter metadata, browse library, view public songs, publish |
| **Member 4** | Guest/Public Interactions & Error Handling | UC-13, UC-14, UC-15, UC-16 | Guest browsing, error resilience, storage, auth recovery |

---

# Platform Architecture Overview

**Core Principles:**
- Single web application (no microservices)
- Centralized MySQL/PostgreSQL database
- RESTful API endpoints mapped 1:1 to use cases
- Session-based authentication (no OAuth required for MVP)
- Temporary browser storage for guest sessions only
- No real-time sync (asynchronous video generation jobs)

**Data Models Summary:**
- Users, Sessions, Songs, Metadata, Videos, FrameSequences, PublishRecords, GenerationHistory

**API Endpoints (Sketch):**
- POST /api/auth/register (UC-05)
- POST /api/auth/login (UC-16)
- POST /api/songs (UC-01)
- GET /api/dashboard (UC-06)
- GET /api/songs/{id} (UC-07)
- DELETE /api/songs/{id} (UC-08)
- PUT /api/songs/{id}/metadata (UC-09)
- GET /api/library (UC-10)
- GET /api/library/{id} (UC-11)
- POST /api/songs/{id}/publish (UC-12)
- POST /api/videos/generate-scenes (UC-02)
- POST /api/videos/generate-frames (UC-03)
- POST /api/videos/assemble (UC-04)

---

# Appendix: Key Validation Rules

| Entity | Field | Validation |
|---|---|---|
| User | Email | Valid format, unique, required |
| User | Password | 8+ chars, uppercase, number, symbol |
| User | Creator Name | 1-50 chars, unique |
| Song | Title | 1-100 chars, required |
| Song | Artist | 1-50 chars, required |
| Song | Duration | >0 seconds, auto-extracted |
| Song | File Size | <50MB (audio), <500MB (YouTube stream) |
| Song | Theme | Dropdown selection, required |
| Song | Language | Dropdown selection, required |
| Song | Lyrics | <5000 chars, optional |
| Metadata | Mood Tags | Checkboxes, optional |
| Metadata | Custom Themes | Custom text tags, max 10 |
| Video | Resolution | Standard (1080p, 720p, 480p) |
| Video | Duration | Matches song duration ±1 second |
| Session | Token | Secure, httpOnly, expires per policy |
| Session | IP Address | Optional validation |
| Publish | Status | DRAFT, PUBLISHED, UNPUBLISHED |

---

**End of Use Cases Document**
