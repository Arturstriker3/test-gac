import { describe, expect, it } from "bun:test";
import {
  type CreatedGroup,
  type OrganizationRelationResponse,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("GET /nodes/:id/descendants", () => {
  const { getApp } = useIntegrationTestContext();

  it("retorna descendentes", async () => {
    const rootResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Empresa",
      },
    });
    const rootGroup = parseJson<CreatedGroup>(rootResponse.payload);
    const childResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Tecnologia",
        parentId: rootGroup.id,
      },
    });
    const childGroup = parseJson<CreatedGroup>(childResponse.payload);

    const response = await getApp().inject({
      method: "GET",
      url: `/nodes/${rootGroup.id}/descendants`,
    });

    expect(response.statusCode).toBe(200);
    const descendants = parseJson<OrganizationRelationResponse[]>(response.payload);
    expect(descendants).toEqual([
      {
        id: childGroup.id,
        name: "Tecnologia",
        depth: 1,
      },
    ]);
  });
});
