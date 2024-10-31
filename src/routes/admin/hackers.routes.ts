import { Router } from "express";
import hackerControllers from "../../controllers/admin/hackers.controllers";

const AdminHackersRoutes = Router();

AdminHackersRoutes.get(
  "/admin/hackers/:id/download-csv",
  hackerControllers.downloadHackers
);

AdminHackersRoutes.get("/admin/hackers/:id", hackerControllers.getHackers);

export default AdminHackersRoutes;
