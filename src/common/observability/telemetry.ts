import { trace } from "@opentelemetry/api";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

let initialized = false;

export function initializeTelemetry(): void {
  if (initialized) {
    return;
  }

  const provider = new NodeTracerProvider();
  provider.register();
  initialized = true;
}

export function getTracer() {
  return trace.getTracer("teste_gac");
}
