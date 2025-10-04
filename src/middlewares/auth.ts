// src/middleware/auth.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "./errorHandler";
import { AuthenticatedUser, Role } from "../types/api.types";
import { getRolePermissions } from "../lib/permissions";
import prisma from "../../prisma/client";
import { AppError } from "../lib/error";

interface JWTPayload {
  sub: {
    id: number;
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
  };
  iat: number;
  exp: number;
}

/**
 * Enhanced authentication middleware with proper error handling and user context
 */
export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("No valid authentication token provided");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw AppError.unauthorized("Authentication token is missing");
    }

    const SECRET_KEY = process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      throw AppError.internal("JWT secret key not configured");
    }

    try {
      const decoded = jwt.verify(token, SECRET_KEY) as unknown as JWTPayload;

      if (!decoded.sub) {
        throw AppError.unauthorized("Invalid token structure");
      }

      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub.id },
        include: {
          roles: true,
        },
      });

      if (!user) {
        throw AppError.unauthorized("User account no longer exists");
      }

      // Create authenticated user context
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        uid: user.uid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: (user.roles?.role as Role) || Role.USER,
        permissions: getRolePermissions(
          (user.roles?.role as Role) || Role.USER
        ),
      };

      // Add user to request object
      req.user = authenticatedUser;

      // Add auth context headers for debugging (remove in production)
      if (process.env.NODE_ENV === "development") {
        res.setHeader("X-Authenticated-User", user.email);
        res.setHeader("X-User-Role", authenticatedUser.role);
      }

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized("Authentication token has expired");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized("Invalid authentication token");
      }

      // Re-throw AppErrors as-is
      if (error instanceof AppError) {
        throw error;
      }

      // Log unexpected JWT errors
      console.error("JWT verification error:", error);
      throw AppError.unauthorized("Authentication failed");
    }
  }
);

/**
 * Optional authentication - doesn't throw if no token provided
 */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    // If no auth header, just continue without user context
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    // If auth header exists, use regular authentication
    return authenticate(req, res, next);
  }
);

/**
 * Middleware to require specific authentication level
 */
export const requireAuth = (options?: {
  allowPublic?: boolean;
  requireVerified?: boolean;
}) => {
  const { allowPublic = false, requireVerified = false } = options || {};

  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      // If public access is allowed and no user, continue
      if (allowPublic && !req.user) {
        return next();
      }

      // If not public and no user, require authentication
      if (!req.user) {
        return authenticate(req, res, next);
      }

      // If verification is required, check user status
      if (requireVerified) {
        // TODO: Add verification logic here if needed
        // For now, just ensure user exists
        if (!req.user.id) {
          throw AppError.forbidden("Account verification required");
        }
      }

      next();
    }
  );
};

/**
 * Middleware for refresh token validation
 */
export const validateRefreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw AppError.badRequest("Refresh token is required");
    }

    const SECRET_KEY = process.env.REFRESH_SECRET_KEY || process.env.SECRET_KEY;
    if (!SECRET_KEY) {
      throw AppError.internal("JWT secret key not configured");
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        SECRET_KEY
      ) as unknown as JWTPayload;

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub.id },
        include: { roles: true },
      });

      if (!user) {
        throw AppError.unauthorized("User account no longer exists");
      }

      // Add user context for token refresh
      req.user = {
        id: user.id,
        uid: user.uid,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: (user.roles?.role as Role) || Role.USER,
        permissions: getRolePermissions(
          (user.roles?.role as Role) || Role.USER
        ),
      };

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized("Refresh token has expired");
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized("Invalid refresh token");
      }

      throw AppError.unauthorized("Refresh token validation failed");
    }
  }
);

/**
 * Middleware to extract user context from token without requiring authentication
 * Useful for optional user context in public endpoints
 */
export const extractUserContext = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await optionalAuthenticate(req, res, next);
    } catch (error) {
      // Silently fail for context extraction
      console.warn("Failed to extract user context:", error);
      next();
    }
  }
);

/**
 * Utility function to generate JWT tokens
 */
export function generateTokens(user: {
  id: number;
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  roles?: { role: string } | null;
}): { accessToken: string; refreshToken: string } {
  const SECRET_KEY = process.env.SECRET_KEY;
  const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY || SECRET_KEY;

  if (!SECRET_KEY) {
    throw AppError.internal("JWT secret key not configured");
  }

  const payload = {
    sub: {
      id: user.id,
      uid: user.uid,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: (user.roles?.role as Role) || Role.USER,
    },
  };

  const accessToken = jwt.sign(payload, SECRET_KEY, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "24h",
    issuer: "bunn-backend",
    audience: "bunn-frontend",
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET_KEY!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
    issuer: "bunn-backend",
    audience: "bunn-frontend",
  });

  return { accessToken, refreshToken };
}

/**
 * Utility function to decode token without verification (for debugging)
 */
export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to log authentication attempts (for security monitoring)
 */
export const logAuthAttempt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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

/**
 * Backward compatibility wrapper for existing auth middleware
 * This allows gradual migration from old auth system
 */
export const legacyAuthCompat = {
  protectRoute: authenticate, // Map old function name to new implementation
};

// Export default for backward compatibility
export default legacyAuthCompat;
