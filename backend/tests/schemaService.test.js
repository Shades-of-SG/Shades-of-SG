const { Sequelize } = require('sequelize');
const { ensureGameScoreSchema, ensureGenerationJobSchema } = require('../services/schemaService');

let sequelize;

beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', logging: false, storage: ':memory:' });
    await sequelize.query(`
        CREATE TABLE game_scores (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            song_id TEXT NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            accuracy DOUBLE,
            difficulty TEXT NOT NULL DEFAULT 'EASY',
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
    `);
});

afterEach(async () => sequelize.close());

test('repairs a legacy game_scores table idempotently', async () => {
    await ensureGameScoreSchema(sequelize);
    await ensureGameScoreSchema(sequelize);

    const columns = await sequelize.getQueryInterface().describeTable('game_scores');
    const indexes = await sequelize.getQueryInterface().showIndex('game_scores');

    expect(columns.max_combo).toMatchObject({ allowNull: false });
    expect(columns.rank).toMatchObject({ allowNull: false });
    expect(indexes.map((index) => index.name)).toContain('game_scores_user_created_at_idx');
});

test('repairs a legacy generation_jobs table idempotently', async () => {
    await sequelize.query(`
        CREATE TABLE generation_jobs (
            id TEXT PRIMARY KEY,
            song_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'QUEUED',
            error_message TEXT,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL
        )
    `);

    await ensureGenerationJobSchema(sequelize);
    await ensureGenerationJobSchema(sequelize);

    const columns = await sequelize.getQueryInterface().describeTable('generation_jobs');
    expect(columns.started_at).toBeDefined();
    expect(columns.completed_at).toBeDefined();
});
