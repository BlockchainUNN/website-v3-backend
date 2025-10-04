// src/routes/hackathons/teams.routes.ts

import { Router } from "express";
import { z } from "zod";
import teamsController from "../../controllers/hackathons/teams.controllers";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validation";

const teamsRoutes = Router();

// Validation schemas
const CreateTeamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, "Team name is required")
      .max(50, "Team name must be 50 characters or less")
      .trim(),
  }),
});

const JoinTeamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
  }),
  body: z.object({
    inviteCode: z
      .string()
      .min(1, "Invite code is required")
      .max(10, "Invite code too long")
      .trim(),
  }),
});

const HackathonParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Hackathon ID is required"),
  }),
});

/**
 * @swagger
 * /api/v3/hackathon/team/{id}:
 *   post:
 *     tags: [Hackathon - Teams]
 *     summary: Create new team
 *     description: Create a new team for a hackathon. User must be registered as a hacker and not already in a team.
 *     security:
 *       - bearerAuth: []
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 50
 *                 example: "Team Alpha"
 *                 description: Unique team name for the hackathon
 *     responses:
 *       201:
 *         description: Team created successfully
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
 *                     role:
 *                       type: string
 *                       example: "Frontend Developer"
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
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
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         inviteCode:
 *                           type: string
 *                           example: "ABC123"
 *                         memberCount:
 *                           type: integer
 *                           example: 1
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Invalid data, team creation period ended, or user already in team
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Hackathon not found or user not registered
 *       409:
 *         description: Team name already exists or user already in a team
 */
teamsRoutes.post(
  "/hackathon/team/:id",
  authenticate,
  validate(CreateTeamSchema),
  teamsController.create
);

/**
 * @swagger
 * /api/v3/hackathon/team/join/{id}:
 *   post:
 *     tags: [Hackathon - Teams]
 *     summary: Join existing team
 *     description: Join an existing team using an invite code. User must be registered as a hacker and not already in a team.
 *     security:
 *       - bearerAuth: []
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
 *               - inviteCode
 *             properties:
 *               inviteCode:
 *                 type: string
 *                 example: "ABC123"
 *                 description: Team invite code (case-insensitive)
 *     responses:
 *       200:
 *         description: Successfully joined team
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
 *                     role:
 *                       type: string
 *                       example: "Backend Developer"
 *                     registeredAt:
 *                       type: string
 *                       format: date-time
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
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         inviteCode:
 *                           type: string
 *                         memberCount:
 *                           type: integer
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Team joining period ended, user already in team, or team is full
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Hackathon, team, or user registration not found
 *       409:
 *         description: User already in a team
 */
teamsRoutes.post(
  "/hackathon/team/join/:id",
  authenticate,
  validate(JoinTeamSchema),
  teamsController.join
);

/**
 * @swagger
 * /api/v3/hackathon/team/{id}:
 *   get:
 *     tags: [Hackathon - Teams]
 *     summary: Get team details
 *     description: Get details of the team the authenticated user is currently in for a specific hackathon.
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
 *         description: Team details retrieved successfully
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
 *                     name:
 *                       type: string
 *                       example: "Team Alpha"
 *                     inviteCode:
 *                       type: string
 *                       example: "ABC123"
 *                     memberCount:
 *                       type: integer
 *                       example: 3
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     hackathon:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         unique_name:
 *                           type: string
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           role:
 *                             type: string
 *                             example: "Frontend Developer"
 *                           registeredAt:
 *                             type: string
 *                             format: date-time
 *                           isCreator:
 *                             type: boolean
 *                             example: false
 *                           user:
 *                             type: object
 *                             properties:
 *                               uid:
 *                                 type: string
 *                               firstName:
 *                                 type: string
 *                               lastName:
 *                                 type: string
 *                               email:
 *                                 type: string
 *                               subCommunity:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               techSkills:
 *                                 type: array
 *                                 items:
 *                                   type: string
 *                               phoneNumber:
 *                                 type: string
 *                                 nullable: true
 *                               gender:
 *                                 type: string
 *                                 nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Hackathon not found, user not registered, or user not in any team
 */
teamsRoutes.get(
  "/hackathon/team/:id",
  authenticate,
  validate(HackathonParamSchema),
  teamsController.getTeam
);

/**
 * @swagger
 * /api/v3/hackathon/team/{id}:
 *   delete:
 *     tags: [Hackathon - Teams]
 *     summary: Leave team
 *     description: Leave the current team. If the user is the last member, the team will be deleted. If the user is the creator and there are other members, a new creator will be assigned.
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
 *       204:
 *         description: Successfully left team
 *       400:
 *         description: Bad request - User not in team or hackathon has already started
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Hackathon not found or user not registered
 */
teamsRoutes.delete(
  "/hackathon/team/:id",
  authenticate,
  validate(HackathonParamSchema),
  teamsController.leaveTeam
);

export default teamsRoutes;
