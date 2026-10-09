const jwt = require('jsonwebtoken');

const User = require('../models/user');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('./catchAsyncErrors');

const isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
    const authorizationHeader = req.headers.authorization;

    if (
        !authorizationHeader ||
        !authorizationHeader.startsWith('Bearer ')
    ) {
        return next(
            new ErrorHandler("Please log in to access this resourced", 401)
        );
    }

    const token = authorizationHeader.split(" ")[1];

    if (!token) {
        return next(
            new ErrorHandler("Please log in to access this resource", 401)
        );  
    }

    let decodedToken;
    
    try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return next(
            new ErrorHandler("Invalid or expired token. Please log in again.", 401)
        );
    }
    
    const user = await User.findById(decodedToken.id);

    if (!user) {
        return next(
            new ErrorHandler("User not found. Please log in again.", 401)
        );
    }

    req.user = user;

    next();
    }

);

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(
                new ErrorHandler("You are not authorized to access this resource", 403)
            );
        }
        next();
    };
};

const requireVerified = (req, res, next) => {
    if (!req.user.isVerified) {
        return next(
            new ErrorHandler("Please verify your email before using this fearture", 403)
        );
    }
    next();
};

module.exports = {
    isAuthenticatedUser,
    authorizeRoles,
    requireVerified
};