import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { DomainError } from "../../domain/organization.errors";

export function mapDomainError(error: DomainError): HttpException {
  if (error.kind === "bad_request") {
    return new BadRequestException({
      statusCode: 400,
      code: "BAD_REQUEST",
      message: error.message,
      details: null,
    });
  }

  if (error.kind === "not_found") {
    return new NotFoundException({
      statusCode: 404,
      code: "NOT_FOUND",
      message: error.message,
      details: null,
    });
  }

  if (error.kind === "conflict") {
    return new ConflictException({
      statusCode: 409,
      code: "CONFLICT",
      message: error.message,
      details: null,
    });
  }

  return new UnprocessableEntityException({
    statusCode: 422,
    code: "INVALID_NODE_TYPE",
    message: error.message,
    details: null,
  });
}
