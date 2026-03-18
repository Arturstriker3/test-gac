import { Injectable } from "@nestjs/common";
import { PoolClient } from "pg";
import { DatabaseService } from "../../../common/database/database.service";
import { ObservabilityService } from "../../../common/observability/observability.service";
import {
  ConflictDomainError,
  InvalidNodeTypeDomainError,
  NotFoundDomainError,
} from "../domain/organization.errors";
import type { OrganizationRepository } from "../domain/organization.repository";
import {
  NODE_TYPES,
  Node,
  NodeType,
  OrganizationRelation,
} from "../domain/node.types";

interface NodeRow {
  id: string;
  type: NodeType;
  name: string;
  email: string | null;
  created_at: Date;
}

interface OrganizationRelationRow {
  id: string;
  name: string;
  depth: number;
}

@Injectable()
export class PostgresOrganizationRepository implements OrganizationRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly observability: ObservabilityService,
  ) {}

  async createUser(input: { name: string; email: string }): Promise<Node> {
    return this.observability.runInSpan(
      "organization.node.create_user",
      { "organization.node.type": NODE_TYPES.USER },
      async () => {
        const queryRunner = await this.databaseService.connect();
        try {
          await queryRunner.query("BEGIN");
          const insertedUser = await queryRunner.query<NodeRow>(
            `
            INSERT INTO nodes (type, name, email)
            VALUES ($1, $2, $3)
            RETURNING id, type, name, email, created_at
            `,
            [NODE_TYPES.USER, input.name, input.email],
          );
          const node = this.mapNodeRow(insertedUser.rows[0]);

          await queryRunner.query(
            `
            INSERT INTO node_closure (ancestor_id, descendant_id, depth)
            VALUES ($1, $1, 0)
            `,
            [node.id],
          );

          await queryRunner.query("COMMIT");
          this.observability.info("user node created", { "node.id": node.id });
          return node;
        } catch (error) {
          await queryRunner.query("ROLLBACK");
          this.rethrowConflictIfNeeded(error);
          throw error;
        } finally {
          queryRunner.release();
        }
      },
    );
  }

  async createGroup(input: { name: string; parentId?: string }): Promise<Node> {
    return this.observability.runInSpan(
      "organization.node.create_group",
      {
        "organization.node.type": NODE_TYPES.GROUP,
        "organization.group.has_parent": Boolean(input.parentId),
      },
      async () => {
        const queryRunner = await this.databaseService.connect();
        try {
          await queryRunner.query("BEGIN");

          if (input.parentId) {
            await this.assertNodeTypeWithRunner(
              queryRunner,
              input.parentId,
              NODE_TYPES.GROUP,
            );
          }

          const insertedGroup = await queryRunner.query<NodeRow>(
            `
            INSERT INTO nodes (type, name, email)
            VALUES ($1, $2, NULL)
            RETURNING id, type, name, email, created_at
            `,
            [NODE_TYPES.GROUP, input.name],
          );
          const node = this.mapNodeRow(insertedGroup.rows[0]);

          await queryRunner.query(
            `
            INSERT INTO node_closure (ancestor_id, descendant_id, depth)
            VALUES ($1, $1, 0)
            `,
            [node.id],
          );

          if (input.parentId) {
            await this.observability.runInSpan(
              "organization.closure.update",
              { "organization.group.parent_id": input.parentId },
              async () => {
                await queryRunner.query(
                  `
                  INSERT INTO node_closure (ancestor_id, descendant_id, depth)
                  SELECT ancestor_id, $1, depth + 1
                  FROM node_closure
                  WHERE descendant_id = $2
                  ON CONFLICT (ancestor_id, descendant_id)
                  DO UPDATE SET depth = LEAST(node_closure.depth, EXCLUDED.depth)
                  `,
                  [node.id, input.parentId],
                );
              },
            );
          }

          await queryRunner.query("COMMIT");
          this.observability.info("group node created", { "node.id": node.id });
          return node;
        } catch (error) {
          await queryRunner.query("ROLLBACK");
          this.rethrowConflictIfNeeded(error);
          throw error;
        } finally {
          queryRunner.release();
        }
      },
    );
  }

  async linkUserToGroup(input: {
    userId: string;
    groupId: string;
  }): Promise<void> {
    await this.observability.runInSpan(
      "organization.link.user_to_group",
      {
        "organization.user_id": input.userId,
        "organization.group_id": input.groupId,
      },
      async () => {
        await this.assertNodeType(input.userId, NODE_TYPES.USER);
        await this.assertNodeType(input.groupId, NODE_TYPES.GROUP);

        await this.databaseService.query(
          `
          INSERT INTO user_group_links (user_id, group_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, group_id) DO NOTHING
          `,
          [input.userId, input.groupId],
        );
      },
    );
  }

  async findNodeById(nodeId: string): Promise<Node | null> {
    const result = await this.databaseService.query<NodeRow>(
      `
      SELECT id, type, name, email, created_at
      FROM nodes
      WHERE id = $1
      `,
      [nodeId],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return this.mapNodeRow(row);
  }

  async listUserOrganizations(userId: string): Promise<OrganizationRelation[]> {
    return this.observability.runInSpan(
      "organization.query.user_organizations",
      { "organization.user_id": userId },
      async () => {
        const result =
          await this.databaseService.query<OrganizationRelationRow>(
            `
          SELECT
            groups.id,
            groups.name,
            (MIN(closure.depth) + 1)::int AS depth
          FROM user_group_links links
          INNER JOIN node_closure closure ON closure.descendant_id = links.group_id
          INNER JOIN nodes groups ON groups.id = closure.ancestor_id
          WHERE links.user_id = $1
            AND groups.type = $2
          GROUP BY groups.id, groups.name
          ORDER BY MIN(closure.depth), groups.name
          `,
            [userId, NODE_TYPES.GROUP],
          );

        return result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          depth: Number(row.depth),
        }));
      },
    );
  }

  async listAncestors(nodeId: string): Promise<OrganizationRelation[]> {
    return this.observability.runInSpan(
      "organization.query.ancestors",
      { "organization.node_id": nodeId },
      async () => {
        const result =
          await this.databaseService.query<OrganizationRelationRow>(
            `
          SELECT ancestors.id, ancestors.name, closure.depth::int AS depth
          FROM node_closure closure
          INNER JOIN nodes ancestors ON ancestors.id = closure.ancestor_id
          WHERE closure.descendant_id = $1
            AND closure.depth >= 1
          ORDER BY closure.depth, ancestors.name
          `,
            [nodeId],
          );

        return result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          depth: Number(row.depth),
        }));
      },
    );
  }

  async listDescendants(nodeId: string): Promise<OrganizationRelation[]> {
    return this.observability.runInSpan(
      "organization.query.descendants",
      { "organization.node_id": nodeId },
      async () => {
        const result =
          await this.databaseService.query<OrganizationRelationRow>(
            `
          SELECT descendants.id, descendants.name, closure.depth::int AS depth
          FROM node_closure closure
          INNER JOIN nodes descendants ON descendants.id = closure.descendant_id
          WHERE closure.ancestor_id = $1
            AND closure.depth >= 1
          ORDER BY closure.depth, descendants.name
          `,
            [nodeId],
          );

        return result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          depth: Number(row.depth),
        }));
      },
    );
  }

  async assertNodeType(nodeId: string, expectedType: NodeType): Promise<void> {
    const node = await this.findNodeById(nodeId);

    if (!node) {
      throw new NotFoundDomainError("node not found");
    }

    if (node.type !== expectedType) {
      throw new InvalidNodeTypeDomainError(
        `node must be of type ${expectedType}`,
      );
    }
  }

  private async assertNodeTypeWithRunner(
    queryRunner: PoolClient,
    nodeId: string,
    expectedType: NodeType,
  ): Promise<void> {
    const result = await queryRunner.query<NodeRow>(
      `
      SELECT id, type, name, email, created_at
      FROM nodes
      WHERE id = $1
      `,
      [nodeId],
    );

    const node = result.rows[0];
    if (!node) {
      throw new NotFoundDomainError("node not found");
    }

    if (node.type !== expectedType) {
      throw new InvalidNodeTypeDomainError(
        `node must be of type ${expectedType}`,
      );
    }
  }

  private mapNodeRow(row: NodeRow): Node {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      email: row.email,
      createdAt: row.created_at,
    };
  }

  private rethrowConflictIfNeeded(error: unknown): void {
    if (!this.isRecord(error)) {
      return;
    }

    if (error.code === "23505") {
      throw new ConflictDomainError("resource already exists");
    }
  }

  private isRecord(value: unknown): value is Record<string, string> {
    return typeof value === "object" && value !== null;
  }
}
