import { Inject, Injectable } from "@nestjs/common";
import { BadRequestDomainError } from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from "../../domain/organization.repository";

interface LinkUserToGroupInput {
  userId: string;
  groupId: string;
}

@Injectable()
export class LinkUserToGroupUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(input: LinkUserToGroupInput): Promise<void> {
    const userId = input.userId.trim();
    const groupId = input.groupId.trim();

    if (!userId) {
      throw new BadRequestDomainError("userId is required");
    }

    if (!groupId) {
      throw new BadRequestDomainError("groupId is required");
    }

    await this.organizationRepository.linkUserToGroup({ userId, groupId });
  }
}
