import { Router } from "express";
import hackerControllers from "../../controllers/hackathons/hackers.controllers";

const hackersRoutes = Router();

hackersRoutes.post("/hackers/:id", hackerControllers.create);
hackersRoutes.get("/hackers/:id/:email", hackerControllers.getHacker);
hackersRoutes.post("/hackers/login/:id", hackerControllers.login);

export default hackersRoutes;
