import { Router } from "express";
import teamsController from "../../controllers/hackathons/teams.controllers";

const teamsRoutes = Router();

teamsRoutes.post("/hackathon/team/:id", teamsController.create);
teamsRoutes.get("/hackathon/team/:id", teamsController.getTeam);
teamsRoutes.delete("/hackathon/team/:id", teamsController.leaveTeam);
teamsRoutes.post("/hackathon/team/join/:id", teamsController.join);

export default teamsRoutes;
