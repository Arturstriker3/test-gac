import { Module } from "@nestjs/common";
import { CommonConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./common/database/database.module";
import { AppController } from "./app.controller";
import { OrganizationModule } from "./modules/organization/organization.module";

@Module({
  imports: [CommonConfigModule, DatabaseModule, OrganizationModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
