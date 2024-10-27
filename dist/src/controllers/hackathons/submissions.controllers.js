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
const imageUploadHandler_1 = require("../../utils/imageUploadHandler");
const create = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['Submissions']
    // #swagger.summary = "Endpoint for submitting Projects"
    try {
        // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is submitting project in", required: 'true'}
        // #swagger.parameters['teamId'] = {in: "path" ,description: "Id of the team User is in", required: 'true'}
        // #swagger.consumes = ['multipart/form-data']
        // #swagger.parameters['name'] = { in: 'formData', required: 'true'}
        // #swagger.parameters['description'] = { in: 'formData', required: 'true'}
        // #swagger.parameters['category'] = { in: 'formData', required: 'true'}
        // #swagger.parameters['liveLink'] = { in: 'formData', required: 'true'}
        // #swagger.parameters['githubLink'] = { in: 'formData',  required: 'true'}
        // #swagger.parameters['demoVideoLink'] = { in: 'formData',  required: 'true'}
        // #swagger.parameters['documentationLink'] = { in: 'formData', required: 'true'}
        // #swagger.parameters['images'] = { in: 'formData', type: 'file'}
        let { name, description, category, liveLink, githubLink, demoVideoLink, documentationLink, } = req.body;
        const images = req.files;
        const user = req.user;
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        const teamId = Number((_b = req.params) === null || _b === void 0 ? void 0 : _b.teamId);
        // Validate user data
        if (!name ||
            !description ||
            !category ||
            !liveLink ||
            !githubLink ||
            !demoVideoLink ||
            !documentationLink)
            // #swagger.responses[400] = {description: 'Bad request - Missing or invalid credentials', schema: {error: 'All fields are required', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "All fields are required.");
        // Check that user is in team
        const hacker = yield client_1.default.hacker.findFirst({
            where: {
                user: { email: user.email },
                hackathon: { unique_name: hackathonId },
            },
            include: { team: true, hackathon: true },
        });
        if (!hacker)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Path not found", "Possible causes, wrong hackathon id or user is not a participant in the hackathon.");
        if (hacker.team_id !== teamId)
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker is not a member of this team, and can not submit on their behalf");
        // Handle image upload
        const uploadedImages = [];
        if (images) {
            for (let index = 0; index < images.length; index++) {
                const uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(images[index]);
                const uploadedImage_db = yield client_1.default.image.create({
                    data: {
                        name: `Project '${name}' - image ${index} `,
                        image_url: uploadedImage.url,
                        public_id: uploadedImage.public_id,
                    },
                });
                uploadedImages.push(uploadedImage_db);
            }
        }
        // Delete old submissions
        yield client_1.default.submission.deleteMany({
            where: { hackathon: { unique_name: hackathonId }, team_id: teamId },
        });
        // Add submission to database.
        const newSubmission = yield client_1.default.submission.create({
            data: {
                team_id: teamId,
                hackathon_id: hacker.hackathon.id,
                project_name: name,
                project_description: description,
                github_links: githubLink,
                demo_video_link: demoVideoLink,
                live_demo_link: liveLink,
                documentation_link: documentationLink,
            },
        });
        yield client_1.default.submissionImage.createMany({
            // Format image data for submissionImages.
            data: (() => {
                return uploadedImages.map((image) => {
                    return {
                        image_url: image.image_url,
                        submission_id: newSubmission.id,
                    };
                });
            })(),
        });
        // #swagger.responses[201] = {description: 'New Submission created', schema: {message: 'Successful Submission', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 201, "Successful Submission");
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const get = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // #swagger.tags = ['Submissions']
    // #swagger.summary = "Endpoint for getting submitted Projects"
    try {
        // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is submitting project in", required: 'true'}
        // #swagger.parameters['teamId'] = {in: "path" ,description: "Id of the team User is in", required: 'true'}
        const user = req.user;
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        const teamId = Number((_b = req.params) === null || _b === void 0 ? void 0 : _b.teamId);
        // Check that user is in team
        const hacker = yield client_1.default.hacker.findFirst({
            where: {
                user: { email: user.email },
                hackathon: { unique_name: hackathonId },
            },
            include: { team: true, hackathon: true },
        });
        if (!hacker)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Path not found", "Possible causes, wrong hackathon id or user is not a participant in the hackathon.");
        if (hacker.team_id !== teamId)
            // #swagger.responses[400] = {description: 'Bad request - Missing or invalid credentials', schema: {error: 'Hacker is not a member of this team.', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "Hacker is not a member of this team.");
        // GET submission from database.
        const submission = yield client_1.default.submission.findFirst({
            where: { hackathon: { unique_name: hackathonId }, team_id: teamId },
            include: { images: true },
        });
        // #swagger.responses[201] = {description: 'New Submission created', schema: {message: 'Successful Submission', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 201, "Successful", submission);
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const submissions = { create, get };
exports.default = submissions;
