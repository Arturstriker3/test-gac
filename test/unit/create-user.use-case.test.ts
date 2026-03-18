import { describe, expect, it } from "bun:test";
import { CreateUserUseCase } from "../../src/modules/organization/application/use-cases/create-user.use-case";
import { BadRequestDomainError } from "../../src/modules/organization/domain/organization.errors";
import { buildNode, createRepositoryMock } from "./helpers/repository-mock";

describe("CreateUserUseCase", () => {
  it("normaliza name/email e chama o repositório", async () => {
    let receivedName = "";
    let receivedEmail = "";
    const user = buildNode();
    const repository = createRepositoryMock({
      createUser: async (input) => {
        receivedName = input.name;
        receivedEmail = input.email;
        return user;
      },
    });
    const useCase = new CreateUserUseCase(repository);

    const result = await useCase.execute({
      name: "  Maria  ",
      email: "  MARIA@Example.Com  ",
    });

    expect(result).toEqual(user);
    expect(receivedName).toBe("Maria");
    expect(receivedEmail).toBe("maria@example.com");
  });

  it("lança erro quando name ou email são inválidos", async () => {
    const repository = createRepositoryMock({
      createUser: async () => buildNode(),
    });
    const useCase = new CreateUserUseCase(repository);

    await expect(
      useCase.execute({ name: "  ", email: "valid@example.com" }),
    ).rejects.toBeInstanceOf(BadRequestDomainError);
    await expect(
      useCase.execute({ name: "Nome", email: "   " }),
    ).rejects.toBeInstanceOf(BadRequestDomainError);
  });
});
