const mongoose = require("mongoose");
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
    verifyVerificationCode
} = require("../utils/verificationCode");

// Every authentication failure must return the same message so the endpoint
// cannot be used to discover which email addresses are registered.
const INVALID_CREDENTIALS = "Invalid email or password";

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const buildRegistrationAcknowledgementText = (user) => {
    const registrationDate = new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const methodLabel =
        user.authSource === "google" ? "Google Identity" : "Email & Password";

    return [
        `Dear ${user.name},`,
        "",
        "Welcome to Aureo Horology Vault.",
        `This email is an official acknowledgement that your email address (${user.email}) has been used to register a Collector account at Aureo.`,
        "",
        "ACCOUNT REGISTRATION ACKNOWLEDGEMENT",
        `• Collector Name: ${user.name}`,
        `• Registered Email: ${user.email}`,
        "• Account Status: Active & Verified Collector",
        "• Membership Tier: Aureo Private Collector",
        `• Registration Method: ${methodLabel}`,
        `• Date Registered: ${registrationDate}`,
        "",
        "Your account is now active. You may browse the collection, acquire timepieces, submit watches for appraisal, and book atelier servicing.",
        "",
        "If you did not register an Aureo account using this email address, please disregard this acknowledgement or contact our Geneva & Manila concierge.",
        "",
        "Warm regards,",
        "Aureo Horology Vault • Geneva & Manila"
    ].join("\n");
};

const buildRegistrationAcknowledgementHtml = (user) => {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const registrationDate = new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const methodLabel =
        user.authSource === "google" ? "Google Identity" : "Email & Password";

    return `
    <div style="margin:0;padding:36px 16px;background-color:#07080a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#f5f2eb;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;margin:0 auto;background-color:#0e1014;border:1px solid #262930;border-top:3px solid #c9a96e;border-radius:12px;overflow:hidden;">
            <tr>
                <td style="padding:32px 36px 24px;border-bottom:1px solid #1b1e24;background:linear-gradient(180deg,#13161c 0%,#0e1014 100%);">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                            <td align="left" valign="middle">
                                <div style="font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#c9a96e;font-weight:700;">
                                    AUREO HOROLOGY VAULT
                                </div>
                            </td>
                            <td align="right" valign="middle">
                                <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background-color:rgba(74,222,128,0.14);color:#4ade80;border:1px solid rgba(74,222,128,0.35);">
                                    REGISTRATION ACKNOWLEDGED
                                </span>
                            </td>
                        </tr>
                    </table>
                    <h1 style="margin:14px 0 8px;font-size:26px;font-weight:600;color:#f5f2eb;font-family:Georgia,'Times New Roman',serif;letter-spacing:0.01em;">
                        Welcome to Aureo Horology Vault
                    </h1>
                    <p style="margin:0;color:#9da3ae;font-size:14px;line-height:1.6;">
                        Dear <strong style="color:#f5f2eb;">${user.name}</strong>, this email officially acknowledges that you have registered an Aureo Collector account using <strong style="color:#c9a96e;">${user.email}</strong>.
                    </p>
                </td>
            </tr>

            <tr>
                <td style="padding:28px 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#13161c;border:1px solid #22262e;border-radius:10px;margin-bottom:24px;">
                        <tr>
                            <td width="50%" valign="top" style="padding:16px 20px;border-bottom:1px solid #1e222a;border-right:1px solid #1e222a;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Collector Name</div>
                                <div style="font-size:13px;color:#f5f2eb;font-weight:600;">${user.name}</div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 20px;border-bottom:1px solid #1e222a;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Registered Email</div>
                                <div style="font-size:13px;color:#c9a96e;font-weight:600;">${user.email}</div>
                            </td>
                        </tr>
                        <tr>
                            <td width="50%" valign="top" style="padding:16px 20px;border-right:1px solid #1e222a;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Membership Tier</div>
                                <div style="font-size:13px;color:#4ade80;font-weight:600;">Active Private Collector</div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 20px;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Registration Date &amp; Method</div>
                                <div style="font-size:13px;color:#f5f2eb;font-weight:600;">${registrationDate} <span style="color:#9da3ae;font-weight:400;">(${methodLabel})</span></div>
                            </td>
                        </tr>
                    </table>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#13161c;border:1px solid rgba(201,169,110,0.28);border-radius:10px;margin-bottom:24px;">
                        <tr>
                            <td style="padding:18px 22px;">
                                <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c9a96e;font-weight:700;margin-bottom:6px;">
                                    Collector Privileges Unlocked
                                </div>
                                <div style="font-size:13px;color:#c8ccd4;line-height:1.6;">
                                    Your Aureo account is ready for immediate use. You can now acquire authenticated timepieces, submit watches for provenance appraisal, and schedule horological servicing.
                                </div>
                            </td>
                        </tr>
                    </table>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                        <tr>
                            <td align="left">
                                <a href="${clientUrl}/catalog" style="display:inline-block;padding:12px 24px;background-color:#c9a96e;color:#0a0b0d;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:6px;">
                                    Explore the Aureo Collection &rarr;
                                </a>
                            </td>
                        </tr>
                    </table>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #1e222a;padding-top:18px;">
                        <tr>
                            <td style="padding-top:16px;">
                                <p style="margin:0 0 8px;font-size:12px;color:#9da3ae;line-height:1.6;">
                                    <strong style="color:#f5f2eb;">Registration Acknowledgement:</strong> This email confirms that <span style="color:#c9a96e;">${user.email}</span> was registered with Aureo Horology Vault. If you did not create this account, please disregard this notice or contact our concierge.
                                </p>
                                <p style="margin:0;font-size:12px;color:#737984;">
                                    Warm regards, <strong style="color:#c9a96e;">Aureo Horology Vault</strong> &bull; Geneva &amp; Manila
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>`;
};

// Confirms the Supabase account so the provider reports the address as verified.
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

// Looks a Supabase identity up by email.
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

// FR 1.1 / FR 1.5: Register a new Aureo Collector account inside a MongoDB
// transaction and send a Registration Acknowledgement Email confirming that
// the email address was registered on Aureo.
const registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, supabaseUserId } = req.body;

    if (!name || !email || (!password && !supabaseUserId)) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }

    if (password && String(password).length < 8) {
        return next(
            new ErrorHandler("Password must be at least 8 characters long", 400)
        );
    }

    const normalizedEmail = normalizeEmail(email);

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        const existingUser = await User.findOne({ email: normalizedEmail }).session(session);

        if (existingUser) {
            await session.abortTransaction();
            return next(new ErrorHandler("Email is already registered", 400));
        }

        const userPayload = {
            name: String(name).trim(),
            email: normalizedEmail,
            supabaseUserId: supabaseUserId || null,
            authSource: supabaseUserId ? "supabase" : "local",
            isVerified: true,
            verificationCodeHash: null,
            verificationCodeExpiresAt: null
        };

        if (password) {
            userPayload.password = password;
        }

        const [createdUser] = await User.create([userPayload], { session });
        user = createdUser;

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    await sendEmail({
        to: user.email,
        subject: "Welcome to Aureo Horology Vault — Registration Acknowledgement",
        text: buildRegistrationAcknowledgementText(user),
        html: buildRegistrationAcknowledgementHtml(user),
        type: "registration",
        relatedId: user._id.toString()
    }).catch((error) => {
        console.error("Registration acknowledgement email could not be sent:", error.message);
    });

    const token = generateToken(user._id);
    const userData = user.toObject();
    delete userData.password;
    delete userData.supabaseUserId;
    delete userData.googleId;

    res.status(201).json({
        success: true,
        message: "Registration successful. An acknowledgement email has been sent to your email address.",
        email: user.email,
        token,
        user: userData
    });
});

// FR 1.5: Sync verification state into the Aureo profile inside a transaction.
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
        codeAccepted = Boolean(providerUser.email_confirmed_at);
    } else {
        if (!/^\d{6}$/.test(String(code || ""))) {
            return next(
                new ErrorHandler("Verification code must contain six digits", 400)
            );
        }

        const normalizedEmail = normalizeEmail(email);

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

    if (providerUser && !providerUser.email_confirmed_at && providerUser.id) {
        providerUser =
            (await confirmSupabaseAccount(providerUser.id)) || providerUser;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findOne({
            $or: [
                { email: normalizeEmail(providerUser?.email || email) },
                ...(providerUser?.id ? [{ supabaseUserId: providerUser.id }] : [])
            ]
        }).session(session);

        if (!user) {
            await session.abortTransaction();
            return next(
                new ErrorHandler("No Aureo account exists for this email address", 404)
            );
        }

        if (providerUser?.id && !user.supabaseUserId) {
            user.supabaseUserId = providerUser.id;
        }

        if (user.authSource === "local" && user.supabaseUserId) {
            user.authSource = "supabase";
        }

        user.isVerified = true;
        user.verificationCodeHash = null;
        user.verificationCodeExpiresAt = null;

        await user.save({ session });
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "Email verified successfully"
    });
});

// FR 1.1 / FR 1.4: Sign in with email + password.
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

        // Check local password hash first if present on the user document
        if (user.password) {
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
            }
        } else if (user.authSource === "local") {
            return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
        } else {
            if (!isSupabaseConfigured()) {
                return next(
                    new ErrorHandler(
                        "Email and password sign-in is temporarily unavailable",
                        503
                    )
                );
            }

            try {
                const anon = getSupabaseAnon();
                let { data, error } = await anon.auth.signInWithPassword({
                    email: normalizedEmail,
                    password
                });

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
            } catch {
                return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
            }
        }
    }

    if (!user) {
        return next(new ErrorHandler(INVALID_CREDENTIALS, 401));
    }

    if (user.isActive === false) {
        return next(
            new ErrorHandler("This account has been deactivated. Please contact support.", 403)
        );
    }

    if (providerUser) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const conflictingLink = await User.findOne({
                _id: { $ne: user._id },
                $or: [
                    { email: normalizeEmail(providerUser.email) },
                    { supabaseUserId: providerUser.id }
                ]
            }).session(session);

            if (conflictingLink) {
                await session.abortTransaction();
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

            await user.save({ session });
            await session.commitTransaction();
        } catch (txError) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            return next(txError);
        } finally {
            session.endSession();
        }
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

// FR 1.2: The user may only edit their own profile inside a transaction.
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            {
                new: true,
                runValidators: true,
                session
            }
        );

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        user
    });
});

// FR 1.1 / Quiz 4: Google sign-in through Firebase inside a transaction.
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    let isNewRegistration = false;
    try {
        user = await User.findOne({
            $or: [{ email: normalizedEmail }, { googleId: uid }]
        })
            .select("+googleId")
            .session(session);

        if (user) {
            if (user.googleId && user.googleId !== uid) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler(
                        "This Google account is already linked to a different Aureo profile",
                        409
                    )
                );
            }

            if (!user.googleId) {
                user.googleId = uid;
                await user.save({ session, validateBeforeSave: false });
            }
        } else {
            const conflictingEmail = await User.findOne({ email: normalizedEmail }).session(session);

            if (conflictingEmail) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler(
                        "This email is already registered with another sign-in method",
                        409
                    )
                );
            }

            const [createdUser] = await User.create(
                [
                    {
                        name: name || "Aureo User",
                        email: normalizedEmail,
                        authSource: "google",
                        isVerified: true,
                        googleId: uid,
                        avatar: picture
                            ? { public_id: "", url: picture }
                            : { public_id: "", url: "" }
                    }
                ],
                { session }
            );
            user = createdUser;
            isNewRegistration = true;
        }

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    if (isNewRegistration && user) {
        await sendEmail({
            to: user.email,
            subject: "Welcome to Aureo Horology Vault — Registration Acknowledgement",
            text: buildRegistrationAcknowledgementText(user),
            html: buildRegistrationAcknowledgementHtml(user),
            type: "registration",
            relatedId: user._id.toString()
        }).catch((error) => {
            console.error("Google registration acknowledgement email could not be sent:", error.message);
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

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        user = await User.findById(req.user._id).session(session);

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

        await user.save({ session, validateBeforeSave: false });
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        avatar: user.avatar
    });
});

// Admin: Get all users (FR 1.4)
const getAllUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        users,
        total: users.length
    });
});

// Admin: Get single user details (FR 1.4)
const getSingleUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
        success: true,
        user
    });
});

// Admin: Create user (FR 1.4 / Full Admin User CRUD) inside a transaction
const createUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, role, contactNumber, address, isVerified } = req.body;

    if (!name || !email) {
        return next(new ErrorHandler("Name and email are required", 400));
    }

    const normalizedEmail = normalizeEmail(email);

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        const existingUser = await User.findOne({ email: normalizedEmail }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            return next(new ErrorHandler("A user with this email already exists", 409));
        }

        const [createdUser] = await User.create(
            [
                {
                    name: String(name).trim(),
                    email: normalizedEmail,
                    password: password || "AureoPass123!",
                    role: role === "admin" ? "admin" : "user",
                    contactNumber: contactNumber ? String(contactNumber).trim() : "",
                    address: address ? String(address).trim() : "",
                    isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
                    authSource: "local"
                }
            ],
            { session }
        );
        user = createdUser;

        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
        success: true,
        message: "User created successfully",
        user: userData
    });
});

// Admin: Update user details & role (FR 1.4 / Full Admin User CRUD) inside a transaction
const updateUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { name, email, role, contactNumber, address, isVerified, password } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        user = await User.findById(req.params.id).select("+password").session(session);
        if (!user) {
            await session.abortTransaction();
            return next(new ErrorHandler("User not found", 404));
        }

        if (role !== undefined) {
            if (!["user", "admin"].includes(role)) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler("Please provide a valid role ('user' or 'admin')", 400)
                );
            }
            if (user._id.toString() === req.user._id.toString() && role !== "admin") {
                await session.abortTransaction();
                return next(
                    new ErrorHandler("You cannot remove your own administrator role", 400)
                );
            }
            user.role = role;
        }

        if (name) {
            user.name = String(name).trim();
        }

        if (email) {
            const normalizedEmail = normalizeEmail(email);
            if (normalizedEmail !== user.email) {
                const conflict = await User.findOne({ email: normalizedEmail }).session(session);
                if (conflict) {
                    await session.abortTransaction();
                    return next(new ErrorHandler("Email is already taken by another account", 409));
                }
                user.email = normalizedEmail;
            }
        }

        if (contactNumber !== undefined) {
            user.contactNumber = String(contactNumber).trim();
        }

        if (address !== undefined) {
            user.address = String(address).trim();
        }

        if (isVerified !== undefined) {
            user.isVerified = Boolean(isVerified);
        }

        if (req.body.isActive !== undefined) {
            if (user._id.toString() === req.user._id.toString() && !req.body.isActive) {
                await session.abortTransaction();
                return next(
                    new ErrorHandler("You cannot deactivate your own administrator account", 400)
                );
            }
            user.isActive = Boolean(req.body.isActive);
        }

        if (password && String(password).trim().length >= 8) {
            user.password = String(password).trim();
        }

        await user.save({ session, validateBeforeSave: false });
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userData
    });
});

const updateUserRole = updateUserByAdmin;

// Admin: Bulk delete users (Strictly soft delete - no hard delete) inside a transaction
const bulkDeleteUsers = catchAsyncErrors(async (req, res, next) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return next(new ErrorHandler("Please provide an array of user IDs", 400));
    }

    const safeIds = ids.filter((id) => id.toString() !== req.user._id.toString());

    if (safeIds.length === 0) {
        return next(new ErrorHandler("You cannot deactivate your own administrator account", 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let result;
    try {
        result = await User.updateMany(
            { _id: { $in: safeIds } },
            { isActive: false },
            { session }
        );
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} user(s) deactivated (soft deleted) successfully`
    });
});

// Admin: Delete user (Strictly soft delete - no hard delete) inside a transaction
const deleteUser = catchAsyncErrors(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(req.params.id).session(session);

        if (!user) {
            await session.abortTransaction();
            return next(new ErrorHandler("User not found", 404));
        }

        if (user._id.toString() === req.user._id.toString()) {
            await session.abortTransaction();
            return next(
                new ErrorHandler("An administrator cannot deactivate their own account", 400)
            );
        }

        user.isActive = false;
        await user.save({ session, validateBeforeSave: false });
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "User account deactivated (soft deleted) successfully"
    });
});

// Admin: Permanently delete a deactivated user inside a transaction
const permanentlyDeleteUser = catchAsyncErrors(async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const user = await User.findById(req.params.id).session(session);

        if (!user) {
            await session.abortTransaction();
            return next(new ErrorHandler("User not found", 404));
        }

        if (user._id.toString() === req.user._id.toString()) {
            await session.abortTransaction();
            return next(new ErrorHandler("An administrator cannot delete their own account", 400));
        }

        if (user.isActive !== false) {
            await session.abortTransaction();
            return next(new ErrorHandler("Only deactivated users can be permanently deleted", 400));
        }

        await User.deleteOne({ _id: user._id }).session(session);
        await session.commitTransaction();
    } catch (txError) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        return next(txError);
    } finally {
        session.endSession();
    }

    res.status(200).json({
        success: true,
        message: "User permanently deleted"
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
    uploadAvatar,
    getAllUsers,
    getSingleUser,
    createUserByAdmin,
    updateUserByAdmin,
    updateUserRole,
    bulkDeleteUsers,
    deleteUser,
    permanentlyDeleteUser
};
