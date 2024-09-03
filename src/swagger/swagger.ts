import swaggerAutogen from "swagger-autogen";
import { BASE_PATH, HOST } from "../server";
import dotenv from "dotenv";
dotenv.config();

const doc = {
  info: {
    version: "3.1.0",
    title: "BlockchainUNN Website-v3 API",
    description: "API Documentation for BlockchainUNN website version 3",
  },
  host: HOST,
  basePath: BASE_PATH,
  securityDefinitions: {
    apiKeyAuth: {
      type: "apiKey",
      in: "header", // can be 'header', 'query' or 'cookie'
      name: "Authorization", // name of the header, query parameter or cookie
      description: "Authorization: Bearer <token>",
    },
  },
};

const outputFile = "./swagger-output.json";
const routes = ["../server.ts"];

swaggerAutogen()(outputFile, routes, doc);
