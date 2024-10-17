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
const bcrypt_1 = __importDefault(require("bcrypt"));
const tokenHandlers_1 = require("../../utils/tokenHandlers");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Admin Management']
    // #swagger.summary = 'Endpoint for creating a superadmin account'
    try {
        /*  #swagger.parameters['body'] = {
                in: 'body',
                description: 'Create a superuser',
                schema: { firstName: "Jon", lastName: "Doe", email: "jonDoe@example.com", password: "P@ssword123" }
        } */
        const { firstName, lastName, email, password } = req.body;
        const role = "superadmin";
        const max_count = Number(process.env.MAX_SUPER_ADMINS) || 3; // Maximum number of super admins
        // Get or create role
        let userRole = yield client_1.default.role.findUnique({
            where: { role: role },
        });
        if (!userRole && (0, validationHandlers_1.isValidRole)(role)) {
            userRole = yield client_1.default.role.create({ data: { role: role } });
        }
        // Check that super admins can still be created - can be commented out if deemed unnecessary
        const superadminCount = yield client_1.default.user.count({
            where: {
                roles: { role: role },
            },
        });
        if (superadminCount >= max_count) {
            /* #swagger.responses[403] = {
                  description: 'Thrown when the maximum amount of superadmins already exist in the database',
                  schema: {
                      error: 'Superadmin slots filled',
                  }
              }
          */
            return (0, responseHandlers_1.errorResponse)(res, 403, "Superadmin slots filled");
        }
        // Data Validations
        if (!firstName || !lastName)
            /* #swagger.responses[400] = {
                  description: 'Bad request - Missing or invalid credentials',
                  schema: {
                      error: 'invalid email address',
                      data: {details: "If more info is available it will be here."}
                  }
              }
           */
            return (0, responseHandlers_1.errorResponse)(res, 400, "You need to provide a first and last name");
        if (!(0, validationHandlers_1.isValidEmailAddress)(email))
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid email address");
        if (!(0, validationHandlers_1.isStrongPassword)(password))
            return (0, responseHandlers_1.errorResponse)(res, 400, "Password is too weak", {
                details: "A strong password must be up to 8 characters long and must contain atleast 1 uppercase letter, 1 number, and atleast 1 special character",
            });
        // Check that email is unused
        const existingUser = yield client_1.default.user.findUnique({
            where: { email: email },
        });
        if (existingUser) {
            return (0, responseHandlers_1.errorResponse)(res, 400, "User with email already exists");
        }
        // Handle password hashing
        bcrypt_1.default.genSalt(10, (err, salt) => {
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
                    details: "Error generating password salt",
                });
            bcrypt_1.default.hash(password, salt, (err, hashedPassword) => {
                if (err)
                    return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Server Error", {
                        details: "Error hashing password",
                    });
                // Create User in DB
                client_1.default.user
                    .create({
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                        hashed_password: hashedPassword,
                        email: email,
                        [userRole ? "roleId" : null]: userRole
                            ? userRole.id
                            : null,
                    },
                })
                    .then((newUser) => {
                    // Create access and refresh token for user
                    const { access, refresh } = (0, tokenHandlers_1.createAuthTokens)({
                        firstName: newUser.first_name,
                        lastName: newUser.last_name,
                        email: newUser.email,
                        role: userRole === null || userRole === void 0 ? void 0 : userRole.role,
                    });
                    /* #swagger.responses[201] = {
                    description: 'Successfully created',
                    schema: {
                        message: 'SuperAdmin Created Successfully',
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
                                role: "superadmin"},
                            }
                        }
                    }
                    */
                    return (0, responseHandlers_1.successResponse)(res, 201, "SuperAdmin Created Successfully", {
                        tokens: {
                            access,
                            refresh,
                        },
                        userDetails: {
                            firstName: newUser.first_name,
                            lastName: newUser.last_name,
                            email: newUser.email,
                            uid: newUser.uid,
                            role: userRole === null || userRole === void 0 ? void 0 : userRole.role,
                        },
                    });
                })
                    .catch((err) => (0, responseHandlers_1.errorResponse)(res, 500, "could not create user", { details: err }));
            });
        });
    }
    catch (error) {
        // Handle error
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error");
    }
});
const auth = { register };
exports.default = auth;
