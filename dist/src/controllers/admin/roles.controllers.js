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
const responseHandlers_1 = require("../../utils/responseHandlers");
const client_1 = __importDefault(require("../../../prisma/client"));
const validationHandlers_1 = require("../../utils/validationHandlers");
const assignRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Admin Management']
    // #swagger.summary = 'Endpoint for assigning roles to other accounts.'
    // #swagger.security = [{"apiKeyAuth": []}]
    var _a;
    try {
        /*  #swagger.parameters['body'] = {
                in: 'body',
                schema: { uid: "1234-4324-3233-342232", role: "admin"}
        } */
        const { uid, role } = req.body;
        // Validations
        if (role === "superadmin")
            // #swagger.responses[400] = {description: 'Bad Request', schema: {error: 'Invalid role: Acceptable roles are admin, event_admin, judge, writer.', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "Role of superadmin can not be assigned");
        if (role === "admin" && req.user.role !== "superadmin")
            // #swagger.responses[401] = {description: 'Unauthorized', schema: {error: 'Only superadmins can assign admin roles.', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.errorResponse)(res, 401, "Only superadmins can assign admin roles");
        // Get or create role
        let userRole = yield client_1.default.role.findUnique({
            where: { role: role },
        });
        if (!userRole) {
            if ((0, validationHandlers_1.isValidRole)(role)) {
                userRole = yield client_1.default.role.create({ data: { role: role } });
            }
            else {
                return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid role: Acceptable roles are admin, event_admin, judge, writer.");
            }
        }
        // Update user account
        const user = yield client_1.default.user.update({
            where: { uid },
            data: { roleId: userRole.id },
            include: { roles: true },
        });
        // #swagger.responses[200] = {description: 'Successful Request', schema: {message: 'User roles successfully updated', data: {firstName: "Jon",lastName: "doe",email: "doe@mail.com",uid: "1123-3223-3433-34322",role: "admin"}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "User roles successfully updated", {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            uid: user.uid,
            role: (_a = user === null || user === void 0 ? void 0 : user.roles) === null || _a === void 0 ? void 0 : _a.role,
        });
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal Server Error', schema: {error: 'Internal Server Error', details: "If more info is available it will be here."}}
        // return errorResponse(res, 500, "Internal Error", error);
    }
});
const roles = { assignRoles };
exports.default = roles;
