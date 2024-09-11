import auth from "../../controllers/admin/auth.controllers";

import Router from "express";
const adminAuthRoutes = Router.Router();

// Basic Auth Routes
adminAuthRoutes.post("/superadmin/register", auth.register);

export default adminAuthRoutes;
