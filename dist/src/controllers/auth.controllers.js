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
const validationHandlers_1 = require("../utils/validationHandlers");
const client_1 = __importDefault(require("../../prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const tokenHandlers_1 = require("../utils/tokenHandlers");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Authentication']
    // #swagger.summary = 'Endpoint for signing into an account'
    try {
        /*  #swagger.parameters['body'] = {
                  in: 'body',
                  description: 'Log In - Password is only required for users with roles',
                  schema: { email: "jonDoe@example.com", password: "P@ssword123" }
          } */
        const { email, password } = req.body;
        // Data Validations
        if (!email || !(0, validationHandlers_1.isValidEmailAddress)(email))
            /* #swagger.responses[400] = {
                    description: 'Bad request - Missing or invalid credentials',
                    schema: {
                        error: 'You need to provide a valid email address',
                        data: {details: "If more info is available it will be here."}
                    }
                }
             */
            return (0, responseHandlers_1.errorResponse)(res, 400, "You need to provide a valid email address");
        // Check that user exists
        const existingUser = yield client_1.default.user.findUnique({
            where: { email: email },
            include: { roles: true },
        });
        if (!existingUser) {
            return (0, responseHandlers_1.errorResponse)(res, 400, "User with email does not exists");
        }
        // Check if the user has a role and password
        if (!existingUser.roleId)
            // If no role then also no password
            /* #swagger.responses[200] = {
            description: 'Users with no role have no password hence no token',
            schema: {
                message: 'Request successful',
                data: {
                    userDetails: {
                        firstName: "Jon",
                        lastName: "Doe",
                        email: "jonDoe@example.com",
                        uid: "uid here...",
                        role: null},
                    }
                }
              }
            }
            */
            return (0, responseHandlers_1.successResponse)(res, 200, "Request successful", {
                userDetails: {
                    firstName: existingUser.first_name,
                    lastName: existingUser.last_name,
                    email: existingUser.email,
                    uid: existingUser.uid,
                    role: null,
                },
            });
        if (!existingUser.hashed_password)
            /* #swagger.responses[409] = {
            description: 'Users with roles but no password need to add a password',
            schema: {
                error: 'Action Required: Verify email address and update password'
              }
            }
            */
            return (0, responseHandlers_1.errorResponse)(res, 409, "Action Required: Verify email address and update password");
        if (!password)
            return (0, responseHandlers_1.errorResponse)(res, 400, "You need to provide a password");
        // Confirm password
        bcrypt_1.default.compare(password, existingUser.hashed_password, (err, result) => {
            var _a, _b;
            if (err)
                /* #swagger.responses[500] = {
                      description: 'Something went wrong server side',
                      schema: {
                          error: 'Internal Server Error',
                          data: {details: "If more info is available it will be here."}
                      }
                   }
                  */
                return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Server Error", {
                    details: "Error comparing passwords",
                });
            if (!result)
                /* #swagger.responses[404] = {
                      description: 'Unauthorized',
                      schema: {
                          error: 'Wrong Password',
                      }
                   }
                  */
                return (0, responseHandlers_1.errorResponse)(res, 404, "Wrong Password");
            const { access, refresh } = (0, tokenHandlers_1.createAuthTokens)({
                firstName: existingUser.first_name,
                lastName: existingUser.last_name,
                email: existingUser.email,
                role: (_a = existingUser.roles) === null || _a === void 0 ? void 0 : _a.role,
            });
            /* #swagger.responses[200] = {
              description: 'Successful Request',
              schema: {
                  message: 'Request Successfully',
                  data: {
                      tokens: {
                          access: "access token...",
                          refresh: "refresh token...",
                      },
                      userDetails: {
                          firstName: "Jon",
                          lastName: "Doe",
                          email: "jonDoe@example.com",
                          uid: "uid here...",
                          role: "writer"},
                      }
                  }
              }
            }
            */
            return (0, responseHandlers_1.successResponse)(res, 200, "Request Successfully", {
                tokens: {
                    access,
                    refresh,
                },
                userDetails: {
                    firstName: existingUser.first_name,
                    lastName: existingUser.last_name,
                    email: existingUser.email,
                    uid: existingUser.uid,
                    role: (_b = existingUser.roles) === null || _b === void 0 ? void 0 : _b.role,
                },
            });
        });
    }
    catch (error) {
        // Handle error
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", error);
    }
});
const auth = { login };
exports.default = auth;
