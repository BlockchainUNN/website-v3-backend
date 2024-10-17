"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST = exports.PORT = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const auth_middleware_1 = __importDefault(
  require("./middlewares/auth.middleware")
);
const fs_1 = require("fs");
const auth_routes_2 = __importDefault(require("./routes/admin/auth.routes"));
const roles_routes_1 = __importDefault(require("./routes/admin/roles.routes"));
const permissions_middleware_1 = require("./middlewares/permissions.middleware");
const events_routes_1 = __importDefault(require("./routes/events.routes"));
const users_routes_1 = __importDefault(require("./routes/users/users.routes"));
const events_routes_2 = __importDefault(
  require("./routes/events/events.routes")
);
const hackers_routes_1 = __importDefault(
  require("./routes/hackathons/hackers.routes")
);
const teams_routes_1 = __importDefault(
  require("./routes/hackathons/teams.routes")
);
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.PORT = process.env.PORT || 8000;
exports.HOST = process.env.HOST || `127.0.0.1:${exports.PORT}`;
const EXTERNAL_HOST = process.env.EXTERNAL_HOST || exports.HOST;
// Running routes
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5555",
  "http://127.0.0.1:8000",
  "http://160.238.36.159",
  "https://blockchainunn-frontend.onrender.com",
];
app.use(
  (0, cors_1.default)({
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
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
//swagger inititailization
const rawData = (0, fs_1.readFileSync)(
  "./src/swagger/swagger-output.json",
  "utf-8"
);
const swaggerFile = JSON.parse(rawData);
app.use(
  "/api/v3/doc",
  swagger_ui_express_1.default.serve,
  swagger_ui_express_1.default.setup(swaggerFile)
);
// Default Route
app.get("/", (req, res) => {
  res.send(
    `<div>View API Documentation @ <a href="http://${EXTERNAL_HOST}/api/v3/doc">${EXTERNAL_HOST}/api/v3/doc</a><div>`
  );
});
// ROUTES HERE
app.use("/api/v3/", auth_routes_1.default);
app.use("/api/v3/", auth_routes_2.default);
app.use("/api/v3/", users_routes_1.default);
app.use("/api/v3/", events_routes_1.default);
app.use("/api/v3/", events_routes_2.default);
app.use("/api/v3/", hackers_routes_1.default);
// PROTECTED ROUTES BELOW HERE
app.use(auth_middleware_1.default.protectRoute);
app.use("/api/v3/", teams_routes_1.default);
app.use(
  "/api/v3/",
  (0, permissions_middleware_1.permissionsCheck)({ role: "admin" }),
  roles_routes_1.default
);
//initializing server
app.listen(exports.PORT, () => {
  console.log(`Server running at  http://${exports.HOST}`);
});
