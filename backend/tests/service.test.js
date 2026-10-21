const {
    request,
    app,
    Service,
    Ticket,
    EmailLog,
    createUser,
    createAdmin,
    get,
    post,
    put,
    del
} = require("./helpers");

const createService = (overrides = {}) =>
    Service.create({
        name: "Watch Cleaning",
        description: "Exterior cleaning and inspection.",
        price: 1500,
        ...overrides
    });

describe("Service catalogue", () => {
    it("lists the services publicly", async () => {
        await createService();

        const response = await request(app).get("/api/v1/services");

        expect(response.status).toBe(200);
        expect(response.body.services).toHaveLength(1);
    });

    it("lets an admin create a service", async () => {
        const admin = await createAdmin();

        const response = await post("/api/v1/admin/service/new", admin, {
            name: "Movement Adjustment",
            description: "Timing inspection and adjustment.",
            price: 3500
        });

        expect(response.status).toBe(201);
        expect(response.body.service.price).toBe(3500);
    });

    it("rejects a price of zero", async () => {
        const admin = await createAdmin();

        const response = await post("/api/v1/admin/service/new", admin, {
            name: "Free Service",
            description: "Should not exist.",
            price: 0
        });

        expect(response.status).toBe(400);
    });

    it("rejects a negative price", async () => {
        const admin = await createAdmin();

        const response = await post("/api/v1/admin/service/new", admin, {
            name: "Bad Price",
            description: "Should not exist.",
            price: -100
        });

        expect(response.status).toBe(400);
    });

    it("blocks a standard user from creating a service", async () => {
        const user = await createUser();

        const response = await post("/api/v1/admin/service/new", user, {
            name: "Nope",
            description: "Nope.",
            price: 100
        });

        expect(response.status).toBe(403);
    });

    it("updates and deletes a service", async () => {
        const admin = await createAdmin();
        const service = await createService();

        const updated = await put(`/api/v1/admin/service/${service._id}`, admin, {
            price: 2000
        });

        expect(updated.status).toBe(200);
        expect(updated.body.service.price).toBe(2000);

        const removed = await del(`/api/v1/admin/service/${service._id}`, admin);
        expect(removed.status).toBe(200);
    });

    it("bulk deletes the selected services", async () => {
        const admin = await createAdmin();
        const first = await createService({ name: "One" });
        const second = await createService({ name: "Two" });

        const response = await post(
            "/api/v1/admin/services/bulk-delete",
            admin,
            { ids: [first._id, second._id] }
        );

        expect(response.status).toBe(200);
        expect(response.body.deleted).toBe(2);
        expect(await Service.countDocuments({})).toBe(0);
    });

    it("blocks a standard user from bulk deleting", async () => {
        const user = await createUser();
        const service = await createService();

        const response = await post(
            "/api/v1/admin/services/bulk-delete",
            user,
            { ids: [service._id] }
        );

        expect(response.status).toBe(403);
    });
});

describe("Support tickets", () => {
    it("opens a ticket with a unique number", async () => {
        const user = await createUser();
        const service = await createService();

        const first = await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Loses about two minutes a day."
        });

        const second = await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Tudor",
            watchModel: "Black Bay",
            problemDescription: "The bezel is scratched."
        });

        expect(first.status).toBe(201);
        expect(first.body.ticket.status).toBe("Received");
        expect(first.body.ticket.ticketNumber).not.toBe(second.body.ticket.ticketNumber);
    });

    it("blocks an unverified user from opening a ticket", async () => {
        const user = await createUser({ isVerified: false });
        const service = await createService();

        const response = await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        expect(response.status).toBe(403);
    });

    it("rejects a ticket for an unknown service", async () => {
        const user = await createUser();

        const response = await post("/api/v1/ticket/new", user, {
            service: "64b7f2c8a1b2c3d4e5f6a7b8",
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        expect(response.status).toBe(404);
    });

    it("notifies the collector when the ticket is received", async () => {
        const user = await createUser();
        const service = await createService();

        await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        const logs = await EmailLog.find({ type: "ticket" });
        expect(logs.length).toBeGreaterThanOrEqual(1);
    });

    it("shows a user only their own tickets", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const service = await createService();

        const body = {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        };

        await post("/api/v1/ticket/new", owner, body);
        await post("/api/v1/ticket/new", other, body);

        const response = await get("/api/v1/tickets/me", owner);
        expect(response.body.tickets).toHaveLength(1);
    });

    it("does not let a user read somebody else's ticket", async () => {
        const owner = await createUser({ email: "owner@example.com" });
        const other = await createUser({ email: "other@example.com" });
        const service = await createService();

        const created = await post("/api/v1/ticket/new", owner, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        const response = await get(`/api/v1/ticket/${created.body.ticket._id}`, other);
        expect(response.status).toBe(403);
    });

    it("records every status change with a timestamp", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const service = await createService();

        const created = await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        const ticketId = created.body.ticket._id;

        const response = await put(`/api/v1/admin/ticket/${ticketId}`, admin, {
            status: "Diagnosing"
        });

        expect(response.status).toBe(200);
        expect(response.body.ticket.status).toBe("Diagnosing");
        expect(response.body.ticket.statusHistory).toHaveLength(2);
        expect(response.body.ticket.statusHistory[1].changedAt).toBeDefined();
    });

    it("rejects a status transition that is not allowed", async () => {
        const admin = await createAdmin();
        const user = await createUser();
        const service = await createService();

        const created = await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        await put(`/api/v1/admin/ticket/${created.body.ticket._id}`, admin, {
            status: "Diagnosing"
        });

        const invalid = await put(`/api/v1/admin/ticket/${created.body.ticket._id}`, admin, {
            status: "Received"
        });

        expect(invalid.status).toBe(400);
    });

    it("blocks a standard user from changing the status", async () => {
        const user = await createUser();
        const service = await createService();

        const created = await post("/api/v1/ticket/new", user, {
            service: service._id,
            watchBrand: "Seiko",
            watchModel: "Presage",
            problemDescription: "Broken."
        });

        const response = await put(
            `/api/v1/admin/ticket/${created.body.ticket._id}`,
            user,
            { status: "Diagnosing" }
        );

        expect(response.status).toBe(403);
    });
});
