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
const downloadSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Submissions']
    // #swagger.summary = "Endpoint for downloading User submissions"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get the event
        const submissions = yield client_1.default.submission.findMany({
            where: { hackathon: { unique_name: hackathonId } },
            include: { team: true, images: true },
        });
        if (!submissions)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Hackathon not found");
        const data = submissions.map((detail) => {
            return {
                id: detail.id,
                team: detail.team.name,
                project_name: detail.project_name,
                category: detail.category,
                project_description: detail.project_description,
                github_links: detail.github_links,
                demo_video_link: detail.demo_video_link,
                live_demo_link: detail.live_demo_link,
                documentation_link: detail.documentation_link,
                Images: detail.images.map((img) => img.image_url).join(","),
            };
        });
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.cvsResponse)(res, 200, "hackerSubmissions", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const getSubmissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Submissions']
    // #swagger.summary = "Endpoint for getting User submissions"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get the event
        const submissions = yield client_1.default.submission.findMany({
            where: { hackathon: { unique_name: hackathonId } },
            include: { team: true, images: true },
        });
        if (!submissions)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Hackathon not found");
        const data = submissions.map((detail) => {
            return {
                id: detail.id,
                team: detail.team.name,
                project_name: detail.project_name,
                category: detail.category,
                project_description: detail.project_description,
                github_links: detail.github_links,
                demo_video_link: detail.demo_video_link,
                live_demo_link: detail.live_demo_link,
                documentation_link: detail.documentation_link,
                Images: detail.images.map((img) => img.image_url).join(","),
            };
        });
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "hackerSubmissions", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const submission = { downloadSubmissions, getSubmissions };
exports.default = submission;
