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
const client_1 = __importDefault(require("../../../prisma/client"));
const responseHandlers_1 = require("../../utils/responseHandlers");
const validationHandlers_1 = require("../../utils/validationHandlers");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mailHandler_1 = require("../../utils/mailHandler");
const tokenHandlers_1 = require("../../utils/tokenHandlers");
const randomValue_1 = require("../../utils/randomValue");
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Hackers']
    // #swagger.summary = "Endpoint for creating a hacker"
    try {
        // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is regiatering for", required: 'true'}
        // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Hackers details", schema: {email: "jondoe@example.com", role: "frontend developer", password: "strong password"}}
        const { email, role, password } = req.body;
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Validate user data
        if (!email || !(0, validationHandlers_1.isValidEmailAddress)(email))
            // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid email address");
        // Checl if event exists
        const hackathon = yield client_1.default.hackathon.findUnique({
            where: { unique_name: hackathonId },
        });
        if (!hackathon)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Hackathon not found");
        // Check if user with email exists
        const existingUser = yield client_1.default.user.findUnique({
            where: { email: email },
        });
        if (!existingUser)
            return (0, responseHandlers_1.errorResponse)(res, 404, "User not found");
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
                // Create Hacker in DB
                client_1.default.hacker
                    .create({
                    data: {
                        user_id: existingUser.id,
                        hackathon_id: hackathon.id,
                        role: role,
                        passwordHash: hashedPassword,
                    },
                    include: { hackathon: true, user: true, team: true },
                })
                    .then((newHacker) => {
                    if (!newHacker) {
                        // #swagger.responses[500] = {description: 'Account was not created. Something went wrong', schema: {error: 'Account was not created. Something went wrong', details: "If more info is available it will be here."}}
                        return (0, responseHandlers_1.errorResponse)(res, 500, "Account was not created. Something went wrong");
                    }
                    // Send mail
                    (0, mailHandler_1.sendMail)(email, `${newHacker.user.first_name} You’re Ready for the Hackathon!`, "hackathon_registeration", { firstName: newHacker.user.first_name });
                    // #swagger.responses[201] = {description: 'Hacker account successfully created', schema: {message: 'Successful Registration.', data: {details: "If more info is available it will be here."}}}
                    return (0, responseHandlers_1.successResponse)(res, 201, "Successful Registration.", {
                        role: newHacker.role,
                        team: newHacker.team,
                        registerationDate: newHacker.registered_at,
                        user: {
                            uid: newHacker.user.uid,
                            fistName: newHacker.user.first_name,
                            lastName: newHacker.user.last_name,
                            email: newHacker.user.email,
                        },
                        hackathon: newHacker.hackathon,
                    });
                })
                    .catch((err) => (0, responseHandlers_1.errorResponse)(res, 500, "could not create hacker", { details: err }));
            });
        });
    }
    catch (error) {
        console.log("error ==>>", error);
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Hackers']
    // #swagger.summary = 'Endpoint for signing into a hacker account'
    var _a;
    try {
        /*  #swagger.parameters['body'] = {
                  in: 'body',
                  description: 'Log In',
                  schema: { email: "jonDoe@example.com", password: "P@ssword123" }
          } */
        //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
        const { email, password } = req.body;
        const hackathonUid = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
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
        // Get hackathon
        const hackathon = yield client_1.default.hackathon.findUnique({
            where: { unique_name: hackathonUid },
        });
        if (!hackathon)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Path does not exist.", {
                details: "Wrong hackathon unique Id/name.",
            });
        // Get User
        const user = yield client_1.default.user.findUnique({ where: { email } });
        if (!user)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker with email does not exist.");
        // Check that hacker exists
        const existingHacker = yield client_1.default.hacker.findUnique({
            where: { hackathon_id: hackathon.id, user_id: user === null || user === void 0 ? void 0 : user.id },
        });
        if (!existingHacker) {
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker with email does not exists");
        }
        // Confirm password
        bcrypt_1.default.compare(password, existingHacker.passwordHash || "", (err, result) => {
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
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                role: "hacker",
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
                        role: "hacker"},
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
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    uid: user.uid,
                    role: existingHacker.role,
                    registeredOn: existingHacker.registered_at,
                },
            });
        });
    }
    catch (error) {
        // Handle error
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", error);
    }
});
const getHacker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Hackers']
    // #swagger.summary = 'Endpoint for getting a hacker account'
    var _a, _b;
    try {
        //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
        //  #swagger.parameters["email"] = {in: "path", description: "Hackers email"}
        const hackathonUid = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        const email = (_b = req.params) === null || _b === void 0 ? void 0 : _b.email;
        console.table({ hackathonUid, email });
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
        // Get hackathon
        const hackathon = yield client_1.default.hackathon.findUnique({
            where: { unique_name: hackathonUid },
        });
        if (!hackathon)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Path does not exist.", {
                details: "Wrong hackathon unique Id/name.",
            });
        // Get User
        const user = yield client_1.default.user.findUnique({ where: { email } });
        if (!user)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker with email does not exist.");
        // Check that hacker exists
        const existingHacker = yield client_1.default.hacker.findUnique({
            where: { hackathon_id: hackathon.id, user_id: user === null || user === void 0 ? void 0 : user.id },
        });
        if (!existingHacker) {
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker with email does not exists");
        }
        /* #swagger.responses[200] = {
            description: 'Successful Request',
            schema: {
                message: 'Request Successfully',
                data: "Any extra details."
      } }
          */
        return (0, responseHandlers_1.successResponse)(res, 200, "Request Successfully", {
            hackerDetails: {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                uid: user.uid,
                role: existingHacker.role,
                registeredOn: existingHacker.registered_at,
            },
        });
    }
    catch (error) {
        // Handle error
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", error);
    }
});
const getHackerCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Hackers']
    // #swagger.summary = 'Endpoint for getting a hacker Count'
    var _a;
    try {
        //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
        const hackathonUid = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get hacker Count
        const hackerCount = yield client_1.default.hacker.count({
            where: { hackathon: { unique_name: hackathonUid } },
        });
        if (!hackerCount)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Path does not exist.", {
                details: "Wrong hackathon unique Id/name.",
            });
        /* #swagger.responses[200] = {
            description: 'Successful Request',
            schema: {
                message: 'Request Successfully',
                data: "Any extra details."
      } }
          */
        return (0, responseHandlers_1.successResponse)(res, 200, "Request Successfully", { hackerCount });
    }
    catch (error) {
        // Handle error
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", error);
    }
});
const getLoggedInHacker = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Hackers']
    // #swagger.summary = 'Endpoint for getting a hacker account of a logged in user'
    var _a, _b;
    try {
        //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
        const hackathonUid = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        const email = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        console.table({ hackathonUid, email });
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
        // Get hackathon
        const hackathon = yield client_1.default.hackathon.findUnique({
            where: { unique_name: hackathonUid },
        });
        if (!hackathon)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Path does not exist.", {
                details: "Wrong hackathon unique Id/name.",
            });
        // Get User
        const user = yield client_1.default.user.findUnique({ where: { email } });
        if (!user)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker with email does not exist.");
        // Check that hacker exists
        const existingHacker = yield client_1.default.hacker.findUnique({
            where: { hackathon_id: hackathon.id, user_id: user === null || user === void 0 ? void 0 : user.id },
        });
        if (!existingHacker) {
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker with email does not exists");
        }
        /* #swagger.responses[200] = {
            description: 'Successful Request',
            schema: {
                message: 'Request Successfully',
                data: "Any extra details."
      } }
          */
        return (0, responseHandlers_1.successResponse)(res, 200, "Request Successfully", {
            hackerDetails: {
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                uid: user.uid,
                role: existingHacker.role,
                registeredOn: existingHacker.registered_at,
            },
        });
    }
    catch (error) {
        // Handle error
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", error);
    }
});
const downloadHackers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Hackers']
    // #swagger.summary = 'Endpoint for downloading hacker's details'
    var _a;
    try {
        // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get hackers
        const hackers = yield client_1.default.hacker.findMany({
            where: { hackathon: { unique_name: hackathonId } },
            select: {
                user: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true,
                        tech_skills: true,
                        phone_number: true,
                        gender: true,
                    },
                },
                role: true,
                registered_at: true,
                team: { select: { name: true, created_at: true } },
            },
        });
        const data = hackers.map((detail) => {
            var _a, _b;
            return {
                firstName: detail.user.first_name,
                lastName: detail.user.last_name,
                email: detail.user.email,
                phoneNumber: detail.user.phone_number,
                gender: detail.user.gender,
                techSkill: detail.user.tech_skills,
                registeredAt: detail.registered_at,
                role: detail.role,
                team: (_a = detail.team) === null || _a === void 0 ? void 0 : _a.name,
                teamCreatedAt: (_b = detail.team) === null || _b === void 0 ? void 0 : _b.created_at,
            };
        });
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.cvsResponse)(res, 200, "hackersDetails", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const resetHackerPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Hackers']
    // #swagger.summary = "Endpoint for resetting Hacker passwords"
    try {
        // #swagger.parameters['id'] = {description: "Id of the Hackerthon", required: 'true'}
        // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Takes email, and any other details you send in will be saved as well in a json field", schema: {email: "jondoe@example.com"}}
        const { email } = req.body;
        const hackerthonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Checl if hacker exists
        const hacker = yield client_1.default.hacker.findFirst({
            where: { user: { email }, hackathon: { unique_name: hackerthonId } },
            include: { user: true },
        });
        if (!hacker)
            return (0, responseHandlers_1.errorResponse)(res, 404, "User not found");
        const otp = yield client_1.default.oTP.create({
            data: {
                userId: hacker.user.id,
                expiration: new Date(Date.now() + 30 * 60 * 1000),
                otpCode: (0, randomValue_1.randomValueHex)(6),
            },
        });
        // Send mail
        const response = yield (0, mailHandler_1.sendMail)(email, `${hacker.user.first_name} Your Password Reset link!!`, "reset_password", {
            firstName: hacker.user.first_name,
            code: otp.otpCode,
            email: hacker.user.email,
        });
        if (response.rejected.includes(email))
            // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 403, "Failed to deliver the email to the recipient. Please check the email address.");
        if (response.accepted.includes(email))
            // #swagger.responses[201] = {description: 'User successfully registered for event.', schema: {message: 'Successful Registration. Confirmation mail has been sent to email address.', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.successResponse)(res, 200, "Successful.");
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const resetPasswordCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Hackers']
    // #swagger.summary = "Callback Endpoint for resetting Hacker passwords"
    try {
        // #swagger.parameters['id'] = {description: "Id of the Hackerthon", required: 'true'}
        // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Takes email, and any other details you send in will be saved as well in a json field", schema: {email: "jondoe@example.com"}}
        const { email, code, newPassword } = req.body;
        const hackerthonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Checl if hacker exists
        const hacker = yield client_1.default.hacker.findFirst({
            where: { user: { email }, hackathon: { unique_name: hackerthonId } },
            include: { user: true },
        });
        if (!hacker)
            return (0, responseHandlers_1.errorResponse)(res, 404, "User not found");
        const otp = yield client_1.default.oTP.findFirst({
            where: {
                user: { email },
                otpCode: code,
            },
        });
        if (!otp)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid Code");
        if (new Date() > otp.expiration)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Expired Code");
        if (otp.isUsed)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Code already used");
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
            bcrypt_1.default.hash(newPassword, salt, (err, hashedPassword) => {
                if (err)
                    return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Server Error", {
                        details: "Error hashing password",
                    });
                // Update Hacker in DB
                client_1.default.hacker
                    .update({
                    where: { id: hacker.id },
                    data: { passwordHash: hashedPassword },
                    include: { hackathon: true, user: true, team: true },
                })
                    .then((updatedHacker) => {
                    if (!updatedHacker) {
                        // #swagger.responses[500] = {description: 'Account was not created. Something went wrong', schema: {error: 'Account was not created. Something went wrong', details: "If more info is available it will be here."}}
                        return (0, responseHandlers_1.errorResponse)(res, 500, "Account was not updated. Something went wrong");
                    }
                    // #swagger.responses[201] = {description: 'Hacker account successfully created', schema: {message: 'Successful Registration.', data: {details: "If more info is available it will be here."}}}
                    return (0, responseHandlers_1.successResponse)(res, 200, "Successful");
                })
                    .catch((err) => (0, responseHandlers_1.errorResponse)(res, 500, "could not create hacker", { details: err }));
            });
        });
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const hackers = {
    create,
    login,
    getHacker,
    getHackerCount,
    getLoggedInHacker,
    downloadHackers,
    resetHackerPassword,
    resetPasswordCallback,
};
exports.default = hackers;
