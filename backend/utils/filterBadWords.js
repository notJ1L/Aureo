const Filter = require("bad-words");

// Unit 1 / FR 6.1: review text is filtered before it is stored so profanity
// never reaches the database. The default blocklist of the package is used.
const badWordFilter = new Filter();

const PLACE_HOLDER = "*";

const cleanText = (text) => {
    if (text === undefined || text === null) {
        return "";
    }

    return badWordFilter.clean(String(text));
};

const containsBadWords = (text) => {
    if (!text) {
        return false;
    }

    return cleanText(text) !== String(text);
};

module.exports = {
    cleanText,
    containsBadWords,
    PLACE_HOLDER
};
