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
const responseHandlers_1 = require("../utils/responseHandlers");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// const SECRET_KEY = process.env?.SECRET_KEY || "random_string";
/**
 * @description This middleware checks the user token supplied as Bearer authorization
 * @required Bearer Authorization
 *
 * PROPOSED FLOW
 * - User registers or logs in and gets 2 tokens (access, refresh)
 * - Access token short lived (bout 24hrs)
 * - Refresh lasts longer (bout a week)
 * - A blacklist for refresh tokens refresh tokens are swapped out everytime they are used.
 * - This function checks specifically the access token tho.
 */
const protectRoute = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    let receivedToken = req.headers.authorization;
    let token;
    const SECRET_KEY = ((_a = process.env) === null || _a === void 0 ? void 0 : _a.SECRET_KEY) || "random_string";
    if (receivedToken && receivedToken.startsWith("Bearer")) {
        try {
            token = receivedToken.split(" ")[1]; // JWT
            // Check that the token is still valid
            console.log(token);
            console.log('key1', SECRET_KEY);
            return jsonwebtoken_1.default.verify(token, SECRET_KEY, function (err, decoded) {
                if (err) {
                    throw err;
                }
                const currentUser = JSON.parse(JSON.stringify(decoded === null || decoded === void 0 ? void 0 : decoded.sub));
                req.user = currentUser;
                return next();
            });
        }
        catch (error) {
            /*
              #swagger.responses[401] = {description: 'Unauthorized', schema: {error: 'You are not authorized to use this service.', data: {details: "If more info is available it will be here."}}}
            */
            return (0, responseHandlers_1.errorResponse)(res, 401, "You are not authorized to use this service.", error);
        }
    }
    if (!token) {
        return (0, responseHandlers_1.errorResponse)(res, 401, "You are not authorized to use this service, no token provided.");
    }
    return next();
});
const AuthMiddleware = { protectRoute };
exports.default = AuthMiddleware;
