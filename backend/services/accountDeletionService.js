const { Op } = require('sequelize');
const {
    AnalyticsEvent, AuditLog, AuthIdentity, AuthOtp, Badge, CreatorApplication, CreatorApplicationHistory,
    CreatorProfile, Folder, FolderSongProposal, GameScore, GeneratedFrame, GenerationJob, InstrumentChallengeProgress,
    Lesson, ModerationAction, Reflection, ReflectionComment, ReflectionLike, RhythmBeatmap, SceneSegment, Session,
    Song, SongBookmark, SongFolder, SongInstrument, SongReport, TriviaAttempt, TriviaQuestion, UserProfile,
    UserWarning,
} = require('../models');
const { writeAudit } = require('./auditService');

function actionableError(statusCode, code, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

// Recomputed inside the caller's transaction so a song publish that races the
// deletion request is still caught before anything is destroyed.
async function assertDeletable(user, { allowPublishedContentRemoval = false, transaction } = {}) {
    if (user.role === 'ADMIN') {
        throw actionableError(403, 'ADMIN_ACCOUNT', 'Administrator accounts cannot be deleted.');
    }
    const songs = await Song.findAll({ attributes: ['id', 'status'], transaction, where: { creatorId: user.id } });
    const songIds = songs.map((song) => song.id);
    const publishedCount = songs.filter((song) => song.status === 'PUBLISHED').length;
    if (publishedCount > 0 && !allowPublishedContentRemoval) {
        throw actionableError(
            409,
            'PUBLISHED_CONTENT_PRESENT',
            `This account has ${publishedCount} published song${publishedCount === 1 ? '' : 's'} still live. `
                + 'Contact support so they can be unpublished before the account is deleted.',
        );
    }
    return { publishedCount, songCount: songIds.length, songIds };
}

/**
 * Permanently removes a user and every row that belongs to them, inside the
 * transaction supplied by the caller. Reused by both the self-service delete
 * route (backend/routes/auth.js) and the admin-initiated delete route
 * (backend/routes/admin.js) so the two paths can never drift apart.
 */
async function hardDeleteUser({
    actorId, allowPublishedContentRemoval = false, reason, req, transaction, user,
}) {
    const summary = await assertDeletable(user, { allowPublishedContentRemoval, transaction });
    const { publishedCount, songCount, songIds } = summary;

    // Write the audit snapshot first, while the row still exists, then null out
    // every reference to this user on audit/moderation history so those records
    // survive the deletion instead of being blocked or removed by it.
    await writeAudit({
        action: 'ACCOUNT_HARD_DELETED',
        actorId,
        creatorId: user.role === 'CREATOR' ? user.id : null,
        entityId: user.id,
        entityType: 'USER',
        metadata: {
            deletedUserEmail: user.email,
            deletedUserName: user.name,
            publishedCount,
            reason: reason || null,
            role: user.role,
            selfService: actorId === user.id,
            songCount,
        },
        req,
        transaction,
    });
    await AuditLog.update(
        { actorId: null },
        { transaction, where: { actorId: user.id } },
    );
    await AuditLog.update(
        { creatorId: null },
        { transaction, where: { creatorId: user.id } },
    );
    await ModerationAction.update({ actorId: null }, { transaction, where: { actorId: user.id } });
    await ModerationAction.update({ targetUserId: null }, { transaction, where: { targetUserId: user.id } });
    await Folder.update({ createdBy: null }, { transaction, where: { createdBy: user.id } });
    await Folder.update({ proposedBy: null }, { transaction, where: { proposedBy: user.id } });
    await Folder.update({ reviewedBy: null }, { transaction, where: { reviewedBy: user.id } });
    await FolderSongProposal.update({ reviewedBy: null }, { transaction, where: { reviewedBy: user.id } });
    await CreatorApplication.update({ reviewedBy: null }, { transaction, where: { reviewedBy: user.id } });
    await CreatorApplicationHistory.update({ actorId: null }, { transaction, where: { actorId: user.id } });
    await UserWarning.update({ issuedBy: null }, { transaction, where: { issuedBy: user.id } });
    await UserWarning.update({ resolvedBy: null }, { transaction, where: { resolvedBy: user.id } });
    await Reflection.update({ moderatedBy: null }, { transaction, where: { moderatedBy: user.id } });
    await AnalyticsEvent.update({ userId: null }, { transaction, where: { userId: user.id } });

    // Owned songs: delete every child row (across every owner) before the songs
    // themselves, then the songs. This also removes other users' bookmarks,
    // reflections, reports, etc. against this creator's content.
    if (songIds.length) {
        const sceneSegments = await SceneSegment.findAll({
            attributes: ['id'], transaction, where: { songId: { [Op.in]: songIds } },
        });
        const sceneSegmentIds = sceneSegments.map((segment) => segment.id);
        if (sceneSegmentIds.length) {
            await GeneratedFrame.destroy({ transaction, where: { sceneSegmentId: { [Op.in]: sceneSegmentIds } } });
        }
        await SceneSegment.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await GenerationJob.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await RhythmBeatmap.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await Lesson.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });

        const triviaQuestions = await TriviaQuestion.findAll({
            attributes: ['id'], transaction, where: { songId: { [Op.in]: songIds } },
        });
        const triviaQuestionIds = triviaQuestions.map((question) => question.id);
        if (triviaQuestionIds.length) {
            await TriviaAttempt.destroy({ transaction, where: { questionId: { [Op.in]: triviaQuestionIds } } });
        }
        await TriviaQuestion.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await GameScore.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });

        const ownedSongReflections = await Reflection.findAll({
            attributes: ['id'], transaction, where: { songId: { [Op.in]: songIds } },
        });
        const ownedReflectionIds = ownedSongReflections.map((reflection) => reflection.id);
        if (ownedReflectionIds.length) {
            await ReflectionLike.destroy({ transaction, where: { reflectionId: { [Op.in]: ownedReflectionIds } } });
            await ReflectionComment.destroy({ transaction, where: { reflectionId: { [Op.in]: ownedReflectionIds } } });
        }
        await Reflection.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await SongBookmark.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await SongReport.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await SongFolder.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await SongInstrument.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await FolderSongProposal.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await AnalyticsEvent.destroy({ transaction, where: { songId: { [Op.in]: songIds } } });
        await Song.destroy({ transaction, where: { creatorId: user.id } });
    }

    // The user's own personal data, wherever it lives (including on songs they
    // don't own).
    await ReflectionLike.destroy({ transaction, where: { userId: user.id } });
    await ReflectionComment.destroy({ transaction, where: { userId: user.id } });
    const ownReflections = await Reflection.findAll({
        attributes: ['id'], transaction, where: { userId: user.id },
    });
    const ownReflectionIds = ownReflections.map((reflection) => reflection.id);
    if (ownReflectionIds.length) {
        await ReflectionLike.destroy({ transaction, where: { reflectionId: { [Op.in]: ownReflectionIds } } });
        await ReflectionComment.destroy({ transaction, where: { reflectionId: { [Op.in]: ownReflectionIds } } });
    }
    await Reflection.destroy({ transaction, where: { userId: user.id } });
    await SongBookmark.destroy({ transaction, where: { userId: user.id } });
    await Badge.destroy({ transaction, where: { userId: user.id } });
    await GameScore.destroy({ transaction, where: { userId: user.id } });
    await TriviaAttempt.destroy({ transaction, where: { userId: user.id } });
    await InstrumentChallengeProgress.destroy({ transaction, where: { userId: user.id } });
    await SongReport.destroy({ transaction, where: { userId: user.id } });
    await UserWarning.destroy({ transaction, where: { userId: user.id } });

    const ownApplications = await CreatorApplication.findAll({
        attributes: ['id'], transaction, where: { userId: user.id },
    });
    const ownApplicationIds = ownApplications.map((application) => application.id);
    if (ownApplicationIds.length) {
        await CreatorApplicationHistory.destroy({
            transaction, where: { applicationId: { [Op.in]: ownApplicationIds } },
        });
    }
    await CreatorApplication.destroy({ transaction, where: { userId: user.id } });
    await FolderSongProposal.destroy({ transaction, where: { proposedBy: user.id } });
    await SongFolder.destroy({ transaction, where: { addedBy: user.id } });
    await UserProfile.destroy({ transaction, where: { userId: user.id } });
    await CreatorProfile.destroy({ transaction, where: { userId: user.id } });
    await Session.destroy({ transaction, where: { userId: user.id } });
    await AuthIdentity.destroy({ transaction, where: { userId: user.id } });
    await AuthOtp.destroy({ transaction, where: { userId: user.id } });

    await user.destroy({ transaction });

    return { deletedCounts: { songs: songCount }, publishedCount, songCount };
}

module.exports = { assertDeletable, hardDeleteUser };
