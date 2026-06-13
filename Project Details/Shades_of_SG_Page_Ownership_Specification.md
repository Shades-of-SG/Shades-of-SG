# Shades of SG – Page Ownership & Design Specification (MVP)

## 1. Product Overview

Shades of SG is a public learning and music experience with a creator workflow for song setup, generation, and publishing.

### Target Users
- Guest user
- Registered user
- Creator

### MVP Principle
Design around feature ownership, not one-page-per-edge-case. Keep the core screens lean and let secondary actions live inside the main pages as tabs, drawers, modals, or sections.

---

## 2. Final Ownership Matrix

### Lia
- Landing
- Home
- Songs Library
- Authentication flow
- Settings
- Shared navbar
- Guest states
- Error and loading states

### Htet
- Song Experience
- Trivia
- AI Generation Status
- Video player component
- Subtitle component
- Instrument display component

### Shermaine
- Creator Dashboard
- Learning Hub
- Instrument Playground
- Badge page
- Dashboard widgets
- Creator navigation

### Ferlyn
- Studio
- Preview
- Rhythm Game
- Reflection Wall
- Reflection Moderation
- Profile
- Metadata form
- Publish toggle
- Reflection CRUD states

---

## 3. Shared Design System

Design these once and reuse across all pages:
- Typography
- Color scheme
- Spacing scale
- Buttons
- Inputs
- Cards
- Badges
- Modals
- Tabs
- Empty states
- Loading skeletons
- Responsive rules

---

## 4. Shared Behavior Notes

### Mobile Navbar
- Logo
- Search icon or short search
- Hamburger menu
- Slide-out or bottom-sheet navigation
- Easy-to-tap CTA buttons

### Guest Session State
- Show a guest badge or anonymous avatar
- Allow browsing, song experience, trivia, rhythm game, and anonymous reflections if required
- Show prompts like “Sign in to save progress” when an action needs persistence
- Use temporary session storage for guest-only progress

### Home vs Landing Page
- Landing Page: Guest users, anyone
- Home Page: Logged-in users view

### Reflection Page
- Moderation to be done by Ferlyn
- Creator navbar should have a button to link to the Reflection Moderation Page

### Navbar Variants
1. Guest Navbar 
Navigation: 
[Logo/Home]
Songs Library
About/ Explore
Language Selector Dropdown (Google Translate Icon)
Login CTA
Sign Up CTA

Mobile: 
Logo
Search icon
Hamburger Menu

2. Registered User Navbar 
Navigation:
[Logo/Home]
Songs Library
Profile
Notifications (optional)
Language (optional)
Avatar Dropdown: 
- Profile
- Settings
- Logout

3. Creator Navbar (Violet)
Navigation:
Dashboard
Studio
AI Generation
Manage Reflections
Songs
Avatar Dropdown:
- Profile
- Settings
- Logout

Navigation Rules: 
Guest --> Registered (After login: Landing --> Home)
Registered role = creator, Creator Dashboard page becomes available after login

---

## 5. Sitemap
Guest
│
├── Landing
├── Songs Library
│     └── Song Experience
│             ├── Trivia
│             ├── Rhythm Game
│             ├── Reflection Wall
│             └── Learning Hub
│
├── Login/Register
├── Home
├── Profile
└── Settings

Creator
│
├── Dashboard
├── Studio
├── Preview
└── AI Generation Status

## 6. Page Breakdown

### Lia Pages

#### Landing Page
**Route:** `/`

**Components:**
- Navbar
- Hero section
- Featured songs
- About / mission section
- CTA section
- Footer

#### Home Page
**Route:** `/home`

**Components:**
- Welcome back panel
- Continue learning section
- Recent songs
- Progress summary
- Badges preview
- Quick links

#### Songs Library
**Route:** `/songs`

**Components:**
- Search bar
- Theme filter
- Language filter
- Mood filter
- Sort control
- Song cards grid
- Empty state
- Load more or pagination

#### Authentication Flow
**Routes:** `/login`, `/register`, `/forgot-password`, `/reset-password`

**Components:**
- Login form
- Register form
- Forgot password form
- Reset password form
- Validation messages
- Success and error states

#### Settings
**Route:** `/settings`

Settings

├ Profile Information
├ Security
├ Appearance
├ Language & Accessibility
├ Notifications
├ Privacy
└ Account

Example:
┌────────────────────┬──────────────────────┐
│ Profile            │                      │
│ Security           │ Profile Information  │
│ Appearance         │                      │
│ Language           │                      │
│ Notifications      │                      │
│ Privacy            │                      │
│ Account            │                      │
└────────────────────┴──────────────────────┘

**Components:**
1. Profile Information
Profile Picture
Display Name
Email Address
[ Save Changes ]

2. Security 
Need Gmail OTP verification (Reset Password)
Current Password
New Password
Comfirm Password

Change Email 
--> Send OTP
--> Verify OTP
--> Update Email

3. Appearance (Optional)
Theme Selection Dropdown
- Singapore: Red & White
- Twilight: Purple & Navy 
- Heritage: Green & Gold
- Marina Bay: Blue, Cyan
- Violet Tay Special (red, blue, white)

Mode Dropdown
- Light Mode
- Dark Mode

Font Size
- Small 
- Medium
- Large

Developer Notes
- Can try storing different sets of CSS color styling, for predefined themes
- theme, setTheme 
CSS
:root {
  --primary: #6d5dfc;
  --secondary: #d4c5ff;
}

4. Language & Accessibility
Preferred Language (implement google translate widget)
English
中文
Bahasa Melayu
தமிழ்

5. Notifications
☑ Badge Notifications
☑ New Song Notifications
☑ Reflection Notifications

6. Progress & Privacy
Reflection Preference:
Default Posting Mode: 
Anonymous 
Named

Data Management: (Optional)
Export My Progress 
Delete Account

Logout

#### Shared States
**Components:**
- Public navbar
- Logged-in navbar
- Guest state badge
- Loading skeletons
- Error 404 page
- Generic retry state

---

### Htet Pages

#### Song Experience
**Route:** `/songs/:id`

**Components:**
- Video player
- Subtitle toggle
- Song details
- Cultural summary
- Instrument display grid
- Related songs
- Trivia CTA

#### Trivia
**Route:** `/songs/:id/trivia`

**Components:**
- Question cards
- Answer options
- Immediate feedback
- Score display
- Retry button
- Save score CTA

#### AI Generation Status
**Route:** `/generate/:songId`

**Components:**
- Progress bar
- Current stage label
- Status badge
- Polling indicator
- Error state

---

### Shermaine Pages

#### Creator Dashboard
**Route:** `/dashboard`

**Components:**
- Song grid
- Status badges
- Search and filters
- Quick action buttons
- Dashboard widgets
- Manage reflections button

#### Learning Hub
**Route:** `/learn`

**Components:**
- Header or intro banner
- Lessons tab
- Timeline tab
- Progress tracker
- Lesson content cards
- Timeline cards or events

#### Instrument Playground
**Route:** `/playground`

**Components:**
- Virtual keyboard
- Instrument selector
- Audio playback triggers
- Visual key highlights
- Instructions panel

#### Badge Page
**Route:** `/badges`

**Components:**
- Badge grid
- Locked and unlocked states
- Badge descriptions
- Progress indicators

#### Creator Navigation
**Components:**
- Dashboard
- Studio
- Generate / AI status
- Songs
- Manage reflections
- Avatar dropdown

---

### Ferlyn Pages

#### Studio
**Route:** `/studio/:songId`

**Components:**
- Metadata form
- Title field
- Artist field
- Theme field
- Language field
- Lyrics editor
- Description field
- Tags
- Publish toggle

#### Preview
**Route:** `/preview/:songId`

**Components:**
- Video preview
- Song details
- Publish confirmation
- Edit back link

#### Rhythm Game
**Route:** `/game/:songId`

**Components:**
- Falling notes
- Accuracy meter
- Combo counter
- Final score
- Difficulty selector
- Guest save prompt

#### Reflection Wall
**Route:** `/reflections`

**Components:**
- Reflection feed
- Create reflection form
- Edit reflection action
- Delete reflection action
- Anonymous and named posting states

#### Reflection Moderation
Reflection Moderation is creator-facing and accessed from the Creator Dashboard.
**Route:** `/creator/reflections`

**Components:**
- Flagged reflections list
- Approve action
- Reject action
- Delete action
- Moderation status labels

#### Profile
**Route:** `/profile`

**Components:**
- Profile header
- User information
- Reflection history
- Game scores
- Achievements
- Badge summary

---

## 6. Badge Design Notes

Badges should still be tied to feature ownership:

### Lia
- First login
- Heritage explorer
- Song discoverer

### Htet
- Trivia master
- Perfect score
- Cultural expert

### Shermaine
- Instrument explorer
- Lesson completer
- Knowledge seeker

### Ferlyn
- Rhythm rookie
- Combo king
- Memory keeper

---

## 7. Scope Guideline

If time gets tight, prioritize these first:
- Landing
- Home
- Songs Library
- Authentication flow
- Song Experience
- Trivia
- AI Generation Status
- Creator Dashboard
- Learning Hub
- Instrument Playground
- Studio
- Rhythm Game
- Reflection Wall

Everything else should be treated as supporting UI states or later polish unless the team explicitly confirms it as MVP-critical.
