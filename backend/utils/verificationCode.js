const crypto = require("crypto");

// Aureo keeps a short lived verification code as a fallback delivery channel.
// Supabase is the primary sender of the verification message, but the fallback
// guarantees the registration flow never dead-ends when the Supabase SMTP
// provider is rate limited or not configured yet.
const CODE_LENGTH = 6;
const CODE_EXPIRE_MINUTES = 10;

const generateVerificationCode = () => {
    const max = 10 ** CODE_LENGTH;

    return String(crypto.randomInt(0, max)).padStart(CODE_LENGTH, "0");
};

const hashVerificationCode = (code) =>
    crypto.createHash("sha256").update(String(code)).digest("hex");

const verifyVerificationCode = (code, storedHash) => {
    if (!code || !storedHash) {
        return false;
    }

    const provided = Buffer.from(hashVerificationCode(code));
    const stored = Buffer.from(String(storedHash));

    if (provided.length !== stored.length) {
        return false;
    }

    return crypto.timingSafeEqual(provided, stored);
};

module.exports = {
    CODE_LENGTH,
    CODE_EXPIRE_MINUTES,
    generateVerificationCode,
    hashVerificationCode,
    verifyVerificationCode
};
