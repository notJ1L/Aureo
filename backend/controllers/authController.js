const User = require("../models/user");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../utils/catchAsyncErrors");
const sendEmail = require("../utils/sendEmail");
const generateToken = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");
const { getAuth } = require("../config/firebase");
const {
    getSupabaseAdmin,
    getSupabaseAnon,
    isSupabaseConfigured
} = require("../config/supabase");
const {
    generateVerificationCode,
    hashVerificationCode,
    verifyVerificationCode,
    CODE_EXPIRE_MINUTES
} = require("../utils/verificationCode");

// Every authentication failure must return the same message so the endpoint
// cannot be used to discover which email addresses are registered.
const INVALID_CREDENTIALS = "Invalid email or password";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const getSupabaseErrorMessage = (error) => {
    const message = error?.message || "Authentication provider error";

    if (/already|registered|exists|duplicate/i.test(message)) {
        return "Email is already registered";
    }

    if (/invalid login credentials/i.test(message)) {
        return INVALID_CREDENTIALS;
    }

    return message;
};

// Confirms the Supabase account so the provider reports the address as
// verified. Used after Aureo accepted a verification code.
const confirmSupabaseAccount = async (supabaseUserId) => {
    const admin = getSupabaseAdmin();

    const { data } = await admin.auth.admin.updateUserById(supabaseUserId, {
        email_confirm: true
    });

    return data?.user || null;
};

// Reads the current provider state for a user.
const fetchSupabaseUser = async (supabaseUserId) => {
    if (!supabaseUserId) {
        return null;
    }

    const admin = getSupabaseAdmin();
    const { data } = await admin.auth.admin.getUserById(supabaseUserId);

    return data?.user || null;
};

// Looks a Supabase identity up by email. The admin API has no email filter,
// so the user list is scanned page by page.
const findSupabaseUserByEmail = async (email) => {
    const admin = getSupabaseAdmin();
    const normalized = normalizeEmail(email);

    for (let page = 1; page <= 10; page += 1) {
        const { data, error } = await admin.auth.admin.listUsers({
            page,
            perPage: 200
        });

        if (error || !data?.users?.length) {
            break;
        }

        const match = data.users.find(
            (candidate) => normalizeEmail(candidate.email) === normalized
        );

        if (match) {
            return match;
        }

        if (data.users.length < 200) {
            break;
        }
    }

    return null;
};

// FR 1.1 / FR 1.5: Register with Supabase email/password identity.
// The password is created inside Supabase and is never stored in MongoDB.
// Aureo only keeps the provider identity id and the profile.
const registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, supabaseUserId } = req.body;

    if (!name || !email || !password) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    if (String(password).length < 8) {
        return next(
            new ErrorHandler("Password must be at least 8 characters long", 400)
        );
    }

    if (!isSupabaseConfigured()) {
        return next(
            new ErrorHandler(
                "Email and password registration is temporarily unavailable",
                503
            )
        );
    }

    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        return next(new ErrorHandler("Email is already registered", 400));
    }

    let providerUserId = supabaseUserId;
    let providerUser = null;

    // When the client already created the Supabase identity we only link it.
    // Otherwise the backend creates it through the Supabase Admin API. An
    // identity that already exists in Supabase is linked instead of rejected,
    // the duplicate check above is what protects the Aureo profile.
    if (!providerUserId) {
        const admin = getSupabaseAdmin();

        const { data, error } = await admin.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: false,
            user_metadata: { name: String(name).trim() }
        });

        if (error) {
            const existingProviderUser = await findSupabaseUserByEmail(
                normalizedEmail
            );

            if (!existingProviderUser) {
                return next(new ErrorHandler(getSupabaseErrorMessage(error), 400));
            }

            providerUser = existingProviderUser;
        } else {
            providerUser = data.user;
        }

        providerUserId = providerUser.id;
    } else {
        providerUser = await fetchSupabaseUser(supabaseUserId);
    }

    // Fallback verification code. Supabase sends its own verification message,
    // this guarantees the user always receives a usable code.
    const verificationCode = generateVerificationCode();

    const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        supabaseUserId: providerUserId,
        authSource: "supabase",
        isVerified: false,
        verificationCodeHash: hashVerificationCode(verificationCode),
        verificationCodeExpiresAt: new Date(
            Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000
        )
    });

    await sendEmail({
        to: user.email,
        subject: "Your Aureo verification code",
        text: [
            `Hello ${user.name},`,
            "",
            `Your Aureo verification code is: ${verificationCode}`,
            "",
            `This code expires in ${CODE_EXPIRE_MINUTES} minutes.`,
            "",
            "If you did not create an Aureo account, you can ignore this email."
        ].join("\n"),
        type: "verification",
        relatedId: user._id.toString()
    }).catch((error) => {
        // A missing SMTP provider must not block the registration itself.
        console.error("Verification email could not be sent:", error.message);
    });

    res.status(201).json({
        success: true,
        message: "Registration successful. Check your email for your verification code.",
        email: user.email
    });
});

// FR 1.5: Sync the Supabase verification state into the Aureo profile.
// The code is validated by Supabase (primary channel) or by the Aureo
// fallback code. Either way the Supabase account ends up confirmed and the
// backend re-reads the provider state before it flips the Aureo flag.
const verifyEmail = catchAsyncErrors(async (req, res, next) => {
    const { email, code, accessToken } = req.body;

    if (!email && !accessToken) {
        return next(
            new ErrorHandler(
                "Email and verification code are required",
                400
            )
        );
    }

    let providerUser = null;
    let codeAccepted = false;

    if (accessToken) {
        const admin = getSupabaseAdmin();
        const { data, error } = await admin.auth.getUser(accessToken);

        if (error || !data?.user) {
            return next(
                new ErrorHandler("Invalid or expired verification code", 400)
            );
        }

        providerUser = data.user;

        // A session only exists once the address was confirmed, so the
        // provider already accepted the code.
        codeAccepted = Boolean(providerUser.email_confirmed_at);
    } else {
        if (!/^\d{6}$/.test(String(code || ""))) {
            return next(
                new ErrorHandler("Verification code must contain six digits", 400)
            );
        }

        const normalizedEmail = normalizeEmail(email);

        // Primary channel: let Supabase validate the code it sent.
        try {
            const anon = getSupabaseAnon();
            const { data, error } = await anon.auth.verifyOtp({
                email: normalizedEmail,
                token: String(code).trim(),
                type: "email"
            });

            if (!error && data?.user) {
                providerUser = data.user;
                codeAccepted = true;
            }
        } catch {
            // fall through to the Aureo fallback code
        }

        if (!codeAccepted) {
            // Fallback channel: validate the Aureo fallback code.
            const user = await User.findOne({ email: normalizedEmail }).select(
                "+verificationCodeHash +verificationCodeExpiresAt +supabaseUserId"
            );

            if (!user) {
                return next(
                    new ErrorHandler("Invalid or expired verification code", 400)
                );
            }

            const isCodeValid =
                Boolean(user.verificationCodeHash) &&
                Boolean(user.verificationCodeExpiresAt) &&
                user.verificationCodeExpiresAt > new Date() &&
                verifyVerificationCode(code, user.verificationCodeHash);

            if (!isCodeValid) {
                return next(
                    new ErrorHandler("Invalid or expired verification code", 400)
                );
            }

            codeAccepted = true;
            providerUser = await fetchSupabaseUser(user.supabaseUserId);
        }
    }

    if (!codeAccepted) {
        return next(new ErrorHandler("Invalid or expired verification code", 400));
    }

    // Make sure the Supabase account is confirmed as well.
    if (providerUser && !providerUser.email_confirmed_at && providerUser.id) {
        providerUser =
            (await confirmSupabaseAccount(providerUser.id)) || providerUser;
    }

    // FR 1.5: the backend syncs the provider verification state.
    const user = await User.findOne({
        $or: [
            { email: normalizeEmail(providerUser?.email || email) },
            ...(providerUser?.id ? [{ supabaseUserId: providerUser.id }] : [])
        ]
    });

    if (!user) {
        return next(
            new ErrorHandler("No Aureo account exists for this email address", 404)
        );
    }

    if (providerUser?.id && !user.supabaseUserId) {
        user.supabaseUserId = providerUser.id;
    }

    if (user.authSource === "local") {
        user.authSource = "supabase";
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

// FR 1.1 / FR 1.4: Sign in with email + password.
// Accepts a Supabase access token (client signed in) or raw credentials.
const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password, accessToken } = req.body;

    if (!email && !accessToken) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    let user = null;
    let providerUser = null;

    if (accessToken) {
        const admin = getSupabaseAdmin();
        const { data, error } = await admin.auth.getUser(accessToken);

        if (error || !data?.user) {
            return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
        }

        providerUser = data.user;
        user = await User.findOne({
            $or: [
                { email: normalizeEmail(providerUser.email) },
                { supabaseUserId: providerUser.id }
            ]
        });
    } else {
        if (!password) {
            return next(new ErrorHandler("Please provide all required fields", 400));
        }

        const normalizedEmail = normalizeEmail(email);
        user = await User.findOne({ email: normalizedEmail }).select(
            "+password +supabaseUserId"
        );

        if (!user) {
            return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
        }

        if (user.authSource === "google") {
            return next(
                new ErrorHandler("Please sign in with Google to continue", 401)
            );
        }

        if (user.authSource === "local") {
            // Locally seeded account (the administrator created by the seeder).
            const isPasswordValid = await user.comparePassword(password);

            if (!isPasswordValid) {
                return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
            }
        } else {
            if (!isSupabaseConfigured()) {
                return next(
                    new ErrorHandler(
                        "Email and password sign-in is temporarily unavailable",
                        503
                    )
                );
            }

            const anon = getSupabaseAnon();
            let { data, error } = await anon.auth.signInWithPassword({
                email: normalizedEmail,
                password
            });

            // FR 1.5: an unverified user is still allowed to sign in, they are
            // only blocked from ordering, appraisals and tickets. Supabase
            // refuses the sign-in while the address is unconfirmed, so the
            // provider state is confirmed and the Aureo `isVerified` flag is
            // kept untouched until the verification code is accepted.
            if (error && error.code === "email_not_confirmed" && user.supabaseUserId) {
                await confirmSupabaseAccount(user.supabaseUserId);

                const retry = await anon.auth.signInWithPassword({
                    email: normalizedEmail,
                    password
                });

                data = retry.data;
                error = retry.error;
            }

            if (error || !data?.user) {
                return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
            }

            providerUser = data.user;
        }
    }

    if (!user) {
        return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
    }

    // Link the provider identity on first successful sign-in.
    if (providerUser) {
        const conflictingLink = await User.findOne({
            _id: { $ne: user._id },
            $or: [
                { email: normalizeEmail(providerUser.email) },
                { supabaseUserId: providerUser.id }
            ]
        });

        if (conflictingLink) {
            return next(
                new ErrorHandler(
                    "This account is already linked to a different Aureo profile",
                    409
                )
            );
        }

        if (!user.supabaseUserId) {
            user.supabaseUserId = providerUser.id;
        }

        if (user.authSource === "local") {
            user.authSource = "supabase";
        }

        // FR 1.5: the Aureo `isVerified` flag is only raised by the
        // verification endpoint, which requires a valid code. Signing in never
        // verifies the account on its own, so an unverified user stays blocked
        // from orders, appraisals and tickets.
        await user.save();
    }

    const token = generateToken(user._id);

    const userData = user.toObject();
    delete userData.password;
    delete userData.supabaseUserId;
    delete userData.googleId;

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

// FR 1.2: The user may only edit their own profile. Email and role are
// intentionally not editable.
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

// FR 1.1 / Quiz 4: Google sign-in through Firebase.
const googleLogin = catchAsyncErrors(async (req, res, next) => {
    const { idToken } = req.body;

    if (!idToken) {
        return next(new ErrorHandler("Firebase ID token is required", 400));
    }

    let decodedToken;
    try {
        decodedToken = await getAuth().verifyIdToken(idToken);
    } catch {
        return next(new ErrorHandler("Invalid or expired Google token", 401));
    }

    const { uid, email, name, picture } = decodedToken;

    if (!email) {
        return next(new ErrorHandler("Google account has no email", 400));
    }

    const normalizedEmail = normalizeEmail(email);

    let user = await User.findOne({
        $or: [{ email: normalizedEmail }, { googleId: uid }]
    }).select("+googleId");

    if (user) {
        // FR 1.4 / Phase 3.8: never silently rebind a provider identity that
        // already belongs to a different profile.
        if (user.googleId && user.googleId !== uid) {
            return next(
                new ErrorHandler(
                    "This Google account is already linked to a different Aureo profile",
                    409
                )
            );
        }

        if (!user.googleId) {
            user.googleId = uid;
            await user.save({ validateBeforeSave: false });
        }
    } else {
        const conflictingEmail = await User.findOne({ email: normalizedEmail });

        if (conflictingEmail) {
            return next(
                new ErrorHandler(
                    "This email is already registered with another sign-in method",
                    409
                )
            );
        }

        user = await User.create({
            name: name || "Aureo User",
            email: normalizedEmail,
            authSource: "google",
            isVerified: true,
            googleId: uid,
            avatar: picture
                ? { public_id: "", url: picture }
                : { public_id: "", url: "" }
        });
    }

    const token = generateToken(user._id);

    const userData = user.toObject();
    delete userData.password;
    delete userData.googleId;
    delete userData.supabaseUserId;

    res.status(200).json({ success: true, token, user: userData });
});

// FR 1.3: Profile photo upload. JPG / PNG only, maximum 2 MB.
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/jpg", "image/png"];

const uploadAvatar = catchAsyncErrors(async (req, res, next) => {
    const { avatar } = req.body;

    if (!avatar) {
        return next(new ErrorHandler("No image provided", 400));
    }

    if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
        return next(
            new ErrorHandler("Profile photo must be a JPG or PNG image", 400)
        );
    }

    const mimeMatch = avatar.match(/^data:(image\/[a-z+]+);base64,/i);

    if (!mimeMatch || !ALLOWED_AVATAR_TYPES.includes(mimeMatch[1].toLowerCase())) {
        return next(
            new ErrorHandler("Profile photo must be a JPG or PNG image", 400)
        );
    }

    const base64Payload = avatar.split(",")[1] || "";
    const sizeInBytes = Buffer.byteLength(base64Payload, "base64");

    if (sizeInBytes > MAX_AVATAR_BYTES) {
        return next(
            new ErrorHandler("Profile photo cannot exceed 2 MB", 400)
        );
    }

    const user = await User.findById(req.user._id);

    if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    const result = await cloudinary.uploader.upload(avatar, {
        folder: "aureo/avatars",
        width: 400,
        crop: "fill",
        gravity: "face"
    });

    user.avatar = {
        public_id: result.public_id,
        url: result.secure_url
    };

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        avatar: user.avatar
    });
});

module.exports = {
    registerUser,
    verifyEmail,
    loginUser,
    googleLogin,
    getCurrentUser,
    logoutUser,
    updateProfile,
    uploadAvatar
};
