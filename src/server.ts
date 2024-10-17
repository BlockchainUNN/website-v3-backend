import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./routes/auth.routes";
import AuthMiddleware from "./middlewares/auth.middleware";
import { readFileSync } from "fs";
import adminAuthRoutes from "./routes/admin/auth.routes";
import roleRoutes from "./routes/admin/roles.routes";
import { permissionsCheck } from "./middlewares/permissions.middleware";
import eventsRoutes from "./routes/events.routes";
import userRoutes from "./routes/users/users.routes";
import getEventsRoutes from "./routes/events/events.routes";
import hackersRoutes from "./routes/hackathons/hackers.routes";
import teamsRoutes from "./routes/hackathons/teams.routes";

dotenv.config();
const app = express();
export const PORT = process.env.PORT || 8080;
export const HOST = process.env.HOST || `127.0.0.1:${PORT}`;
const EXTERNAL_HOST = process.env.EXTERNAL_HOST || HOST;

// Running routes
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5555",
  "http://127.0.0.1:8000",
  "http://160.238.36.159",
  "https://blockchainunn-frontend.onrender.com",
];
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

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
app.use("/api/v3/", eventsRoutes);
app.use("/api/v3/", getEventsRoutes);
app.use("/api/v3/", hackersRoutes);

// PROTECTED ROUTES BELOW HERE
app.use(AuthMiddleware.protectRoute);
app.use("/api/v3/", teamsRoutes);
app.use("/api/v3/", permissionsCheck({ role: "admin" }), roleRoutes);

//initializing server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at  http://${HOST}`);
});
