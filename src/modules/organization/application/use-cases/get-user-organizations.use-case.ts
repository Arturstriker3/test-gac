import { Inject, Injectable } from "@nestjs/common";
import {
  NotFoundDomainError,
  InvalidNodeTypeDomainError,
} from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
} from "../../domain/organization.repository";
import type { OrganizationRepository } from "../../domain/organization.repository";
import { NODE_TYPES, OrganizationRelation } from "../../domain/node.types";

@Injectable()
export class GetUserOrganizationsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(userId: string): Promise<OrganizationRelation[]> {
    const node = await this.organizationRepository.findNodeById(userId);

    if (!node) {
      throw new NotFoundDomainError("user not found");
    }

    if (node.type !== NODE_TYPES.USER) {
      throw new InvalidNodeTypeDomainError("node is not a USER");
    }

    return this.organizationRepository.listUserOrganizations(userId);
  }
}
