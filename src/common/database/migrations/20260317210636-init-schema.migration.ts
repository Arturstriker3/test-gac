import { PoolClient } from "pg";
import { Migration } from "../migration.interface";

export default class InitSchema20260317210636 implements Migration {
  name = "20260317210636-init-schema";

  async up(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query("SELECT 1");
  }

  async down(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query("SELECT 1");
  }
}
