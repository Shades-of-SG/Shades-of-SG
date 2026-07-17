const { Sequelize } = require('sequelize');
const path = require('path');

const isPostgres = Boolean(process.env.DB_URL);

const sequelize = isPostgres
    ? new Sequelize(process.env.DB_URL, {
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
