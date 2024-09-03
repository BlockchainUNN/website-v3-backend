import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.routes";
import AuthMiddleware from "./middlewares/auth.middleware";

dotenv.config();
const app = express();
export const PORT = process.env.PORT || 8000;
export const HOST = process.env.HOST || `http://127.0.0.1:${PORT}`;
export const BASE_PATH = "/api/v3/";

// Running routes
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
//swagger inititailization
// app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));

// ROUTES HERE
app.use(BASE_PATH, authRoutes);

// PROTECTED ROUTES BELOW HERE
app.use(AuthMiddleware.protectRoute);

// Default Route
app.get("/", (req: Request, res: Response) => {
  res.send(
    `<div>View API Documentation @ <a href="${HOST}${BASE_PATH}docs">${HOST}${BASE_PATH}docs</a><div>`
  );
});

//initializing server
app.listen(PORT, () => {
  console.log(`Server running at  http://127.0.0.1:${PORT}`);
});
