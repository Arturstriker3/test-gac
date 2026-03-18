import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import {
  HookHandlerDoneFunction,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { ZodValidationPipe } from "./common/validation/zod-validation.pipe";
import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/app-config.service";
import { MigrationRunnerService } from "./common/database/migration-runner.service";
import { ObservabilityService } from "./common/observability/observability.service";
import { DomainErrorFilter } from "./modules/organization/presentation/rest/domain-error.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const appConfig = app.get(AppConfigService);
  const migrationRunner = app.get(MigrationRunnerService);
  const observability = app.get(ObservabilityService);
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new DomainErrorFilter());

  const requestStartedAt = new WeakMap<FastifyRequest, bigint>();
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook(
    "onRequest",
    (
      request: FastifyRequest,
      _reply: FastifyReply,
      done: HookHandlerDoneFunction,
    ) => {
    requestStartedAt.set(request, process.hrtime.bigint());
      done();
    },
  );
  fastify.addHook(
    "onResponse",
    (
      request: FastifyRequest,
      reply: FastifyReply,
      done: HookHandlerDoneFunction,
    ) => {
      const startTime = requestStartedAt.get(request);
      if (!startTime) {
        done();
        return;
      }

      const durationMs =
        Number(process.hrtime.bigint() - startTime) / 1_000_000;
      const statusCode = reply.statusCode;
      const httpRoute = request.routeOptions?.url ?? request.url;
      const isSuccess = statusCode < 400;

      observability.info("http request completed", {
        "event.dataset": "gac.http",
        "metric.kind": "request",
        http_method: request.method.toUpperCase(),
        http_route: httpRoute,
        http_status_code: statusCode,
        http_status_group: `${Math.floor(statusCode / 100)}xx`,
        http_success: isSuccess,
        http_slow: durationMs >= 300,
        http_duration_ms: Number(durationMs.toFixed(2)),
      });
      done();
    },
  );

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
