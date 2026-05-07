const expect = require("chai").expect;
const request = require("supertest");
const app = require("../../server/app");
const {
  createUserAndToken,
  createAdminAndToken,
  generateExpiredToken,
  generateInvalidToken,
} = require("./helpers/mockAuth");

// Authentication middleware tests - covers requireAuth for various token scenarios
describe("requireAuth middleware", () => {
  // Standard successful authentication test - should allow access with a valid JWT and return 201 created
  it("should pass through and return 201 with a valid JWT", async () => {
    const { token } = await createUserAndToken();

    const res = await request(app)
      .post("/api/chat/create")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(201);
  });

  // Invalid token scenarios - should return 401 with AUTH_INVALID_TOKEN code for missing, malformed, invalid signature, and expired tokens
  it("should return 401 AUTH_INVALID_TOKEN with no Authorization header", async () => {
    const res = await request(app).post("/api/chat");

    expect(res.status).to.equal(401);
    expect(res.body.error.code).to.equal("AUTH_INVALID_TOKEN");
  });

  it("should return 401 AUTH_INVALID_TOKEN with a malformed Authorization header", async () => {
    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", "malformed_token");

    expect(res.status).to.equal(401);
    expect(res.body.error.code).to.equal("AUTH_INVALID_TOKEN");
  });

  it("should return 401 AUTH_INVALID_TOKEN with an invalid JWT signature", async () => {
    const token = generateInvalidToken();

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(401);
    expect(res.body.error.code).to.equal("AUTH_INVALID_TOKEN");
  });

  it("should return 401 AUTH_INVALID_TOKEN with an expired JWT", async () => {
    const token = generateExpiredToken();

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(401);
    expect(res.body.error.code).to.equal("AUTH_INVALID_TOKEN");
  });
});

// Authorization middleware tests - covers requireAdmin for various user roles and authentication states
describe("requireAdmin middleware", () => {
  // Standard successful admin access test - should allow access with a valid admin JWT and return 501 from the dummy route
  it("should pass through and return 501 with a valid admin JWT", async () => {
    const { token } = await createAdminAndToken();

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(501);
  });

  // Non-admin access test - should return 403 with FORBIDDEN code for valid JWTs that do not have admin role
  it("should return 403 FORBIDDEN with a valid non-admin JWT", async () => {
    const { token } = await createUserAndToken();

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).to.equal(403);
    expect(res.body.error.code).to.equal("FORBIDDEN");
  });

  // Unauthenticated access test - should return 401 with AUTH_INVALID_TOKEN code for requests without valid authentication before role is checked
  it("should return 401 AUTH_INVALID_TOKEN for unauthenticated requests before checking role", async () => {
    const res = await request(app).get("/api/admin/analytics");

    expect(res.status).to.equal(401);
    expect(res.body.error.code).to.equal("AUTH_INVALID_TOKEN");
  });
});
