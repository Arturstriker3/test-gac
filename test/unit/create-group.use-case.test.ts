import { describe, expect, it } from "bun:test";
import { CreateGroupUseCase } from "../../src/modules/organization/application/use-cases/create-group.use-case";
import { BadRequestDomainError } from "../../src/modules/organization/domain/organization.errors";
import { NODE_TYPES } from "../../src/modules/organization/domain/node.types";
import { buildNode, createRepositoryMock } from "./helpers/repository-mock";

describe("CreateGroupUseCase", () => {
  it("normaliza input e mantém parentId opcional", async () => {
    let receivedName = "";
    let receivedParentId: string | undefined;
    const group = buildNode({
      type: NODE_TYPES.GROUP,
      email: null,
      name: "Engenharia",
    });
    const repository = createRepositoryMock({
      createGroup: async (input) => {
        receivedName = input.name;
        receivedParentId = input.parentId;
        return group;
      },
    });
    const useCase = new CreateGroupUseCase(repository);

    const result = await useCase.execute({
      name: "  Engenharia  ",
      parentId: "  70e68f63-da35-44de-8a3a-84f21f4f7906  ",
    });

    expect(result).toEqual(group);
    expect(receivedName).toBe("Engenharia");
    expect(receivedParentId).toBe("70e68f63-da35-44de-8a3a-84f21f4f7906");
  });

  it("lança erro quando name é inválido", async () => {
    const repository = createRepositoryMock({
      createGroup: async () =>
        buildNode({
          type: NODE_TYPES.GROUP,
          email: null,
        }),
    });
    const useCase = new CreateGroupUseCase(repository);

    await expect(
      useCase.execute({
        name: "  ",
      }),
    ).rejects.toBeInstanceOf(BadRequestDomainError);
  });
});
