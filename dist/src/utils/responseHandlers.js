"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadResponse = exports.errorResponse = exports.successResponse = void 0;
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
const downloadResponse = (res, status, data) => {
    res.setHeader("Content-disposition", "attachment; filename=data.csv");
    res.set("Content-Type", "text/csv");
    return res.status(Number(status)).send(data);
};
exports.downloadResponse = downloadResponse;
