const crypto = require("crypto");

const generateVerificationCode = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

const hashVerificationCode = (code) => {
    return crypto
        .createHash("sha256")
        .update(code)
        .digest("hex");
};

const verifyVerificationCode = (code, storedHash) => {
    const generatedHash = hashVerificationCode(code);

    return crypto.timingSafeEqual(
        Buffer.from(generatedHash, "utf8"),
        Buffer.from(storedHash, "utf8")
    );
};

module.exports = {
    generateVerificationCode,
    hashVerificationCode,
    verifyVerificationCode
};