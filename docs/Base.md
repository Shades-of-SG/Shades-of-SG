# SHADES OF SG — FRONTEND SHELL & ROUTING SCAFFOLD SPECIFICATION

## Objective

Build the complete frontend website skeleton for Shades of SG.

This task is NOT to implement feature logic.

This task is to create the complete navigational structure, layouts, routes, reusable UI foundation, placeholder pages, and responsive design system so that each developer can immediately begin implementing their assigned features.

Preserve all existing working functionality, especially the Rhythm Game implementation.

---

# Important Rules

## Do Not

* Do not implement backend APIs.
* Do not create mock authentication systems.
* Do not implement database logic.
* Do not implement AI generation pipelines.
* Do not create complex state management.
* Do not delete existing pages.
* Do not overwrite working Rhythm Game code.

## Do

* Create route structure.
* Create layouts.
* Create navigation.
* Create page placeholders.
* Create reusable components.
* Create responsive styling.
* Add TODO ownership comments.

---

# Application Structure

The application consists of three major experiences:

## 1. Public Experience

Accessible to all visitors.

Purpose:

* Discover songs
* Learn about Singapore culture
* Play rhythm game
* Submit reflections

Pages:

* Landing
* Songs Library
* Song Experience
* Trivia
* Instrument Playground
* Learning Hub
* Rhythm Game
* Reflection Wall

---

## 2. Authentication Experience

Pages:

* Login
* Register
* Forgot Password
* Reset Password

These pages should use a separate lightweight layout.

---

## 3. Creator Portal

Pages:

* Dashboard
* Studio
* Generation Progress
* Reflection Moderation

These pages should use a creator-specific layout.

---

# Required Layouts

Create:

## MainLayout.jsx

Used by:

* Landing
* Songs
* Song Experience
* Learning Hub
* Instrument Playground
* Trivia
* Rhythm Game
* Reflection Wall
* Profile
* Settings

Contains:

* Navbar
* Main Content
* Footer

---

## CreatorLayout.jsx

Used by:

* Dashboard
* Studio
* Generation Progress
* Reflection Moderation

Contains:

* Creator Sidebar
* Top Navigation
* Main Content

Creator pages should feel separate from the public experience.

---

## AuthLayout.jsx

Used by:

* Login
* Register
* Forgot Password
* Reset Password

Contains:

* Centered card
* Branding
* Minimal navigation

---

# Route Structure

Create routes for:

```text
/

/songs

/songs/:id

/songs/:id/trivia

/songs/:id/playground

/learning

/rhythm-game

/reflections

/login

/register

/forgot-password

/reset-password

/profile

/settings

/creator/dashboard

/creator/studio

/creator/generation

/creator/reflections

*
```

Create NotFound page for wildcard route.

---

# Navbar Variants

Create ONE reusable Navbar component.

Navbar accepts:

```js
role = "guest"
role = "user"
role = "creator"
```

and renders different navigation.

---

## Guest Navbar

Visible links:

* Home
* Songs
* Learning Hub
* Rhythm Game
* Reflection Wall
* Login
* Register

---

## Registered User Navbar

Visible links:

* Home
* Songs
* Learning Hub
* Rhythm Game
* Reflection Wall
* Profile
* Settings
* Logout

---

## Creator Navbar

Visible links:

* Dashboard
* Studio
* Songs
* Reflection Moderation
* Profile
* Settings
* Logout

---

# Navigation Requirements

Navbar should:

* Highlight active page
* Support mobile hamburger menu
* Collapse cleanly on mobile
* Remain sticky on scroll
* Allow future notification icons
* Allow future badge indicators

Use placeholder auth state for now.

---

# Footer

Create reusable Footer component.

Include:

* About Shades of SG
* Quick Links
* Copyright
* Social placeholders

Responsive on mobile.

---

# Required Pages

Create all page files.

Each page should contain:

* Page title
* Description
* Placeholder content sections
* Placeholder cards
* Responsive layout
* TODO comments

Example:

```jsx
/*
TODO - Htet

Implement video player
Implement subtitles
Implement cultural summary
*/
```

---

# Developer Ownership

## Lia

Landing.jsx

SongsLibrary.jsx

Login.jsx

Register.jsx

ForgotPassword.jsx

ResetPassword.jsx

Settings.jsx

Shared Navbar/Footer

---

## Htet

SongExperience.jsx

TriviaHub.jsx

GenerationProgress.jsx

---

## Shermaine

Dashboard.jsx

InstrumentPlayground.jsx

LearningHub.jsx

Badge components

---

## Ferlyn

Studio.jsx

RhythmGame.jsx

MemoryWall.jsx

Profile.jsx

ReflectionModeration.jsx

---

# Page Content Requirements

## Landing

Sections:

* Hero
* Featured Songs
* Why Shades of SG
* Call To Action

---

## Songs Library

Sections:

* Search Bar
* Filters
* Song Grid

---

## Song Experience

Sections:

* Video Player Placeholder
* Song Metadata
* Cultural Summary
* Instruments Section

---

## Trivia

Sections:

* Question Area
* Progress Tracker
* Results Area

---

## Instrument Playground

Sections:

* Instrument Selection
* Keyboard Mapping Display
* Audio Controls

---

## Learning Hub

Sections:

* Lessons
* Timeline
* Cultural Resources

---

## Rhythm Game

Preserve existing implementation.

If page already exists:

DO NOT rewrite game logic.

Only wrap inside shared layout if needed.

---

## Reflection Wall

Sections:

* Reflection Feed
* Reflection Submission Form
* Song Filter

---

## Profile

Sections:

* User Information
* Reflection History
* Game Scores
* Achievements

---

## Dashboard

Sections:

* Song Statistics
* Song Grid
* Quick Actions

---

## Studio

Sections:

* Song Metadata Form
* Preview Area
* Publish Controls

---

## Generation Progress

Sections:

* Generation Status
* Progress Timeline
* Logs

---

## Reflection Moderation

Sections:

* Pending Reflections
* Approved Reflections
* Flagged Reflections

---

# Design System

## Typography

Base font size:

```css
16px = 1rem
```

Typography scale:

```css
H1 = 3rem
H2 = 2.25rem
H3 = 1.75rem
H4 = 1.5rem

Body = 1rem

Small = 0.875rem
```

Line height:

```css
Headings = 1.2
Body = 1.5
```

Responsive typography required.

---

# Color Palette

Theme:

Twilight Singapore

Primary:

```css
#5B4B8A
```

Secondary:

```css
#7A6EA8
```

Accent:

```css
#D8B4FE
```

Background:

```css
#0F172A
```

Surface:

```css
#1E293B
```

Text:

```css
#F8FAFC
```

Muted:

```css
#94A3B8
```

Success:

```css
#22C55E
```

Warning:

```css
#F59E0B
```

Error:

```css
#EF4444
```

---

# Reusable Components

Create:

```text
Navbar.jsx
Footer.jsx
PageHeader.jsx
SectionCard.jsx
EmptyState.jsx
LoadingState.jsx
ErrorState.jsx
SongCard.jsx
FilterBar.jsx
Sidebar.jsx
ProtectedRoute.jsx
```

All components should be reusable.

---

# Responsiveness

Support:

* Mobile
* Tablet
* Desktop

Breakpoints:

```css
640px
768px
1024px
1280px
```

Requirements:

* Mobile navigation drawer
* Responsive grids
* Responsive cards
* Responsive typography

---

# Folder Structure

Follow:

```text
src/
|
├── layouts/
│   ├── MainLayout.jsx
│   ├── CreatorLayout.jsx
│   └── AuthLayout.jsx
│
├── pages/
│
├── components/
│
├── routes/
│
├── context/
│
├── services/
│
├── hooks/
│
├── assets/
│
└── styles/
```

---

# Final Deliverable

When complete:

1. All routes functional.
2. No blank pages.
3. No missing imports.
4. No build errors.
5. Responsive layouts working.
6. Existing Rhythm Game preserved.
7. Clear TODO ownership comments added.
8. Clean code suitable for teammate handoff.
9. Ready for feature implementation phase.
