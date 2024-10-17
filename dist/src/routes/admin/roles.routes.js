"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const roles_controllers_1 = __importDefault(require("../../controllers/admin/roles.controllers"));
const express_1 = __importDefault(require("express"));
const roleRoutes = express_1.default.Router();
roleRoutes.post("/roles/", roles_controllers_1.default.assignRoles);
exports.default = roleRoutes;
