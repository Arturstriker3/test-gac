import { describe, expect, it } from "bun:test";
import {
  type ErrorResponse,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("POST /users - invalid json", () => {
  const { getApp } = useIntegrationTestContext();

  it("retorna 400 com shape padronizado para JSON inválido", async () => {
    const response = await getApp().inject({
      method: "POST",
      url: "/users",
      headers: {
        "content-type": "application/json",
      },
      payload: '{"name":"Maria","email":"maria@example.com"',
    });

    expect(response.statusCode).toBe(400);
    const body = parseJson<ErrorResponse>(response.payload);
    expect(body.statusCode).toBe(400);
    expect(body.code).toBe("MALFORMED_JSON");
    expect(body.message).toBe("Malformed JSON body");
    expect(body.details).toBeNull();
  });
});
