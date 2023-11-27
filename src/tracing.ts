import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  BasicTracerProvider,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import {
  SemanticResourceAttributes,
  TelemetrySdkLanguageValues,
} from '@opentelemetry/semantic-conventions';

const axiomApikey = process.env.AXIOM_API_KEY;
if (!axiomApikey) {
  console.warn('Missing AXIOM_API_KEY, skipping OpenTelemetry init');
}

const serviceName = process.env.AXIOM_SERVICE_NAME;
const datasetName = process.env.AXIOM_DATASET_NAME;
const resource = new Resource({
  [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
  [SemanticResourceAttributes.TELEMETRY_SDK_LANGUAGE]:
    TelemetrySdkLanguageValues.NODEJS,
});

const exporter = new OTLPTraceExporter({
  url: 'https://api.axiom.co/v1/traces',
  headers: {
    Authorization: `Bearer ${axiomApikey}`,
    'X-Axiom-Dataset': datasetName,
  },
});
const spanProcessor = new SimpleSpanProcessor(exporter);

const provider = new BasicTracerProvider({ resource: resource });
provider.addSpanProcessor(spanProcessor);

registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    new WinstonInstrumentation(),
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new NestInstrumentation(),
  ],
});

const openTelemetrySdk = new NodeSDK({
  resource: resource,
  traceExporter: exporter,
  spanProcessor: spanProcessor,
});

export function startTracing() {
  provider.register();
  openTelemetrySdk.start();

  process.on('SIGTERM', async () => {
    await openTelemetrySdk.shutdown();
  });
}
