"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controllers_1 = __importDefault(require("../controllers/auth.controllers"));
const express_1 = __importDefault(require("express"));
const authRoutes = express_1.default.Router();
// Basic Auth Routes
authRoutes.post("/login/", auth_controllers_1.default.login);
exports.default = authRoutes;
