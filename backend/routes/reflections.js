const express = require('express');
const { Op } = require('sequelize');
const { Reflection, Song, User } = require('../models');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serializeReflection(reflection, currentUserId) {
    const value = reflection.get({ plain: true });

    return {
        id: value.id,
        content: value.content,
        displayName: value.displayName || 'Anonymous',
        isAnonymous: !value.displayName,
        isOwner: Boolean(currentUserId && value.userId === currentUserId),
        song: value.song ? { id: value.song.id, title: value.song.title } : null,
        songId: value.songId,
        status: value.status,
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
    };
}

async function findReflection(id) {
    if (!UUID_PATTERN.test(id)) return null;

    return Reflection.findByPk(id, {
        include: [{ model: Song, as: 'song', attributes: ['id', 'title'] }],
    });
}

async function validateInput(body) {
    const content = body.content?.trim();
    const songId = body.songId;

    if (!content || !songId) {
        return { error: 'Song and reflection are required.' };
    }

    if (content.length > 1000) {
        return { error: 'Reflection must be 1000 characters or fewer.' };
    }

    if (!UUID_PATTERN.test(songId) || !(await Song.findByPk(songId))) {
        return { error: 'Please choose a valid song.' };
    }

    return { content, songId };
}

router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const where = { status: 'APPROVED' };
        const search = req.query.search?.trim();
        const songId = req.query.songId?.trim();

        if (songId && UUID_PATTERN.test(songId)) where.songId = songId;
        if (search) where.content = { [Op.like]: `%${search}%` };

        const reflections = await Reflection.findAll({
            where,
            include: [{ model: Song, as: 'song', attributes: ['id', 'title'] }],
            order: [['createdAt', req.query.sort === 'oldest' ? 'ASC' : 'DESC']],
        });

        return res.json({
            reflections: reflections.map((item) => serializeReflection(item, req.authUser?.id)),
        });
    } catch (error) {
        return next(error);
    }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        const input = await validateInput(req.body);
        if (input.error) return res.status(400).json({ message: input.error });

        const user = await User.findByPk(req.authUser.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });

        const reflection = await Reflection.create({
            content: input.content,
            displayName: req.body.isAnonymous ? null : user.name,
            songId: input.songId,
            status: 'APPROVED',
            userId: user.id,
        });

        const created = await findReflection(reflection.id);
        return res.status(201).json({ reflection: serializeReflection(created, user.id) });
    } catch (error) {
        return next(error);
    }
});

router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const reflection = await findReflection(req.params.id);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        if (reflection.userId !== req.authUser.id) return res.status(403).json({ message: 'You can only edit your own reflections.' });

        const input = await validateInput(req.body);
        if (input.error) return res.status(400).json({ message: input.error });

        const user = await User.findByPk(req.authUser.id);
        await reflection.update({
            content: input.content,
            displayName: req.body.isAnonymous ? null : user.name,
            songId: input.songId,
        });

        const updated = await findReflection(reflection.id);
        return res.json({ reflection: serializeReflection(updated, req.authUser.id) });
    } catch (error) {
        return next(error);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const reflection = await findReflection(req.params.id);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        if (reflection.userId !== req.authUser.id) return res.status(403).json({ message: 'You can only delete your own reflections.' });

        await reflection.destroy();
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
