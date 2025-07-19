"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, _req, res, _next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`Error ${status}: ${message}`);
    console.error(err.stack);
    res.status(status).json({
        error: message,
        timestamp: new Date().toISOString()
    });
};
exports.errorHandler = errorHandler;
