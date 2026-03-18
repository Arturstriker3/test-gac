import { describe, expect, it } from "bun:test";
import { LinkUserToGroupUseCase } from "../../src/modules/organization/application/use-cases/link-user-to-group.use-case";
import { BadRequestDomainError } from "../../src/modules/organization/domain/organization.errors";
import { createRepositoryMock } from "./helpers/repository-mock";

describe("LinkUserToGroupUseCase", () => {
  it("valida e normaliza IDs", async () => {
    let payload: { userId: string; groupId: string } | undefined;
    const repository = createRepositoryMock({
      linkUserToGroup: async (input) => {
        payload = input;
      },
    });
    const useCase = new LinkUserToGroupUseCase(repository);

    await useCase.execute({
      userId: "  49ef15c1-467a-4f27-bdc9-7aefca8381e9  ",
      groupId: "  8706fcb7-309a-4b43-b72d-eaf7d0f4b9fb  ",
    });

    if (!payload) {
      throw new Error("payload not captured");
    }

    expect(payload).toEqual({
      userId: "49ef15c1-467a-4f27-bdc9-7aefca8381e9",
      groupId: "8706fcb7-309a-4b43-b72d-eaf7d0f4b9fb",
    });
  });

  it("lança erro quando IDs são inválidos", async () => {
    const repository = createRepositoryMock({
      linkUserToGroup: async () => undefined,
    });
    const useCase = new LinkUserToGroupUseCase(repository);

    await expect(
      useCase.execute({
        userId: " ",
        groupId: "8706fcb7-309a-4b43-b72d-eaf7d0f4b9fb",
      }),
    ).rejects.toBeInstanceOf(BadRequestDomainError);
    await expect(
      useCase.execute({
        userId: "49ef15c1-467a-4f27-bdc9-7aefca8381e9",
        groupId: " ",
      }),
    ).rejects.toBeInstanceOf(BadRequestDomainError);
  });
});
