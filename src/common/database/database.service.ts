import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { AppConfigService } from "../config/app-config.service";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly config: AppConfigService) {
    this.pool = new Pool({
      host: this.config.dbHost,
      port: this.config.dbPort,
      database: this.config.dbName,
      user: this.config.dbUser,
      password: this.config.dbPassword,
    });
  }

  async ping(): Promise<void> {
    await this.pool.query("SELECT 1");
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, [...values]);
  }

  connect(): Promise<PoolClient> {
    return this.pool.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
