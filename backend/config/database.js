const { Sequelize } = require('sequelize');
const path = require('path');

// DATABASE_URL is the documented production setting used by Render/Supabase.
// Keep DB_URL as a backwards-compatible alias for existing environments.
const databaseUrl = process.env.NODE_ENV === 'test'
    ? ''
    : process.env.DATABASE_URL || process.env.DB_URL;
const isPostgres = Boolean(databaseUrl);

const sequelize = isPostgres
    ? new Sequelize(databaseUrl, {
        dialect: 'postgres',
        logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
        dialectOptions: {
            ssl: process.env.DB_SSL === 'false'
                ? false
                : {
                    require: true,
                    rejectUnauthorized: false,
                },
        },
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DB_STORAGE || path.join(__dirname, '..', 'database.sqlite'),
        logging: process.env.SEQUELIZE_LOGGING === 'true' ? console.log : false,
    });

module.exports = sequelize;
