import { describe, expect, it } from "bun:test";
import {
  type ErrorResponse,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("GET /users/:id/organizations - domain error", () => {
  const { getApp } = useIntegrationTestContext();

  it("retorna erro de domínio com shape padronizado", async () => {
    const response = await getApp().inject({
      method: "GET",
      url: "/users/49ef15c1-467a-4f27-bdc9-7aefca8381e9/organizations",
    });

    expect(response.statusCode).toBe(404);
    const body = parseJson<ErrorResponse>(response.payload);
    expect(body.statusCode).toBe(404);
    expect(body.code).toBe("NOT_FOUND");
    expect(body.message).toBe("user not found");
    expect(body.details).toBeNull();
  });
});
