"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const submissions_controllers_1 = __importDefault(require("../../controllers/admin/submissions.controllers"));
const adminSubmissionRoutes = (0, express_1.Router)();
adminSubmissionRoutes.get("/admin/submissions/:id/download-csv", submissions_controllers_1.default.downloadSubmissions);
adminSubmissionRoutes.get("/admin/submissions/:id", submissions_controllers_1.default.getSubmissions);
exports.default = adminSubmissionRoutes;
