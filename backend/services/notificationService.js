const { Notification } = require('../models');

function createInProductNotification({ message, title, type, userId, warningId = null, link = '/settings/safety', transaction }) {
    if (!userId) return Promise.resolve(null);
    return Notification.create({ link, message, title, type, userId, warningId }, { transaction });
}

module.exports = { createInProductNotification };
