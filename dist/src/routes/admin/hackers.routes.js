"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const hackers_controllers_1 = __importDefault(require("../../controllers/admin/hackers.controllers"));
const AdminHackersRoutes = (0, express_1.Router)();
AdminHackersRoutes.get("/admin/hackers/:id/download-csv", hackers_controllers_1.default.downloadHackers);
AdminHackersRoutes.get("/admin/hackers/:id", hackers_controllers_1.default.getHackers);
exports.default = AdminHackersRoutes;
