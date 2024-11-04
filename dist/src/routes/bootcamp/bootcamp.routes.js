"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bootcamp_controller_1 = __importDefault(require("../../controllers/bootcamp/bootcamp.controller"));
const bootcampRoutes = (0, express_1.Router)();
bootcampRoutes.post("/bootcamp/registerations", bootcamp_controller_1.default.register);
exports.default = bootcampRoutes;
