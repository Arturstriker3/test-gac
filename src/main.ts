import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ZodValidationPipe } from "./common/validation/zod-validation.pipe";
import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/app-config.service";
import { MigrationRunnerService } from "./common/database/migration-runner.service";
import { DomainErrorFilter } from "./modules/organization/presentation/rest/domain-error.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const appConfig = app.get(AppConfigService);
  const migrationRunner = app.get(MigrationRunnerService);
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new DomainErrorFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Teste GAC API")
    .setDescription("Documentação da API")
    .setVersion("1.0.0")
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument);

  await migrationRunner.runPendingMigrations();
  await app.listen(appConfig.port, "0.0.0.0");
  logger.log(`API running on http://localhost:${appConfig.port}`);
  logger.log(`Swagger running on http://localhost:${appConfig.port}/docs`);
}

void bootstrap();
