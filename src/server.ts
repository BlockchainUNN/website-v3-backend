import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import AuthMiddleware from "./middlewares/auth.middleware";
import { readFileSync } from "fs";
import adminAuthRoutes from "./routes/admin/auth.routes";
import userRoutes from "./routes/users.routes";
import roleRoutes from "./routes/admin/roles.routes";
import { permissionsCheck } from "./middlewares/permissions.middleware";
import eventsRoutes from "./routes/events.routes";
import getUserRoutes from "./routes/users/users.route";
import getEventsRoutes from "./routes/events/events.routes";

dotenv.config();
const app = express();
export const PORT = process.env.PORT || 8000;
export const HOST = process.env.HOST || `127.0.0.1:${PORT}`;
const EXTERNAL_HOST = process.env.EXTERNAL_HOST || HOST;

// Running routes
// app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//swagger inititailization
const rawData = readFileSync("./src/swagger/swagger-output.json", "utf-8");
const swaggerFile = JSON.parse(rawData);
app.use("/api/v3/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Default Route
app.get("/", (req: Request, res: Response) => {
  res.send(
    `<div>View API Documentation @ <a href="http://${EXTERNAL_HOST}/api/v3/doc">${EXTERNAL_HOST}/api/v3/doc</a><div>`
  );
});

// ROUTES HERE
app.use("/api/v3/", authRoutes);
app.use("/api/v3/", adminAuthRoutes);
app.use("/api/v3/", userRoutes);
app.use("/api/v3/", getUserRoutes);
app.use("/api/v3/", eventsRoutes);
app.use("/api/v3/", getEventsRoutes);

// PROTECTED ROUTES BELOW HERE
app.use(AuthMiddleware.protectRoute);
app.use("/api/v3/", permissionsCheck({ role: "admin" }), roleRoutes);

//initializing server
app.listen(PORT, () => {
  console.log(`Server running at  http://${HOST}`);
});
