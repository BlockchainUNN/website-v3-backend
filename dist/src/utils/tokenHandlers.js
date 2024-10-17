"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthTokens = createAuthTokens;
const server_1 = require("../server");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function createAuthTokens(user) {
    var _a;
    const expiration_time_access = Number(process.env.ACCESS_TOKEN_HRS) || 24;
    const expiration_time_refresh = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
    const SECRET_KEY = ((_a = process.env) === null || _a === void 0 ? void 0 : _a.SECRET_KEY) || "random_string";
    console.log('secret key2', SECRET_KEY);
    const access = jsonwebtoken_1.default.sign({
        iss: server_1.HOST,
        sub: Object.assign({}, user),
    }, SECRET_KEY, { expiresIn: `${expiration_time_access}h` });
    const refresh = jsonwebtoken_1.default.sign({
        iss: server_1.HOST,
        sub: Object.assign({}, user),
    }, SECRET_KEY, { expiresIn: `${expiration_time_refresh}d` });
    return { access, refresh };
}
