require('dotenv').config();

const { sequelize, User } = require('../models');
const { hashPassword } = require('../services/authService');

async function seedCreator() {
    const email = process.env.SEED_CREATOR_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_CREATOR_PASSWORD;

    if (!email || !password) {
        throw new Error('SEED_CREATOR_EMAIL and SEED_CREATOR_PASSWORD are required.');
    }

    const existingCreator = await User.findOne({ where: { email } });

    if (existingCreator) {
        console.log(`Creator account already exists for ${email}. No changes made.`);
        return;
    }

    await User.create({
        email,
        name: process.env.SEED_CREATOR_NAME?.trim() || 'Creator',
        passwordHash: hashPassword(password),
        role: 'CREATOR',
    });

    console.log(`Creator account created for ${email}.`);
}

seedCreator()
    .catch((error) => {
        console.error(`Unable to seed creator account: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
