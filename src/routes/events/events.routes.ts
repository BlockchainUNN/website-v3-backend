import { Router } from "express";
import { upload } from "../../config/upload";
import { Permission } from "../../types/api.types";
import eventController from "../../controllers/events/events.controllers";
import {
  requirePermission,
  requireResourceAccess,
} from "../../lib/permissions";
import { optionalAuthenticate, authenticate } from "../../middlewares/auth";
import {
  validate,
  validateFileUpload,
  validateMultipart,
} from "../../middlewares/validation";
import { ParamIdSchema } from "../../schema/common.schema";
import {
  GetEventsQuerySchema,
  CreateEventSchema,
  UpdateEventSchema,
  EventRegistrationSchema,
} from "../../schema/event.schemas";

const eventRoutes = Router();

/**
 * @swagger
 * /api/v3/events:
 *   get:
 *     tags: [Events]
 *     summary: Get all events with pagination and filtering
 *     description: Retrieve a paginated list of events. Public access.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for event name, description, or location
 *       - in: query
 *         name: upcoming
 *         schema:
 *           type: boolean
 *         description: Filter for upcoming events only
 *       - in: query
 *         name: past
 *         schema:
 *           type: boolean
 *         description: Filter for past events only
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, startDate, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
eventRoutes.get(
  "/events",
  optionalAuthenticate, // Optional auth to show registration status
  validate(GetEventsQuerySchema),
  eventController.getEvents
);

/**
 * @swagger
 * /api/v3/events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get event by ID
 *     description: Retrieve detailed information about a specific event. Public access.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Event'
 *                     - type: object
 *                       properties:
 *                         attendees:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               uid:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               registrationDetails:
 *                                 type: object
 *                               registeredAt:
 *                                 type: string
 *                                 format: date-time
 *                         gallery:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                                 format: uri
 *                         status:
 *                           type: string
 *                           enum: [upcoming, ongoing, past]
 *                         isRegistrationOpen:
 *                           type: boolean
 *                         isUserRegistered:
 *                           type: boolean
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
eventRoutes.get(
  "/events/:id",
  optionalAuthenticate, // Optional auth to show user registration status
  validate(ParamIdSchema),
  eventController.getEventById
);

/**
 * @swagger
 * /api/v3/events:
 *   post:
 *     tags: [Events]
 *     summary: Create new event
 *     description: Create a new event. Event Admin, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - startDate
 *               - endDate
 *               - location
 *               - maxAttendees
 *               - coverImage
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Blockchain Conference 2024"
 *               description:
 *                 type: string
 *                 example: "A comprehensive blockchain conference featuring industry leaders."
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-01T09:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-01T18:00:00Z"
 *               location:
 *                 type: string
 *                 example: "University of Nigeria, Nsukka"
 *               maxAttendees:
 *                 type: integer
 *                 example: 500
 *               cohosts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     roleSkill:
 *                       type: string
 *                     xUrl:
 *                       type: string
 *                       format: uri
 *                     linkedinUrl:
 *                       type: string
 *                       format: uri
 *                     instagramUrl:
 *                       type: string
 *                       format: uri
 *                     facebookUrl:
 *                       type: string
 *                       format: uri
 *                     discordUrl:
 *                       type: string
 *                       format: uri
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Event cover image file
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
eventRoutes.post(
  "/events",
  authenticate,
  requirePermission(Permission.CREATE_EVENT),
  upload.single("coverImage"),
  validateFileUpload({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 10 * 1024 * 1024, // 10MB for event covers
    required: true,
    fieldName: "coverImage",
  }),
  validateMultipart(CreateEventSchema),
  eventController.createEvent
);

/**
 * @swagger
 * /api/v3/events/{id}:
 *   put:
 *     tags: [Events]
 *     summary: Update event
 *     description: Update event details. Event host, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Blockchain Conference 2024"
 *               description:
 *                 type: string
 *                 example: "Updated description of the conference."
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-01T09:00:00Z"
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-12-01T18:00:00Z"
 *               location:
 *                 type: string
 *                 example: "University of Nigeria, Nsukka"
 *               maxAttendees:
 *                 type: integer
 *                 example: 600
 *               cohosts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     roleSkill:
 *                       type: string
 *                     xUrl:
 *                       type: string
 *                       format: uri
 *                     linkedinUrl:
 *                       type: string
 *                       format: uri
 *                     instagramUrl:
 *                       type: string
 *                       format: uri
 *                     facebookUrl:
 *                       type: string
 *                       format: uri
 *                     discordUrl:
 *                       type: string
 *                       format: uri
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Updated event cover image file
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
eventRoutes.put(
  "/events/:id",
  authenticate,
  upload.single("coverImage"),
  validateFileUpload({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    required: false,
    fieldName: "coverImage",
  }),
  validate(ParamIdSchema),
  validateMultipart(UpdateEventSchema),
  requireResourceAccess({
    permission: Permission.UPDATE_EVENT,
    resourceType: "event",
    allowOwnership: true,
  }),
  eventController.updateEvent
);

/**
 * @swagger
 * /api/v3/events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete event
 *     description: Delete an event. Event host, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *       400:
 *         description: Cannot delete event with registered attendees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
eventRoutes.delete(
  "/events/:id",
  authenticate,
  validate(ParamIdSchema),
  requireResourceAccess({
    permission: Permission.DELETE_EVENT,
    resourceType: "event",
    allowOwnership: true,
  }),
  eventController.deleteEvent
);

/**
 * @swagger
 * /api/v3/events/{id}/register:
 *   post:
 *     tags: [Events]
 *     summary: Register for event
 *     description: Register the authenticated user for an event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               registrationDetails:
 *                 type: object
 *                 description: Additional registration information
 *                 example:
 *                   dietaryRequirements: "Vegetarian"
 *                   emergencyContact: "+1234567890"
 *                   specialNeeds: "Wheelchair accessible seating"
 *     responses:
 *       201:
 *         description: Successfully registered for event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 456
 *                     eventId:
 *                       type: integer
 *                       example: 123
 *                     userId:
 *                       type: integer
 *                       example: 789
 *                     registrationDetails:
 *                       type: object
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Registration closed or event full
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Already registered for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Conflict'
 */
eventRoutes.post(
  "/events/:id/register",
  validate(ParamIdSchema),
  validate(EventRegistrationSchema),
  eventController.registerForEvent
);

/**
 * @swagger
 * /api/v3/events/{id}/register:
 *   delete:
 *     tags: [Events]
 *     summary: Unregister from event
 *     description: Unregister the authenticated user from an event.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       204:
 *         description: Successfully unregistered from event
 *       400:
 *         description: Cannot unregister (e.g., too close to event start)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Not registered for this event or event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFound'
 */
eventRoutes.delete(
  "/events/:id/register",
  authenticate,
  validate(ParamIdSchema),
  eventController.unregisterFromEvent
);

export default eventRoutes;

// Export for backward compatibility
export { eventRoutes };
