# Song Pagination and Lazy-Loading Audit

## Objective

Prevent song collection screens from downloading an unbounded catalogue, while preserving publication rules, creator ownership, administrator access, filtering, rhythm eligibility, scores, bookmarks, reports, and stable navigation.

## Audit Findings

| Surface | Previous behaviour | Implemented interaction |
| --- | --- | --- |
| Public Songs Library | `GET /api/songs` loaded every published song; JSON filters and paging ran after the query/in React | Server-filtered pages of 9 with an accessible Load more action, request cancellation, deduplication, first/later loading states, and retry |
| Rhythm Hub | Loaded every song and then requested beatmaps once per song | Server-filtered pages of 10; published beatmaps are eager-loaded and summarized in the song response; Load more preserves personal progress |
| Landing | Loaded all songs and sliced five in React | Fixed five-song server preview with View all |
| Learning Hub | Loaded the complete published catalogue | Fixed six-song server preview |
| Creator My Songs | Loaded every owned song and every generation job | Server pages of 10, status filtering, authoritative status totals, latest-job-only eager loading, and Previous/Next |
| Creator dashboard | Already limited to five recent songs/jobs | Kept as a deliberate fixed preview |
| Private creator profile | Loaded all creator songs | Fixed six-song preview; dashboard summary remains authoritative for totals |
| Public creator profile | Embedded every published song | Server pages of 8 with Load more and a database-derived total |
| Admin Content | Already database-paginated | Kept 25-row Previous/Next table; normalized metadata, maximum size, and stable ID ordering |
| Admin collection song chooser | Requested as many as 100 published songs | Searchable 20-song pages with Load more |
| Reflection song selectors | Reused the formerly unbounded public endpoint | Reflection Wall keeps one compact bottom-row dropdown backed by a bounded 50-song request; composer and moderation views use searchable 20-song pages with stale-result protection, deduplication, retry, and Load more |
| Rhythm leaderboard selector | Enumerated every playable song | Searchable 20-song database pages with Load more and selected-song recovery; desktop Search Songs, Song, Difficulty, and Time Period controls share one row, then collapse responsively on smaller screens |
| Public folders and folder detail | Embedded every published member song | All-folders response uses six-song database previews; folder detail uses server pages of 12 with stable collection order |
| Guided lesson songs | Static application data, not database catalogue records | No change |

## API Contract

Song-list endpoints expose `items` and:

```json
{
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Compatibility `songs` aliases remain temporarily on public, creator, and administrator song endpoints. Internal updated clients use `items`. Invalid/non-positive values fall back to defaults; excessive limits clamp to 50. Ordering ends in song ID.

## Backend Filtering and Visibility

- Public: non-null creator, `PUBLISHED`, non-placeholder title, then theme/language/mood/search/rhythm/difficulty/played-state filters, then count and pagination.
- Creator: authenticated creator ID first, optional valid lifecycle status and title search second, then count and pagination.
- Administrator: admin middleware first, then status/visibility/creator/search filters, then count and pagination.
- Public creator profile: public profile visibility and `PUBLISHED` ownership scope are evaluated before pagination.
- Rhythm song results eager-load published beatmaps in the bounded query. Bookmark/report lookups are restricted to IDs on the returned page.

## Sizes and Indexes

- Public default: 12; Library: 9; Rhythm Hub: 10.
- Creator management default: 10.
- Public creator profile: 8.
- Admin tables: 25.
- Reflection Wall dropdown: fixed maximum of 50; reflection composer and moderation selectors: 20 per searchable page.
- Fixed previews: Landing 5, Learning 6, creator dashboard 5, private creator profile 6.
- Global maximum: 50.

Migration `032_song_pagination_indexes.sql` adds public status/date/ID and creator/status/update/ID indexes without modifying data.

## Remaining Follow-up

- Add browser-level back-position restoration for Load more galleries; browser history currently retains normal scroll position but loaded React state is not persisted across a full remount.

## PostgreSQL Rhythm Query Follow-up

The correlated rhythm-beatmap and played-status subqueries quote Sequelize's case-sensitive `"Song"."id"` alias. This prevents PostgreSQL error `42P01` while retaining the same filtering behaviour under SQLite. A regression test covers rhythm eligibility, beatmap summaries, and authenticated played-song filtering; the live configured PostgreSQL endpoint was verified with a `200` response.
