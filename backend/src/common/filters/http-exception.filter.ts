import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Ocorreu um erro interno. Tente novamente mais tarde.';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const exObj = exceptionResponse as Record<string, unknown>;
        message =
          typeof exObj['message'] === 'string'
            ? exObj['message']
            : Array.isArray(exObj['message'])
              ? (exObj['message'] as string[]).join(', ')
              : message;
        error = typeof exObj['error'] === 'string' ? exObj['error'] : error;
      }
    }

    // Log com detalhes técnicos — nunca vai para o cliente
    this.logger.error(
      `${request.method} ${request.path} → ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const body: ErrorResponse = {
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.path,
    };

    response.status(status).json(body);
  }
}
