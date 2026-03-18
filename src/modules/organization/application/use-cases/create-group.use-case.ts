import { Inject, Injectable } from "@nestjs/common";
import { BadRequestDomainError } from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
} from "../../domain/organization.repository";
import type { OrganizationRepository } from "../../domain/organization.repository";
import { Node } from "../../domain/node.types";

interface CreateGroupInput {
  name: string;
  parentId?: string;
}

@Injectable()
export class CreateGroupUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(input: CreateGroupInput): Promise<Node> {
    const name = input.name.trim();

    if (!name) {
      throw new BadRequestDomainError("name is required");
    }

    const parentId = input.parentId?.trim();

    return this.organizationRepository.createGroup({
      name,
      parentId: parentId || undefined,
    });
  }
}
