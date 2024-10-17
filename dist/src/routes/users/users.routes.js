"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controllers_1 = __importDefault(require("../../controllers/users/users.controllers"));
const auth_middleware_1 = __importDefault(require("../../middlewares/auth.middleware"));
const permissions_middleware_1 = require("../../middlewares/permissions.middleware");
const upload_1 = require("../../config/upload");
const userRoutes = (0, express_1.Router)();
userRoutes.post("/users/", upload_1.upload.single("profilePic"), users_controllers_1.default.create);
userRoutes.get("/users", auth_middleware_1.default.protectRoute, (0, permissions_middleware_1.permissionsCheck)({ role: "admin" }), users_controllers_1.default.getUsers);
userRoutes.get("/users/:email", users_controllers_1.default.getUserDetails);
exports.default = userRoutes;
