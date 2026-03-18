import { Injectable } from "@nestjs/common";
import {
  SpanStatusCode,
  type Attributes,
  type SpanContext,
  trace,
} from "@opentelemetry/api";
import { getTracer, initializeTelemetry } from "./telemetry";

type LogLevel = "debug" | "info" | "warn" | "error";

@Injectable()
export class ObservabilityService {
  constructor() {
    initializeTelemetry();
  }

  async runInSpan<T>(
    name: string,
    attributes: Attributes,
    operation: () => Promise<T>,
  ): Promise<T> {
    const tracer = getTracer();
    return tracer.startActiveSpan(name, { attributes }, async (span) => {
      try {
        const result = await operation();
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        const mappedError = this.toError(error);
        span.recordException(mappedError);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: mappedError.message,
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  info(message: string, fields: Record<string, unknown> = {}): void {
    this.log("info", message, fields);
  }

  error(message: string, fields: Record<string, unknown> = {}): void {
    this.log("error", message, fields);
  }

  private log(
    level: LogLevel,
    message: string,
    fields: Record<string, unknown>,
  ): void {
    const spanContext = this.getCurrentSpanContext();
    const payload: Record<string, unknown> = {
      "@timestamp": new Date().toISOString(),
      "ecs.version": "8.11.0",
      "service.name": "teste_gac",
      "event.dataset": "gac.api",
      "log.level": level,
      message,
      ...fields,
    };

    if (spanContext) {
      payload["trace.id"] = spanContext.traceId;
      payload["span.id"] = spanContext.spanId;
    }

    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }

  private getCurrentSpanContext(): SpanContext | null {
    const span = trace.getActiveSpan();
    if (!span) {
      return null;
    }

    const spanContext = span.spanContext();
    if (!this.hasValue(spanContext.traceId) || !this.hasValue(spanContext.spanId)) {
      return null;
    }

    return spanContext;
  }

  private hasValue(value: string): boolean {
    const normalized = value.replace(/0/g, "");
    return normalized.length > 0;
  }

  private toError(value: unknown): Error {
    if (value instanceof Error) {
      return value;
    }

    return new Error(typeof value === "string" ? value : "Unexpected error");
  }
}
