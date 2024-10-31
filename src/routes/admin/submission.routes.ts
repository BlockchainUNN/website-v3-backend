import { Router } from "express";
import submissionsControllers from "../../controllers/admin/submissions.controllers";

const adminSubmissionRoutes = Router();

adminSubmissionRoutes.get(
  "/admin/submissions/:id/download-csv",
  submissionsControllers.downloadSubmissions
);

adminSubmissionRoutes.get(
  "/admin/submissions/:id",
  submissionsControllers.getSubmissions
);

export default adminSubmissionRoutes;
