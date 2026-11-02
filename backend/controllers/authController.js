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

const buildRegistrationAcknowledgementText = (user, verificationCode = null) => {
    const registrationDate = new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const methodLabel =
        user.authSource === "google" ? "Google Identity" : "Email & Password";

    const lines = [
        `Dear ${user.name},`,
        "",
        "Welcome to Aureo Horology Vault.",
        `This email officially acknowledges that your email address (${user.email}) has been registered with Aureo.`,
        "",
        "ACCOUNT REGISTRATION SUMMARY",
        `• Collector Name: ${user.name}`,
        `• Registered Email: ${user.email}`,
        "• Membership Tier: Aureo Private Collector",
        `• Registration Method: ${methodLabel}`,
        `• Date Registered: ${registrationDate}`
    ];

    if (verificationCode) {
        lines.push(
            "",
            "EMAIL VERIFICATION CODE",
            `Your 6-digit Aureo verification code is: ${verificationCode}`,
            `(Valid for ${CODE_EXPIRE_MINUTES} minutes)`
        );
    }

    lines.push(
        "",
        "If you did not register an Aureo account using this email address, please disregard this notice or contact our Geneva & Manila concierge.",
        "",
        "Warm regards,",
        "Aureo Horology Vault • Geneva & Manila"
    );

    return lines.join("\n");
};

const buildRegistrationAcknowledgementHtml = (user, verificationCode = null) => {
    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const registrationDate = new Date(user.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
    const methodLabel =
        user.authSource === "google" ? "Google Identity" : "Email & Password";

    const verificationBlock = verificationCode
        ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#13161c;border:1px solid rgba(201,169,110,0.35);border-radius:10px;margin-bottom:26px;">
                <tr>
                    <td align="center" style="padding:22px 24px;">
                        <div style="font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:#c9a96e;font-weight:700;margin-bottom:8px;">
                            Security Verification Code
                        </div>
                        <div style="font-size:13px;color:#9da3ae;margin-bottom:14px;line-height:1.5;">
                            Enter this 6-digit verification code on the Aureo verification screen to activate full acquisition, appraisal, and atelier privileges:
                        </div>
                        <div style="display:inline-block;padding:12px 28px;background-color:#0b0d10;border:1px solid #c9a96e;border-radius:8px;font-family:'Courier New',monospace;font-size:28px;font-weight:700;letter-spacing:0.32em;color:#f5f2eb;">
                            ${verificationCode}
                        </div>
                        <div style="font-size:11px;color:#737984;margin-top:10px;">
                            This code expires in ${CODE_EXPIRE_MINUTES} minutes.
                        </div>
                    </td>
                </tr>
            </table>
        `
        : "";

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
                                <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;background-color:rgba(201,169,110,0.14);color:#c9a96e;border:1px solid rgba(201,169,110,0.4);">
                                    REGISTERED
                                </span>
                            </td>
                        </tr>
                    </table>
                    <h1 style="margin:14px 0 8px;font-size:26px;font-weight:600;color:#f5f2eb;font-family:Georgia,'Times New Roman',serif;letter-spacing:0.01em;">
                        Account Registration Acknowledged
                    </h1>
                    <p style="margin:0;color:#9da3ae;font-size:14px;line-height:1.6;">
                        Dear <strong style="color:#f5f2eb;">${user.name}</strong>, welcome to Aureo. This email officially acknowledges that an Aureo Collector account has been registered using <strong style="color:#c9a96e;">${user.email}</strong>.
                    </p>
                </td>
            </tr>

            <tr>
                <td style="padding:28px 36px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#13161c;border:1px solid #22262e;border-radius:10px;margin-bottom:26px;">
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
                                <div style="font-size:13px;color:#f5f2eb;font-weight:600;">Aureo Private Collector</div>
                            </td>
                            <td width="50%" valign="top" style="padding:16px 20px;">
                                <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#737984;margin-bottom:5px;">Registration Date &amp; Method</div>
                                <div style="font-size:13px;color:#f5f2eb;font-weight:600;">${registrationDate} <span style="color:#9da3ae;font-weight:400;">(${methodLabel})</span></div>
                            </td>
                        </tr>
                    </table>

                    ${verificationBlock}

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
                                    <strong style="color:#f5f2eb;">Security Notice:</strong> This is an automated registration acknowledgement confirming that <span style="color:#c9a96e;">${user.email}</span> was used to create an account at Aureo Horology Vault. If you did not authorize this registration, please disregard this message or contact our support desk.
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
// Uses a Mongoose transaction for atomic user profile creation and sends a
// luxury Registration Acknowledgement Email (with verification code) via SMTP.
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

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
        return next(new ErrorHandler("Email is already registered", 400));
    }

    let providerUserId = supabaseUserId || null;
    let providerUser = null;
    let authSource = "supabase";

    if (!providerUserId && isSupabaseConfigured() && password) {
        try {
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

                if (existingProviderUser) {
                    providerUser = existingProviderUser;
                    providerUserId = providerUser.id;
                } else {
                    // Fall back to local password storage if Supabase is rate-limited
                    authSource = "local";
                }
            } else if (data?.user) {
                providerUser = data.user;
                providerUserId = providerUser.id;
            }
        } catch {
            authSource = "local";
        }
    } else if (providerUserId && isSupabaseConfigured()) {
        try {
            providerUser = await fetchSupabaseUser(supabaseUserId);
        } catch {
            providerUser = null;
        }
    } else {
        authSource = "local";
    }

    const verificationCode = generateVerificationCode();

    const session = await mongoose.startSession();
    session.startTransaction();

    let user;
    try {
        const userPayload = {
            name: String(name).trim(),
            email: normalizedEmail,
            supabaseUserId: providerUserId,
            authSource: providerUserId ? "supabase" : authSource,
            isVerified: false,
            verificationCodeHash: hashVerificationCode(verificationCode),
            verificationCodeExpiresAt: new Date(
                Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000
            )
        };

        if (!providerUserId && password) {
            userPayload.password = password;
        }

        const [createdUser] = await User.create([userPayload], { session });
        user = createdUser;

        await session.commitTransaction();
    } catch (txError) {
        await session.abortTransaction();
        return next(txError);
    } finally {
        session.endSession();
    }

    await sendEmail({
        to: user.email,
        subject: "Welcome to Aureo Horology Vault — Registration Confirmed",
        text: buildRegistrationAcknowledgementText(user, verificationCode),
        html: buildRegistrationAcknowledgementHtml(user, verificationCode),
        type: "verification",
        relatedId: user._id.toString()
    }).catch((error) => {
        // A missing SMTP provider must not block the registration itself.
        console.error("Registration acknowledgement email could not be sent:", error.message);
    });

    res.status(201).json({
        success: true,
        message: "Registration successful. An acknowledgement email with your verification code has been sent.",
        email: user.email
    });
});

// FR 1.5: Sync the Supabase verification state into the Aureo profile.
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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // FR 1.5: the backend syncs the provider verification state.
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
        await session.abortTransaction();
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

    if (user.isActive === false) {
        return next(
            new ErrorHandler("This account has been deactivated. Please contact support.", 403)
        );
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
            // FR 1.4 / Phase 3.8: never silently rebind a provider identity that
            // already belongs to a different profile.
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
        await session.abortTransaction();
        return next(txError);
    } finally {
        session.endSession();
    }

    if (isNewRegistration && user) {
        await sendEmail({
            to: user.email,
            subject: "Welcome to Aureo Horology Vault — Registration Confirmed",
            text: buildRegistrationAcknowledgementText(user, null),
            html: buildRegistrationAcknowledgementHtml(user, null),
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

// Admin: Create user (FR 1.4 / Full Admin User CRUD)
const createUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password, role, contactNumber, address, isVerified } = req.body;

    if (!name || !email) {
        return next(new ErrorHandler("Name and email are required", 400));
    }

    const normalizedEmail = normalizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        return next(new ErrorHandler("A user with this email already exists", 409));
    }

    const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        password: password || "AureoPass123!",
        role: role === "admin" ? "admin" : "user",
        contactNumber: contactNumber ? String(contactNumber).trim() : "",
        address: address ? String(address).trim() : "",
        isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
        authSource: "local"
    });

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
        success: true,
        message: "User created successfully",
        user: userData
    });
});

// Admin: Update user details & role (FR 1.4 / Full Admin User CRUD)
const updateUserByAdmin = catchAsyncErrors(async (req, res, next) => {
    const { name, email, role, contactNumber, address, isVerified, password } = req.body;

    const user = await User.findById(req.params.id).select("+password");
    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (role !== undefined) {
        if (!["user", "admin"].includes(role)) {
            return next(
                new ErrorHandler("Please provide a valid role ('user' or 'admin')", 400)
            );
        }
        // Protect self-demotion
        if (user._id.toString() === req.user._id.toString() && role !== "admin") {
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
            const conflict = await User.findOne({ email: normalizedEmail });
            if (conflict) {
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
            return next(
                new ErrorHandler("You cannot deactivate your own administrator account", 400)
            );
        }
        user.isActive = Boolean(req.body.isActive);
    }

    if (password && String(password).trim().length >= 8) {
        user.password = String(password).trim();
    }

    await user.save({ validateBeforeSave: false });

    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userData
    });
});

const updateUserRole = updateUserByAdmin;

// Admin: Bulk delete users (Strictly soft delete - no hard delete)
const bulkDeleteUsers = catchAsyncErrors(async (req, res, next) => {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return next(new ErrorHandler("Please provide an array of user IDs", 400));
    }

    // Never allow an admin to deactivate their own account in bulk
    const safeIds = ids.filter((id) => id.toString() !== req.user._id.toString());

    if (safeIds.length === 0) {
        return next(new ErrorHandler("You cannot deactivate your own administrator account", 400));
    }

    const result = await User.updateMany({ _id: { $in: safeIds } }, { isActive: false });

    res.status(200).json({
        success: true,
        message: `${result.modifiedCount} user(s) deactivated (soft deleted) successfully`
    });
});

// Admin: Delete user (Strictly soft delete - no hard delete)
const deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (user._id.toString() === req.user._id.toString()) {
        return next(
            new ErrorHandler("An administrator cannot deactivate their own account", 400)
        );
    }

    user.isActive = false;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "User account deactivated (soft deleted) successfully"
    });
});

// Admin: Permanently delete a deactivated user.
const permanentlyDeleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorHandler("User not found", 404));
    }

    if (user._id.toString() === req.user._id.toString()) {
        return next(new ErrorHandler("An administrator cannot delete their own account", 400));
    }

    if (user.isActive !== false) {
        return next(new ErrorHandler("Only deactivated users can be permanently deleted", 400));
    }

    await User.deleteOne({ _id: user._id });

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
