const {
    request,
    app,
    Product,
    createUser,
    createAdmin,
    createProduct,
    createOrder,
    get,
    post,
    put,
    del
} = require("./helpers");

describe("Public product catalogue", () => {
    it("lists products without a token", async () => {
        await createProduct({ name: "Public Piece", brand: "Seiko" });

        const response = await request(app).get("/api/v1/products");

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        expect(response.body.pagination).toBeDefined();
    });

    it("applies the combined price, category, rating and review filters", async () => {
        await createProduct({ name: "A", brand: "Seiko", category: "dress", price: 10000, ratings: 4.5, numOfReviews: 10 });
        await createProduct({ name: "B", brand: "Tudor", category: "diver", price: 90000, ratings: 3.1, numOfReviews: 2 });
        await createProduct({ name: "C", brand: "Seiko", category: "diver", price: 20000, ratings: 4.9, numOfReviews: 20 });

        const response = await request(app).get(
            "/api/v1/products?brand=Seiko&category=dress&minPrice=5000&maxPrice=50000&minRating=4&minReviews=5"
        );

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0].name).toBe("A");
    });

    it("filters by case size", async () => {
        await createProduct({ name: "Small", caseSize: 36 });
        await createProduct({ name: "Large", caseSize: 44 });

        const response = await request(app).get("/api/v1/products?caseSize=44");

        expect(response.body.products).toHaveLength(1);
        expect(response.body.products[0].name).toBe("Large");
    });

    it("ignores an empty filter instead of returning nothing", async () => {
        await createProduct();

        const response = await request(app).get(
            "/api/v1/products?brand=&movement=&condition=&minPrice=&maxPrice="
        );

        expect(response.body.products).toHaveLength(1);
    });

    it("paginates the list", async () => {
        await createProduct({ name: "One" });
        await createProduct({ name: "Two" });
        await createProduct({ name: "Three" });

        const page1 = await request(app).get("/api/v1/products?page=1&limit=2");
        const page2 = await request(app).get("/api/v1/products?page=2&limit=2");

        expect(page1.body.products).toHaveLength(2);
        expect(page2.body.products).toHaveLength(1);
        expect(page1.body.pagination.totalPages).toBe(2);
    });

    it("ignores a query operator injection attempt", async () => {
        await createProduct({ price: 100 });

        const response = await request(app).get("/api/v1/products?price[$ne]=999999");

        expect(response.status).toBe(200);
        expect(response.body.products).toHaveLength(1);
    });

    it("hides an inactive product from the public list", async () => {
        await createProduct({ name: "Archived", isActive: false });

        const response = await request(app).get("/api/v1/products");

        expect(response.body.products).toHaveLength(0);
    });

    it("answers an unknown product with 404", async () => {
        const response = await request(app).get("/api/v1/product/64b7f2c8a1b2c3d4e5f6a7b8");

        expect(response.status).toBe(404);
    });
});

describe("Admin product management", () => {
    it("creates a product", async () => {
        const admin = await createAdmin();

        const response = await post("/api/v1/admin/product/new", admin, {
            name: "New Listing",
            brand: "Omega",
            category: "diver",
            movement: "automatic",
            caseSize: 41,
            condition: "new",
            price: 99000,
            description: "A freshly listed timepiece.",
            stock: 4,
            images: []
        });

        expect(response.status).toBe(201);
        expect(response.body.product.stock).toBe(4);
    });

    it("rejects a second-hand product with a stock other than one", async () => {
        const admin = await createAdmin();

        const response = await post("/api/v1/admin/product/new", admin, {
            name: "Pre-owned",
            brand: "Omega",
            category: "diver",
            movement: "automatic",
            caseSize: 41,
            condition: "second-hand",
            price: 99000,
            description: "A pre-owned timepiece.",
            stock: 5,
            images: []
        });

        expect(response.status).toBe(400);
    });

    it("forces a second-hand product to a single unit", async () => {
        const admin = await createAdmin();

        const response = await post("/api/v1/admin/product/new", admin, {
            name: "Unique Piece",
            brand: "Omega",
            category: "diver",
            movement: "automatic",
            caseSize: 41,
            condition: "second-hand",
            price: 99000,
            description: "A pre-owned timepiece.",
            stock: 9,
            images: []
        });

        expect(response.status).toBe(400);
    });

    it("blocks a standard user from creating a product", async () => {
        const user = await createUser();

        const response = await post("/api/v1/admin/product/new", user, {
            name: "Not allowed",
            brand: "Omega",
            category: "diver",
            movement: "automatic",
            caseSize: 41,
            condition: "new",
            price: 99000,
            description: "Nope.",
            stock: 1,
            images: []
        });

        expect(response.status).toBe(403);
    });

    it("answers an invalid product with 400 instead of 500", async () => {
        const admin = await createAdmin();

        // The brand is required by the Product model. The failure is a
        // client mistake, so it has to be answered with 400.
        const response = await post("/api/v1/admin/product/new", admin, {
            name: "Missing brand",
            category: "dress",
            movement: "automatic",
            caseSize: 40,
            condition: "new",
            price: 25000,
            description: "The brand is missing on purpose.",
            stock: 1,
            images: []
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toMatch(/brand/i);
    });

    it("answers an invalid product id with 400 instead of 500", async () => {
        const admin = await createAdmin();

        const response = await put("/api/v1/admin/product/not-a-valid-id", admin, {
            name: "Broken id"
        });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it("archives a product that is referenced by an order instead of deleting it", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const product = await createProduct();

        await createOrder(user, { productId: product._id });

        const response = await del(`/api/v1/admin/product/${product._id}`, admin);

        expect(response.status).toBe(200);
        expect(response.body.message).toMatch(/inactive/i);

        const stillThere = await Product.findById(product._id);
        expect(stillThere).not.toBeNull();
        expect(stillThere.isActive).toBe(false);
    });

    it("deletes a product that is not referenced by any order", async () => {
        const admin = await createAdmin();
        const product = await createProduct();

        const response = await del(`/api/v1/admin/product/${product._id}`, admin);

        expect(response.status).toBe(200);
        expect(await Product.findById(product._id)).toBeNull();
    });

    it("bulk deletes the selected products", async () => {
        const admin = await createAdmin();
        const first = await createProduct({ name: "Bulk One" });
        const second = await createProduct({ name: "Bulk Two" });

        const response = await post(
            "/api/v1/admin/products/bulk-delete",
            admin,
            { ids: [first._id, second._id] }
        );

        expect(response.status).toBe(200);
        expect(response.body.deleted).toBe(2);
        expect(await Product.countDocuments({})).toBe(0);
    });

    it("blocks a standard user from bulk deleting", async () => {
        const user = await createUser();
        const product = await createProduct();

        const response = await post(
            "/api/v1/admin/products/bulk-delete",
            user,
            { ids: [product._id] }
        );

        expect(response.status).toBe(403);
    });
});

describe("Wishlist", () => {
    it("adds a product only once", async () => {
        const user = await createUser();
        const product = await createProduct();

        await post(`/api/v1/wishlist/${product._id}`, user);
        const response = await post(`/api/v1/wishlist/${product._id}`, user);

        expect(response.status).toBe(200);
        expect(response.body.wishlist).toHaveLength(1);
    });

    it("removes a product from the wishlist", async () => {
        const user = await createUser();
        const product = await createProduct();

        await post(`/api/v1/wishlist/${product._id}`, user);
        const response = await del(`/api/v1/wishlist/${product._id}`, user);

        expect(response.status).toBe(200);
        expect(response.body.wishlist).toHaveLength(0);
    });

    it("keeps the wishlist private to its owner", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const product = await createProduct();

        await post(`/api/v1/wishlist/${product._id}`, owner);

        const response = await get("/api/v1/wishlist", other);
        expect(response.body.wishlist).toHaveLength(0);

        const ownerResponse = await get("/api/v1/wishlist", owner);
        expect(ownerResponse.body.wishlist).toHaveLength(1);
    });
});
