const request = require("supertest");
const app = require("../src/app");


describe("Candidate API", () => {

  test("GET /api/candidates should return 200", async () => {
    const response = await request(app)
      .get("/api/candidates");

    expect(response.statusCode).toBe(200);
  });

});
