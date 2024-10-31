"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_controllers_1 = __importDefault(require("../../controllers/admin/teams.controllers"));
const adminTeamsRoutes = (0, express_1.Router)();
adminTeamsRoutes.get("/admin/hackathon/team/:id/download-csv", teams_controllers_1.default.downloadTeamsData);
adminTeamsRoutes.get("/admin/hackathon/team/:id", teams_controllers_1.default.getTeamsData);
exports.default = adminTeamsRoutes;
