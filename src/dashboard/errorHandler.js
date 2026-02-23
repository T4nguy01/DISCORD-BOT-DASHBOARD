/**
 * Middleware centralisé pour la gestion des erreurs API
 */
function errorHandler(err, req, res, next) {
    console.error(`[Dashboard Error] ${req.method} ${req.url}:`, err);

    const status = err.status || 500;
    const message = err.message || "Une erreur interne est survenue.";

    res.status(status).json({
        ok: false,
        error: message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}

module.exports = errorHandler;
