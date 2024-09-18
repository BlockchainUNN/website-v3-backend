import roles from "../../controllers/admin/roles.controllers";
import Router from "express";

const roleRoutes = Router.Router();
roleRoutes.post("/roles/", roles.assignRoles);
export default roleRoutes;
