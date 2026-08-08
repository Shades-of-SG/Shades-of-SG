const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { AuthIdentity, User, sequelize } = require('../models');
const { accountSuspensionMessage, createScopedToken, createToken, hashPassword, serializeUser, verifyScopedToken } = require('./authService');

const PROVIDERS = new Set(['GOOGLE', 'APPLE']);
const googleClient = new OAuth2Client();
let appleJwks;

function clean(value) {
    return String(value || '').trim();
}

function oauthConfig() {
    const googleClientId = clean(process.env.GOOGLE_CLIENT_ID);
    const apple = {
        clientId: clean(process.env.APPLE_CLIENT_ID),
        keyId: clean(process.env.APPLE_KEY_ID),
        privateKey: clean(process.env.APPLE_PRIVATE_KEY).replace(/\\n/g, '\n'),
        redirectUri: clean(process.env.APPLE_REDIRECT_URI),
        teamId: clean(process.env.APPLE_TEAM_ID),
    };
    const appleAuthEnabled = Object.values(apple).every(Boolean);
    return {
        apple: { ...apple, enabled: appleAuthEnabled },
        google: { clientId: googleClientId, enabled: Boolean(googleClientId) },
    };
}

function publicOauthConfig() {
    const config = oauthConfig();
    return {
        appleAuthEnabled: config.apple.enabled,
        appleClientId: config.apple.enabled ? config.apple.clientId : null,
        appleRedirectUri: config.apple.enabled ? config.apple.redirectUri : null,
        googleAuthEnabled: config.google.enabled,
        googleClientId: config.google.enabled ? config.google.clientId : null,
    };
}

function oauthError(message, statusCode = 400, code = 'OAUTH_FAILED') {
    const error = new Error(message);
    error.code = code;
    error.statusCode = statusCode;
    return error;
}

function createOauthChallenge(providerValue) {
    const provider = clean(providerValue).toUpperCase();
    if (!PROVIDERS.has(provider)) throw oauthError('Unsupported sign-in provider.');
    const config = oauthConfig();
    if (!config[provider.toLowerCase()].enabled) throw oauthError(`${provider === 'GOOGLE' ? 'Google' : 'Apple'} sign-in is not configured.`, 503, 'OAUTH_NOT_CONFIGURED');
    return {
        nonce: createScopedToken({ purpose: `OAUTH_NONCE_${provider}`, userId: provider, version: 0 }, 600),
        state: createScopedToken({ purpose: `OAUTH_STATE_${provider}`, userId: provider, version: 0 }, 600),
    };
}

function verifyChallenge(token, purpose, provider) {
    const payload = verifyScopedToken(token, `${purpose}_${provider}`);
    if (!payload || payload.userId !== provider) throw oauthError('The sign-in request expired. Please try again.', 400, 'OAUTH_CHALLENGE_INVALID');
}

async function verifyGoogleCredential({ credential, nonce }) {
    const config = oauthConfig().google;
    if (!config.enabled) throw oauthError('Google sign-in is not configured.', 503, 'OAUTH_NOT_CONFIGURED');
    verifyChallenge(nonce, 'OAUTH_NONCE', 'GOOGLE');
    let payload;
    try {
        const ticket = await googleClient.verifyIdToken({ audience: config.clientId, idToken: credential });
        payload = ticket.getPayload();
    } catch {
        throw oauthError('Google could not verify this sign-in. Please try again.', 401, 'OAUTH_TOKEN_INVALID');
    }
    if (!payload?.sub || !payload.email || payload.email_verified !== true || payload.nonce !== nonce) {
        throw oauthError('Google returned an invalid identity token.', 401, 'OAUTH_TOKEN_INVALID');
    }
    const email = payload.email.trim().toLowerCase();
    return {
        email,
        emailAuthoritative: email.endsWith('@gmail.com') || Boolean(payload.hd),
        name: clean(payload.name) || email.split('@')[0],
        provider: 'GOOGLE',
        subject: payload.sub,
    };
}

async function createAppleClientSecret(config) {
    const { importPKCS8, SignJWT } = await import('jose');
    const key = await importPKCS8(config.privateKey, 'ES256');
    return new SignJWT({})
        .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
        .setIssuer(config.teamId)
        .setAudience('https://appleid.apple.com')
        .setSubject(config.clientId)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(key);
}

async function exchangeAppleCode(code, config) {
    const clientSecret = await createAppleClientSecret(config);
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
    });
    const response = await fetch('https://appleid.apple.com/auth/token', {
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.id_token) throw oauthError('Apple could not verify this sign-in. Please try again.', 401, 'OAUTH_TOKEN_INVALID');
    return data.id_token;
}

async function verifyAppleCredential({ code, nonce, state, user }) {
    const config = oauthConfig().apple;
    if (!config.enabled) throw oauthError('Apple sign-in is not configured.', 503, 'OAUTH_NOT_CONFIGURED');
    verifyChallenge(nonce, 'OAUTH_NONCE', 'APPLE');
    verifyChallenge(state, 'OAUTH_STATE', 'APPLE');
    if (!clean(code)) throw oauthError('Apple did not return an authorization code.', 401, 'OAUTH_TOKEN_INVALID');
    let payload;
    try {
        const { createRemoteJWKSet, jwtVerify } = await import('jose');
        appleJwks ||= createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
        const idToken = await exchangeAppleCode(code, config);
        ({ payload } = await jwtVerify(idToken, appleJwks, {
            audience: config.clientId,
            issuer: 'https://appleid.apple.com',
        }));
    } catch (error) {
        if (error.code === 'OAUTH_TOKEN_INVALID') throw error;
        throw oauthError('Apple could not verify this sign-in. Please try again.', 401, 'OAUTH_TOKEN_INVALID');
    }
    if (!payload?.sub || payload.nonce !== nonce) throw oauthError('Apple returned an invalid identity token.', 401, 'OAUTH_TOKEN_INVALID');
    const email = clean(payload.email).toLowerCase();
    const emailVerified = payload.email_verified === true || payload.email_verified === 'true';
    const suppliedName = [clean(user?.name?.firstName), clean(user?.name?.lastName)].filter(Boolean).join(' ');
    return {
        email: emailVerified ? email : '',
        emailAuthoritative: emailVerified,
        name: suppliedName || (email ? email.split('@')[0] : 'Apple user'),
        provider: 'APPLE',
        subject: payload.sub,
    };
}

async function finishOauthSignIn(identity) {
    let signedInUser;
    await sequelize.transaction(async (transaction) => {
        const existingIdentity = await AuthIdentity.findOne({
            include: [{ as: 'user', model: User, required: true }],
            transaction,
            where: { provider: identity.provider, providerSubject: identity.subject },
        });
        if (existingIdentity) {
            signedInUser = existingIdentity.user;
            return;
        }
        if (!identity.email) throw oauthError('Apple did not provide an email address for this new account.', 400, 'OAUTH_EMAIL_REQUIRED');
        let user = await User.findOne({ transaction, where: { email: identity.email } });
        if (user && !identity.emailAuthoritative) {
            throw oauthError('Sign in with your password before linking this Google account.', 409, 'OAUTH_LINK_REQUIRED');
        }
        if (!user) {
            user = await User.create({
                email: identity.email,
                emailVerificationRequired: false,
                emailVerifiedAt: new Date(),
                name: identity.name,
                passwordHash: hashPassword(crypto.randomBytes(48).toString('base64url')),
                role: 'REGISTERED',
            }, { transaction });
        } else if (user.emailVerificationRequired) {
            await user.update({ emailVerificationRequired: false, emailVerifiedAt: new Date() }, { transaction });
        }
        if (user.accountStatus !== 'ACTIVE') {
            throw oauthError(accountSuspensionMessage(user), 403, 'ACCOUNT_SUSPENDED');
        }
        const providerAlreadyLinked = await AuthIdentity.findOne({
            transaction,
            where: { provider: identity.provider, userId: user.id },
        });
        if (providerAlreadyLinked) {
            throw oauthError(`This account is already linked to a different ${identity.provider === 'GOOGLE' ? 'Google' : 'Apple'} identity.`, 409, 'OAUTH_IDENTITY_CONFLICT');
        }
        await AuthIdentity.create({
            provider: identity.provider,
            providerSubject: identity.subject,
            userId: user.id,
        }, { transaction });
        signedInUser = user;
    });
    if (signedInUser.accountStatus !== 'ACTIVE') throw oauthError(accountSuspensionMessage(signedInUser), 403, 'ACCOUNT_SUSPENDED');
    return { token: createToken(signedInUser), user: serializeUser(signedInUser) };
}

module.exports = {
    createOauthChallenge,
    finishOauthSignIn,
    publicOauthConfig,
    verifyAppleCredential,
    verifyGoogleCredential,
};
