"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_controllers_1 = __importDefault(require("../../controllers/hackathons/teams.controllers"));
const teamsRoutes = (0, express_1.Router)();
teamsRoutes.post("/hackathon/team/:id", teams_controllers_1.default.create);
teamsRoutes.get("/hackathon/team/:id", teams_controllers_1.default.getTeam);
teamsRoutes.delete("/hackathon/team/:id", teams_controllers_1.default.leaveTeam);
teamsRoutes.post("/hackathon/team/join/:id", teams_controllers_1.default.join);
exports.default = teamsRoutes;
