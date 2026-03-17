import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import { AppConfigService } from "./common/config/app-config.service";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const appConfig = app.get(AppConfigService);
  await app.listen(appConfig.port, "0.0.0.0");
}

void bootstrap();
