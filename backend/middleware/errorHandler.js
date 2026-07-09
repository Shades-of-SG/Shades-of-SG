function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    console.error('[Error Handler]', error);

    const statusCode = error.statusCode || error.status || 500;

    return res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal server error' : error.message
    });
}

module.exports = errorHandler;
