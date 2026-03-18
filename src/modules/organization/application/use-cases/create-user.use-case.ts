import { Inject, Injectable } from "@nestjs/common";
import {
  BadRequestDomainError,
  ConflictDomainError,
} from "../../domain/organization.errors";
import {
  ORGANIZATION_REPOSITORY,
} from "../../domain/organization.repository";
import type { OrganizationRepository } from "../../domain/organization.repository";
import { Node } from "../../domain/node.types";

interface CreateUserInput {
  name: string;
  email: string;
}

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY)
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  async execute(input: CreateUserInput): Promise<Node> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) {
      throw new BadRequestDomainError("name is required");
    }

    if (!email) {
      throw new BadRequestDomainError("email is required");
    }

    try {
      return await this.organizationRepository.createUser({ name, email });
    } catch (error) {
      if (error instanceof ConflictDomainError) {
        throw error;
      }
      throw error;
    }
  }
}
