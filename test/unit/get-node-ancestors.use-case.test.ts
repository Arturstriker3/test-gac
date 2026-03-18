import { describe, expect, it } from "bun:test";
import { GetNodeAncestorsUseCase } from "../../src/modules/organization/application/use-cases/get-node-ancestors.use-case";
import { NotFoundDomainError } from "../../src/modules/organization/domain/organization.errors";
import { buildOrganizationRelation, createRepositoryMock } from "./helpers/repository-mock";

describe("GetNodeAncestorsUseCase", () => {
  it("retorna ancestrais quando nó existe", async () => {
    const relations = [buildOrganizationRelation({ depth: 1 })];
    const repository = createRepositoryMock({
      findNodeById: async () => ({
        id: "f9f7f48e-1491-4de0-87e7-e3fd615f8026",
        type: "GROUP",
        name: "Engenharia",
        email: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      }),
      listAncestors: async () => relations,
    });
    const useCase = new GetNodeAncestorsUseCase(repository);

    const result = await useCase.execute("f9f7f48e-1491-4de0-87e7-e3fd615f8026");
    expect(result).toEqual(relations);
  });

  it("lança NotFound quando nó não existe", async () => {
    const repository = createRepositoryMock({
      findNodeById: async () => null,
      listAncestors: async () => [buildOrganizationRelation()],
    });
    const useCase = new GetNodeAncestorsUseCase(repository);

    await expect(
      useCase.execute("49ef15c1-467a-4f27-bdc9-7aefca8381e9"),
    ).rejects.toBeInstanceOf(NotFoundDomainError);
  });
});
