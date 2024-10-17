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
exports.sendMail = sendMail;
const path_1 = __importDefault(require("path"));
const mailer_1 = require("../config/mailer");
const pug_1 = __importDefault(require("pug"));
const juice_1 = __importDefault(require("juice"));
const fs_1 = __importDefault(require("fs"));
const FROM_MAIL = process.env.FROM_MAIL;
function sendMail(to, subject, templateName, options) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Get template file, and css file
            const templatePath = path_1.default.join(__dirname, "../templates", `${templateName}.pug`);
            const cssFile = path_1.default.join(__dirname, "../templates/css", "styles.css");
            const cssFileContents = fs_1.default.readFileSync(cssFile, "utf-8");
            // Send mail
            const templateFunction = pug_1.default.compileFile(templatePath);
            const info = yield mailer_1.transporter.sendMail({
                from: `"The BlockchainUNN Team" <${FROM_MAIL}>`,
                to,
                subject,
                html: juice_1.default.inlineContent(templateFunction(options), cssFileContents), // Juice makes the external css file to be inline.
            });
            return { accepted: info.accepted, rejected: info.rejected };
        }
        catch (error) {
            console.log("Mailling Error ==>> ", error);
            throw error;
        }
    });
}
