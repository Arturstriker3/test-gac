import { PoolClient } from "pg";

export interface Migration {
  name: string;
  up(queryRunner: PoolClient): Promise<void>;
  down(queryRunner: PoolClient): Promise<void>;
}

export interface MigrationConstructor {
  new (): Migration;
}
