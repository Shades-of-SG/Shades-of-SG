const express = require('express');
const { Folder, Song, SongFolder } = require('../models');
const { optionalAuth, requireCreator } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();

function slugify(name) {
    return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
}

router.get('/', async (req, res, next) => {
    try {
        const folders = await Folder.findAll({ where: { status: 'APPROVED' }, order: [['name', 'ASC']] });
        return res.json({ folders });
    } catch (error) { return next(error); }
});

router.get('/proposals/mine', requireCreator, async (req, res, next) => {
    try {
        const folders = await Folder.findAll({
            where: { origin: 'CREATOR_PROPOSAL', proposedBy: req.authUserRecord.id },
            order: [['createdAt', 'DESC']],
        });
        return res.json({ folders });
    } catch (error) { return next(error); }
});

router.post('/proposals', requireCreator, async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const description = String(req.body.description || '').trim() || null;
        if (name.length < 2 || name.length > 255) return res.status(400).json({ message: 'Folder name must be between 2 and 255 characters.' });
        if (description && description.length > 2000) return res.status(400).json({ message: 'Description must be 2000 characters or fewer.' });
        const baseSlug = slugify(name);
        if (!baseSlug) return res.status(400).json({ message: 'Folder name must include letters or numbers.' });
        const folder = await Folder.create({
            createdBy: req.authUserRecord.id,
            description,
            name,
            origin: 'CREATOR_PROPOSAL',
            proposedBy: req.authUserRecord.id,
            slug: `${baseSlug}-${Date.now().toString(36)}`,
            status: 'PENDING',
        });
        await writeAudit({ action: 'FOLDER_PROPOSED', actorId: req.authUserRecord.id, creatorId: req.authUserRecord.id, entityId: folder.id, entityType: 'FOLDER', req });
        return res.status(201).json({ folder });
    } catch (error) { return next(error); }
});

router.get('/song/:songId', optionalAuth, async (req, res, next) => {
    try {
        const song = await Song.findByPk(req.params.songId);
        const isOwner = Boolean(req.authUserRecord?.role === 'CREATOR' && song?.creatorId === req.authUserRecord.id);
        if (!song || (!isOwner && song.status !== 'PUBLISHED')) return res.status(404).json({ message: 'Song not found.' });
        const folders = await song.getFolders({ where: isOwner ? undefined : { status: 'APPROVED' }, order: [['name', 'ASC']] });
        return res.json({ folders });
    } catch (error) { return next(error); }
});

router.put('/song/:songId/:folderId', requireCreator, async (req, res, next) => {
    try {
        const song = await Song.findOne({ where: { id: req.params.songId, creatorId: req.authUserRecord.id } });
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        const folder = await Folder.findOne({ where: { id: req.params.folderId, status: 'APPROVED' } });
        if (!folder) return res.status(404).json({ message: 'Approved folder not found.' });
        const [link, created] = await SongFolder.findOrCreate({
            defaults: { addedBy: req.authUserRecord.id },
            where: { folderId: folder.id, songId: song.id },
        });
        if (created) await writeAudit({ action: 'SONG_FOLDER_ATTACHED', actorId: req.authUserRecord.id, creatorId: song.creatorId, entityId: folder.id, entityType: 'FOLDER', req, songId: song.id });
        return res.status(created ? 201 : 200).json({ link });
    } catch (error) { return next(error); }
});

router.delete('/song/:songId/:folderId', requireCreator, async (req, res, next) => {
    try {
        const song = await Song.findOne({ where: { id: req.params.songId, creatorId: req.authUserRecord.id } });
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        const deleted = await SongFolder.destroy({ where: { folderId: req.params.folderId, songId: song.id } });
        if (!deleted) return res.status(404).json({ message: 'Song folder link not found.' });
        await writeAudit({ action: 'SONG_FOLDER_DETACHED', actorId: req.authUserRecord.id, creatorId: song.creatorId, entityId: req.params.folderId, entityType: 'FOLDER', req, songId: song.id });
        return res.status(204).end();
    } catch (error) { return next(error); }
});

module.exports = router;
