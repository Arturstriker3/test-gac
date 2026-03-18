import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

function toKebabCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function toPascalCase(value: string): string {
  return toKebabCase(value)
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function buildTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}${second}`;
}

async function main(): Promise<void> {
  const migrationName = process.argv[2] ?? "";
  const normalizedName = toKebabCase(migrationName);

  if (!normalizedName) {
    throw new Error("Use: bun run migration:create <migration-name>");
  }

  const timestamp = buildTimestamp();
  const className = `${toPascalCase(normalizedName)}${timestamp}`;
  const migrationId = `${timestamp}-${normalizedName}`;
  const migrationsDirectory = join(
    process.cwd(),
    "src",
    "common",
    "database",
    "migrations",
  );
  const filePath = join(migrationsDirectory, `${migrationId}.migration.ts`);

  const template = `import { PoolClient } from "pg";
import { Migration } from "../migration.interface";

export default class ${className} implements Migration {
  name = "${migrationId}";

  async up(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query("SELECT 1");
  }

  async down(queryRunner: PoolClient): Promise<void> {
    await queryRunner.query("SELECT 1");
  }
}
`;

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, template, "utf-8");

  process.stdout.write(`Migration created: ${filePath}\n`);
}

void main();
