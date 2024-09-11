import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth.routes";
import AuthMiddleware from "./middlewares/auth.middleware";
import { readFileSync } from "fs";
import adminAuthRoutes from "./routes/admin/auth.routes";

dotenv.config();
const app = express();
export const PORT = process.env.PORT || 8000;
export const HOST = process.env.HOST || `127.0.0.1:${PORT}`;

// Running routes
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//swagger inititailization
const rawData = readFileSync("./src/swagger/swagger-output.json", "utf-8");
const swaggerFile = JSON.parse(rawData);
app.use("/api/v3/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// Default Route
app.get("/", (req: Request, res: Response) => {
  res.send(
    `<div>View API Documentation @ <a href="${HOST}/api/v3/doc">${HOST}/api/v3/doc</a><div>`
  );
});

// ROUTES HERE
app.use("/api/v3/", authRoutes);
app.use("/api/v3/", adminAuthRoutes);

// PROTECTED ROUTES BELOW HERE
app.use(AuthMiddleware.protectRoute);
// Testing middleware
app.get("/", (req: Request, res: Response) => {
  res.status(200);
});

//initializing server
app.listen(PORT, () => {
  console.log(`Server running at  http://${HOST}`);
});
