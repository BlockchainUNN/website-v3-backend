import { Router } from "express";
import hackerControllers from "../../controllers/hackathons/hackers.controllers";

const hackersRoutes = Router();

hackersRoutes.post("/hackers/:id", hackerControllers.create);

export default hackersRoutes;
