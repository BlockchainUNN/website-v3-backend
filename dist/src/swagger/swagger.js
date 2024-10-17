"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_autogen_1 = __importDefault(require("swagger-autogen"));
const server_1 = require("../server");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const doc = {
    info: {
        version: "3.1.0",
        title: "BlockchainUNN Website-v3 API",
        description: "API Documentation for BlockchainUNN website version 3",
    },
    host: process.env.EXTERNAL_HOST || server_1.HOST,
    // basePath: BASE_PATH,
    securityDefinitions: {
        apiKeyAuth: {
            type: "apiKey",
            in: "header", // can be 'header', 'query' or 'cookie'
            name: "Authorization", // name of the header, query parameter or cookie
            description: "Authorization: Bearer <token>",
        },
    },
    components: {
        securitySchemes: {
            apiKeyAuth: {
                type: "apiKey",
                in: "header", // can be 'header', 'query' or 'cookie'
                name: "Authorization", // name of the header, query parameter or cookie
                description: "Authorization: Bearer <token>",
            },
        },
    },
};
const outputFile = "./swagger-output.json";
const routes = ["../server.ts"];
(0, swagger_autogen_1.default)()(outputFile, routes, doc);
