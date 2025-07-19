"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reverseService_1 = require("../services/reverseService");
const router = (0, express_1.Router)();
router.post('/', async (req, res, next) => {
    try {
        const { text } = req.body;
        if (!text || typeof text !== 'string') {
            res.status(400).json({
                error: 'Invalid input. Text field is required and must be a string.'
            });
            return;
        }
        if (text.length > 100) {
            res.status(400).json({
                error: 'Text exceeds maximum length of 100 characters.'
            });
            return;
        }
        const reversedText = (0, reverseService_1.reverseText)(text);
        res.json({
            original: text,
            reversed: reversedText,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
