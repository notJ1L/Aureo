const catchAsyncErrors = require("../utils/catchAsyncErrors");

const healthCheck = catchAsyncErrors(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Aureo API is running"
    });
});

module.exports = { healthCheck };