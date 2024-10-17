"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.permissionsCheck = void 0;
const responseHandlers_1 = require("../utils/responseHandlers");
const client_1 = __importDefault(require("../../prisma/client"));
/**
 * @description This middleware checks the request user for the user's role
 * @required Authenticated User
 */
const permissionsCheck = ({ role, allowOwner = false, }) => {
    // Process the roles array
    const roles = Array.isArray(role)
        ? role // If role is an array, use it directly
        : role === "superadmin"
            ? ["superadmin"]
            : role === "admin"
                ? ["admin", "superadmin"]
                : role
                    ? [role, "admin", "superadmin"]
                    : ["admin", "superadmin"];
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user)
            return (0, responseHandlers_1.errorResponse)(res, 401, "User is unauthenticated.");
        try {
            // If owner is allowed
            let owner;
            if (allowOwner && req.params.id) {
                owner = yield client_1.default.user.findUnique({ where: { id: parseInt(req.params.id) } });
                if (!owner) {
                    console.log(`No owner found for id: ${req.params.id}`);
                }
            }
            if (roles.includes(req.user.role) || // Check if user's role is in the allowed roles
                (allowOwner && (owner === null || owner === void 0 ? void 0 : owner.email) === req.user.email)) {
                console.log(`User authorized with role: ${req.user.role}`);
                return next();
            }
            else {
                console.log("Authorization failed. Insufficient permissions.");
                return (0, responseHandlers_1.errorResponse)(res, 401, "You are not authorized to use this service.");
            }
        }
        catch (error) {
            return (0, responseHandlers_1.errorResponse)(res, 401, "You are not authorized to use this service.", error);
        }
    });
};
exports.permissionsCheck = permissionsCheck;
