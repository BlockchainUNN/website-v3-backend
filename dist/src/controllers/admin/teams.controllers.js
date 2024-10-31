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
const downloadTeamsData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Teams']
    // #swagger.summary = 'Endpoint for downloading Teams details'
    var _a;
    try {
        // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get teams
        const teams = yield client_1.default.team.findMany({
            where: { hackathon: { unique_name: hackathonId } },
            select: {
                id: true,
                name: true,
                created_at: true,
                submission: {
                    select: {
                        project_name: true,
                        category: true,
                    },
                },
            },
        });
        const data = teams.map((detail) => {
            var _a, _b, _c, _d, _e, _f;
            return {
                id: detail.id,
                name: detail.name,
                projectSubmitted: ((_b = (_a = detail.submission) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.project_name) ? true : false,
                project: (_d = (_c = detail.submission) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.project_name,
                category: (_f = (_e = detail.submission) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.category,
                dateFormed: detail.created_at,
            };
        });
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.cvsResponse)(res, 200, "teamDetails", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const getTeamsData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Teams']
    // #swagger.summary = 'Endpoint for getting Teams details'
    var _a;
    try {
        // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get teams
        const teams = yield client_1.default.team.findMany({
            where: { hackathon: { unique_name: hackathonId } },
            select: {
                id: true,
                name: true,
                created_at: true,
                submission: {
                    select: {
                        project_name: true,
                        category: true,
                    },
                },
            },
        });
        const data = teams.map((detail) => {
            var _a, _b, _c, _d, _e, _f;
            return {
                id: detail.id,
                name: detail.name,
                projectSubmitted: ((_b = (_a = detail.submission) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.project_name) ? true : false,
                project: (_d = (_c = detail.submission) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.project_name,
                category: (_f = (_e = detail.submission) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.category,
                dateFormed: detail.created_at,
            };
        });
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "teamDetails", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const teams = { downloadTeamsData, getTeamsData };
exports.default = teams;
