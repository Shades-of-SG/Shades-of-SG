const express = require('express');
const { Op } = require('sequelize');
const { Folder, FolderSongProposal, Song, SongFolder } = require('../models');
const { optionalAuth, requireCreator } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();

function slugify(name) {
    return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180);
}

function serializePublicFolder(folder) {
    const value = folder.get({ plain: true });
    return {
        id: value.id,
        name: value.name,
        slug: value.slug,
        description: value.description,
        displayOrder: value.displayOrder,
        songs: (value.songs || []).map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            coverImageUrl: song.coverImageUrl,
            description: song.description,
            songOrder: song.SongFolder?.songOrder || 0,
        })),
    };
}

router.get('/', async (req, res, next) => {
    try {
        const folders = await Folder.findAll({
            where: { status: 'APPROVED' },
            include: [{
                model: Song,
                as: 'songs',
                attributes: ['id', 'title', 'artist', 'coverImageUrl', 'description'],
                through: { attributes: ['songOrder'] },
                required: true,
                where: { status: 'PUBLISHED' },
            }],
            order: [['displayOrder', 'ASC'], ['name', 'ASC'], [{ model: Song, as: 'songs' }, SongFolder, 'songOrder', 'ASC']],
        });
        return res.json({ folders: folders.map(serializePublicFolder) });
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

router.patch('/proposals/:id', requireCreator, async (req, res, next) => {
    try {
        const folder = await Folder.findOne({ where: { id: req.params.id, origin: 'CREATOR_PROPOSAL', proposedBy: req.authUserRecord.id, status: { [Op.in]: ['PENDING', 'CHANGES_REQUESTED'] } } });
        if (!folder) return res.status(404).json({ message: 'Editable folder proposal not found.' });
        const updates = {};
        if (req.body.name !== undefined) {
            updates.name = String(req.body.name).trim();
            if (updates.name.length < 2 || updates.name.length > 255) return res.status(400).json({ message: 'Folder name must be between 2 and 255 characters.' });
        }
        if (req.body.description !== undefined) updates.description = String(req.body.description || '').trim() || null;
        if (folder.status === 'CHANGES_REQUESTED') updates.status = 'PENDING';
        await folder.update(updates);
        await writeAudit({ action: 'FOLDER_PROPOSAL_UPDATED', actorId: req.authUserRecord.id, creatorId: req.authUserRecord.id, entityId: folder.id, entityType: 'FOLDER', req });
        return res.json({ folder });
    } catch (error) { return next(error); }
});

router.get('/placements/mine', requireCreator, async (req, res, next) => {
    try {
        const proposals = await FolderSongProposal.findAll({
            where: { proposedBy: req.authUserRecord.id },
            include: [
                { model: Song, as: 'song', attributes: ['id', 'title', 'status'], required: true, where: { creatorId: req.authUserRecord.id } },
                { model: Folder, as: 'folder', attributes: ['id', 'name', 'status'] },
            ],
            order: [['createdAt', 'DESC']],
        });
        return res.json({ proposals });
    } catch (error) { return next(error); }
});

async function createPlacementProposal(req, res, next) {
    try {
        const body = req.body || {};
        const songId = body.songId || req.params.songId;
        const folderId = body.folderId || req.params.folderId;
        const song = await Song.findOne({ where: { id: songId, creatorId: req.authUserRecord.id } });
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        const folder = await Folder.findOne({ where: { id: folderId, status: 'APPROVED' } });
        if (!folder) return res.status(404).json({ message: 'Approved folder not found.' });
        if (await SongFolder.findOne({ where: { folderId: folder.id, songId: song.id } })) return res.status(409).json({ message: 'This song is already in the folder.' });
        const active = await FolderSongProposal.findOne({ where: { folderId: folder.id, songId: song.id, status: { [Op.in]: ['PENDING', 'CHANGES_REQUESTED'] } } });
        if (active) return res.status(409).json({ message: 'A placement proposal is already under review.' });
        const creatorNote = String(body.creatorNote || '').trim() || null;
        if (creatorNote && creatorNote.length > 2000) return res.status(400).json({ message: 'Creator note must be 2000 characters or fewer.' });
        const proposal = await FolderSongProposal.create({ creatorNote, folderId: folder.id, proposedBy: req.authUserRecord.id, songId: song.id, status: 'PENDING' });
        await writeAudit({ action: 'SONG_FOLDER_PLACEMENT_PROPOSED', actorId: req.authUserRecord.id, creatorId: song.creatorId, entityId: proposal.id, entityType: 'FOLDER_SONG_PROPOSAL', metadata: { folderId: folder.id }, req, songId: song.id });
        return res.status(202).json({ proposal });
    } catch (error) { return next(error); }
}

router.post('/placements', requireCreator, createPlacementProposal);
router.put('/song/:songId/:folderId', requireCreator, createPlacementProposal);

router.patch('/placements/:id', requireCreator, async (req, res, next) => {
    try {
        const proposal = await FolderSongProposal.findOne({ where: { id: req.params.id, proposedBy: req.authUserRecord.id, status: { [Op.in]: ['PENDING', 'CHANGES_REQUESTED'] } }, include: [{ model: Song, as: 'song', attributes: ['id', 'creatorId'], required: true, where: { creatorId: req.authUserRecord.id } }] });
        if (!proposal) return res.status(404).json({ message: 'Editable placement proposal not found.' });
        if (req.body.withdraw === true) {
            await proposal.update({ status: 'WITHDRAWN' });
            await writeAudit({ action: 'SONG_FOLDER_PLACEMENT_WITHDRAWN', actorId: req.authUserRecord.id, creatorId: req.authUserRecord.id, entityId: proposal.id, entityType: 'FOLDER_SONG_PROPOSAL', req, songId: proposal.songId });
            return res.json({ proposal });
        }
        const creatorNote = String(req.body.creatorNote || '').trim() || null;
        if (creatorNote && creatorNote.length > 2000) return res.status(400).json({ message: 'Creator note must be 2000 characters or fewer.' });
        await proposal.update({ creatorNote, status: 'PENDING' });
        return res.json({ proposal });
    } catch (error) { return next(error); }
});

router.get('/song/:songId', optionalAuth, async (req, res, next) => {
    try {
        const song = await Song.findByPk(req.params.songId);
        const isOwner = Boolean(
            req.authUserRecord?.role === 'CREATOR'
            && req.authUserRecord.creatorAccessStatus === 'ACTIVE'
            && song?.creatorId === req.authUserRecord.id
        );
        if (!song || (!isOwner && song.status !== 'PUBLISHED')) return res.status(404).json({ message: 'Song not found.' });
        const folders = await song.getFolders({ where: { status: 'APPROVED' }, order: [['displayOrder', 'ASC'], ['name', 'ASC']] });
        return res.json({ folders });
    } catch (error) { return next(error); }
});

router.delete('/song/:songId/:folderId', requireCreator, (req, res) => res.status(403).json({ message: 'Only administrators can remove songs from platform folders.' }));

router.get('/:slug', async (req, res, next) => {
    try {
        const folder = await Folder.findOne({
            where: { slug: req.params.slug, status: 'APPROVED' },
            include: [{
                model: Song, as: 'songs', required: true,
                attributes: ['id', 'title', 'artist', 'coverImageUrl', 'description'],
                through: { attributes: ['songOrder'] }, where: { status: 'PUBLISHED' },
            }],
            order: [[{ model: Song, as: 'songs' }, SongFolder, 'songOrder', 'ASC']],
        });
        if (!folder) return res.status(404).json({ message: 'Published folder not found.' });
        return res.json({ folder: serializePublicFolder(folder) });
    } catch (error) { return next(error); }
});

module.exports = router;
