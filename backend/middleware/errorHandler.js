function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    console.error('[Error Handler]', error);

    const fileTooLarge = error.code === 'LIMIT_FILE_SIZE';
    const statusCode = fileTooLarge ? 413 : error.statusCode || error.status || 500;

    return res.status(statusCode).json({
        success: false,
        message: fileTooLarge
            ? 'The uploaded file is too large.'
            : statusCode === 500 ? 'Internal server error' : error.message
    });
}

module.exports = errorHandler;
