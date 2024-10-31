import { Router } from "express";
import hackerControllers from "../../controllers/hackathons/hackers.controllers";
import AuthMiddleware from "../../middlewares/auth.middleware";

const hackersRoutes = Router();

hackersRoutes.post("/hackers/:id", hackerControllers.create);
hackersRoutes.post(
  "/hackers/:id/reset-password",
  hackerControllers.resetHackerPassword
);
hackersRoutes.post(
  "/hackers/:id/reset-password/callback",
  hackerControllers.resetPasswordCallback
);
hackersRoutes.get(
  "/hackers/:id",
  AuthMiddleware.protectRoute,
  hackerControllers.getLoggedInHacker
);
hackersRoutes.get("/hackers/count/:id", hackerControllers.getHackerCount);
hackersRoutes.get("/hackers/:id/:email", hackerControllers.getHacker);
hackersRoutes.post("/hackers/login/:id", hackerControllers.login);

export default hackersRoutes;
