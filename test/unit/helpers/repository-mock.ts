import type { OrganizationRepository } from "../../../src/modules/organization/domain/organization.repository";
import { NODE_TYPES, type Node, type OrganizationRelation } from "../../../src/modules/organization/domain/node.types";

export function buildNode(input: Partial<Node> = {}): Node {
  return {
    id: input.id ?? "f9f7f48e-1491-4de0-87e7-e3fd615f8026",
    type: input.type ?? NODE_TYPES.USER,
    name: input.name ?? "Default Name",
    email: input.email ?? "default@example.com",
    createdAt: input.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
  };
}

export function buildOrganizationRelation(
  input: Partial<OrganizationRelation> = {},
): OrganizationRelation {
  return {
    id: input.id ?? "c2d3e7f9-209b-40d2-8f87-4fc6780e653a",
    name: input.name ?? "Engineering",
    depth: input.depth ?? 1,
  };
}

export function createRepositoryMock(
  overrides: Partial<OrganizationRepository> = {},
): OrganizationRepository {
  return {
    createUser: async () => {
      throw new Error("createUser not mocked");
    },
    createGroup: async () => {
      throw new Error("createGroup not mocked");
    },
    linkUserToGroup: async () => {
      throw new Error("linkUserToGroup not mocked");
    },
    findNodeById: async () => {
      throw new Error("findNodeById not mocked");
    },
    listUserOrganizations: async () => {
      throw new Error("listUserOrganizations not mocked");
    },
    listAncestors: async () => {
      throw new Error("listAncestors not mocked");
    },
    listDescendants: async () => {
      throw new Error("listDescendants not mocked");
    },
    assertNodeType: async () => {
      throw new Error("assertNodeType not mocked");
    },
    ...overrides,
  };
}
