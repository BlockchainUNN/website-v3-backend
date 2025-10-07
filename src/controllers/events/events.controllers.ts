import { Request, Response } from "express";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
} from "../../lib/response";
import { calculatePagination } from "../../lib/response";
import { uploadSingleImage } from "../../utils/imageUploadHandler";
import { Permission } from "../../types/api.types";
import { hasPermission } from "../../lib/permissions";
import prisma from "../../../prisma/client";
import { AppError } from "../../lib/error";
import { asyncHandler } from "../../middlewares/errorHandler";
import {
  GetEventsQuery,
  CreateEventInput,
  UpdateEventInput,
  EventRegistrationInput,
} from "../../schema/event.schemas";
import { Event } from "@prisma/client";

/**
 * Get all events with pagination and filtering
 * @route GET /api/v3/events
 * @access Public
 */
export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as GetEventsQuery;
  const {
    page = 1,
    limit = 10,
    search,
    upcoming,
    past,
    sortBy = "start_date",
    sortOrder = "asc",
  } = query;

  // Build where clause for filtering
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { location: { contains: search, mode: "insensitive" } },
    ];
  }

  // Date filtering
  const now = new Date();
  if (upcoming === true) {
    where.start_date = { gte: now };
  } else if (past === true) {
    where.end_date = { lt: now };
  }

  // Get total count for pagination
  const total = await prisma.event.count({ where });

  // Get events with pagination
  const events = await prisma.event.findMany({
    where,
    include: {
      host: true,
      cohosts: true,
      eventAttendee: {
        select: {
          id: true,
        },
      },
      _count: {
        select: {
          eventAttendee: true,
        },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Transform events for response
  const transformedEvents = events.map(async (event: Event) => {
    const eventHost = await prisma.user.findUnique({
      where: { id: event.host_id },
      include: { roles: true },
    });

    const cohost = await prisma.user.findUnique({
      where: { id: event.host_id },
      include: { roles: true },
    });

    return {
      id: event.id,
      uid: event.uid,
      name: event.name,
      description: event.description,
      coverImage: event.cover_image,
      startDate: event.start_date.toISOString(),
      endDate: event.end_date.toISOString(),
      location: event.location,
      maxAttendees: event.max_attendees,
      attendeesCount: event.attendees_count,
      availableSlots: event.max_attendees - event.attendees_count,
      host: {
        id: eventHost?.id,
        uid: eventHost?.uid,
        firstName: eventHost?.first_name,
        lastName: eventHost?.last_name,
        email: eventHost?.email,
        role: eventHost?.roles?.role || "user",
      },
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      // Add status based on dates
      status:
        now < new Date(event.start_date)
          ? "upcoming"
          : now >= new Date(event.start_date) && now <= new Date(event.end_date)
          ? "ongoing"
          : "past",
      isRegistrationOpen:
        now < new Date(event.start_date) &&
        event.attendees_count < event.max_attendees,
    };
  });

  const pagination = calculatePagination({ total, page, limit });

  return paginatedResponse(res, transformedEvents, pagination);
});

/**
 * Get event by ID
 * @route GET /api/v3/events/:id
 * @access Public
 */
export const getEventById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      throw AppError.badRequest("Invalid event ID");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        host: {
          select: {
            id: true,
            uid: true,
            first_name: true,
            last_name: true,
            email: true,
            roles: true,
          },
        },
        cohosts: true,
        eventAttendee: {
          include: {
            user: {
              select: {
                id: true,
                uid: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        eventGallery: {
          include: {
            image: {
              select: {
                id: true,
                name: true,
                image_url: true,
              },
            },
          },
        },
        _count: {
          select: {
            eventAttendee: true,
          },
        },
      },
    });

    if (!event) {
      throw AppError.eventNotFound(eventId);
    }

    const now = new Date();

    // Check if user is registered (if authenticated)
    let isUserRegistered = false;
    if (req.user) {
      const registration = event.eventAttendee.find(
        (attendee: { user: { id: any } }) => attendee.user.id === req.user!.id
      );
      isUserRegistered = !!registration;
    }

    const transformedEvent = {
      id: event.id,
      uid: event.uid,
      name: event.name,
      description: event.description,
      coverImage: event.cover_image,
      startDate: event.start_date,
      endDate: event.end_date,
      location: event.location,
      maxAttendees: event.max_attendees,
      attendeesCount: event._count.eventAttendee,
      availableSlots: event.max_attendees - event._count.eventAttendee,
      host: {
        id: event.host.id,
        uid: event.host.uid,
        firstName: event.host.first_name,
        lastName: event.host.last_name,
        email: event.host.email,
        role: event.host.roles?.role || "user",
      },
      cohosts: event.cohosts.map(
        (cohost: {
          id: any;
          name: any;
          role_skill: any;
          x_url: any;
          linkedin_url: any;
          instagram_url: any;
          facebook_url: any;
          discord_url: any;
        }) => ({
          id: cohost.id,
          name: cohost.name,
          roleSkill: cohost.role_skill,
          xUrl: cohost.x_url,
          linkedinUrl: cohost.linkedin_url,
          instagramUrl: cohost.instagram_url,
          facebookUrl: cohost.facebook_url,
          discordUrl: cohost.discord_url,
        })
      ),
      attendees: event.eventAttendee.map(
        (attendee: {
          user: { id: any; uid: any; first_name: any; last_name: any };
          registrationDetails: any;
          id: any;
        }) => ({
          id: attendee.user.id,
          uid: attendee.user.uid,
          firstName: attendee.user.first_name,
          lastName: attendee.user.last_name,
          registrationDetails: attendee.registrationDetails,
          registeredAt: attendee.id, // Using attendee record creation as registration time
        })
      ),
      gallery: event.eventGallery.map(
        (gallery: { image: { id: any; name: any; image_url: any } }) => ({
          id: gallery.image.id,
          name: gallery.image.name,
          url: gallery.image.image_url,
        })
      ),
      createdAt: event.created_at,
      updatedAt: event.updated_at,
      status:
        now < event.start_date
          ? "upcoming"
          : now >= event.start_date && now <= new Date(event.end_date)
          ? "ongoing"
          : "past",
      isRegistrationOpen:
        now < event.start_date &&
        event._count.eventAttendee < event.max_attendees,
      isUserRegistered,
    };

    return successResponse(res, transformedEvent);
  }
);

/**
 * Create new event
 * @route POST /api/v3/events
 * @access Event Admin, Admin, Superadmin
 */
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const eventData = req.body as CreateEventInput;
  const coverImage = req.file;

  if (!coverImage) {
    throw AppError.badRequest("Cover image is required");
  }

  // Validate dates
  const startDate = new Date(eventData.startDate);
  const endDate = new Date(eventData.endDate);
  const now = new Date();

  if (startDate <= now) {
    throw AppError.badRequest("Event start date must be in the future");
  }

  if (endDate <= startDate) {
    throw AppError.badRequest("Event end date must be after start date");
  }

  // Handle cover image upload
  let uploadedImage;
  try {
    uploadedImage = await uploadSingleImage(coverImage);
  } catch (error) {
    throw AppError.fileUploadError("Failed to upload cover image", error);
  }

  // Create event in a transaction
  const newEvent = await prisma.$transaction(
    async (tx: {
      event: {
        create: (arg0: {
          data: {
            uid: string; // Simple UID generation
            name: string;
            description: string;
            cover_image: any;
            start_date: Date;
            end_date: Date;
            location: string;
            host_id: any;
            attendees_count: number;
            max_attendees: number;
          };
        }) => any;
      };
      eventCohost: {
        createMany: (arg0: {
          data: {
            event_id: any;
            name: string;
            role_skill: string;
            x_url: string | null;
            linkedin_url: string | null;
            instagram_url: string | null;
            facebook_url: string | null;
            discord_url: string | null;
          }[];
        }) => any;
      };
    }) => {
      // Create the event
      const event = await tx.event.create({
        data: {
          uid: `event_${Date.now()}`, // Simple UID generation
          name: eventData.name,
          description: eventData.description,
          cover_image: uploadedImage.url,
          start_date: startDate,
          end_date: endDate,
          location: eventData.location,
          host_id: req.user!.id,
          attendees_count: 0,
          max_attendees: eventData.maxAttendees,
        },
      });

      // Create cohosts if provided
      if (eventData.cohosts && eventData.cohosts.length > 0) {
        await tx.eventCohost.createMany({
          data: eventData.cohosts.map((cohost) => ({
            event_id: event.id,
            name: cohost.name,
            role_skill: cohost.roleSkill,
            x_url: cohost.xUrl || null,
            linkedin_url: cohost.linkedinUrl || null,
            instagram_url: cohost.instagramUrl || null,
            facebook_url: cohost.facebookUrl || null,
            discord_url: cohost.discordUrl || null,
          })),
        });
      }

      return event;
    }
  );

  // Fetch the complete event data
  const eventWithDetails = await prisma.event.findUnique({
    where: { id: newEvent.id },
    include: {
      host: {
        select: {
          id: true,
          uid: true,
          first_name: true,
          last_name: true,
          email: true,
          roles: true,
        },
      },
      cohosts: true,
    },
  });

  const responseData = {
    id: eventWithDetails!.id,
    uid: eventWithDetails!.uid,
    name: eventWithDetails!.name,
    description: eventWithDetails!.description,
    coverImage: eventWithDetails!.cover_image,
    startDate: eventWithDetails!.start_date,
    endDate: eventWithDetails!.end_date,
    location: eventWithDetails!.location,
    maxAttendees: eventWithDetails!.max_attendees,
    attendeesCount: 0,
    host: {
      id: eventWithDetails!.host.id,
      uid: eventWithDetails!.host.uid,
      firstName: eventWithDetails!.host.first_name,
      lastName: eventWithDetails!.host.last_name,
      email: eventWithDetails!.host.email,
      role: eventWithDetails!.host.roles?.role || "user",
    },
    cohosts: eventWithDetails!.cohosts.map(
      (cohost: {
        id: any;
        name: any;
        role_skill: any;
        x_url: any;
        linkedin_url: any;
        instagram_url: any;
        facebook_url: any;
        discord_url: any;
      }) => ({
        id: cohost.id,
        name: cohost.name,
        roleSkill: cohost.role_skill,
        xUrl: cohost.x_url,
        linkedinUrl: cohost.linkedin_url,
        instagramUrl: cohost.instagram_url,
        facebookUrl: cohost.facebook_url,
        discordUrl: cohost.discord_url,
      })
    ),
    createdAt: eventWithDetails!.created_at,
  };

  return createdResponse(
    res,
    responseData,
    `/api/v3/events/${newEvent.id}`,
    "Event created successfully"
  );
});

/**
 * Update event
 * @route PUT /api/v3/events/:id
 * @access Event Host, Admin, Superadmin
 */
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const eventId = parseInt(id);
  const updateData = req.body as UpdateEventInput;
  const coverImage = req.file;

  if (isNaN(eventId)) {
    throw AppError.badRequest("Invalid event ID");
  }

  // Check if event exists
  const existingEvent = await prisma.event.findUnique({
    where: { id: eventId },
    include: { host: true },
  });

  if (!existingEvent) {
    throw AppError.eventNotFound(eventId);
  }

  // Check permissions (host or admin)
  const canUpdate =
    req.user?.id === existingEvent.host_id ||
    hasPermission(req.user!.role, Permission.UPDATE_EVENT);

  if (!canUpdate) {
    throw AppError.forbidden("Cannot update this event");
  }

  // Validate dates if provided
  if (updateData.startDate || updateData.endDate) {
    const startDate = updateData.startDate
      ? new Date(updateData.startDate)
      : existingEvent.start_date;
    const endDate = updateData.endDate
      ? new Date(updateData.endDate)
      : existingEvent.end_date;

    if (endDate <= startDate) {
      throw AppError.badRequest("Event end date must be after start date");
    }
  }

  // Handle cover image upload
  let uploadedImageUrl = existingEvent.cover_image;
  if (coverImage) {
    try {
      const uploadedImage = await uploadSingleImage(coverImage);
      uploadedImageUrl = uploadedImage.url;
    } catch (error) {
      throw AppError.fileUploadError("Failed to upload cover image", error);
    }
  }

  // Update event in a transaction
  const updatedEvent = await prisma.$transaction(
    async (tx: {
      event: {
        update: (arg0: {
          where: { id: number };
          data: {
            max_attendees?: number | undefined;
            location?: string | undefined;
            end_date?: Date | undefined;
            start_date?: Date | undefined;
            cover_image?: any;
            description?: string | undefined;
            name?: string | undefined;
          };
        }) => any;
      };
      eventCohost: {
        deleteMany: (arg0: { where: { event_id: number } }) => any;
        createMany: (arg0: {
          data: {
            event_id: number;
            name: string;
            role_skill: string;
            x_url: string | null;
            linkedin_url: string | null;
            instagram_url: string | null;
            facebook_url: string | null;
            discord_url: string | null;
          }[];
        }) => any;
      };
    }) => {
      // Update the event
      const event = await tx.event.update({
        where: { id: eventId },
        data: {
          ...(updateData.name && { name: updateData.name }),
          ...(updateData.description && {
            description: updateData.description,
          }),
          ...(uploadedImageUrl !== existingEvent.cover_image && {
            cover_image: uploadedImageUrl,
          }),
          ...(updateData.startDate && {
            start_date: new Date(updateData.startDate),
          }),
          ...(updateData.endDate && { end_date: new Date(updateData.endDate) }),
          ...(updateData.location && { location: updateData.location }),
          ...(updateData.maxAttendees && {
            max_attendees: updateData.maxAttendees,
          }),
        },
      });

      // Update cohosts if provided
      if (updateData.cohosts) {
        // Delete existing cohosts
        await tx.eventCohost.deleteMany({
          where: { event_id: eventId },
        });

        // Create new cohosts
        if (updateData.cohosts.length > 0) {
          await tx.eventCohost.createMany({
            data: updateData.cohosts.map((cohost) => ({
              event_id: eventId,
              name: cohost.name,
              role_skill: cohost.roleSkill,
              x_url: cohost.xUrl || null,
              linkedin_url: cohost.linkedinUrl || null,
              instagram_url: cohost.instagramUrl || null,
              facebook_url: cohost.facebookUrl || null,
              discord_url: cohost.discordUrl || null,
            })),
          });
        }
      }

      return event;
    }
  );

  // Fetch the complete updated event data
  const eventWithDetails = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      host: {
        select: {
          id: true,
          uid: true,
          first_name: true,
          last_name: true,
          email: true,
          roles: true,
        },
      },
      cohosts: true,
      _count: {
        select: {
          eventAttendee: true,
        },
      },
    },
  });

  const responseData = {
    id: eventWithDetails!.id,
    uid: eventWithDetails!.uid,
    name: eventWithDetails!.name,
    description: eventWithDetails!.description,
    coverImage: eventWithDetails!.cover_image,
    startDate: eventWithDetails!.start_date,
    endDate: eventWithDetails!.end_date,
    location: eventWithDetails!.location,
    maxAttendees: eventWithDetails!.max_attendees,
    attendeesCount: eventWithDetails!._count.eventAttendee,
    host: {
      id: eventWithDetails!.host.id,
      uid: eventWithDetails!.host.uid,
      firstName: eventWithDetails!.host.first_name,
      lastName: eventWithDetails!.host.last_name,
      email: eventWithDetails!.host.email,
      role: eventWithDetails!.host.roles?.role || "user",
    },
    cohosts: eventWithDetails!.cohosts.map(
      (cohost: {
        id: any;
        name: any;
        role_skill: any;
        x_url: any;
        linkedin_url: any;
        instagram_url: any;
        facebook_url: any;
        discord_url: any;
      }) => ({
        id: cohost.id,
        name: cohost.name,
        roleSkill: cohost.role_skill,
        xUrl: cohost.x_url,
        linkedinUrl: cohost.linkedin_url,
        instagramUrl: cohost.instagram_url,
        facebookUrl: cohost.facebook_url,
        discordUrl: cohost.discord_url,
      })
    ),
    updatedAt: eventWithDetails!.updated_at,
  };

  return successResponse(res, responseData, 200, "Event updated successfully");
});

/**
 * Delete event
 * @route DELETE /api/v3/events/:id
 * @access Event Host, Admin, Superadmin
 */
export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const eventId = parseInt(id);

  if (isNaN(eventId)) {
    throw AppError.badRequest("Invalid event ID");
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { host: true },
  });

  if (!event) {
    throw AppError.eventNotFound(eventId);
  }

  // Check permissions (host or admin)
  const canDelete =
    req.user?.id === event.host_id ||
    hasPermission(req.user!.role, Permission.DELETE_EVENT);

  if (!canDelete) {
    throw AppError.forbidden("Cannot delete this event");
  }

  // Check if event has attendees
  const attendeeCount = await prisma.eventAttendee.count({
    where: { event_id: eventId },
  });

  if (attendeeCount > 0) {
    throw AppError.badRequest("Cannot delete event with registered attendees");
  }

  // Delete event (cascade will handle related records)
  await prisma.event.delete({
    where: { id: eventId },
  });

  return successResponse(
    res,
    { id: eventId },
    200,
    "Event deleted successfully"
  );
});

/**
 * Register for event
 * @route POST /api/v3/events/:id/register
 * @access Authenticated users
 */
export const registerForEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const eventId = parseInt(id);
    const { registrationDetails } = req.body as EventRegistrationInput;

    if (isNaN(eventId)) {
      throw AppError.badRequest("Invalid event ID");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        _count: {
          select: {
            eventAttendee: true,
          },
        },
      },
    });

    if (!event) {
      throw AppError.eventNotFound(eventId);
    }

    // Check if registration is open
    const now = new Date();
    if (now >= event.start_date) {
      throw AppError.registrationClosed();
    }

    // Check if event is full
    if (
      event.max_attendees > 0 &&
      event._count.eventAttendee >= event.max_attendees
    ) {
      throw AppError.eventFull();
    }

    // Get or create user
    let user = await prisma.user.findFirst({
      where: { email: registrationDetails?.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          first_name: registrationDetails?.firstName,
          last_name: registrationDetails?.lastName,
          email: registrationDetails?.email,
          gender: registrationDetails?.gender,
          phone_number: registrationDetails?.phoneNumber,
        },
      });
    }

    if (!user) {
      throw AppError.userNotFound(
        "Could not find or create an account for this user"
      );
    }

    // Check if user is already registered
    const existingRegistration = await prisma.eventAttendee.findFirst({
      where: {
        event_id: eventId,
        attendee_id: user!.id,
      },
    });

    if (existingRegistration) {
      throw AppError.conflict("You are already registered for this event");
    }

    // Create registration
    const registration = await prisma.eventAttendee.create({
      data: {
        event_id: eventId,
        attendee_id: user!.id,
        registrationDetails: registrationDetails ?? undefined,
      },
    });

    // Update attendee count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees_count: {
          increment: 1,
        },
      },
    });

    const responseData = {
      id: registration.id,
      eventId: eventId,
      userId: user!.id,
      registrationDetails: registration.registrationDetails,
      registeredAt: registration.id, // Using registration record creation
    };

    return createdResponse(
      res,
      responseData,
      `/api/v3/events/${eventId}`,
      "Successfully registered for event"
    );
  }
);

/**
 * Unregister from event
 * @route DELETE /api/v3/events/:id/register
 * @access Authenticated users
 */
export const unregisterFromEvent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
      throw AppError.badRequest("Invalid event ID");
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw AppError.eventNotFound(eventId);
    }

    // Check if user is registered
    const registration = await prisma.eventAttendee.findFirst({
      where: {
        event_id: eventId,
        attendee_id: req.user!.id,
      },
    });

    if (!registration) {
      throw AppError.notFound("You are not registered for this event");
    }

    // Check if unregistration is allowed (e.g., not too close to event start)
    const now = new Date();
    const hoursBeforeEvent =
      (event.start_date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursBeforeEvent < 24) {
      throw AppError.badRequest(
        "Cannot unregister less than 24 hours before event start"
      );
    }

    // Delete registration
    await prisma.eventAttendee.delete({
      where: { id: registration.id },
    });

    // Update attendee count
    await prisma.event.update({
      where: { id: eventId },
      data: {
        attendees_count: {
          decrement: 1,
        },
      },
    });

    return noContentResponse(res);
  }
);

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
};
