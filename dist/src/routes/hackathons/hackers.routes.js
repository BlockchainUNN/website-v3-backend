"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hackers_controllers_1 = __importDefault(require("../../controllers/hackathons/hackers.controllers"));
const auth_middleware_1 = __importDefault(require("../../middlewares/auth.middleware"));
const hackersRoutes = (0, express_1.Router)();
hackersRoutes.post("/hackers/:id", hackers_controllers_1.default.create);
hackersRoutes.get("/hackers/:id", auth_middleware_1.default.protectRoute, hackers_controllers_1.default.getLoggedInHacker);
hackersRoutes.get("/hackers/count/:id", hackers_controllers_1.default.getHackerCount);
hackersRoutes.get("/hackers/:id/:email", hackers_controllers_1.default.getHacker);
hackersRoutes.post("/hackers/login/:id", hackers_controllers_1.default.login);
exports.default = hackersRoutes;
