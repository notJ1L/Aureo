// Multer reports its own limit and filter problems with a `code` instead of
// a status code. They are all client errors, so they are mapped here.
const MULTER_ERROR_MESSAGES = {
    LIMIT_FILE_SIZE: "Each photo may not exceed 5 MB.",
    LIMIT_FILE_COUNT: "Too many photos were uploaded.",
    LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
    LIMIT_UNEXPECTED_PART: "Unexpected form field.",
    LIMIT_PART_COUNT: "Too many form fields were sent."
};

const errorMiddleware = (err, req, res, next) => {
    if (err && MULTER_ERROR_MESSAGES[err.code]) {
        err.statusCode = 400;
        err.message = MULTER_ERROR_MESSAGES[err.code];
    }

    // A Mongoose validation failure is a client mistake, not a server
    // failure, so it is answered with 400 instead of 500.
    if (err && err.name === "ValidationError") {
        err.statusCode = 400;
        err.message = Object.values(err.errors || {})
            .map((field) => field.message)
            .join(", ") || err.message;
    }

    // An invalid id in the URL is also a client mistake.
    if (err && err.name === "CastError") {
        err.statusCode = 400;
        err.message = `Invalid value for ${err.path}`;
    }

    // A duplicate key violates a unique index.
    if (err && err.code === 11000) {
        err.statusCode = 409;
        err.message = "A record with those details already exists";
    }

    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    console.error(err);

    // Internal failures never reveal their details to the client. The full
    // error is written to the server log above.
    const isServerError = err.statusCode >= 500;
    const message = isServerError
        ? "Something went wrong on the Aureo server. Please try again."
        : err.message;

    res.status(err.statusCode).json({
        success: false,
        message
    });
};

module.exports = errorMiddleware;
