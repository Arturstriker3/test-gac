import { Injectable, Logger } from "@nestjs/common";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { PoolClient } from "pg";
import { DatabaseService } from "./database.service";
import { Migration, MigrationConstructor } from "./migration.interface";

interface ExecutedMigrationRow {
  name: string;
}

@Injectable()
export class MigrationRunnerService {
  private readonly logger = new Logger(MigrationRunnerService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async runPendingMigrations(): Promise<void> {
    await this.ensureMigrationsTable();
    const executedMigrationNames = await this.loadExecutedMigrationNames();
    const migrations = await this.loadMigrations();

    for (const migration of migrations) {
      if (executedMigrationNames.has(migration.name)) {
        continue;
      }
      await this.runMigration(migration);
    }
  }

  private async ensureMigrationsTable(): Promise<void> {
    const queryRunner = await this.databaseService.connect();
    try {
      await queryRunner.query("BEGIN");
      const tableExists = await this.hasMigrationsTable(queryRunner);

      if (!tableExists) {
        await this.createMigrationsTable(queryRunner);
      } else {
        await this.migrateLegacySchemaIfNeeded(queryRunner);
      }

      await queryRunner.query("COMMIT");
    } catch (error) {
      await queryRunner.query("ROLLBACK");
      throw error;
    } finally {
      queryRunner.release();
    }
  }

  private async loadExecutedMigrationNames(): Promise<Set<string>> {
    const result = await this.databaseService.query<ExecutedMigrationRow>(`
      SELECT name
      FROM migrations
    `);
    return new Set(result.rows.map((row) => row.name));
  }

  private async loadMigrations(): Promise<Migration[]> {
    const migrationsDirectory = join(__dirname, "migrations");
    const directoryEntries = await readdir(migrationsDirectory, {
      withFileTypes: true,
    }).catch(() => []);
    const migrationFileNames = directoryEntries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter(
        (fileName) =>
          fileName.endsWith(".migration.js") ||
          fileName.endsWith(".migration.ts"),
      )
      .sort((left, right) => left.localeCompare(right));

    const loadedMigrations: Migration[] = [];
    for (const migrationFileName of migrationFileNames) {
      const migration = await this.loadMigrationFromFile(
        join(migrationsDirectory, migrationFileName),
      );
      loadedMigrations.push(migration);
    }
    return loadedMigrations;
  }

  private async loadMigrationFromFile(filePath: string): Promise<Migration> {
    const importedModule: unknown = await import(filePath);
    if (!this.isRecord(importedModule)) {
      throw new Error(`Invalid migration module: ${filePath}`);
    }
    const loadedModule = importedModule;
    const moduleExports = Object.values(loadedModule);
    const migrationExport = loadedModule.default ?? moduleExports[0];

    if (typeof migrationExport !== "function") {
      throw new Error(`Migration file ${filePath} does not export a class`);
    }

    const MigrationClass = migrationExport as MigrationConstructor;
    const migration = new MigrationClass();

    if (!migration.name) {
      throw new Error(`Migration in ${filePath} does not define name`);
    }

    return migration;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private async runMigration(migration: Migration): Promise<void> {
    const queryRunner = await this.databaseService.connect();
    try {
      await queryRunner.query("BEGIN");
      await migration.up(queryRunner);
      await queryRunner.query("INSERT INTO migrations (name) VALUES ($1)", [
        migration.name,
      ]);
      await queryRunner.query("COMMIT");
      this.logger.log(`Migration executed: ${migration.name}`);
    } catch (error) {
      await queryRunner.query("ROLLBACK");
      throw error;
    } finally {
      queryRunner.release();
    }
  }

  private async hasMigrationsTable(queryRunner: PoolClient): Promise<boolean> {
    const result = await queryRunner.query<{ regclass: string | null }>(`
      SELECT to_regclass('public.migrations') AS regclass
    `);
    return result.rows[0]?.regclass !== null;
  }

  private async createMigrationsTable(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE migrations (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX migrations_name_unique_idx ON migrations (name)
    `);
  }

  private async migrateLegacySchemaIfNeeded(
    queryRunner: PoolClient,
  ): Promise<void> {
    const idDataType = await this.loadIdColumnDataType(queryRunner);

    if (idDataType === "bigint") {
      await queryRunner.query(`
        ALTER TABLE migrations
        ADD COLUMN IF NOT EXISTS name VARCHAR(255)
      `);
      await queryRunner.query(`
        UPDATE migrations
        SET name = id::text
        WHERE name IS NULL
      `);
      await queryRunner.query(`
        ALTER TABLE migrations
        ALTER COLUMN name SET NOT NULL
      `);
      await queryRunner.query(`
        ALTER TABLE migrations
        ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      `);
      await queryRunner.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS migrations_name_unique_idx
        ON migrations (name)
      `);
      return;
    }

    await queryRunner.query(`
      ALTER TABLE migrations
      RENAME TO migrations_legacy
    `);
    await this.createMigrationsTable(queryRunner);
    await queryRunner.query(`
      INSERT INTO migrations (name, executed_at)
      SELECT id::text, COALESCE(executed_at, NOW())
      FROM migrations_legacy
    `);
    await queryRunner.query(`
      DROP TABLE migrations_legacy
    `);
  }

  private async loadIdColumnDataType(
    queryRunner: PoolClient,
  ): Promise<string | null> {
    const result = await queryRunner.query<{ data_type: string }>(
      `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'migrations'
        AND column_name = 'id'
      `,
    );
    return result.rows[0]?.data_type ?? null;
  }
}
