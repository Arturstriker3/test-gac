import { Module } from "@nestjs/common";
import { CommonConfigModule } from "./common/config/config.module";
import { DatabaseModule } from "./common/database/database.module";
import { AppController } from "./app.controller";

@Module({
  imports: [CommonConfigModule, DatabaseModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
