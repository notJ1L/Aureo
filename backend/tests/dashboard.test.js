const {
    request,
    app,
    Product,
    Order,
    Appraisal,
    createUser,
    createAdmin,
    createProduct,
    createOrder,
    get,
    post
} = require("./helpers");

describe("Admin dashboard", () => {
    it("rejects a standard user with 403", async () => {
        const user = await createUser();

        const response = await get("/api/v1/admin/dashboard", user);

        expect(response.status).toBe(403);
    });

    it("answers an admin with the metrics", async () => {
        const admin = await createAdmin();

        const response = await get("/api/v1/admin/dashboard", admin);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("sales");
        expect(response.body).toHaveProperty("expenses");
        expect(response.body).toHaveProperty("orderCounts");
        expect(response.body).toHaveProperty("inventory");
        expect(response.body).toHaveProperty("monthlySales");
    });

    it("counts only the paid orders as sales", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const product = await createProduct({ price: 10000 });

        await createOrder(user, { productId: product._id, status: "Pending" });
        await createOrder(user, {
            productId: product._id,
            status: "Paid",
            paymentStatus: "Paid"
        });
        await createOrder(user, {
            productId: product._id,
            status: "Completed",
            paymentStatus: "Paid"
        });

        const response = await get("/api/v1/admin/dashboard", admin);

        expect(response.body.sales).toBe(20000);
        expect(response.body.orderCounts.Pending).toBe(1);
        expect(response.body.orderCounts.Paid).toBe(1);
        expect(response.body.orderCounts.Completed).toBe(1);
    });

    it("counts the accepted appraisal offers as expenses", async () => {
        const admin = await createAdmin();
        const user = await createUser();

        await Appraisal.create({
            user: user._id,
            brand: "Rolex",
            model: "Datejust",
            movement: "automatic",
            caseSize: 36,
            condition: "second-hand",
            year: 2018,
            askingPrice: 200000,
            photos: [{ public_id: "p", url: "https://example.com/p.jpg" }],
            status: "Accepted",
            offerPrice: 180000
        });

        await Appraisal.create({
            user: user._id,
            brand: "Omega",
            model: "Speedmaster",
            movement: "manual",
            caseSize: 42,
            condition: "second-hand",
            year: 2015,
            askingPrice: 150000,
            photos: [{ public_id: "p", url: "https://example.com/p.jpg" }],
            status: "Pending"
        });

        const response = await get("/api/v1/admin/dashboard", admin);

        expect(response.body.expenses).toBe(180000);
    });

    it("reports the current inventory", async () => {
        const admin = await createAdmin();

        await createProduct({ name: "A", condition: "new", stock: 4 });
        await createProduct({ name: "B", condition: "second-hand", stock: 1 });
        await createProduct({ name: "C", condition: "new", stock: 0 });

        const response = await get("/api/v1/admin/dashboard", admin);

        expect(response.body.inventory.totalProducts).toBe(3);
        expect(response.body.inventory.inStock).toBe(2);
        expect(response.body.inventory.newWatches).toBe(2);
        expect(response.body.inventory.secondHandWatches).toBe(1);
        expect(response.body.inventory.totalUnits).toBe(5);
    });

    it("honours the date range filter", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const product = await createProduct({ price: 10000 });

        const order = await createOrder(user, {
            productId: product._id,
            status: "Paid",
            paymentStatus: "Paid"
        });

        // The raw driver is used so the Mongoose timestamp plugin cannot
        // overwrite the created date.
        await Order.collection.updateOne(
            { _id: order._id },
            { $set: { createdAt: new Date("2020-01-15T00:00:00.000Z") } }
        );

        const inRange = await get(
            "/api/v1/admin/dashboard?from=2020-01-01&to=2020-12-31",
            admin
        );

        expect(inRange.body.sales).toBe(10000);
        expect(inRange.body.monthlySales).toHaveLength(1);

        const outOfRange = await get(
            "/api/v1/admin/dashboard?from=2024-01-01&to=2024-12-31",
            admin
        );

        expect(outOfRange.body.sales).toBe(0);
    });

    it("rejects an invalid date", async () => {
        const admin = await createAdmin();

        const response = await get("/api/v1/admin/dashboard?from=not-a-date", admin);

        expect(response.status).toBe(400);
    });
});

describe("AI chat assistant", () => {
    it("rejects an unauthenticated request", async () => {
        const response = await request(app).post("/api/v1/chat").send({
            message: "hello"
        });

        expect(response.status).toBe(401);
    });

    it("answers a greeting", async () => {
        const user = await createUser();

        const response = await post("/api/v1/chat", user, { message: "hello" });

        expect(response.status).toBe(200);
        expect(response.body.reply).toMatch(/budget/i);
    });

    it("extracts the budget, brand and movement preferences", async () => {
        const user = await createUser();

        const response = await post("/api/v1/chat", user, {
            message: "I want a Seiko automatic watch under 50000"
        });

        expect(response.body.preferences.brand).toBe("Seiko");
        expect(response.body.preferences.movement).toBe("automatic");
        expect(response.body.preferences.budget).toBe(50000);
    });

    it("matches the preferences against the products in stock", async () => {
        const user = await createUser();

        await createProduct({
            name: "Budget Automatic",
            brand: "Seiko",
            movement: "automatic",
            price: 30000,
            stock: 4,
            ratings: 4.5
        });
        await createProduct({
            name: "Over Budget",
            brand: "Seiko",
            movement: "automatic",
            price: 90000,
            stock: 4
        });

        const response = await post("/api/v1/chat", user, {
            message: "a Seiko automatic under 50000"
        });

        expect(response.body.matches).toHaveLength(1);
        expect(response.body.matches[0].name).toBe("Budget Automatic");
    });

    it("never recommends a sold out product", async () => {
        const user = await createUser();

        await createProduct({ name: "Sold Out", brand: "Seiko", price: 30000, stock: 0 });

        const response = await post("/api/v1/chat", user, {
            message: "a Seiko under 50000"
        });

        expect(response.body.matches).toHaveLength(0);
        expect(response.body.reply).toMatch(/could not find/i);
    });

    it("keeps the history of a collector private", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });

        await post("/api/v1/chat", owner, { message: "I want a Rolex under 300000" });

        const response = await get("/api/v1/chat/history", other);

        expect(response.status).toBe(200);
        expect(response.body.messages).toHaveLength(0);
    });

    it("remembers the preferences between two messages", async () => {
        const user = await createUser();

        await post("/api/v1/chat", user, { message: "I want a Seiko under 50000" });
        const response = await post("/api/v1/chat", user, { message: "something automatic" });

        expect(response.body.preferences.brand).toBe("Seiko");
        expect(response.body.preferences.budget).toBe(50000);
    });

    it("rejects an empty message", async () => {
        const user = await createUser();

        const response = await post("/api/v1/chat", user, { message: "   " });

        expect(response.status).toBe(400);
    });
});
