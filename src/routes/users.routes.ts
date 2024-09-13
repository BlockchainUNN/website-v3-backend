import Router from "express";
import { upload } from "../config/upload";
import users from "../controllers/users.controllers";

const userRoutes = Router.Router();

// Basic User Routes
userRoutes.post("/users/", upload.single("profilePic"), users.create);

export default userRoutes;
