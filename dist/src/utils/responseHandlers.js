"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cvsResponse = exports.errorResponse = exports.successResponse = void 0;
const fast_csv_1 = require("fast-csv");
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
const cvsResponse = (res, status, filename, data) => {
    res.header("Content-Type", "text/csv");
    res.attachment(filename + ".csv");
    // Use fast-csv to write the CSV data and pipe it to the response
    const csvStream = (0, fast_csv_1.format)({ headers: true });
    csvStream.pipe(res);
    // Write data to CSV stream and end the stream
    data.forEach((record) => csvStream.write(record));
    csvStream.end();
    return res.status(Number(status));
};
exports.cvsResponse = cvsResponse;
