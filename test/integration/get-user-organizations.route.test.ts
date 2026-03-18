import { describe, expect, it } from "bun:test";
import {
  type CreatedGroup,
  type CreatedUser,
  type OrganizationRelationResponse,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("GET /users/:id/organizations", () => {
  const { getApp } = useIntegrationTestContext();

  it("retorna organizações diretas e ancestrais", async () => {
    const userResponse = await getApp().inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "Ana",
        email: "ana@example.com",
      },
    });
    const parentGroupResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Empresa",
      },
    });
    const parentGroup = parseJson<CreatedGroup>(parentGroupResponse.payload);
    const childGroupResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Engenharia",
        parentId: parentGroup.id,
      },
    });

    const user = parseJson<CreatedUser>(userResponse.payload);
    const childGroup = parseJson<CreatedGroup>(childGroupResponse.payload);

    await getApp().inject({
      method: "POST",
      url: `/users/${user.id}/groups`,
      payload: {
        groupId: childGroup.id,
      },
    });

    const response = await getApp().inject({
      method: "GET",
      url: `/users/${user.id}/organizations`,
    });

    expect(response.statusCode).toBe(200);
    const organizations = parseJson<OrganizationRelationResponse[]>(response.payload);
    expect(organizations).toEqual([
      {
        id: childGroup.id,
        name: "Engenharia",
        depth: 0,
      },
      {
        id: parentGroup.id,
        name: "Empresa",
        depth: 1,
      },
    ]);
  });
});
