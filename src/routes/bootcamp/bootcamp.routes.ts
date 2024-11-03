import { Router } from "express";
import bootcampController from "../../controllers/bootcamp/bootcamp.controller";

const bootcampRoutes = Router();

bootcampRoutes.get("/bootcamp/registerations", bootcampController.register);

export default bootcampRoutes;
