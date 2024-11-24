import { Router } from "express";
import bootcampController from "../../controllers/bootcamp/bootcamp.controller";

const bootcampRoutes = Router();

bootcampRoutes.post("/bootcamp/registerations", bootcampController.register);
bootcampRoutes.get(
  "/bootcamp/download-csv/:track",
  bootcampController.download
);

export default bootcampRoutes;
