import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { FastifyReply } from "fastify";
import { DomainError } from "../../domain/organization.errors";
import { mapDomainError } from "./map-domain-error";

type ErrorResponseBody = {
  statusCode: number;
  code: string;
  message: string;
  details: unknown;
};

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof DomainError) {
      const mappedError = mapDomainError(exception);
      response.status(mappedError.getStatus()).send(mappedError.getResponse());
      return;
    }

    if (this.isInvalidJsonBodyError(exception)) {
      response.status(HttpStatus.BAD_REQUEST).send({
        statusCode: HttpStatus.BAD_REQUEST,
        code: "MALFORMED_JSON",
        message: "Malformed JSON body",
        details: null,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const payload = this.normalizeHttpException(exception, statusCode);
      response.status(statusCode).send(payload);
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: "INTERNAL_SERVER_ERROR",
      message: "Internal server error",
      details: null,
    });
  }

  private normalizeHttpException(
    exception: HttpException,
    statusCode: number,
  ): ErrorResponseBody {
    const response = exception.getResponse();
    const fallbackMessage = exception.message ?? "Error";

    if (!this.isRecord(response)) {
      const message =
        typeof response === "string" && response.length > 0
          ? response
          : fallbackMessage;

      if (this.isMalformedJsonHttpError(statusCode, message, null)) {
        return {
          statusCode: 400,
          code: "MALFORMED_JSON",
          message: "Malformed JSON body",
          details: null,
        };
      }

      return {
        statusCode,
        code: this.getDefaultCode(statusCode),
        message,
        details: null,
      };
    }

    const message = this.resolveMessage(response["message"], fallbackMessage);
    if (this.isMalformedJsonHttpError(statusCode, message, response["error"])) {
      return {
        statusCode: 400,
        code: "MALFORMED_JSON",
        message: "Malformed JSON body",
        details: null,
      };
    }

    return {
      statusCode,
      code: this.resolveCode(response["code"], statusCode),
      message,
      details: response["details"] ?? null,
    };
  }

  private resolveCode(code: unknown, statusCode: number): string {
    if (typeof code === "string" && code.length > 0) {
      return code;
    }

    return this.getDefaultCode(statusCode);
  }

  private resolveMessage(message: unknown, fallback: string): string {
    if (typeof message === "string" && message.length > 0) {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }

    return fallback || "Unexpected error";
  }

  private getDefaultCode(statusCode: number): string {
    if (statusCode === 400) {
      return "BAD_REQUEST";
    }

    if (statusCode === 404) {
      return "NOT_FOUND";
    }

    if (statusCode === 409) {
      return "CONFLICT";
    }

    if (statusCode === 422) {
      return "UNPROCESSABLE_ENTITY";
    }

    if (statusCode === 500) {
      return "INTERNAL_SERVER_ERROR";
    }

    return "HTTP_ERROR";
  }

  private isInvalidJsonBodyError(error: unknown): boolean {
    if (!this.isRecord(error)) {
      return false;
    }

    return (
      error["code"] === "FST_ERR_CTP_INVALID_JSON_BODY" &&
      error["statusCode"] === HttpStatus.BAD_REQUEST
    );
  }

  private isMalformedJsonHttpError(
    statusCode: number,
    message: string,
    error: unknown,
  ): boolean {
    if (statusCode !== 400) {
      return false;
    }

    const errorText = typeof error === "string" ? error : "";
    const combined = `${message} ${errorText}`.toLowerCase();
    return (
      combined.includes("json") ||
      combined.includes("unexpected token") ||
      combined.includes("unexpected end")
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }
}
