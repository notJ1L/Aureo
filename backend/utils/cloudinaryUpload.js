const cloudinary = require("../config/cloudinary");

// Uploads a buffer that Multer kept in memory to Cloudinary and returns the
// { public_id, url } metadata that is stored in MongoDB.
const uploadBuffer = (buffer, folder = "aureo/images") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                quality: "auto"
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    public_id: result.public_id,
                    url: result.secure_url
                });
            }
        );

        stream.end(buffer);
    });
};

// Uploads every file of a Multer request and returns the metadata list.
const uploadFiles = async (files = [], folder = "aureo/images") => {
    const uploaded = [];

    for (const file of files) {
        const metadata = await uploadBuffer(file.buffer, folder);
        uploaded.push(metadata);
    }

    return uploaded;
};

module.exports = { uploadBuffer, uploadFiles };
