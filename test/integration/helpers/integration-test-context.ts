import { afterAll, beforeAll, beforeEach } from "bun:test";
import { Test, type TestingModule } from "@nestjs/testing";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "../../../src/app.module";
import { ZodValidationPipe } from "../../../src/common/validation/zod-validation.pipe";
import { MigrationRunnerService } from "../../../src/common/database/migration-runner.service";
import { DatabaseService } from "../../../src/common/database/database.service";
import { DomainErrorFilter } from "../../../src/modules/organization/presentation/rest/domain-error.filter";

export interface CreatedUser {
  id: string;
  type: "USER";
  name: string;
  email: string;
}

export interface CreatedGroup {
  id: string;
  type: "GROUP";
  name: string;
}

export interface OrganizationRelationResponse {
  id: string;
  name: string;
  depth: number;
}

export function parseJson<T>(payload: string): T {
  return JSON.parse(payload) as T;
}

export function useIntegrationTestContext(): {
  getApp: () => NestFastifyApplication;
} {
  let app!: NestFastifyApplication;
  let databaseService!: DatabaseService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new DomainErrorFilter());

    const migrationRunner = app.get(MigrationRunnerService);
    databaseService = app.get(DatabaseService);

    await migrationRunner.runPendingMigrations();
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  beforeEach(async () => {
    await databaseService.query(`
      TRUNCATE TABLE user_group_links, node_closure, nodes CASCADE
    `);
  });

  afterAll(async () => {
    await app.close();
  });

  return {
    getApp: () => app,
  };
}
