const expect = require("chai").expect;
const request = require("supertest");
const app = require("../../server/app");

// 404 Not Found handler tests - covers unknown routes and ensuring JSON response with correct error code
describe("404 Not Found Handler", () => {
  // Unknown route test - should return 404 with NOT_FOUND code and JSON content type for an undefined GET route
  it("should return 404 JSON for an unknown GET route", async () => {
    const res = await request(app).get("/api/unknown");

    expect(res.status).to.equal(404);
    expect(res.body.success).to.be.false;
    expect(res.body.error.code).to.equal("NOT_FOUND");
    expect(res.headers["content-type"]).to.include("application/json");
  });

  // Unknown route test - should return 404 with NOT_FOUND code and JSON content type for an undefined POST route and never return HTML
  it("should return 404 JSON for an unknown POST route and never return HTML", async () => {
    const res = await request(app).post("/api/unknown");

    expect(res.status).to.equal(404);
    expect(res.headers["content-type"]).to.include("application/json");
    expect(res.text).to.not.include("<html>");
  });
});
