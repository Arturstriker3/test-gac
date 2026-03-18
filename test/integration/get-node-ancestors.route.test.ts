import { describe, expect, it } from "bun:test";
import {
  type CreatedGroup,
  type OrganizationRelationResponse,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("GET /nodes/:id/ancestors", () => {
  const { getApp } = useIntegrationTestContext();

  it("retorna ancestrais", async () => {
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
      url: `/nodes/${childGroup.id}/ancestors`,
    });

    expect(response.statusCode).toBe(200);
    const ancestors = parseJson<OrganizationRelationResponse[]>(response.payload);
    expect(ancestors).toEqual([
      {
        id: rootGroup.id,
        name: "Empresa",
        depth: 1,
      },
    ]);
  });
});
