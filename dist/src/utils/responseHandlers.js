"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorResponse = exports.successResponse = void 0;
const successResponse = (res, status, message, data) => {
    return res.status(Number(status)).json({
        message,
        data,
    });
};
exports.successResponse = successResponse;
const errorResponse = (res, status, error, details) => {
    return res.status(Number(status)).json({
        error,
        details,
    });
};
exports.errorResponse = errorResponse;
