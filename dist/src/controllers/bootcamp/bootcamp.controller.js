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
const validationHandlers_1 = require("../../utils/validationHandlers");
const responseHandlers_1 = require("../../utils/responseHandlers");
const client_1 = __importDefault(require("../../../prisma/client"));
const mailHandler_1 = require("../../utils/mailHandler");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Bootcamp']
    // #swagger.summary = "Endpoint for registering for an the bootcamp"
    try {
        const { firstName, lastName, phoneNumber, email, track, levelOfExperience, reasonForJoining, goals, location, availability, } = req.body;
        // Validate user data
        if (!email || !(0, validationHandlers_1.isValidEmailAddress)(email))
            // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid email address");
        // Validate user data
        if (!firstName || !lastName)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Please fill in your name.");
        if (!phoneNumber)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Please fill in your Phone number.");
        if (!track)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Please select a track.");
        if (!levelOfExperience)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Please select a level of experience.");
        if (yield client_1.default.bootcampApplication.findUnique({ where: { email } }))
            return (0, responseHandlers_1.errorResponse)(res, 400, "User with this email already registered for the bootcamp.");
        const bootcampReg = yield client_1.default.bootcampApplication.create({
            data: {
                FirstName: firstName,
                lastName,
                phoneNumber,
                email,
                track,
                levelOfExperience,
                reasonForJoining,
                goals,
                location,
                availability,
            },
        });
        // Send mail
        const response = yield (0, mailHandler_1.sendMail)(email, `BlockchainUNN Bootcamp Registeration`, "bootcamp_registeration", {} // { firstName: bootcampReg.FirstName, track: bootcampReg.track }
        );
        if (response.rejected.includes(email))
            // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 403, "Failed to deliver the email to the recipient. Please check the email address.");
        if (response.accepted.includes(email))
            // #swagger.responses[201] = {description: 'User successfully registered for event.', schema: {message: 'Successful Registration. Confirmation mail has been sent to email address.', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.successResponse)(res, 201, "Successful Registration. Confirmation mail has been sent to email address");
    }
    catch (error) {
        console.log(error);
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
exports.default = { register };
