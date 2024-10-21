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
const imageUploadHandler_1 = require("../../utils/imageUploadHandler");
const mailHandler_1 = require("../../utils/mailHandler");
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Users']
    // #swagger.summary = "Endpoint for creating/adding members to the community"
    try {
        /*
            #swagger.consumes = ['multipart/form-data']
            #swagger.parameters['email'] = { in: 'formData', required: 'true'}
            #swagger.parameters['firstName'] = { in: 'formData', required: 'true'}
            #swagger.parameters['lastName'] = { in: 'formData', required: 'true'}
            #swagger.parameters['techSkills'] = { in: 'formData', required: 'true', description: 'Comma Seperated list of skills user is intrested in.'}
            #swagger.parameters['phoneNumber'] = { in: 'formData'}
            #swagger.parameters['gender'] = { in: 'formData'}
            #swagger.parameters['profilePic'] = { in: 'formData', type: 'file'}
        */
        let { email, firstName, lastName, techSkills, phoneNumber, gender } = req.body;
        const profilePic = req.file;
        let profilePic_db, uploadedImage;
        // Validate user data
        if (!firstName || !lastName)
            return (0, responseHandlers_1.errorResponse)(res, 400, "First name and Last name are required.");
        if (!email || !(0, validationHandlers_1.isValidEmailAddress)(email))
            /*
                #swagger.responses[400] = {description: 'Bad request - Missing or invalid credentials', schema: {error: 'Invalid email address', data: {details: "If more info is available it will be here."}}}
             */
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid email address");
        if (phoneNumber && !(0, validationHandlers_1.isValidPhoneNumber)(phoneNumber))
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid phone number. Please start with a country code.");
        if (gender.toLowerCase() === "male") {
            gender = "male";
        }
        else if (gender.toLowerCase() === "female") {
            gender = "female";
        }
        else {
            gender = null;
        }
        // Mapping tech skills to comunities
        const techSkillsArr = String(techSkills).toLowerCase().split(",");
        let subCommunities = [];
        if (techSkillsArr.includes("programming"))
            subCommunities = [...subCommunities, "developer"];
        if (techSkillsArr.includes("designing") ||
            techSkills.includes("product management"))
            subCommunities = [...subCommunities, "design"];
        if (techSkillsArr.includes("copywriting") ||
            techSkillsArr.includes("marketing") ||
            techSkillsArr.includes("community management") ||
            techSkills.includes("product management"))
            subCommunities = [...subCommunities, "content"];
        // Check if user with email exists
        const existingUser = yield client_1.default.user.findUnique({
            where: { email: email },
        });
        if (existingUser) {
            // Todo: Update this with the proper email.
            const response = yield (0, mailHandler_1.sendMail)(email, "Welcome Back", "onboarding", {});
            if (response.rejected.includes(email))
                // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
                return (0, responseHandlers_1.errorResponse)(res, 403, "Failed to deliver the email to the recipient. Please check the email address.");
            if (response.accepted.includes(email))
                // #swagger.responses[200] = {description: 'Existing User', schema: {message: 'Email address associated with an existing community member. Community Links have been sent to email address.', data: {details: "If more info is available it will be here."}}}
                return (0, responseHandlers_1.successResponse)(res, 200, "Email address associated with an existing community member. Community Links have been sent to email address.");
        }
        // Handle image upload
        if (profilePic) {
            uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(profilePic);
            profilePic_db = yield client_1.default.image.create({
                data: {
                    name: `${firstName} ${lastName} Profile Picture`,
                    image_url: uploadedImage.url,
                    public_id: uploadedImage.public_id,
                },
            });
        }
        // Add user to database
        const newUser = yield client_1.default.user.create({
            data: {
                email: email,
                first_name: firstName,
                last_name: lastName,
                sub_community: subCommunities,
                tech_skills: techSkillsArr,
                phone_number: phoneNumber,
                gender: gender,
                profile_pic: profilePic_db === null || profilePic_db === void 0 ? void 0 : profilePic_db.id,
            },
        });
        // #swagger.responses[201] = {description: 'New user created', schema: {message: 'Successful Registration. Community Links have been sent to email address.', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 201, "Successful Registration. Community Links have been sent to email address.", {
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            subCommunity: newUser.sub_community,
            techSkills: newUser.tech_skills,
            phoneNumber,
            gender,
            uid: newUser.uid,
            profilePic: profilePic_db === null || profilePic_db === void 0 ? void 0 : profilePic_db.image_url,
        });
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Endpoint for getting list of users'
    // #swagger.security = [{"apiKeyAuth": []}]
    try {
        //to fetch all users
        const users = yield client_1.default.user.findMany();
        // #swagger.responses[200] = {description: 'Get list of users', schema: {message: 'user retrived successfully', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "user retrieved successfully", users);
    }
    catch (error) {
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "An error occurred while fetching users", error);
    }
});
const getUserDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get User details'
    // #swagger.parameters['email'] = { in: 'path', required: 'true'}
    const { email } = req.params;
    try {
        const user = yield client_1.default.user.findUnique({
            where: { email },
        });
        if (!user) {
            // #swagger.responses[404] = {description: 'User not found', schema: {error: 'User not found', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.errorResponse)(res, 404, "User not found");
        }
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: 'User details retrieved succesfully', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "User details retrieved succesfully", user);
    }
    catch (error) {
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
        (0, responseHandlers_1.errorResponse)(res, 500, "An Error occured fetching user details", error);
    }
});
exports.default = { getUsers, getUserDetails, create };
