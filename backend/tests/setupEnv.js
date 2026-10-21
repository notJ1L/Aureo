const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", "config", ".env") });

// The test suite runs against a separate database so a test run can never
// touch the development data.
const TEST_DB_NAME = "aureo_test";

// Rewrites a MongoDB connection string so it points at the given database.
// The database segment of the connection string is always replaced, and a
// connection string without a database segment gets one.
const withDatabase = (uri, databaseName) => {
    const [base, query] = String(uri).split("?");

    const match = base.match(/^(mongodb(?:\+srv)?:\/\/[^/]+)(?:\/.*)?$/);

    if (!match) {
        return uri;
    }

    const host = match[1];

    return query ? `${host}/${databaseName}?${query}` : `${host}/${databaseName}`;
};

const TEST_MONGO_URI = withDatabase(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017/aureo",
    TEST_DB_NAME
);

process.env.MONGO_URI = TEST_MONGO_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET || "aureo-test-secret";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

module.exports = { TEST_DB_NAME, TEST_MONGO_URI, withDatabase };
