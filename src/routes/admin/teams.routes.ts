import { Router } from "express";
import teamsController from "../../controllers/admin/teams.controllers";

const adminTeamsRoutes = Router();

adminTeamsRoutes.get(
  "/admin/hackathon/team/:id/download-csv",
  teamsController.downloadTeamsData
);

adminTeamsRoutes.get("/admin/hackathon/team/:id", teamsController.getTeamsData);

export default adminTeamsRoutes;
