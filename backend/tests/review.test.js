const {
    request,
    app,
    Product,
    Review,
    createUser,
    createAdmin,
    createProduct,
    createOrder,
    get,
    post,
    put,
    del
} = require("./helpers");

describe("Review rules", () => {
    it("lets a verified purchaser review a new watch", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Excellent timekeeping."
        });

        expect(response.status).toBe(200);
        expect(response.body.review.rating).toBe(5);
    });

    it("rejects a review from somebody who did not buy the watch", async () => {
        const user = await createUser();
        const product = await createProduct();

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "I never bought this."
        });

        expect(response.status).toBe(403);
    });

    it("rejects a review from a pending order", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Pending" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Still pending."
        });

        expect(response.status).toBe(403);
    });

    it("rejects a review from a cancelled order", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Cancelled" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Cancelled order."
        });

        expect(response.status).toBe(403);
    });

    it("rejects a review of a second-hand watch", async () => {
        const user = await createUser();
        const product = await createProduct({ condition: "second-hand", stock: 1 });
        await createOrder(user, { productId: product._id, status: "Completed", paymentStatus: "Paid" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Pre-owned piece."
        });

        expect(response.status).toBe(400);
    });

    it("rejects a rating outside the one to five range", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 9,
            comment: "Too high."
        });

        expect(response.status).toBe(400);
    });

    it("rejects an empty comment", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 4,
            comment: "   "
        });

        expect(response.status).toBe(400);
    });

    it("masks profanity in the comment", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const response = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 4,
            comment: "bad ass watch"
        });

        expect(response.status).toBe(200);
        expect(response.body.review.comment).toBe("bad *** watch");
    });

    it("keeps one review per user and product", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        await post(`/api/v1/product/${product._id}/review`, user, { rating: 5, comment: "First." });
        const second = await post(`/api/v1/product/${product._id}/review`, user, { rating: 2, comment: "Second." });

        expect(second.status).toBe(200);
        expect(await Review.countDocuments({ product: product._id })).toBe(1);
        expect(second.body.review.rating).toBe(2);
    });

    it("recalculates the product rating", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        await post(`/api/v1/product/${product._id}/review`, user, { rating: 4, comment: "Good." });

        const updated = await Product.findById(product._id);
        expect(updated.ratings).toBe(4);
        expect(updated.numOfReviews).toBe(1);
    });

    it("lets a user review again after deleting the first review", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const created = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 2,
            comment: "Changed my mind."
        });

        const removed = await del(`/api/v1/review/${created.body.review._id}`, user);
        expect(removed.status).toBe(200);

        const reposted = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Second thoughts."
        });

        expect(reposted.status).toBe(200);
        expect(reposted.body.review.rating).toBe(5);

        // The soft deleted review is reused, so the unique index still holds.
        expect(await Review.countDocuments({ product: product._id })).toBe(1);

        const updated = await Product.findById(product._id);
        expect(updated.numOfReviews).toBe(1);
        expect(updated.ratings).toBe(5);
    });
});

describe("Review ownership", () => {
    it("lets the owner update their own review", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const created = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "First thoughts."
        });

        const response = await put(`/api/v1/review/${created.body.review._id}`, user, {
            rating: 3,
            comment: "Revised thoughts."
        });

        expect(response.status).toBe(200);
        expect(response.body.review.rating).toBe(3);
        expect(response.body.review.comment).toBe("Revised thoughts.");
    });

    it("refuses to let a user edit somebody else's review", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const product = await createProduct();
        await createOrder(owner, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const created = await post(`/api/v1/product/${product._id}/review`, owner, {
            rating: 5,
            comment: "Mine."
        });

        const response = await put(`/api/v1/review/${created.body.review._id}`, other, {
            rating: 1,
            comment: "Hijacked."
        });

        expect(response.status).toBe(403);
    });

    it("lets the owner delete their own review", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const created = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Mine."
        });

        const response = await del(`/api/v1/review/${created.body.review._id}`, user);

        expect(response.status).toBe(200);

        const updated = await Product.findById(product._id);
        expect(updated.numOfReviews).toBe(0);
    });

    it("lets an admin delete any review", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const created = await post(`/api/v1/product/${product._id}/review`, user, {
            rating: 5,
            comment: "Mine."
        });

        const response = await del(`/api/v1/review/${created.body.review._id}`, admin);

        expect(response.status).toBe(200);
    });

    it("refuses to let a user delete somebody else's review", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const product = await createProduct();
        await createOrder(owner, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        const created = await post(`/api/v1/product/${product._id}/review`, owner, {
            rating: 5,
            comment: "Mine."
        });

        const response = await del(`/api/v1/review/${created.body.review._id}`, other);

        expect(response.status).toBe(403);
    });

    it("shows the reviews publicly", async () => {
        const user = await createUser();
        const product = await createProduct();
        await createOrder(user, { productId: product._id, status: "Paid", paymentStatus: "Paid" });

        await post(`/api/v1/product/${product._id}/review`, user, { rating: 5, comment: "Public." });

        const response = await request(app).get(`/api/v1/product/${product._id}/reviews`);

        expect(response.status).toBe(200);
        expect(response.body.reviews).toHaveLength(1);
    });
});
