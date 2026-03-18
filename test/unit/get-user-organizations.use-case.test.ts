import { describe, expect, it } from "bun:test";
import { GetUserOrganizationsUseCase } from "../../src/modules/organization/application/use-cases/get-user-organizations.use-case";
import {
  InvalidNodeTypeDomainError,
  NotFoundDomainError,
} from "../../src/modules/organization/domain/organization.errors";
import { NODE_TYPES } from "../../src/modules/organization/domain/node.types";
import {
  buildNode,
  buildOrganizationRelation,
  createRepositoryMock,
} from "./helpers/repository-mock";

describe("GetUserOrganizationsUseCase", () => {
  it("retorna organizações quando nó é USER", async () => {
    const relations = [buildOrganizationRelation({ depth: 1 })];
    const repository = createRepositoryMock({
      findNodeById: async () =>
        buildNode({
          type: NODE_TYPES.USER,
          email: "user@example.com",
        }),
      listUserOrganizations: async () => relations,
    });
    const useCase = new GetUserOrganizationsUseCase(repository);

    const result = await useCase.execute("49ef15c1-467a-4f27-bdc9-7aefca8381e9");
    expect(result).toEqual(relations);
  });

  it("lança NotFound quando usuário não existe", async () => {
    const repository = createRepositoryMock({
      findNodeById: async () => null,
      listUserOrganizations: async () => [buildOrganizationRelation()],
    });
    const useCase = new GetUserOrganizationsUseCase(repository);

    await expect(
      useCase.execute("49ef15c1-467a-4f27-bdc9-7aefca8381e9"),
    ).rejects.toBeInstanceOf(NotFoundDomainError);
  });

  it("lança InvalidNodeType quando nó não é USER", async () => {
    const repository = createRepositoryMock({
      findNodeById: async () =>
        buildNode({
          type: NODE_TYPES.GROUP,
          email: null,
        }),
      listUserOrganizations: async () => [buildOrganizationRelation()],
    });
    const useCase = new GetUserOrganizationsUseCase(repository);

    await expect(
      useCase.execute("49ef15c1-467a-4f27-bdc9-7aefca8381e9"),
    ).rejects.toBeInstanceOf(InvalidNodeTypeDomainError);
  });
});
