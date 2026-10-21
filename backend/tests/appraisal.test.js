const {
    request,
    app,
    Product,
    Appraisal,
    createUser,
    createAdmin,
    createProduct,
    get,
    post,
    put
} = require("./helpers");

// The appraisal photo upload is a multipart request. The controller streams
// the files to Cloudinary, so the upload helper is mocked in the test.
jest.mock("../utils/cloudinaryUpload", () => ({
    uploadBuffer: jest.fn(async (buffer) => ({
        public_id: "cloudinary-test-id",
        url: "https://res.cloudinary.com/test/image/upload/watch.jpg"
    })),
    uploadFiles: jest.fn(async (files) =>
        files.map(() => ({
            public_id: "cloudinary-test-id",
            url: "https://res.cloudinary.com/test/image/upload/watch.jpg"
        }))
    )
}));

const buildAppraisalBody = (overrides = {}) => ({
    brand: "Rolex",
    model: "Datejust 36",
    movement: "automatic",
    caseSize: "36",
    condition: "second-hand",
    year: "2018",
    hasBox: "true",
    hasPapers: "false",
    askingPrice: "150000",
    ...overrides
});

const submitAppraisal = (user, body = buildAppraisalBody(), withPhoto = true) => {
    const req = post("/api/v1/appraisal/new", user);

    if (withPhoto) {
        req.attach("photos", Buffer.from("fake-image"), {
            filename: "watch.png",
            contentType: "image/png"
        });
    }

    Object.entries(body).forEach(([key, value]) => req.field(key, value));

    return req;
};

describe("Appraisal submission", () => {
    it("accepts an appraisal with a photo", async () => {
        const user = await createUser();

        const response = await submitAppraisal(user);

        expect(response.status).toBe(201);
        expect(response.body.appraisal.status).toBe("Pending");
        expect(response.body.appraisal.photos).toHaveLength(1);
    });

    it("requires at least one photo", async () => {
        const user = await createUser();

        const response = await submitAppraisal(user, buildAppraisalBody(), false);

        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/photo/i);
    });

    it("rejects more than six photos", async () => {
        const user = await createUser();

        const req = post("/api/v1/appraisal/new", user);
        for (let index = 0; index < 7; index += 1) {
            req.attach("photos", Buffer.from("fake"), {
                filename: `watch-${index}.png`,
                contentType: "image/png"
            });
        }
        Object.entries(buildAppraisalBody()).forEach(([key, value]) => req.field(key, value));

        const response = await req;

        expect(response.status).toBe(400);
    });

    it("rejects a file that is not an image", async () => {
        const user = await createUser();

        const req = post("/api/v1/appraisal/new", user);
        req.attach("photos", Buffer.from("not-an-image"), {
            filename: "notes.txt",
            contentType: "text/plain"
        });
        Object.entries(buildAppraisalBody()).forEach(([key, value]) => req.field(key, value));

        const response = await req;

        expect(response.status).toBe(400);
    });

    it("blocks an unverified user", async () => {
        const user = await createUser({ isVerified: false });

        const response = await submitAppraisal(user);

        expect(response.status).toBe(403);
    });

    it("shows a user only their own appraisals", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });

        await submitAppraisal(owner);
        await submitAppraisal(other);

        const response = await get("/api/v1/appraisals/me", owner);

        expect(response.status).toBe(200);
        expect(response.body.appraisals).toHaveLength(1);
    });

    it("does not let a user read somebody else's appraisal", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });

        const created = await submitAppraisal(owner);
        const appraisalId = created.body.appraisal._id;

        const response = await get(`/api/v1/appraisal/${appraisalId}`, other);

        expect(response.status).toBe(403);
    });
});

describe("Appraisal review and conversion", () => {
    it("lets the admin make an offer", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const created = await submitAppraisal(user);

        const response = await put(
            `/api/v1/admin/appraisal/${created.body.appraisal._id}`,
            admin,
            { offerPrice: 140000 }
        );

        expect(response.status).toBe(200);
        expect(response.body.appraisal.status).toBe("Offer Made");
        expect(response.body.appraisal.offerPrice).toBe(140000);
    });

    it("lets the admin reject an appraisal", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const created = await submitAppraisal(user);

        const response = await put(
            `/api/v1/admin/appraisal/${created.body.appraisal._id}`,
            admin,
            { action: "reject" }
        );

        expect(response.body.appraisal.status).toBe("Rejected");
    });

    it("blocks a standard user from making an offer", async () => {
        const user = await createUser();
        const created = await submitAppraisal(user);

        const response = await put(
            `/api/v1/admin/appraisal/${created.body.appraisal._id}`,
            user,
            { offerPrice: 140000 }
        );

        expect(response.status).toBe(403);
    });

    it("only lets the owner respond to an offer", async () => {
        const admin = await createAdmin();
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const created = await submitAppraisal(owner);

        await put(`/api/v1/admin/appraisal/${created.body.appraisal._id}`, admin, {
            offerPrice: 140000
        });

        const forbidden = await put(
            `/api/v1/appraisal/${created.body.appraisal._id}/respond`,
            other,
            { decision: "Accepted" }
        );

        expect(forbidden.status).toBe(403);
    });

    it("refuses a response when no offer was made", async () => {
        const user = await createUser();
        const created = await submitAppraisal(user);

        const response = await put(
            `/api/v1/appraisal/${created.body.appraisal._id}/respond`,
            user,
            { decision: "Accepted" }
        );

        expect(response.status).toBe(400);
    });

    it("converts an accepted appraisal into a second-hand product", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const created = await submitAppraisal(user);

        await put(`/api/v1/admin/appraisal/${created.body.appraisal._id}`, admin, {
            offerPrice: 140000
        });
        await put(`/api/v1/appraisal/${created.body.appraisal._id}/respond`, user, {
            decision: "Accepted"
        });

        const response = await post(
            `/api/v1/admin/appraisal/${created.body.appraisal._id}/convert`,
            admin
        );

        expect(response.status).toBe(201);
        expect(response.body.product.condition).toBe("second-hand");
        expect(response.body.product.stock).toBe(1);
        expect(response.body.product.price).toBe(140000);
    });

    it("refuses to convert the same appraisal twice", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const created = await submitAppraisal(user);

        await put(`/api/v1/admin/appraisal/${created.body.appraisal._id}`, admin, {
            offerPrice: 140000
        });
        await put(`/api/v1/appraisal/${created.body.appraisal._id}/respond`, user, {
            decision: "Accepted"
        });

        await post(`/api/v1/admin/appraisal/${created.body.appraisal._id}/convert`, admin);
        const second = await post(
            `/api/v1/admin/appraisal/${created.body.appraisal._id}/convert`,
            admin
        );

        expect(second.status).toBe(409);
        expect(await Product.countDocuments({ condition: "second-hand" })).toBe(1);
    });

    it("refuses to convert an appraisal that was not accepted", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const created = await submitAppraisal(user);

        const response = await post(
            `/api/v1/admin/appraisal/${created.body.appraisal._id}/convert`,
            admin
        );

        expect(response.status).toBe(400);
    });
});
