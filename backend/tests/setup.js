const mongoose = require("mongoose");
const { connectDB } = require("../config/db");

// firebase-admin pulls in ESM only dependencies that Jest cannot require in a
// CommonJS test run, so the Google identity provider is mocked. The mocked
// token is deterministic, which keeps the Google sign-in test stable.
jest.mock("../config/firebase", () => ({
    getAuth: () => ({
        verifyIdToken: jest.fn(async () => ({
            uid: "firebase-test-uid",
            email: "google@example.com",
            name: "Google Tester",
            picture: "https://example.com/avatar.jpg"
        }))
    })
}));

const clearDatabase = async () => {
    const { collections } = mongoose.connection;

    await Promise.all(
        Object.values(collections).map((collection) => collection.deleteMany({}))
    );
};

beforeAll(async () => {
    await connectDB();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await mongoose.connection.close();
});

module.exports = { clearDatabase };
