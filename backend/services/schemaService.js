const { DataTypes, QueryTypes } = require('sequelize');

async function ensureGuestReflectionSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('reflections');

    if (!columns.display_mode) {
        await queryInterface.addColumn('reflections', 'display_mode', {
            allowNull: false,
            defaultValue: 'ANONYMOUS',
            type: DataTypes.STRING(32),
        });
    }

    if (!columns.guest_submission) {
        await queryInterface.addColumn('reflections', 'guest_submission', {
            allowNull: false,
            defaultValue: false,
            type: DataTypes.BOOLEAN,
        });
    }

    await sequelize.query(
        "UPDATE reflections SET display_mode = CASE WHEN display_name IS NULL THEN 'ANONYMOUS' ELSE 'PROFILE' END",
        { type: QueryTypes.UPDATE }
    );
}

async function ensureReflectionModerationSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('reflections');

    if (!columns.tags) {
        await queryInterface.addColumn('reflections', 'tags', {
            allowNull: false,
            defaultValue: [],
            type: DataTypes.JSON,
        });
    }

    if (!columns.moderated_by) {
        await queryInterface.addColumn('reflections', 'moderated_by', {
            allowNull: true,
            onDelete: 'SET NULL',
            references: { key: 'id', model: 'users' },
            type: DataTypes.UUID,
        });
    }

    if (!columns.moderated_at) {
        await queryInterface.addColumn('reflections', 'moderated_at', {
            allowNull: true,
            type: DataTypes.DATE,
        });
    }

    if (!columns.moderator_note) {
        await queryInterface.addColumn('reflections', 'moderator_note', {
            allowNull: true,
            type: DataTypes.TEXT,
        });
    }

    const indexes = await queryInterface.showIndex('reflections');
    if (!indexes.some((index) => index.name === 'reflections_status_created_at_idx')) {
        await queryInterface.addIndex('reflections', ['status', 'created_at'], {
            name: 'reflections_status_created_at_idx',
        });
    }
}

async function ensureSongSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('songs');

    if (!columns.raw_lyrics) {
        await queryInterface.addColumn('songs', 'raw_lyrics', {
            allowNull: true,
            type: DataTypes.TEXT,
        });
    }

    if (!columns.transcription_segments) {
        await queryInterface.addColumn('songs', 'transcription_segments', {
            allowNull: true,
            type: DataTypes.JSON,
        });
    }
}

async function ensureGenerationJobSchema(sequelize) {
    // Empty schema updater to satisfy server.js import requirements
}

async function ensureRhythmBeatmapSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('rhythm_beatmaps');

    // Some databases received the initial rhythm table before published_at
    // was added to the model. Keep startup additive and safe for existing maps.
    if (!columns.published_at) {
        await queryInterface.addColumn('rhythm_beatmaps', 'published_at', {
            allowNull: true,
            type: DataTypes.DATE,
        });
    }
}

async function ensureSongMediaSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('songs');

    if (!columns.audio_file_name) {
        await queryInterface.addColumn('songs', 'audio_file_name', {
            allowNull: true,
            type: DataTypes.STRING,
        });
    }
}

async function ensureGameScoreSchema(sequelize) {
    const queryInterface = sequelize.getQueryInterface();
    const columns = await queryInterface.describeTable('game_scores');

    if (!columns.max_combo) {
        await queryInterface.addColumn('game_scores', 'max_combo', {
            allowNull: false,
            defaultValue: 0,
            type: DataTypes.INTEGER,
        });
    }

    if (!columns.rank) {
        await queryInterface.addColumn('game_scores', 'rank', {
            allowNull: false,
            defaultValue: 'C',
            type: DataTypes.STRING(8),
        });
    }

    const indexes = await queryInterface.showIndex('game_scores');
    if (!indexes.some((index) => index.name === 'game_scores_user_created_at_idx')) {
        await queryInterface.addIndex('game_scores', ['user_id', 'created_at'], {
            name: 'game_scores_user_created_at_idx',
        });
    }
}

module.exports = {
    ensureGameScoreSchema,
    ensureGenerationJobSchema,
    ensureGuestReflectionSchema,
    ensureReflectionModerationSchema,
    ensureSongSchema,
    ensureRhythmBeatmapSchema,
    ensureSongMediaSchema,
};
