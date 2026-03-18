import { Module } from "@nestjs/common";
import { CreateGroupUseCase } from "./application/use-cases/create-group.use-case";
import { CreateUserUseCase } from "./application/use-cases/create-user.use-case";
import { GetNodeAncestorsUseCase } from "./application/use-cases/get-node-ancestors.use-case";
import { GetNodeDescendantsUseCase } from "./application/use-cases/get-node-descendants.use-case";
import { GetUserOrganizationsUseCase } from "./application/use-cases/get-user-organizations.use-case";
import { LinkUserToGroupUseCase } from "./application/use-cases/link-user-to-group.use-case";
import { ORGANIZATION_REPOSITORY } from "./domain/organization.repository";
import { PostgresOrganizationRepository } from "./infrastructure/postgres-organization.repository";
import { OrganizationController } from "./presentation/rest/organization.controller";

@Module({
  controllers: [OrganizationController],
  providers: [
    CreateUserUseCase,
    CreateGroupUseCase,
    LinkUserToGroupUseCase,
    GetUserOrganizationsUseCase,
    GetNodeAncestorsUseCase,
    GetNodeDescendantsUseCase,
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: PostgresOrganizationRepository,
    },
  ],
})
export class OrganizationModule {}
