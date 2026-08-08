# Authentication and onboarding setup

**Last updated:** 8 August 2026
**Document purpose:** Configure and verify the implemented email/password, OTP, Google, and Apple authentication flows without changing or reseeding production data.

## Database deployment

Apply every file in `backend/migrations` in full lexicographic filename order after taking the normal managed backup. Authentication-specific changes are introduced by:

1. `016_email_verification_and_auth_otp.sql`
2. `017_oauth_identities.sql`
3. `018_separate_creator_access_status.sql`
4. `025_account_deletion.sql` — legacy soft-delete state, superseded by hard deletion
5. `026_account_hard_delete.sql`

Do not reset, reseed, synchronize, truncate, or recreate the production database. Server startup calls `sequelize.authenticate()` and does not run migrations or `sequelize.sync()`.

Set unique randomly generated values for `AUTH_TOKEN_SECRET` and `OTP_IP_HASH_SECRET`. `JWT_SECRET` remains a legacy alias for `AUTH_TOKEN_SECRET`; `AUTH_TOKEN_TTL_SECONDS` controls bearer-token lifetime.

## SMTP configuration

Set these values in the backend deployment environment:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=sender@example.com
SMTP_PASS=provider-app-password
MAIL_FROM=Shades of SG <no-reply@example.com>
SMTP_TIMEOUT_MS=10000
FRONTEND_URL=https://your-frontend.example.com
FRONTEND_URLS=https://your-approved-preview.example.com
FRONTEND_URL_PATTERNS=https://shades-of-*-your-team.vercel.app
```

Registration verification, password reset, and email change use hashed, expiring, single-use OTP rows. Request and verification endpoints enforce cooldowns, attempt limits, and process-local rate limits.

For local email inspection, set `MAIL_TRANSPORT=json`. Tests use isolated JSON transport and do not contact a real SMTP server. Never enable JSON transport in production.

Google sign-in is enabled only when `GOOGLE_CLIENT_ID` is configured. The authorised JavaScript origins must contain the deployed frontend. The backend verifies the provider token and stores only the provider plus stable subject in `auth_identities`.

## Sign in with Apple

Apple sign-in is implemented but remains hidden until the complete provider configuration is present:

```dotenv
APPLE_CLIENT_ID=com.example.service
APPLE_TEAM_ID=TEAMID
APPLE_KEY_ID=KEYID
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
APPLE_REDIRECT_URI=https://your-frontend.example.com/login
```

The Apple Developer account must contain the matching Services ID, verified web domain, HTTPS return URL, and private key. The backend creates the client secret, verifies the provider token, and stores only Apple's stable subject identifier. Partial credentials must not make the button visible.

## Token and account notes

- New email/password accounts are `REGISTERED`; users apply for creator access and administrators approve eligible applications.
- `account_status=SUSPENDED` blocks authenticated account access.
- `creator_access_status=SUSPENDED` blocks creator tools but can leave normal user-mode access active.
- Password and email security changes increment `auth_version` where required, invalidating stale JWT/reset sessions.
- Protected routes restore only validated same-origin paths. A pending guest rhythm-score claim takes priority after authentication.
- Password-reset request responses are generic to reduce account enumeration.
- OTP values are hashed and provider tokens are verified but not stored.
- Self-service and administrator deletion use hard deletion after credential/permission checks; historical audit/moderation rows may remain with null actor references.
- CORS uses `FRONTEND_URL`, optional exact `FRONTEND_URLS`, and narrow HTTPS `FRONTEND_URL_PATTERNS`.
- The frontend uses `VITE_API_URL`, including `/api`.

Verification should cover registration and OTP resend/expiry, login and `/api/auth/me`, password reset, email change, unsafe return-path rejection, guest-score claim, separate suspension states, configured OAuth providers, and disposable-account deletion.
