import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  SpanStatusCode,
  type Attributes,
  type SpanContext,
  trace,
} from "@opentelemetry/api";
import { getTracer, initializeTelemetry } from "./telemetry";

type LogLevel = "debug" | "info" | "warn" | "error";

@Injectable()
export class ObservabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly runtimeMetricsIntervalMs = 5000;
  private runtimeMetricsTimer: NodeJS.Timeout | null = null;
  private previousCpuUsage = process.cpuUsage();
  private previousCpuTime = process.hrtime.bigint();
  private expectedTickAt = Date.now() + this.runtimeMetricsIntervalMs;

  constructor() {
    initializeTelemetry();
  }

  onModuleInit(): void {
    this.runtimeMetricsTimer = setInterval(() => {
      this.emitRuntimeMetrics();
    }, this.runtimeMetricsIntervalMs);
    this.runtimeMetricsTimer.unref();
  }

  onModuleDestroy(): void {
    if (!this.runtimeMetricsTimer) {
      return;
    }
    clearInterval(this.runtimeMetricsTimer);
    this.runtimeMetricsTimer = null;
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
    if (
      !this.hasValue(spanContext.traceId) ||
      !this.hasValue(spanContext.spanId)
    ) {
      return null;
    }

    return spanContext;
  }

  private hasValue(value: string): boolean {
    const normalized = value.replace(/0/g, "");
    return normalized.length > 0;
  }

  private emitRuntimeMetrics(): void {
    const now = Date.now();
    const eventLoopLagMs = Math.max(0, now - this.expectedTickAt);
    this.expectedTickAt = now + this.runtimeMetricsIntervalMs;

    const currentCpuUsage = process.cpuUsage();
    const currentCpuTime = process.hrtime.bigint();
    const elapsedCpuMs =
      Number(currentCpuTime - this.previousCpuTime) / 1_000_000;
    const usedCpuMicros =
      currentCpuUsage.user -
      this.previousCpuUsage.user +
      (currentCpuUsage.system - this.previousCpuUsage.system);
    const cpuUsagePercent =
      elapsedCpuMs > 0
        ? Number(((usedCpuMicros / 1000 / elapsedCpuMs) * 100).toFixed(2))
        : 0;

    this.previousCpuUsage = currentCpuUsage;
    this.previousCpuTime = currentCpuTime;

    const memoryUsage = process.memoryUsage();
    this.info("runtime metrics", {
      "event.dataset": "gac.runtime",
      "metric.kind": "runtime",
      runtime_cpu_usage_percent: cpuUsagePercent,
      runtime_memory_rss_mb: this.toMegabytes(memoryUsage.rss),
      runtime_memory_heap_used_mb: this.toMegabytes(memoryUsage.heapUsed),
      runtime_memory_heap_total_mb: this.toMegabytes(memoryUsage.heapTotal),
      runtime_event_loop_lag_ms: Number(eventLoopLagMs.toFixed(2)),
    });
  }

  private toMegabytes(valueInBytes: number): number {
    return Number((valueInBytes / (1024 * 1024)).toFixed(2));
  }

  private toError(value: unknown): Error {
    if (value instanceof Error) {
      return value;
    }

    return new Error(typeof value === "string" ? value : "Unexpected error");
  }
}
