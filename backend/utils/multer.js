const multer = require("multer");
const ErrorHandler = require("./ErrorHandler");

// FR 3.2: at least one photo is required, at most six, and each file may not
// exceed 5 MB. The files are kept in memory so they can be streamed straight
// to Cloudinary.
const MAX_PHOTOS = 6;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const photoUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_PHOTOS
    },
    fileFilter: (req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(String(file.mimetype).toLowerCase())) {
            return callback(
                new ErrorHandler("Only JPG and PNG photos are allowed", 400)
            );
        }

        callback(null, true);
    }
});

const uploadAppraisalPhotos = photoUpload.array("photos", MAX_PHOTOS);

module.exports = {
    photoUpload,
    uploadAppraisalPhotos,
    MAX_PHOTOS,
    MAX_FILE_SIZE,
    ALLOWED_MIME_TYPES
};
