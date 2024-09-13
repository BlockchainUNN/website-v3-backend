import { v2 as cloudinary } from "cloudinary";
import { FileType } from "../types/files.types";

cloudinary.config({
  secure: true,
});

const uploadToCloudinary = (buffer: Buffer, fileName: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bunn",
        public_id: fileName,
        resource_type: "image",
      },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    // Write the buffer to the stream
    stream.end(buffer);
  });
};

export const uploadSingleImage = async (file: FileType) => {
  try {
    const fileBuffer = file.buffer;
    const originalFileName = file.originalname || "";
    const fileNameWithoutExtension = originalFileName
      .split(".")
      .slice(0, -1)
      .join(".");

    // Generate a custom file name if needed (e.g., append a timestamp)
    const customFileName = `${fileNameWithoutExtension}-${Date.now()}`;
    const result = await uploadToCloudinary(fileBuffer, customFileName);

    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};
