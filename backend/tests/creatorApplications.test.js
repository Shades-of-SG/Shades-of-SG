const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'creator-applications.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { CreatorApplication, sequelize, User } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const completeDraft = {
    contentIdeas: 'A visual oral-history series pairing NDP songs with memories from neighbourhood music groups.',
    experience: 'I volunteer with a community arts group and create short interview videos for local events.',
    guidelinesAccepted: true,
    introduction: 'I care about preserving the stories carried by Singapore music.',
    motivation: 'I would like to help make Singapore cultural stories welcoming and accessible to younger audiences.',
    portfolioUrl: 'https://portfolio.example.test/work',
};

let admin;
let applicant;
let otherUser;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    const passwordHash = hashPassword('password123');
    applicant = await User.create({ email: 'applicant@example.com', name: 'Application Tester', passwordHash, role: 'REGISTERED' });
    otherUser = await User.create({ email: 'other@example.com', name: 'Other Applicant', passwordHash, role: 'REGISTERED' });
    admin = await User.create({ email: 'admin-applications@example.com', name: 'Review Admin', passwordHash, role: 'ADMIN' });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('drafts persist privately and only one editable application is reused per user', async () => {
    const first = await request(app).put('/api/creator-applications/draft').set(auth(applicant)).send({ introduction: 'First saved introduction' });
    expect(first.status).toBe(200);
    expect(first.body.application).toMatchObject({ introduction: 'First saved introduction', status: 'DRAFT' });
    expect(first.body.application).not.toHaveProperty('resumeData');
    expect(first.body.application).not.toHaveProperty('resumeUrl');

    const second = await request(app).put('/api/creator-applications/draft').set(auth(applicant)).send({ introduction: 'Updated introduction' });
    expect(second.status).toBe(200);
    expect(second.body.application.id).toBe(first.body.application.id);
    expect(await CreatorApplication.count({ where: { userId: applicant.id, status: 'DRAFT' } })).toBe(1);

    const mine = await request(app).get('/api/creator-applications/mine').set(auth(applicant));
    expect(mine.status).toBe(200);
    expect(mine.body.applications[0]).toMatchObject({ id: first.body.application.id, introduction: 'Updated introduction' });
    expect(mine.body.applications[0].history).toHaveLength(1);
});

test('resume upload validates content, replaces atomically, survives refresh, and remains owner-only while draft', async () => {
    const draft = await CreatorApplication.findOne({ where: { userId: applicant.id, status: 'DRAFT' } });
    const wrongContent = await request(app)
        .post(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant))
        .attach('resume', Buffer.from('not a pdf'), { contentType: 'application/pdf', filename: 'resume.pdf' });
    expect(wrongContent.status).toBe(400);
    expect((await draft.reload()).resumeData).toBeNull();

    const firstPdf = Buffer.from('%PDF-1.4\nfirst private resume');
    const uploaded = await request(app)
        .post(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant))
        .attach('resume', firstPdf, { contentType: 'application/pdf', filename: 'first-resume.pdf' });
    expect(uploaded.status).toBe(200);
    expect(uploaded.body.application).toMatchObject({ hasResume: true, resumeFileName: 'first-resume.pdf', resumeFileSize: firstPdf.length });
    expect(uploaded.body.application).not.toHaveProperty('resumeData');

    const replacement = Buffer.from('PK\u0003\u0004[Content_Types].xml word/document.xml replacement');
    const replaced = await request(app)
        .post(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant))
        .attach('resume', replacement, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename: 'replacement.docx',
        });
    expect(replaced.status).toBe(200);
    expect(replaced.body.application).toMatchObject({ resumeFileName: 'replacement.docx', resumeFileSize: replacement.length });

    const ownerDownload = await request(app).get(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant));
    expect(ownerDownload.status).toBe(200);
    expect(ownerDownload.headers['cache-control']).toBe('private, no-store');
    expect(ownerDownload.headers['x-content-type-options']).toBe('nosniff');
    expect(Number(ownerDownload.headers['content-length'])).toBe(replacement.length);
    expect(Buffer.from((await draft.reload()).resumeData)).toEqual(replacement);

    expect((await request(app).get(`/api/creator-applications/${draft.id}/resume`).set(auth(otherUser))).status).toBe(404);
    expect((await request(app).get(`/api/creator-applications/${draft.id}/resume`).set(auth(admin))).status).toBe(404);

    const refreshed = await request(app).get('/api/creator-applications/mine').set(auth(applicant));
    expect(refreshed.body.applications[0]).toMatchObject({ hasResume: true, resumeFileName: 'replacement.docx' });

    expect((await request(app).delete(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant))).status).toBe(204);
    expect((await request(app).get(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant))).status).toBe(404);
    expect((await draft.reload()).resumeData).toBeNull();

    const restored = await request(app)
        .post(`/api/creator-applications/${draft.id}/resume`).set(auth(applicant))
        .attach('resume', replacement, {
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            filename: 'replacement.docx',
        });
    expect(restored.status).toBe(200);
});

test('submission is read-only, visible in admin review, and its resume is role-protected', async () => {
    const saved = await request(app).put('/api/creator-applications/draft').set(auth(applicant)).send(completeDraft);
    const submitted = await request(app).post(`/api/creator-applications/${saved.body.application.id}/submit`).set(auth(applicant));
    expect(submitted.status).toBe(200);
    expect(submitted.body.application.status).toBe('SUBMITTED');
    expect(submitted.body.application.submittedAt).toBeTruthy();

    const editAttempt = await request(app).put('/api/creator-applications/draft').set(auth(applicant)).send({ introduction: 'Should not replace submitted content' });
    expect(editAttempt.status).toBe(409);

    const adminList = await request(app).get('/api/admin/creator-applications').set(auth(admin));
    expect(adminList.status).toBe(200);
    expect(adminList.body.applications[0]).toMatchObject({
        contentIdeas: completeDraft.contentIdeas,
        experience: completeDraft.experience,
        hasResume: true,
        introduction: completeDraft.introduction,
        motivation: completeDraft.motivation,
        status: 'SUBMITTED',
    });
    expect(adminList.body.applications[0]).not.toHaveProperty('resumeData');
    expect(adminList.body.applications[0]).not.toHaveProperty('resumeUrl');

    expect((await request(app).get(`/api/creator-applications/${saved.body.application.id}/resume`).set(auth(admin))).status).toBe(200);
    expect((await request(app).get(`/api/creator-applications/${saved.body.application.id}/resume`).set(auth(otherUser))).status).toBe(404);
});

test('a different user cannot replace, remove, submit, or withdraw another user application', async () => {
    const application = await CreatorApplication.findOne({ where: { userId: applicant.id, status: 'SUBMITTED' } });
    const pdf = Buffer.from('%PDF-1.4\nunauthorised replacement');
    expect((await request(app).post(`/api/creator-applications/${application.id}/resume`).set(auth(otherUser)).attach('resume', pdf, { contentType: 'application/pdf', filename: 'other.pdf' })).status).toBe(404);
    expect((await request(app).delete(`/api/creator-applications/${application.id}/resume`).set(auth(otherUser))).status).toBe(404);
    expect((await request(app).post(`/api/creator-applications/${application.id}/submit`).set(auth(otherUser))).status).toBe(404);
    expect((await request(app).post(`/api/creator-applications/${application.id}/withdraw`).set(auth(otherUser)).send({})).status).toBe(404);
});
