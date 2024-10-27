import { Router } from "express";
import submissionsControllers from "../../controllers/hackathons/submissions.controllers";
import { upload } from "../../config/upload";

const submissionsRoutes = Router();

submissionsRoutes.post(
  "/submissions/:id/:teamId",
  upload.array("images", 4),
  submissionsControllers.create
);

submissionsRoutes.get("/submissions/:id/:teamId", submissionsControllers.get);

export default submissionsRoutes;
