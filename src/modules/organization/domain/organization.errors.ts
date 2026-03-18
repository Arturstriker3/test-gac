export class DomainError extends Error {
  constructor(
    message: string,
    readonly kind: "not_found" | "conflict" | "invalid_type" | "bad_request",
  ) {
    super(message);
  }
}

export class NotFoundDomainError extends DomainError {
  constructor(message: string) {
    super(message, "not_found");
  }
}

export class ConflictDomainError extends DomainError {
  constructor(message: string) {
    super(message, "conflict");
  }
}

export class InvalidNodeTypeDomainError extends DomainError {
  constructor(message: string) {
    super(message, "invalid_type");
  }
}

export class BadRequestDomainError extends DomainError {
  constructor(message: string) {
    super(message, "bad_request");
  }
}
