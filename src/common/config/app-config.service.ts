import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvVariables } from "./env.schema";

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvVariables, true>,
  ) {}

  get port(): number {
    return this.configService.get("PORT", { infer: true });
  }

  get dbHost(): string {
    return this.configService.get("DB_HOST", { infer: true });
  }

  get dbPort(): number {
    return this.configService.get("DB_PORT", { infer: true });
  }

  get dbName(): string {
    return this.configService.get("DB_NAME", { infer: true });
  }

  get dbUser(): string {
    return this.configService.get("DB_USER", { infer: true });
  }

  get dbPassword(): string {
    return this.configService.get("DB_PASSWORD", { infer: true });
  }
}
