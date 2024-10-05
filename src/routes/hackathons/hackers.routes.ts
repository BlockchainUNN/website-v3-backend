import { Router } from "express";
import hackerControllers from "../../controllers/hackathons/hackers.controllers";
import AuthMiddleware from "../../middlewares/auth.middleware";

const hackersRoutes = Router();

hackersRoutes.post("/hackers/:id", hackerControllers.create);
hackersRoutes.get(
  "/hackers/:id",
  AuthMiddleware.protectRoute,
  hackerControllers.getLoggedInHacker
);
hackersRoutes.get("/hackers/:id/:email", hackerControllers.getHacker);
hackersRoutes.post("/hackers/login/:id", hackerControllers.login);

export default hackersRoutes;
