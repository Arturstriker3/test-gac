import { describe, expect, it } from "bun:test";
import {
  type ErrorResponse,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("GET /users/:id/organizations - validation error", () => {
  const { getApp } = useIntegrationTestContext();

  it("retorna 400 + VALIDATION_ERROR quando id não é UUID", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/users/not-a-uuid/organizations",
    });

    expect(response.statusCode).toBe(400);
    const body = parseJson<ErrorResponse>(response.payload);
    expect(body.statusCode).toBe(400);
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("Validation failed");
    expect(body.details).toBeDefined();
  });
});
