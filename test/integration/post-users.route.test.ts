import { describe, expect, it } from "bun:test";
import { z } from "zod";
import {
  type CreatedUser,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

const uuidSchema = z.string().uuid();

describe("POST /users", () => {
  const { getApp } = useIntegrationTestContext();

  it("cria usuário", async () => {
    const response = await getApp().inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Maria",
        email: "maria@example.com",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = parseJson<CreatedUser>(response.payload);
    expect(uuidSchema.safeParse(body.id).success).toBe(true);
    expect(body.type).toBe("USER");
    expect(body.name).toBe("Maria");
    expect(body.email).toBe("maria@example.com");
  });
});
