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

module.exports = { ensureGuestReflectionSchema, ensureReflectionModerationSchema };
