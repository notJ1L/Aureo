const User = require("../models/user");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const sendEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");

const {
    generateVerificationCode,
    hashVerificationCode,
    verifyVerificationCode
} = require("../utils/verificationCode");

const registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    if (password.length < 8) {
        return next(new ErrorHandler("Password must be at least 8 characters long", 400));
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        return next(new ErrorHandler("Email is already registered", 400));
    }

    const verificationCode = generateVerificationCode();
    const hashedVerificationCode = hashVerificationCode(verificationCode);

    const expirationMinutes = Number(process.env.VERIFICATION_CODE_EXPIRE_MINUTES || 10);
    
    const verificationCodeExpiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        verificationCodeHash: hashedVerificationCode,
        verificationCodeExpiresAt,
    });

    await sendEmail({
        to: user.email,
        subject: "Your Aureo verification code",
        text: [
            `Hello ${user.name},`,
            "",
            `Your Aureo verification code is: ${verificationCode}`,
            "",
            `This code expires in ${expirationMinutes} minutes.`,
            "",
            "If you did not create an Aureo account, you can ignore this email."
        ].join("\n"),
        type: "verification",
        relatedId: user._id.toString()
    });

    res.status(201).json({
        success: true,
        message: "Registration successful. Check your email for your verification code.",
        email: user.email
    });
});

const verifyEmail = catchAsyncErrors(async (req, res, next) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return next(
            new ErrorHandler(
                "Email and verification code are required",
                400
            )
        );
    }

    if (!/^\d{6}$/.test(code)) {
        return next(
            new ErrorHandler(
                "Verification code must contain six digits",
                400
            )
        );
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    }).select(
        "+verificationCodeHash +verificationCodeExpiresAt"
    );

    if (!user) {
        return next(
            new ErrorHandler(
                "Invalid email or verification code",
                400
            )
        );
    }

    if (user.isVerified) {
        return next(
            new ErrorHandler(
                "This account is already verified",
                400
            )
        );
    }

    if (
        !user.verificationCodeHash ||
        !user.verificationCodeExpiresAt ||
        user.verificationCodeExpiresAt < new Date()
    ) {
        return next(
            new ErrorHandler(
                "Verification code has expired",
                400
            )
        );
    }

    let isCodeValid = false;

    try {
        isCodeValid = verifyVerificationCode(
            code,
            user.verificationCodeHash
        );
    } catch (error) {
        isCodeValid = false;
    }

    if (!isCodeValid) {
        return next(
            new ErrorHandler(
                "Invalid email or verification code",
                400
            )
        );
    }

    user.isVerified = true;
    user.verificationCodeHash = null;
    user.verificationCodeExpiresAt = null;

    await user.save();

    res.status(200).json({
        success: true,
        message: "Email verified successfully"
    });
});

const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(
            new ErrorHandler(
                "Invalid email or password",
                401
            )
        );
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    }).select("+password");

    if (!user) {
        return next(
            new ErrorHandler(
                "Invalid email or password",
                401
            )
        );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
        return next(
            new ErrorHandler(
                "Invalid email or password",
                401
            )
        );
    }

    const token = generateToken(user._id);

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
        success: true,
        token,
        user: userData
    });
});

const getCurrentUser = catchAsyncErrors(async (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});

const logoutUser = catchAsyncErrors(async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
});

const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const allowedFields = [
        "name",
        "contactNumber",
        "address"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    if (updates.name !== undefined) {
        updates.name = updates.name.trim();

        if (!updates.name) {
            return next(
                new ErrorHandler("Name cannot be empty", 400)
            );
        }
    }

    if (Object.keys(updates).length === 0) {
        return next(
            new ErrorHandler(
                "No profile fields were provided",
                400
            )
        );
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        updates,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        success: true,
        user
    });
});

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    getCurrentUser,
    logoutUser,
    updateProfile
};
