import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** The one shape every error leaves the API in. */
export interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Every unhandled exception becomes one shape, and nothing that is not an `HttpException` reaches
 * the client with its own message: a TypeORM error string names columns and tables, and a stack
 * trace names paths. Those go to the log, never to the response.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const body = this.toBody(exception);
    this.log(exception, body, request);

    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ErrorResponseBody {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    const statusCode = exception.getStatus();
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { statusCode, message: payload, error: exception.name };
    }

    const { message, error } = payload as Partial<ErrorResponseBody>;
    return {
      statusCode,
      message: message ?? exception.message,
      error: error ?? exception.name,
    };
  }

  // Request context, never the body: it carries passwords on login and health data everywhere else.
  private log(
    exception: unknown,
    body: ErrorResponseBody,
    request: Request
  ): void {
    const where = `${request.method} ${request.originalUrl} from ${request.ip}`;

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${where} failed`,
        exception instanceof Error ? exception.stack : String(exception)
      );
      return;
    }

    if (
      body.statusCode === HttpStatus.UNAUTHORIZED ||
      body.statusCode === HttpStatus.FORBIDDEN
    ) {
      this.logger.warn(`${where} rejected: ${body.error}`);
      return;
    }

    this.logger.debug(`${where} rejected: ${body.error}`);
  }
}
