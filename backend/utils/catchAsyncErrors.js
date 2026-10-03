const catchAsyncErrors = (controllerFunction) => {
    return (req, res, next) => {
        Promise.resolve(controllerFunction(req, res, next)).catch(next);
    };
};

module.exports = catchAsyncErrors;