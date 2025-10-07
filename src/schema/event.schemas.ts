import { z } from "zod";
import { nameSchema } from "./common.schema";

export const CreateEventSchema = z
  .object({
    body: z.object({
      name: z
        .string()
        .min(1, "Event name is required")
        .max(200, "Event name too long"),
      description: z.string().min(1, "Event description is required"),
      startDate: z.string().datetime("Invalid start date format"),
      endDate: z.string().datetime("Invalid end date format"),
      location: z.string().min(1, "Location is required"),
      maxAttendees: z
        .number()
        .int()
        .positive("Max attendees must be a positive number"),
      cohosts: z
        .array(
          z.object({
            name: nameSchema,
            roleSkill: z.string().min(1, "Role/skill is required"),
            xUrl: z.string().url().optional(),
            linkedinUrl: z.string().url().optional(),
            instagramUrl: z.string().url().optional(),
            facebookUrl: z.string().url().optional(),
            discordUrl: z.string().url().optional(),
          })
        )
        .optional(),
    }),
    files: z.object({
      coverImage: z
        .any()
        .refine((file) => file != null, "Cover image is required"),
    }),
  })
  .refine(
    (data) => {
      const start = new Date(data.body.startDate);
      const end = new Date(data.body.endDate);
      return start < end;
    },
    {
      message: "Start date must be before end date",
      path: ["body", "endDate"],
    }
  );

export type CreateEventInput = z.infer<typeof CreateEventSchema>["body"];

export const UpdateEventSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid event ID"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Event name is required")
      .max(200, "Event name too long")
      .optional(),
    description: z.string().min(1, "Event description is required").optional(),
    startDate: z.string().datetime("Invalid start date format").optional(),
    endDate: z.string().datetime("Invalid end date format").optional(),
    location: z.string().min(1, "Location is required").optional(),
    maxAttendees: z
      .number()
      .int()
      .positive("Max attendees must be a positive number")
      .optional(),
    cohosts: z
      .array(
        z.object({
          name: nameSchema,
          roleSkill: z.string().min(1, "Role/skill is required"),
          xUrl: z.string().url().optional(),
          linkedinUrl: z.string().url().optional(),
          instagramUrl: z.string().url().optional(),
          facebookUrl: z.string().url().optional(),
          discordUrl: z.string().url().optional(),
        })
      )
      .optional(),
  }),
  files: z
    .object({
      coverImage: z.any().optional(),
    })
    .optional(),
});

export type UpdateEventInput = z.infer<typeof UpdateEventSchema>["body"];

export const EventRegistrationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid event ID"),
  }),
  body: z.object({
    registrationDetails: z.object({
      email: z.string().email("Invalid email address"),
      gender: z.string(),
      student: z.string(),
      lastName: z.string(),
      firstName: z.string(),
      techCareer: z.string(),
      phoneNumber: z.string(),
      attendingFrom: z.string(),
      experienceLevel: z.string(),
      willParticipateInHackathon: z.string(),
    }),
  }),
});

export type EventRegistrationInput = z.infer<
  typeof EventRegistrationSchema
>["body"];

export const GetEventsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    upcoming: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    past: z
      .string()
      .transform((val) => val === "true")
      .optional(),
    sortBy: z.enum(["name", "startDate", "created_at"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export type GetEventsQuery = z.infer<typeof GetEventsQuerySchema>["query"];
