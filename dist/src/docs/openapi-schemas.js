"use strict";
// src/docs/openapi-schemas.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.openApiSchemas = void 0;
/**
 * OpenAPI schema definitions for Swagger documentation
 * These definitions complement the route documentation
 */
exports.openApiSchemas = {
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT access token for authentication",
            },
        },
        schemas: {
            // Base API response schemas
            ApiResponse: {
                type: "object",
                properties: {
                    success: {
                        type: "boolean",
                        description: "Indicates if the request was successful",
                    },
                    data: {
                        description: "Response data (varies by endpoint)",
                        nullable: true,
                    },
                    error: {
                        $ref: "#/components/schemas/ApiError",
                        nullable: true,
                    },
                },
                required: ["success"],
            },
            ApiError: {
                type: "object",
                properties: {
                    code: {
                        type: "string",
                        description: "Machine-readable error code",
                        example: "VALIDATION_ERROR",
                    },
                    status: {
                        type: "integer",
                        description: "HTTP status code",
                        example: 400,
                    },
                    message: {
                        type: "string",
                        description: "Human-readable error message",
                        example: "Validation failed",
                    },
                    detail: {
                        description: "Additional error details",
                        oneOf: [{ type: "string" }, { type: "object" }],
                    },
                },
                required: ["code", "status", "message"],
            },
            Pagination: {
                type: "object",
                properties: {
                    page: {
                        type: "integer",
                        description: "Current page number",
                        example: 1,
                    },
                    limit: {
                        type: "integer",
                        description: "Number of items per page",
                        example: 10,
                    },
                    total: {
                        type: "integer",
                        description: "Total number of items",
                        example: 100,
                    },
                    totalPages: {
                        type: "integer",
                        description: "Total number of pages",
                        example: 10,
                    },
                    hasNext: {
                        type: "boolean",
                        description: "Whether there is a next page",
                        example: true,
                    },
                    hasPrev: {
                        type: "boolean",
                        description: "Whether there is a previous page",
                        example: false,
                    },
                },
                required: [
                    "page",
                    "limit",
                    "total",
                    "totalPages",
                    "hasNext",
                    "hasPrev",
                ],
            },
            // User schemas
            User: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "User ID",
                        example: 1,
                    },
                    uid: {
                        type: "string",
                        description: "User UUID",
                        example: "123e4567-e89b-12d3-a456-426614174000",
                    },
                    firstName: {
                        type: "string",
                        description: "User first name",
                        example: "John",
                    },
                    lastName: {
                        type: "string",
                        description: "User last name",
                        example: "Doe",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        description: "User email address",
                        example: "john.doe@example.com",
                    },
                    role: {
                        type: "string",
                        enum: [
                            "user",
                            "admin",
                            "superadmin",
                            "writer",
                            "event_admin",
                            "hacker",
                        ],
                        description: "User role",
                        example: "user",
                    },
                    subCommunity: {
                        type: "array",
                        items: { type: "string" },
                        description: "User sub-communities",
                        nullable: true,
                    },
                    techSkills: {
                        type: "array",
                        items: { type: "string" },
                        description: "User technical skills",
                        nullable: true,
                    },
                    phoneNumber: {
                        type: "string",
                        description: "User phone number",
                        nullable: true,
                        example: "+1234567890",
                    },
                    gender: {
                        type: "string",
                        enum: ["male", "female", "other", "prefer_not_to_say"],
                        description: "User gender",
                        nullable: true,
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "User creation timestamp",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "User last update timestamp",
                    },
                },
                required: [
                    "id",
                    "uid",
                    "firstName",
                    "lastName",
                    "email",
                    "role",
                    "createdAt",
                    "updatedAt",
                ],
            },
            UserDetails: {
                allOf: [
                    { $ref: "#/components/schemas/User" },
                    {
                        type: "object",
                        properties: {
                            profilePicture: {
                                type: "object",
                                properties: {
                                    url: { type: "string", format: "uri" },
                                    name: { type: "string" },
                                },
                                nullable: true,
                            },
                            eventsAttended: {
                                type: "array",
                                items: { $ref: "#/components/schemas/EventSummary" },
                            },
                            eventsHosted: {
                                type: "array",
                                items: { $ref: "#/components/schemas/EventSummary" },
                            },
                            stats: {
                                type: "object",
                                properties: {
                                    eventsAttended: { type: "integer" },
                                    eventsHosted: { type: "integer" },
                                },
                            },
                        },
                    },
                ],
            },
            // Event schemas
            Event: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Event ID",
                        example: 1,
                    },
                    uid: {
                        type: "string",
                        description: "Event UUID",
                        example: "123e4567-e89b-12d3-a456-426614174000",
                    },
                    name: {
                        type: "string",
                        description: "Event name",
                        example: "Blockchain Conference 2024",
                    },
                    description: {
                        type: "string",
                        description: "Event description",
                        example: "A comprehensive blockchain conference featuring industry leaders.",
                    },
                    coverImage: {
                        type: "string",
                        format: "uri",
                        description: "Event cover image URL",
                    },
                    startDate: {
                        type: "string",
                        format: "date-time",
                        description: "Event start date and time",
                    },
                    endDate: {
                        type: "string",
                        format: "date-time",
                        description: "Event end date and time",
                    },
                    location: {
                        type: "string",
                        description: "Event location",
                        example: "University of Nigeria, Nsukka",
                    },
                    maxAttendees: {
                        type: "integer",
                        description: "Maximum number of attendees",
                        example: 500,
                    },
                    attendeesCount: {
                        type: "integer",
                        description: "Current number of registered attendees",
                        example: 250,
                    },
                    host: {
                        $ref: "#/components/schemas/User",
                    },
                    cohosts: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Cohost" },
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Event creation timestamp",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "Event last update timestamp",
                    },
                },
                required: [
                    "id",
                    "uid",
                    "name",
                    "description",
                    "startDate",
                    "endDate",
                    "location",
                    "maxAttendees",
                    "attendeesCount",
                    "createdAt",
                    "updatedAt",
                ],
            },
            EventSummary: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    uid: { type: "string" },
                    name: { type: "string" },
                    startDate: { type: "string", format: "date-time" },
                    endDate: { type: "string", format: "date-time" },
                    attendeesCount: { type: "integer" },
                },
                required: ["id", "uid", "name", "startDate", "endDate"],
            },
            Cohost: {
                type: "object",
                properties: {
                    id: { type: "integer" },
                    name: { type: "string" },
                    roleSkill: { type: "string" },
                    xUrl: { type: "string", format: "uri", nullable: true },
                    linkedinUrl: { type: "string", format: "uri", nullable: true },
                    instagramUrl: { type: "string", format: "uri", nullable: true },
                    facebookUrl: { type: "string", format: "uri", nullable: true },
                    discordUrl: { type: "string", format: "uri", nullable: true },
                },
                required: ["id", "name", "roleSkill"],
            },
            // Blog schemas
            BlogPost: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Blog post ID",
                        example: 1,
                    },
                    uid: {
                        type: "string",
                        description: "Blog post UUID",
                        example: "123e4567-e89b-12d3-a456-426614174000",
                    },
                    title: {
                        type: "string",
                        description: "Blog post title",
                        example: "Introduction to Blockchain Technology",
                    },
                    content: {
                        type: "string",
                        description: "Blog post content (HTML/Markdown)",
                        example: "# Introduction\n\nBlockchain technology is...",
                    },
                    previewImage: {
                        type: "string",
                        format: "uri",
                        description: "Blog post preview image URL",
                    },
                    authors: {
                        type: "array",
                        items: { $ref: "#/components/schemas/BlogAuthor" },
                        description: "Blog post authors",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Blog post creation timestamp",
                    },
                    updatedAt: {
                        type: "string",
                        format: "date-time",
                        description: "Blog post last update timestamp",
                    },
                },
                required: [
                    "id",
                    "uid",
                    "title",
                    "content",
                    "previewImage",
                    "authors",
                    "createdAt",
                    "updatedAt",
                ],
            },
            BlogAuthor: {
                type: "object",
                properties: {
                    id: {
                        type: "integer",
                        description: "Author ID",
                        example: 1,
                    },
                    name: {
                        type: "string",
                        description: "Author name",
                        example: "Jane Smith",
                    },
                    roleSkill: {
                        type: "string",
                        description: "Author role or skill",
                        example: "Blockchain Developer",
                    },
                    xUrl: {
                        type: "string",
                        format: "uri",
                        nullable: true,
                        description: "Author X (Twitter) URL",
                    },
                    linkedinUrl: {
                        type: "string",
                        format: "uri",
                        nullable: true,
                        description: "Author LinkedIn URL",
                    },
                    instagramUrl: {
                        type: "string",
                        format: "uri",
                        nullable: true,
                        description: "Author Instagram URL",
                    },
                    facebookUrl: {
                        type: "string",
                        format: "uri",
                        nullable: true,
                        description: "Author Facebook URL",
                    },
                    discordUrl: {
                        type: "string",
                        format: "uri",
                        nullable: true,
                        description: "Author Discord URL",
                    },
                    createdAt: {
                        type: "string",
                        format: "date-time",
                        description: "Author creation timestamp",
                    },
                },
                required: ["id", "name", "roleSkill", "createdAt"],
            },
            // Authentication schemas
            AuthTokens: {
                type: "object",
                properties: {
                    accessToken: {
                        type: "string",
                        description: "JWT access token",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                    refreshToken: {
                        type: "string",
                        description: "JWT refresh token",
                        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    },
                },
                required: ["accessToken", "refreshToken"],
            },
        },
        // Common response templates
        responses: {
            BadRequest: {
                description: "Bad Request",
                content: {
                    "application/json": {
                        schema: {
                            allOf: [
                                { $ref: "#/components/schemas/ApiResponse" },
                                {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: { type: "string", example: "VALIDATION_ERROR" },
                                                status: { type: "integer", example: 400 },
                                                message: {
                                                    type: "string",
                                                    example: "Validation failed",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            Unauthorized: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: {
                            allOf: [
                                { $ref: "#/components/schemas/ApiResponse" },
                                {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: {
                                                    type: "string",
                                                    example: "AUTHENTICATION_REQUIRED",
                                                },
                                                status: { type: "integer", example: 401 },
                                                message: {
                                                    type: "string",
                                                    example: "Authentication required",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            Forbidden: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: {
                            allOf: [
                                { $ref: "#/components/schemas/ApiResponse" },
                                {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: { type: "string", example: "FORBIDDEN" },
                                                status: { type: "integer", example: 403 },
                                                message: {
                                                    type: "string",
                                                    example: "Insufficient permissions",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            NotFound: {
                description: "Not Found",
                content: {
                    "application/json": {
                        schema: {
                            allOf: [
                                { $ref: "#/components/schemas/ApiResponse" },
                                {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: { type: "string", example: "NOT_FOUND" },
                                                status: { type: "integer", example: 404 },
                                                message: {
                                                    type: "string",
                                                    example: "Resource not found",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            Conflict: {
                description: "Conflict",
                content: {
                    "application/json": {
                        schema: {
                            allOf: [
                                { $ref: "#/components/schemas/ApiResponse" },
                                {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: {
                                                    type: "string",
                                                    example: "RESOURCE_ALREADY_EXISTS",
                                                },
                                                status: { type: "integer", example: 409 },
                                                message: {
                                                    type: "string",
                                                    example: "Resource already exists",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
            InternalError: {
                description: "Internal Server Error",
                content: {
                    "application/json": {
                        schema: {
                            allOf: [
                                { $ref: "#/components/schemas/ApiResponse" },
                                {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: false },
                                        error: {
                                            type: "object",
                                            properties: {
                                                code: {
                                                    type: "string",
                                                    example: "INTERNAL_SERVER_ERROR",
                                                },
                                                status: { type: "integer", example: 500 },
                                                message: {
                                                    type: "string",
                                                    example: "An unexpected error occurred",
                                                },
                                            },
                                        },
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },
    },
};
