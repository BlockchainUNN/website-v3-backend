// src/lib/response.ts

import { Response } from "express";
import {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  PaginationMeta,
} from "../types/api.types";

/**
 * Creates a standardized API response object
 */
export function createApiResponse<T>(params: {
  success: boolean;
  data?: T | null;
  error?: ApiError | null;
}): ApiResponse<T> {
  return {
    success: params.success,
    data: params.data ?? null,
    error: params.error ?? null,
  };
}

/**
 * Sends a successful response
 */
export function successResponse<T>(
  res: Response,
  data: T,
  status: number = 200,
  message?: string
): Response {
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
export function errorResponse(
  res: Response,
  error: ApiError,
  headers?: Record<string, string>
): Response {
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
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationMeta
): PaginatedResponse<T> {
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
export function paginatedResponse<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  status: number = 200
): Response {
  const response = createPaginatedResponse(items, pagination);
  return res.status(status).json(response);
}

/**
 * Utility to calculate pagination metadata
 */
export function calculatePagination(params: {
  total: number;
  page: number;
  limit: number;
}): PaginationMeta {
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
export function parsePaginationQuery(query: any): {
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit as string) || 10)
  );

  return { page, limit };
}

/**
 * Creates a "no content" response (204)
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

/**
 * Creates a "created" response (201) with location header
 */
export function createdResponse<T>(
  res: Response,
  data: T,
  location?: string,
  message?: string
): Response {
  if (location) {
    res.setHeader("Location", location);
  }

  return successResponse(res, data, 201, message);
}

/**
 * Legacy adapter for backward compatibility with existing responseHandlers
 * This allows gradual migration from old response format
 */
export function legacySuccessResponse(
  res: Response,
  status: number,
  message: string,
  data?: any
): Response {
  // For now, return the legacy format but add a deprecation header
  res.setHeader(
    "X-Deprecation-Warning",
    "This response format is deprecated. Upgrade to new API response format."
  );

  return res.status(status).json({
    message,
    data: data || null,
  });
}

export function legacyErrorResponse(
  res: Response,
  status: number,
  error: string,
  data?: any
): Response {
  // For now, return the legacy format but add a deprecation header
  res.setHeader(
    "X-Deprecation-Warning",
    "This response format is deprecated. Upgrade to new API response format."
  );

  return res.status(status).json({
    error,
    data: data || null,
  });
}
