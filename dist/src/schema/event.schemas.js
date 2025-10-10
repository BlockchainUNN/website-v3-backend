"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetEventsQuerySchema = exports.EventRegistrationSchema = exports.UpdateEventSchema = exports.CreateEventSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
exports.CreateEventSchema = zod_1.z
    .object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Event name is required")
            .max(200, "Event name too long"),
        description: zod_1.z.string().min(1, "Event description is required"),
        startDate: zod_1.z.string().datetime("Invalid start date format"),
        endDate: zod_1.z.string().datetime("Invalid end date format"),
        location: zod_1.z.string().min(1, "Location is required"),
        maxAttendees: zod_1.z
            .number()
            .int()
            .positive("Max attendees must be a positive number"),
        cohosts: zod_1.z
            .array(zod_1.z.object({
            name: common_schema_1.nameSchema,
            roleSkill: zod_1.z.string().min(1, "Role/skill is required"),
            xUrl: zod_1.z.string().url().optional(),
            linkedinUrl: zod_1.z.string().url().optional(),
            instagramUrl: zod_1.z.string().url().optional(),
            facebookUrl: zod_1.z.string().url().optional(),
            discordUrl: zod_1.z.string().url().optional(),
        }))
            .optional(),
    }),
    files: zod_1.z.object({
        coverImage: zod_1.z
            .any()
            .refine((file) => file != null, "Cover image is required"),
    }),
})
    .refine((data) => {
    const start = new Date(data.body.startDate);
    const end = new Date(data.body.endDate);
    return start < end;
}, {
    message: "Start date must be before end date",
    path: ["body", "endDate"],
});
exports.UpdateEventSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "Invalid event ID"),
    }),
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(1, "Event name is required")
            .max(200, "Event name too long")
            .optional(),
        description: zod_1.z.string().min(1, "Event description is required").optional(),
        startDate: zod_1.z.string().datetime("Invalid start date format").optional(),
        endDate: zod_1.z.string().datetime("Invalid end date format").optional(),
        location: zod_1.z.string().min(1, "Location is required").optional(),
        maxAttendees: zod_1.z
            .number()
            .int()
            .positive("Max attendees must be a positive number")
            .optional(),
        cohosts: zod_1.z
            .array(zod_1.z.object({
            name: common_schema_1.nameSchema,
            roleSkill: zod_1.z.string().min(1, "Role/skill is required"),
            xUrl: zod_1.z.string().url().optional(),
            linkedinUrl: zod_1.z.string().url().optional(),
            instagramUrl: zod_1.z.string().url().optional(),
            facebookUrl: zod_1.z.string().url().optional(),
            discordUrl: zod_1.z.string().url().optional(),
        }))
            .optional(),
    }),
    files: zod_1.z
        .object({
        coverImage: zod_1.z.any().optional(),
    })
        .optional(),
});
exports.EventRegistrationSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "Invalid event ID"),
    }),
    body: zod_1.z.object({
        registrationDetails: zod_1.z.object({
            email: zod_1.z.string().email("Invalid email address"),
            gender: zod_1.z.string(),
            student: zod_1.z.string(),
            lastName: zod_1.z.string(),
            firstName: zod_1.z.string(),
            techCareer: zod_1.z.string(),
            phoneNumber: zod_1.z.string(),
            attendingFrom: zod_1.z.string(),
            experienceLevel: zod_1.z.string(),
            willParticipateInHackathon: zod_1.z.string(),
        }),
    }),
});
exports.GetEventsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        search: zod_1.z.string().optional(),
        upcoming: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        past: zod_1.z
            .string()
            .transform((val) => val === "true")
            .optional(),
        sortBy: zod_1.z.enum(["name", "startDate", "created_at"]).optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
    }),
});
