require("./hooks")();
const request = require("supertest");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const prisma = require("../src/config/prisma");


const agent = () => request(app);

async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      name: "Test User",
      email: "test@workbridge.dev",
      phone: "+2347000000001",
      passwordHash: await bcrypt.hash("Password123", 12),
      role: "FREELANCER",
      emailVerified: true,
      ...overrides,
    },
  });
}

describe("Auth", () => {
  it("registers a new account", async () => {
    const res = await agent().post("/api/v1/auth/register").send({
      name: "Ada Test",
      email: "ada@test.dev",
      phone: "+2347000000002",
      password: "Password123",
      role: "FREELANCER",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects duplicate email with 409", async () => {
    await createUser({ email: "dup@test.dev" });
    const res = await agent().post("/api/v1/auth/register").send({
      name: "Dup",
      email: "dup@test.dev",
      phone: "+2347000000099",
      password: "Password123",
      role: "CLIENT",
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it("rejects ADMIN self-registration", async () => {
    const res = await agent().post("/api/v1/auth/register").send({
      name: "Sneaky",
      email: "sneaky@test.dev",
      phone: "+2347000000003",
      password: "Password123",
      role: "ADMIN",
    });
    expect(res.status).toBe(400);
  });

  it("blocks login when email is unverified", async () => {
    await createUser({ email: "unver@test.dev", emailVerified: false });
    const res = await agent().post("/api/v1/auth/login").send({
      email: "unver@test.dev",
      password: "Password123",
    });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not verified/i);
  });

  it("logs in verified user and returns accessToken", async () => {
    await createUser({ email: "ver@test.dev" });
    const res = await agent().post("/api/v1/auth/login").send({
      email: "ver@test.dev",
      password: "Password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.headers["set-cookie"]?.[0]).toMatch(/workbridge_rt/);
  });

  it("rejects wrong password with generic 401", async () => {
    await createUser({ email: "wrong@test.dev" });
    const res = await agent().post("/api/v1/auth/login").send({
      email: "wrong@test.dev",
      password: "WrongPass999",
    });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid email or password");
  });
});