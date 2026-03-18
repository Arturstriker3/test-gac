import { Inject, Injectable } from "@nestjs/common";
import { NotFoundDomainError } from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
} from "../../domain/organization.repository";
import type { OrganizationRepository } from "../../domain/organization.repository";
import { OrganizationRelation } from "../../domain/node.types";

@Injectable()
export class GetNodeAncestorsUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(nodeId: string): Promise<OrganizationRelation[]> {
    const node = await this.organizationRepository.findNodeById(nodeId);

    if (!node) {
      throw new NotFoundDomainError("node not found");
    }

    return this.organizationRepository.listAncestors(nodeId);
  }
}
