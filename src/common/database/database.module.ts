import { Global, Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { MigrationRunnerService } from "./migration-runner.service";

@Global()
@Module({
  providers: [DatabaseService, MigrationRunnerService],
  exports: [DatabaseService, MigrationRunnerService],
})
export class DatabaseModule {}
