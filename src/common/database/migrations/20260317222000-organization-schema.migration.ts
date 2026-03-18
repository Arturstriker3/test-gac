import { PoolClient } from "pg";
import { Migration } from "../migration.interface";

export default class OrganizationSchema20260317222000 implements Migration {
  name = "20260317222000-organization-schema";

  async up(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto"
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS nodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(16) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT nodes_type_valid_check CHECK (type IN ('USER', 'GROUP')),
        CONSTRAINT nodes_email_type_check CHECK (
          (type = 'USER' AND email IS NOT NULL)
          OR (type = 'GROUP' AND email IS NULL)
        )
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS nodes_user_email_unique_idx
      ON nodes (email)
      WHERE type = 'USER' AND email IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS nodes_type_idx
      ON nodes (type)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS node_closure (
        ancestor_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        descendant_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        depth INTEGER NOT NULL,
        PRIMARY KEY (ancestor_id, descendant_id),
        CONSTRAINT node_closure_depth_non_negative_check CHECK (depth >= 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS node_closure_ancestor_depth_idx
      ON node_closure (ancestor_id, depth)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS node_closure_descendant_depth_idx
      ON node_closure (descendant_id, depth)
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_group_links (
        user_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        group_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, group_id)
      )
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION validate_user_group_link_types()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM nodes WHERE id = NEW.user_id AND type = 'USER'
        ) THEN
          RAISE EXCEPTION 'user_id must reference USER node';
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM nodes WHERE id = NEW.group_id AND type = 'GROUP'
        ) THEN
          RAISE EXCEPTION 'group_id must reference GROUP node';
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS user_group_links_type_validation_trigger
      ON user_group_links
    `);

    await queryRunner.query(`
      CREATE TRIGGER user_group_links_type_validation_trigger
      BEFORE INSERT OR UPDATE ON user_group_links
      FOR EACH ROW
      EXECUTE FUNCTION validate_user_group_link_types()
    `);
  }

  async down(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS user_group_links_type_validation_trigger
      ON user_group_links
    `);

    await queryRunner.query(`
      DROP FUNCTION IF EXISTS validate_user_group_link_types
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS user_group_links
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS node_closure
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS nodes
    `);
  }
}
