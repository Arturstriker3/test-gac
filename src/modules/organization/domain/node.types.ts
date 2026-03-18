export const NODE_TYPES = {
  USER: "USER",
  GROUP: "GROUP",
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

export interface Node {
  id: string;
  type: NodeType;
  name: string;
  email: string | null;
  createdAt: Date;
}

export interface OrganizationRelation {
  id: string;
  name: string;
  depth: number;
}

export interface UserGroupLink {
  userId: string;
  groupId: string;
}

export interface NodeClosure {
  ancestorId: string;
  descendantId: string;
  depth: number;
}
