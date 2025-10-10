"use strict";
// src/lib/response.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiResponse = createApiResponse;
exports.successResponse = successResponse;
exports.errorResponse = errorResponse;
exports.createPaginatedResponse = createPaginatedResponse;
exports.paginatedResponse = paginatedResponse;
exports.calculatePagination = calculatePagination;
exports.parsePaginationQuery = parsePaginationQuery;
exports.noContentResponse = noContentResponse;
exports.createdResponse = createdResponse;
exports.legacySuccessResponse = legacySuccessResponse;
exports.legacyErrorResponse = legacyErrorResponse;
/**
 * Creates a standardized API response object
 */
function createApiResponse(params) {
    var _a, _b;
    return {
        success: params.success,
        data: (_a = params.data) !== null && _a !== void 0 ? _a : null,
        error: (_b = params.error) !== null && _b !== void 0 ? _b : null,
    };
}
/**
 * Sends a successful response
 */
function successResponse(res, data, status = 200, message) {
    const response = createApiResponse({
        success: true,
        data: data,
    });
    if (message) {
        res.setHeader("X-Message", message);
    }
    return res.status(status).json(response);
}
/**
 * Sends an error response
 */
function errorResponse(res, error, headers) {
    const response = createApiResponse({
        success: false,
        error: error,
    });
    if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
            res.setHeader(key, value);
        });
    }
    return res.status(error.status).json(response);
}
/**
 * Creates a paginated response
 */
function createPaginatedResponse(items, pagination) {
    return createApiResponse({
        success: true,
        data: {
            items,
            pagination,
        },
    });
}
/**
 * Sends a paginated response
 */
function paginatedResponse(res, items, pagination, status = 200) {
    const response = createPaginatedResponse(items, pagination);
    return res.status(status).json(response);
}
/**
 * Utility to calculate pagination metadata
 */
function calculatePagination(params) {
    const { total, page, limit } = params;
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}
/**
 * Parses pagination query parameters with defaults
 */
function parsePaginationQuery(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    return { page, limit };
}
/**
 * Creates a "no content" response (204)
 */
function noContentResponse(res) {
    return res.status(204).send();
}
/**
 * Creates a "created" response (201) with location header
 */
function createdResponse(res, data, location, message) {
    if (location) {
        res.setHeader("Location", location);
    }
    return successResponse(res, data, 201, message);
}
/**
 * Legacy adapter for backward compatibility with existing responseHandlers
 * This allows gradual migration from old response format
 */
function legacySuccessResponse(res, status, message, data) {
    // For now, return the legacy format but add a deprecation header
    res.setHeader("X-Deprecation-Warning", "This response format is deprecated. Upgrade to new API response format.");
    return res.status(status).json({
        message,
        data: data || null,
    });
}
function legacyErrorResponse(res, status, error, data) {
    // For now, return the legacy format but add a deprecation header
    res.setHeader("X-Deprecation-Warning", "This response format is deprecated. Upgrade to new API response format.");
    return res.status(status).json({
        error,
        data: data || null,
    });
}
