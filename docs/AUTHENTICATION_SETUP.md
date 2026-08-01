# Authentication and onboarding setup

## Database deployment

The authentication schema change is forward-only. Apply the numbered migrations in order after taking the normal managed backup:

1. `015_multi_creator_platform.sql`
2. `016_email_verification_and_auth_otp.sql`

Migration 016 only adds columns, adjusts the creator-application status constraint, creates the `auth_otps` table, and creates indexes. Do not reset, reseed, synchronize, truncate, or recreate the production database. Existing accounts retain their current ability to sign in; only newly registered accounts are explicitly marked as requiring email verification.

## SMTP configuration

Set these values in the backend deployment environment:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-sending-account@example.com
SMTP_PASS=your-provider-app-password
MAIL_FROM=Shades of SG <no-reply@example.com>
FRONTEND_URL=https://your-frontend.example.com
FRONTEND_URLS=https://your-approved-preview.example.com
SMTP_TIMEOUT_MS=10000
```

For Gmail, enable two-step verification on the sending account and create a dedicated App Password. Use port 465 with `SMTP_SECURE=true`, or port 587 with `SMTP_SECURE=false` for STARTTLS. Store the App Password only in the deployment secret manager; never commit it to an environment example or source file.

For local email inspection, set `MAIL_TRANSPORT=json`. The backend prints the recipient and six-digit OTP to its terminal so the local verification flow can be completed without an SMTP account. Test runs automatically use Nodemailer's JSON transport and never contact an SMTP server. Do not use the JSON transport in production.

Also set unique, randomly generated values for `AUTH_TOKEN_SECRET` and `OTP_IP_HASH_SECRET`. Bearer-token lifetime is controlled by `AUTH_TOKEN_TTL_SECONDS` and defaults to one hour.

## Sign in with Apple

Apple sign-in is intentionally disabled. The API returns `appleAuthEnabled: false`, and the frontend does not display a non-working button. Email/password authentication and OTP verification remain fully functional.

Before enabling Apple, the Apple Developer account must contain:

- an App ID with Sign in with Apple enabled;
- a Services ID matching `APPLE_CLIENT_ID`;
- a verified web domain and HTTPS return URL matching `APPLE_REDIRECT_URI`;
- a Sign in with Apple private key, with its Key ID and Team ID;
- deployment secrets for `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, and `APPLE_REDIRECT_URI`.

The server implementation must then add a forward-only provider-identity table and a complete OpenID Connect callback. It must generate and validate state and nonce, verify the token signature, issuer, audience and expiry against Apple's keys, persist Apple's stable subject identifier, support relay addresses, and require a safe explicit linking flow for existing accounts. Credentials alone must not make the button visible until that implementation and its callback tests are deployed.

## Token and account notes

Protected endpoints reload the account from the database and enforce its current role, suspension state, verification requirement, and authentication version. Password reset increments that authentication version, invalidating previously issued bearer tokens. Tokens expire after a configurable short lifetime.

The current frontend stores bearer tokens in `localStorage`, so they remain exposed to any successful same-origin script injection. Keep the Content Security Policy strict and avoid rendering unsanitized HTML. A future hardening stage can replace this with short-lived access tokens plus rotating, HttpOnly, Secure, SameSite refresh cookies.

Direct profile email changes are blocked until the reusable `EMAIL_CHANGE` OTP purpose is connected to dedicated request-and-confirm endpoints.

Rate limiting is process-local. Deployments with multiple backend instances should replace it with a shared Redis or database-backed limiter while retaining the existing per-IP-and-email keys.
