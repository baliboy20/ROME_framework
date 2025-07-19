"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseText = reverseText;
function reverseText(text) {
    if (!text) {
        return '';
    }
    const chars = Array.from(text);
    return chars.reverse().join('');
}
