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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleImage = void 0;
const cloudinary_1 = require("cloudinary");
cloudinary_1.v2.config({
    secure: true,
});
const uploadToCloudinary = (buffer, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({
            folder: "bunn",
            public_id: fileName,
            resource_type: "image",
        }, (error, result) => {
            if (result) {
                resolve(result);
            }
            else {
                reject(error);
            }
        });
        // Write the buffer to the stream
        stream.end(buffer);
    });
};
const uploadSingleImage = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileBuffer = file.buffer;
        const originalFileName = file.originalname || "";
        const fileNameWithoutExtension = originalFileName
            .split(".")
            .slice(0, -1)
            .join(".");
        // Generate a custom file name if needed (e.g., append a timestamp)
        const customFileName = `${fileNameWithoutExtension}-${Date.now()}`;
        const result = yield uploadToCloudinary(fileBuffer, customFileName);
        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    }
    catch (error) {
        console.log(error);
        throw error;
    }
});
exports.uploadSingleImage = uploadSingleImage;
