import { Injectable, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { WinstonTransport as AxiomTransport } from '@axiomhq/winston';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService {
  private context = 'UNKNOWN';
  private logger: winston.Logger;

  constructor() {
    const defaultFormat = winston.format.combine(
      winston.format.errors({ stack: true }),
      winston.format.timestamp(),
      winston.format.json(),
      winston.format.prettyPrint(),
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: defaultFormat,
      }),
      new AxiomTransport({
        dataset: process.env.AXIOM_DATASET_NAME,
        token: process.env.AXIOM_API_KEY,
        orgId: process.env.AXIOM_ORG_NAME,
      }),
    ];

    const options: winston.LoggerOptions = {
      exitOnError: false,
      transports: transports,
      exceptionHandlers: [],
      rejectionHandlers: [],
      format: defaultFormat,
      defaultMeta: {
        service: { name: process.env.AXIOM_SERVICE_NAME },
        resource: { service: { name: process.env.AXIOM_SERVICE_NAME } },
        name: 'log',
        kind: 'internal',
      },
    };

    this.logger = winston.createLogger(options);
  }

  public log(message: string) {
    this.logger.log('info', message);
  }
}