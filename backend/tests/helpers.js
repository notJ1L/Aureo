const request = require("supertest");
const app = require("../app");
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const Review = require("../models/review");
const EmailLog = require("../models/emailLog");
const Service = require("../models/service");
const Ticket = require("../models/ticket");
const Appraisal = require("../models/appraisal");
const ChatHistory = require("../models/chatHistory");
const generateToken = require("../utils/generateToken");

// Helpers shared by the test suites.

const createUser = async ({
    name = "Test Collector",
    email = "collector@example.com",
    password = "StrongPass123",
    role = "user",
    isVerified = true
} = {}) => {
    return User.create({
        name,
        email,
        password,
        role,
        isVerified,
        authSource: "local"
    });
};

const createAdmin = (overrides = {}) =>
    createUser({
        name: "Test Admin",
        email: "admin@example.com",
        role: "admin",
        ...overrides
    });

const createProduct = (overrides = {}) =>
    Product.create({
        name: "Test Timepiece",
        brand: "Aureo",
        category: "dress",
        movement: "automatic",
        caseSize: 40,
        condition: "new",
        price: 25000,
        description: "A watch used by the automated test suite.",
        images: [{ public_id: "test", url: "https://example.com/watch.jpg" }],
        stock: 5,
        isActive: true,
        ...overrides
    });

// Creates an order the way the real checkout does: the item snapshot takes the
// product name and price and the stock is reduced.
const createOrder = async (user, overrides = {}) => {
    const quantity = overrides.quantity || 1;
    const product = await Product.findById(overrides.productId);

    if (product && overrides.decrementStock !== false) {
        await Product.findByIdAndUpdate(product._id, {
            $inc: { stock: -quantity }
        });
    }

    return Order.create({
        user: user._id,
        orderItems: [
            {
                product: overrides.productId,
                name: overrides.name || product?.name || "Test Timepiece",
                price: overrides.price ?? product?.price ?? 25000,
                quantity,
                image: "https://example.com/watch.jpg"
            }
        ],
        shippingInfo: {
            address: "12 Aureo Street",
            city: "Manila",
            postalCode: "1000",
            country: "Philippines",
            phone: "09171234567"
        },
        paymentMethod: overrides.paymentMethod || "Cash",
        paymentStatus: overrides.paymentStatus || "Pending",
        status: overrides.status || "Pending",
        statusHistory: [{ status: overrides.status || "Pending", changedAt: new Date() }],
        ...overrides.order
    });
};

const authHeader = (user) => `Bearer ${generateToken(user._id)}`;

const get = (endpoint, user) =>
    request(app).get(endpoint).set("Authorization", authHeader(user));

const post = (endpoint, user, body) =>
    request(app)
        .post(endpoint)
        .set("Authorization", authHeader(user))
        .send(body);

const put = (endpoint, user, body) =>
    request(app)
        .put(endpoint)
        .set("Authorization", authHeader(user))
        .send(body);

const del = (endpoint, user) =>
    request(app).delete(endpoint).set("Authorization", authHeader(user));

module.exports = {
    request,
    app,
    User,
    Product,
    Order,
    Review,
    EmailLog,
    Service,
    Ticket,
    Appraisal,
    ChatHistory,
    createUser,
    createAdmin,
    createProduct,
    createOrder,
    authHeader,
    get,
    post,
    put,
    del
};
