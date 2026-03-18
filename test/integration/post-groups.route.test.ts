import { describe, expect, it } from "bun:test";
import { z } from "zod";
import {
  type CreatedGroup,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

const uuidSchema = z.string().uuid();

describe("POST /groups", () => {
  const { getApp } = useIntegrationTestContext();

  it("cria grupo raiz e grupo filho", async () => {
    const rootResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Empresa",
      },
    });
    expect(rootResponse.statusCode).toBe(201);
    const root = parseJson<CreatedGroup>(rootResponse.payload);

    const childResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Tecnologia",
        parentId: root.id,
      },
    });
    expect(childResponse.statusCode).toBe(201);
    const child = parseJson<CreatedGroup>(childResponse.payload);

    expect(uuidSchema.safeParse(root.id).success).toBe(true);
    expect(root.type).toBe("GROUP");
    expect(root.name).toBe("Empresa");
    expect(uuidSchema.safeParse(child.id).success).toBe(true);
    expect(child.type).toBe("GROUP");
    expect(child.name).toBe("Tecnologia");
  });
});
