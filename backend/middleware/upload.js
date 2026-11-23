
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadDir = path.resolve(
    __dirname,
    "../uploads"
);
const allowedTypes = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const extension = allowedTypes[file.mimetype];
        cb(
            null,
            `${randomUUID()}${extension}`
        );
    }
});
const fileFilter = (req, file, cb) => {
    if (!allowedTypes[file.mimetype]) {
        return cb(
            new Error("Only JPG, PNG and WEBP images are allowed")
        );
    }
    cb(null, true);

};
export const upload = multer({storage,fileFilter,limits: {fileSize: 5 * 1024 * 1024}
});
