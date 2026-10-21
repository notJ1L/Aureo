const {
    request,
    app,
    Product,
    Order,
    EmailLog,
    createUser,
    createAdmin,
    createProduct,
    createOrder,
    get,
    post,
    put,
    del
} = require("./helpers");

const shippingInfo = {
    address: "12 Aureo Street",
    city: "Manila",
    postalCode: "1000",
    country: "Philippines",
    phone: "09171234567"
};

describe("Order creation", () => {
    it("recalculates the price on the server", async () => {
        const user = await createUser();
        const product = await createProduct({ price: 25000 });

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, price: 1, quantity: 1 }],
            shippingInfo,
            paymentMethod: "Cash"
        });

        expect(response.status).toBe(201);
        expect(response.body.order.orderItems[0].price).toBe(25000);
    });

    it("keeps a cash order pending until an admin marks it paid", async () => {
        const user = await createUser();
        const product = await createProduct();

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 1 }],
            shippingInfo,
            paymentMethod: "Cash"
        });

        expect(response.body.order.status).toBe("Pending");
        expect(response.body.order.paymentStatus).toBe("Pending");
    });

    it("declines the designated test card number", async () => {
        const user = await createUser();
        const product = await createProduct();

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 1 }],
            shippingInfo,
            paymentMethod: "Dummy Credit Card",
            cardNumber: "4000 0000 0000 0002"
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/declined/i);
    });

    it("does not store the card number", async () => {
        const user = await createUser();
        const product = await createProduct();

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 1 }],
            shippingInfo,
            paymentMethod: "Dummy Credit Card",
            cardNumber: "4000 1234 5678 9010"
        });

        expect(response.status).toBe(201);
        expect(JSON.stringify(response.body)).not.toMatch(/4000 1234 5678 9010/);

        const stored = await Order.findById(response.body.order._id);
        expect(JSON.stringify(stored)).not.toMatch(/4000/);
    });

    it("rejects an order for more stock than available", async () => {
        const user = await createUser();
        const product = await createProduct({ stock: 1 });

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 5 }],
            shippingInfo,
            paymentMethod: "Cash"
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/stock/i);
    });

    it("rejects a second-hand order for more than one unit", async () => {
        const user = await createUser();
        const product = await createProduct({ condition: "second-hand", stock: 1 });

        const response = await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 2 }],
            shippingInfo,
            paymentMethod: "Cash"
        });

        expect(response.status).toBe(400);
    });

    it("reduces the stock when the order is placed", async () => {
        const user = await createUser();
        const product = await createProduct({ stock: 4 });

        await post("/api/v1/order/new", user, {
            orderItems: [{ product: product._id, quantity: 2 }],
            shippingInfo,
            paymentMethod: "Cash"
        });

        const updated = await Product.findById(product._id);
        expect(updated.stock).toBe(2);
    });

    it("rejects an empty order with 400", async () => {
        const user = await createUser();

        const response = await post("/api/v1/order/new", user, {
            orderItems: [],
            shippingInfo
        });

        expect(response.status).toBe(400);
    });
});

describe("Order ownership and cancellation", () => {
    it("only shows the owner the order", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const order = await createOrder(owner, { productId: (await createProduct())._id });

        const response = await get(`/api/v1/order/${order._id}`, other);

        expect(response.status).toBe(403);
    });

    it("lists only the orders of the current user", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const product = await createProduct();

        await createOrder(owner, { productId: product._id });
        await createOrder(other, { productId: product._id });

        const response = await get("/api/v1/orders/me", owner);

        expect(response.status).toBe(200);
        expect(response.body.orders).toHaveLength(1);
    });

    it("cancels a pending order and restores the stock", async () => {
        const user = await createUser();
        const product = await createProduct({ stock: 3 });
        const order = await createOrder(user, { productId: product._id });

        const response = await put(`/api/v1/order/${order._id}/cancel`, user);

        expect(response.status).toBe(200);
        expect(response.body.order.status).toBe("Cancelled");

        const updated = await Product.findById(product._id);
        expect(updated.stock).toBe(3);
    });

    it("refuses to cancel an order that is already paid", async () => {
        const user = await createUser();
        const order = await createOrder(user, {
            productId: (await createProduct())._id,
            status: "Paid",
            paymentStatus: "Paid"
        });

        const response = await put(`/api/v1/order/${order._id}/cancel`, user);

        expect(response.status).toBe(400);
    });

    it("does not let a user cancel somebody else's order", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const order = await createOrder(owner, { productId: (await createProduct())._id });

        const response = await put(`/api/v1/order/${order._id}/cancel`, other);

        expect(response.status).toBe(403);
    });
});

describe("Admin order management", () => {
    it("moves an order through the status flow", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const order = await createOrder(user, { productId: (await createProduct())._id });

        const paid = await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Paid" });
        expect(paid.status).toBe(200);
        expect(paid.body.order.status).toBe("Paid");

        const shipped = await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Shipped" });
        expect(shipped.body.order.status).toBe("Shipped");

        const completed = await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Completed" });
        expect(completed.body.order.status).toBe("Completed");
    });

    it("rejects a transition that skips a step", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const order = await createOrder(user, { productId: (await createProduct())._id });

        const response = await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Shipped" });

        expect(response.status).toBe(400);
    });

    it("refuses to move a completed order back", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const order = await createOrder(user, {
            productId: (await createProduct())._id,
            status: "Completed",
            paymentStatus: "Paid"
        });

        const response = await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Paid" });

        expect(response.status).toBe(400);
    });

    it("rejects an unknown status", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const order = await createOrder(user, { productId: (await createProduct())._id });

        const response = await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Teleported" });

        expect(response.status).toBe(400);
    });

    it("notifies the customer on every status change", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const order = await createOrder(user, { productId: (await createProduct())._id });

        await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Paid" });
        await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Shipped" });
        await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Completed" });

        const logs = await EmailLog.find({ relatedId: order._id.toString(), type: "order" });

        expect(logs.length).toBeGreaterThanOrEqual(3);
    });

    it("attaches a PDF receipt to the completed transaction email", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const product = await createProduct({ name: "Receipt Piece" });
        const order = await createOrder(user, { productId: product._id });

        await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Paid" });
        await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Shipped" });
        await put(`/api/v1/admin/order/${order._id}`, admin, { status: "Completed" });

        const log = await EmailLog.findOne({
            relatedId: order._id.toString(),
            subject: /Transaction Complete/i
        });

        expect(log).not.toBeNull();
        expect(log.body).toContain("Receipt Piece");
        expect(log.body).toMatch(/Subtotal:/);
        expect(log.body).toMatch(/Grand total:/);
        expect(log.attachments[0]).toMatch(/\.pdf$/);
    });

    it("blocks a standard user from changing an order", async () => {
        const user = await createUser();
        const order = await createOrder(user, { productId: (await createProduct())._id });

        const response = await put(`/api/v1/admin/order/${order._id}`, user, { status: "Paid" });

        expect(response.status).toBe(403);
    });
});
