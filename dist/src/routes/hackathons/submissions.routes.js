"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submissions_controllers_1 = __importDefault(require("../../controllers/hackathons/submissions.controllers"));
const upload_1 = require("../../config/upload");
const submissionsRoutes = (0, express_1.Router)();
submissionsRoutes.post("/submissions/:id/:teamId", upload_1.upload.array("images", 4), submissions_controllers_1.default.create);
submissionsRoutes.get("/submissions/:id/:teamId", submissions_controllers_1.default.get);
exports.default = submissionsRoutes;
