// src/routes/hackathons/hackers.routes.ts

import { Router } from "express";
import { z } from "zod";
import hackerController from "../../controllers/hackathons/hackers.controllers";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validation";

const hackersRoutes = Router();

// Validation schemas
const CreateHackerSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
  }),
  body: z.object({
    email: z.string().email("Invalid email address"),
    role: z.string().min(1, "Role is required").max(100, "Role too long"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
  }),
});

const LoginHackerSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
  }),
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

const HackathonParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
  }),
});

const HackerEmailParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
    email: z.string().email("Invalid email address"),
  }),
});

/**
 * @swagger
 * /api/v3/hackers/{id}:
 *   post:
 *     tags: [Hackathon - Hackers]
 *     summary: Register for hackathon
 *     description: Register a user for a specific hackathon as a hacker.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hackathon unique ID/name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "hacker@example.com"
 *                 description: Must be an existing user email
 *               role:
 *                 type: string
 *                 example: "Frontend Developer"
 *                 description: Hacker's role/specialization
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123"
 *                 description: Strong password for hackathon account
 *     responses:
 *       201:
 *         description: Successfully registered for hackathon
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
 *                     role:
 *                       type: string
 *                       example: "Frontend Developer"
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
 *                     user:
 *                       type: object
 *                       properties:
 *                         uid:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     hackathon:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         unique_name:
 *                           type: string
 *                     team:
 *                       type: object
 *                       nullable: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Hackathon or user not found
 *       409:
 *         description: User already registered for this hackathon
 */
hackersRoutes.post(
  "/hackers/:id",
  validate(CreateHackerSchema),
  hackerController.create
);

/**
 * @swagger
 * /api/v3/hackers/login/{id}:
 *   post:
 *     tags: [Hackathon - Hackers]
 *     summary: Hacker login
 *     description: Login to hackathon account and receive authentication tokens.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hackathon unique ID/name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "hacker@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *                     userDetails:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         uid:
 *                           type: string
 *                         role:
 *                           type: string
 *                         registeredAt:
 *                           type: string
 *                           format: date-time
 *                         team:
 *                           type: object
 *                           nullable: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Invalid credentials
 *       404:
 *         description: Hackathon or hacker not found
 */
hackersRoutes.post(
  "/hackers/login/:id",
  validate(LoginHackerSchema),
  hackerController.login
);

/**
 * @swagger
 * /api/v3/hackers/{id}:
 *   get:
 *     tags: [Hackathon - Hackers]
 *     summary: Get logged-in hacker details
 *     description: Get details of the currently authenticated hacker for a specific hackathon.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hackathon unique ID/name
 *     responses:
 *       200:
 *         description: Hacker details retrieved successfully
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
 *                     hackerDetails:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         uid:
 *                           type: string
 *                         role:
 *                           type: string
 *                         registeredAt:
 *                           type: string
 *                           format: date-time
 *                         team:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             inviteCode:
 *                               type: string
 *                             members:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   role:
 *                                     type: string
 *                                   user:
 *                                     type: object
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Hackathon or hacker registration not found
 */
hackersRoutes.get(
  "/hackers/:id",
  authenticate,
  validate(HackathonParamSchema),
  hackerController.getLoggedInHacker
);

/**
 * @swagger
 * /api/v3/hackers/count/{id}:
 *   get:
 *     tags: [Hackathon - Hackers]
 *     summary: Get hacker count for hackathon
 *     description: Get the total number of registered hackers for a specific hackathon.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hackathon unique ID/name
 *     responses:
 *       200:
 *         description: Hacker count retrieved successfully
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
 *                     hackathonId:
 *                       type: string
 *                       example: "blogathon-2024"
 *                     hackathonName:
 *                       type: string
 *                       example: "Blogathon 2024"
 *                     hackerCount:
 *                       type: integer
 *                       example: 150
 *       404:
 *         description: Hackathon not found
 */
hackersRoutes.get(
  "/hackers/count/:id",
  validate(HackathonParamSchema),
  hackerController.getHackerCount
);

/**
 * @swagger
 * /api/v3/hackers/{id}/{email}:
 *   get:
 *     tags: [Hackathon - Hackers]
 *     summary: Get hacker by email
 *     description: Get details of a specific hacker by their email address for a hackathon.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Hackathon unique ID/name
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: Hacker's email address
 *     responses:
 *       200:
 *         description: Hacker details retrieved successfully
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
 *                     hackerDetails:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         uid:
 *                           type: string
 *                         role:
 *                           type: string
 *                         registeredAt:
 *                           type: string
 *                           format: date-time
 *                         team:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             invite_code:
 *                               type: string
 *       400:
 *         description: Invalid email format
 *       404:
 *         description: Hackathon, user, or hacker registration not found
 */
hackersRoutes.get(
  "/hackers/:id/:email",
  validate(HackerEmailParamSchema),
  hackerController.getHacker
);

export default hackersRoutes;
