"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controllers_1 = __importDefault(require("../../controllers/admin/auth.controllers"));
const express_1 = __importDefault(require("express"));
const adminAuthRoutes = express_1.default.Router();
// Basic Auth Routes
adminAuthRoutes.post("/superadmin/register", auth_controllers_1.default.register);
exports.default = adminAuthRoutes;
