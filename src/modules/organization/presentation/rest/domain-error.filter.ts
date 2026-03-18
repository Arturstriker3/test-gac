import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { DomainError } from "../../domain/organization.errors";
import { mapDomainError } from "./map-domain-error";

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const mappedError = mapDomainError(exception);

    response.status(mappedError.getStatus()).send(mappedError.getResponse());
  }
}
