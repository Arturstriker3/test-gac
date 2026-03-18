import { describe, expect, it } from "bun:test";
import {
  type CreatedGroup,
  type CreatedUser,
  parseJson,
  useIntegrationTestContext,
} from "./helpers/integration-test-context";

describe("POST /users/:id/groups", () => {
  const { getApp } = useIntegrationTestContext();

  it("associa usuário ao grupo", async () => {
    const userResponse = await getApp().inject({
      method: "POST",
      url: "/users",
      payload: {
        name: "João",
        email: "joao@example.com",
      },
    });
    const groupResponse = await getApp().inject({
      method: "POST",
      url: "/groups",
      payload: {
        name: "Engineering",
      },
    });
    const user = parseJson<CreatedUser>(userResponse.payload);
    const group = parseJson<CreatedGroup>(groupResponse.payload);

    const response = await getApp().inject({
      method: "POST",
      url: `/users/${user.id}/groups`,
      payload: {
        groupId: group.id,
      },
    });

    expect(response.statusCode).toBe(204);
  });
});
