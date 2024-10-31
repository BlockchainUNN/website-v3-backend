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
const getHackers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // #swagger.tags = ['Hackers']
    // #swagger.summary = 'Endpoint for viewing hacker's details'
    var _a;
    try {
        // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
        const hackathonId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get hackers
        const hackers = yield client_1.default.hacker.findMany({
            where: { hackathon: { unique_name: hackathonId } },
            select: {
                id: true,
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
                id: detail.id,
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
        return (0, responseHandlers_1.successResponse)(res, 200, "hackersDetails", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
// const editHacker = async (req: Request, res: Response) => {
//   // #swagger.tags = ['Hackers']
//   // #swagger.summary = 'Endpoint for editing hacker's details'
//   try {
//     // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
//     const hackathonId = req.params?.id;
//     const hackerId = Number(req.params?.hackerId);
//     // Get hackers
//     const hackers = await prisma.hacker.findUnique({
//       where: { id: hackerId },
//       select: {
//         user: {
//           select: {
//             first_name: true,
//             last_name: true,
//             email: true,
//             tech_skills: true,
//             phone_number: true,
//             gender: true,
//           },
//         },
//         role: true,
//         registered_at: true,
//         team: { select: { name: true, created_at: true } },
//       },
//     });
//     const data = hackers.map((detail) => {
//       return {
//         firstName: detail.user.first_name,
//         lastName: detail.user.last_name,
//         email: detail.user.email,
//         phoneNumber: detail.user.phone_number,
//         gender: detail.user.gender,
//         techSkill: detail.user.tech_skills,
//         registeredAt: detail.registered_at,
//         role: detail.role,
//         team: detail.team?.name,
//         teamCreatedAt: detail.team?.created_at,
//       };
//     });
//     // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
//     return cvsResponse(res, 200, "hackersDetails", data);
//   } catch (error) {
//     // Handle error
//     console.log(error);
//     // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
//     return errorResponse(res, 500, "Internal Error", { details: error });
//   }
// };
const hackers = {
    downloadHackers,
    getHackers,
    //   editHacker,
};
exports.default = hackers;
