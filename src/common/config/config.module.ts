import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppConfigService } from "./app-config.service";
import { envSchema } from "./env.schema";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      validate: (rawEnvironment: Record<string, unknown>) => {
        const parsedEnvironment = envSchema.safeParse(rawEnvironment);
        if (!parsedEnvironment.success) {
          throw new Error(`Invalid environment variables: ${parsedEnvironment.error.message}`);
        }
        return parsedEnvironment.data;
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class CommonConfigModule {}
