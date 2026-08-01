const nodemailer = require('nodemailer');

let transport;
const testOutbox = [];
const DEFAULT_SMTP_TIMEOUT_MS = 10000;

function smtpTimeoutMs() {
    const configured = Number(process.env.SMTP_TIMEOUT_MS);
    if (!Number.isFinite(configured)) return DEFAULT_SMTP_TIMEOUT_MS;
    return Math.min(Math.max(Math.round(configured), 1000), 25000);
}

function isTestTransport() {
    return process.env.NODE_ENV === 'test'
        || (process.env.NODE_ENV !== 'production' && process.env.MAIL_TRANSPORT === 'json');
}

function requireSmtpConfig() {
    const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
    const missing = required.filter((name) => !String(process.env[name] || '').trim());
    if (missing.length) {
        const error = new Error(`Email delivery is not configured. Missing: ${missing.join(', ')}.`);
        error.code = 'SMTP_CONFIG_MISSING';
        error.statusCode = 503;
        throw error;
    }
}

function getTransport() {
    if (transport) return transport;
    if (isTestTransport()) {
        transport = nodemailer.createTransport({ jsonTransport: true });
        return transport;
    }
    requireSmtpConfig();
    const port = Number(process.env.SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        const error = new Error('SMTP_PORT must be a valid port number.');
        error.code = 'SMTP_CONFIG_INVALID';
        error.statusCode = 503;
        throw error;
    }
    const timeout = smtpTimeoutMs();
    transport = nodemailer.createTransport({
        auth: { pass: process.env.SMTP_PASS, user: process.env.SMTP_USER },
        connectionTimeout: timeout,
        dnsTimeout: timeout,
        greetingTimeout: timeout,
        host: process.env.SMTP_HOST,
        port,
        secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
        requireTLS: String(process.env.SMTP_SECURE).toLowerCase() !== 'true',
        socketTimeout: timeout,
    });
    return transport;
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    })[character]);
}

function otpTemplate({ code, name, purpose }) {
    const title = purpose === 'PASSWORD_RESET' ? 'Reset your Shades of SG password' : 'Verify your Shades of SG email';
    const action = purpose === 'PASSWORD_RESET' ? 'password reset' : 'account registration';
    const safeName = escapeHtml(name || 'there');
    return {
        subject: title,
        text: `Hello ${name || 'there'},\n\nYour six-digit code for ${action} is ${code}. It expires in 10 minutes. Do not share this code.\n\nIf you did not request this, you can ignore this email.`,
        html: `<p>Hello ${safeName},</p><p>Your six-digit code for ${action} is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>It expires in 10 minutes. Do not share this code.</p><p>If you did not request this, you can ignore this email.</p>`,
    };
}

function applicationTemplate({ feedback, name, status }) {
    const readable = String(status).replaceAll('_', ' ').toLowerCase();
    const intro = status === 'APPROVED'
        ? 'Your account has been upgraded to CREATOR. You can access the creator dashboard after signing in.'
        : status === 'REJECTED'
            ? 'Thank you for applying. Your application was not approved at this time.'
            : status === 'SUBMITTED'
                ? 'Your creator application has been received. You will receive an outcome or update within seven working days.'
                : `Your creator application is now ${readable}.`;
    const safeFeedback = feedback ? escapeHtml(feedback) : '';
    return {
        subject: status === 'SUBMITTED' ? 'Creator application received' : `Creator application update: ${readable}`,
        text: `Hello ${name || 'there'},\n\n${intro}${feedback ? `\n\nFeedback: ${feedback}` : ''}\n\nYou can check the current status from your Shades of SG account.`,
        html: `<p>Hello ${escapeHtml(name || 'there')},</p><p>${escapeHtml(intro)}</p>${safeFeedback ? `<p><strong>Applicant feedback:</strong> ${safeFeedback}</p>` : ''}<p>You can check the current status from your Shades of SG account.</p>`,
    };
}

async function sendEmail({ html, subject, text, to }) {
    const message = { from: process.env.MAIL_FROM || 'Shades of SG <no-reply@localhost>', html, subject, text, to };
    try {
        const result = await getTransport().sendMail(message);
        if (isTestTransport()) testOutbox.push({ ...message });
        return result;
    } catch (cause) {
        const error = new Error('Email delivery is temporarily unavailable.');
        error.statusCode = 503;
        error.cause = cause;
        throw error;
    }
}

function sendOtpEmail(values) {
    if (isTestTransport() && process.env.NODE_ENV !== 'test') {
        console.info(`[Development email] OTP for ${values.to}: ${values.code}`);
    }
    return sendEmail({ ...otpTemplate(values), to: values.to });
}

function sendApplicationEmail(values) {
    return sendEmail({ ...applicationTemplate(values), to: values.to });
}

function resetEmailTransportForTests() {
    transport = null;
    testOutbox.length = 0;
}

module.exports = {
    getTestOutbox: () => [...testOutbox],
    resetEmailTransportForTests,
    sendApplicationEmail,
    sendOtpEmail,
};
