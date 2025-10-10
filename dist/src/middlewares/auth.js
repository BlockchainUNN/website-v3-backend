"use strict";
// src/middleware/auth.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyAuthCompat = exports.logAuthAttempt = exports.extractUserContext = exports.validateRefreshToken = exports.requireAuth = exports.optionalAuthenticate = exports.authenticate = void 0;
exports.generateTokens = generateTokens;
exports.decodeToken = decodeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const api_types_1 = require("../types/api.types");
const permissions_1 = require("../lib/permissions");
const client_1 = __importDefault(require("../../prisma/client"));
const error_1 = require("../lib/error");
/**
 * Enhanced authentication middleware with proper error handling and user context
 */
exports.authenticate = (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw error_1.AppError.unauthorized("No valid authentication token provided");
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        throw error_1.AppError.unauthorized("Authentication token is missing");
    }
    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
        throw error_1.AppError.internal("JWT secret key not configured");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, SECRET_KEY);
        if (!decoded.sub) {
            throw error_1.AppError.unauthorized("Invalid token structure");
        }
        // Verify user still exists and is active
        const user = yield client_1.default.user.findUnique({
            where: { id: decoded.sub.id },
            include: {
                roles: true,
            },
        });
        if (!user) {
            throw error_1.AppError.unauthorized("User account no longer exists");
        }
        // Create authenticated user context
        const authenticatedUser = {
            id: user.id,
            uid: user.uid,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.role) || api_types_1.Role.USER,
            permissions: (0, permissions_1.getRolePermissions)(((_b = user.roles) === null || _b === void 0 ? void 0 : _b.role) || api_types_1.Role.USER),
        };
        // Add user to request object
        req.user = authenticatedUser;
        // Add auth context headers for debugging (remove in production)
        if (process.env.NODE_ENV === "development") {
            res.setHeader("X-Authenticated-User", user.email);
            res.setHeader("X-User-Role", authenticatedUser.role);
        }
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw error_1.AppError.unauthorized("Authentication token has expired");
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw error_1.AppError.unauthorized("Invalid authentication token");
        }
        // Re-throw AppErrors as-is
        if (error instanceof error_1.AppError) {
            throw error;
        }
        // Log unexpected JWT errors
        console.error("JWT verification error:", error);
        throw error_1.AppError.unauthorized("Authentication failed");
    }
}));
/**
 * Optional authentication - doesn't throw if no token provided
 */
exports.optionalAuthenticate = (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    // If no auth header, just continue without user context
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }
    // If auth header exists, use regular authentication
    return (0, exports.authenticate)(req, res, next);
}));
/**
 * Middleware to require specific authentication level
 */
const requireAuth = (options) => {
    const { allowPublic = false, requireVerified = false } = options || {};
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        // If public access is allowed and no user, continue
        if (allowPublic && !req.user) {
            return next();
        }
        // If not public and no user, require authentication
        if (!req.user) {
            return (0, exports.authenticate)(req, res, next);
        }
        // If verification is required, check user status
        if (requireVerified) {
            // TODO: Add verification logic here if needed
            // For now, just ensure user exists
            if (!req.user.id) {
                throw error_1.AppError.forbidden("Account verification required");
            }
        }
        next();
    }));
};
exports.requireAuth = requireAuth;
/**
 * Middleware for refresh token validation
 */
exports.validateRefreshToken = (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw error_1.AppError.badRequest("Refresh token is required");
    }
    const SECRET_KEY = process.env.REFRESH_SECRET_KEY || process.env.SECRET_KEY;
    if (!SECRET_KEY) {
        throw error_1.AppError.internal("JWT secret key not configured");
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(refreshToken, SECRET_KEY);
        // Verify user still exists
        const user = yield client_1.default.user.findUnique({
            where: { id: decoded.sub.id },
            include: { roles: true },
        });
        if (!user) {
            throw error_1.AppError.unauthorized("User account no longer exists");
        }
        // Add user context for token refresh
        req.user = {
            id: user.id,
            uid: user.uid,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.role) || api_types_1.Role.USER,
            permissions: (0, permissions_1.getRolePermissions)(((_b = user.roles) === null || _b === void 0 ? void 0 : _b.role) || api_types_1.Role.USER),
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw error_1.AppError.unauthorized("Refresh token has expired");
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            throw error_1.AppError.unauthorized("Invalid refresh token");
        }
        throw error_1.AppError.unauthorized("Refresh token validation failed");
    }
}));
/**
 * Middleware to extract user context from token without requiring authentication
 * Useful for optional user context in public endpoints
 */
exports.extractUserContext = (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, exports.optionalAuthenticate)(req, res, next);
    }
    catch (error) {
        // Silently fail for context extraction
        console.warn("Failed to extract user context:", error);
        next();
    }
}));
/**
 * Utility function to generate JWT tokens
 */
function generateTokens(user) {
    var _a;
    const SECRET_KEY = process.env.SECRET_KEY;
    const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY || SECRET_KEY;
    if (!SECRET_KEY) {
        throw error_1.AppError.internal("JWT secret key not configured");
    }
    const payload = {
        sub: {
            id: user.id,
            uid: user.uid,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.role) || api_types_1.Role.USER,
        },
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, SECRET_KEY, {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || "24h",
        issuer: "bunn-backend",
        audience: "bunn-frontend",
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_SECRET_KEY, {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
        issuer: "bunn-backend",
        audience: "bunn-frontend",
    });
    return { accessToken, refreshToken };
}
/**
 * Utility function to decode token without verification (for debugging)
 */
function decodeToken(token) {
    try {
        return jsonwebtoken_1.default.decode(token);
    }
    catch (error) {
        return null;
    }
}
/**
 * Middleware to log authentication attempts (for security monitoring)
 */
const logAuthAttempt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const hasToken = authHeader && authHeader.startsWith("Bearer ");
    // Log auth attempt with IP and user agent for security monitoring
    console.info("Auth attempt:", {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        hasToken,
        timestamp: new Date().toISOString(),
    });
    next();
};
exports.logAuthAttempt = logAuthAttempt;
/**
 * Backward compatibility wrapper for existing auth middleware
 * This allows gradual migration from old auth system
 */
exports.legacyAuthCompat = {
    protectRoute: exports.authenticate, // Map old function name to new implementation
};
// Export default for backward compatibility
exports.default = exports.legacyAuthCompat;
