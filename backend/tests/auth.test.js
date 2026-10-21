const {
    request,
    app,
    User,
    createUser,
    createAdmin,
    createProduct,
    get,
    post,
    put,
    del
} = require("./helpers");

describe("Health and error handling", () => {
    it("answers the health check", async () => {
        const response = await request(app).get("/api/v1/health");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it("answers an unknown route with a 404", async () => {
        const response = await request(app).get("/api/v1/does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});

describe("Authentication and access control", () => {
    it("rejects a missing token with 401", async () => {
        const response = await request(app).get("/api/v1/me");

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it("rejects an invalid token with 401", async () => {
        const response = await request(app)
            .get("/api/v1/me")
            .set("Authorization", "Bearer not.a.real.token");

        expect(response.status).toBe(401);
    });

    it("returns the current user for a valid token", async () => {
        const user = await createUser();
        const response = await get("/api/v1/me", user);

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe(user.email);
    });

    it("never exposes the password", async () => {
        const user = await createUser();
        const response = await get("/api/v1/me", user);

        expect(response.body.user.password).toBeUndefined();
    });

    it("rejects a duplicate registration with 400", async () => {
        await createUser({ email: "collector@example.com" });

        const response = await request(app)
            .post("/api/v1/register")
            .send({
                name: "Duplicate",
                email: "collector@example.com",
                password: "StrongPass123"
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/already registered/i);
    });

    it("answers a wrong password with the generic message", async () => {
        await createUser({ email: "collector@example.com" });

        const response = await request(app)
            .post("/api/v1/login")
            .send({ email: "collector@example.com", password: "WrongPassword123" });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe("Invalid email or password");
    });

    it("blocks a standard user from an admin route with 403", async () => {
        const user = await createUser();
        const response = await get("/api/v1/admin/products", user);

        expect(response.status).toBe(403);
    });

    it("blocks an unverified user from ordering with 403", async () => {
        const user = await createUser({ isVerified: false });
        const product = await createProduct();

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 1 }],
            shippingInfo: {
                address: "12 Aureo Street",
                city: "Manila",
                postalCode: "1000",
                country: "Philippines",
                phone: "09171234567"
            },
            paymentMethod: "Cash"
        });

        expect(response.status).toBe(403);
    });

    it("only lets a user edit their own profile", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });

        const response = await put(
            "/api/v1/me/update",
            other,
            { name: "Hijacked" }
        );

        expect(response.status).toBe(200);

        const unchanged = await User.findById(owner._id);
        expect(unchanged.name).toBe("Test Collector");
    });

    it("never allows the role to be changed through the profile", async () => {
        const user = await createUser();
        const admin = await createAdmin();

        const response = await put("/api/v1/me/update", user, {
            name: "Escalated",
            role: "admin"
        });

        expect(response.status).toBe(200);

        const updated = await User.findById(user._id);
        expect(updated.role).toBe("user");
        expect(updated.role).not.toBe(admin.role);
    });
});
