import { Node, NodeType, OrganizationRelation } from "./node.types";

export const ORGANIZATION_REPOSITORY = Symbol("ORGANIZATION_REPOSITORY");

export interface OrganizationRepository {
  createUser(input: { name: string; email: string }): Promise<Node>;
  createGroup(input: { name: string; parentId?: string }): Promise<Node>;
  linkUserToGroup(input: { userId: string; groupId: string }): Promise<void>;
  findNodeById(nodeId: string): Promise<Node | null>;
  listUserOrganizations(userId: string): Promise<OrganizationRelation[]>;
  listAncestors(nodeId: string): Promise<OrganizationRelation[]>;
  listDescendants(nodeId: string): Promise<OrganizationRelation[]>;
  assertNodeType(nodeId: string, expectedType: NodeType): Promise<void>;
}
