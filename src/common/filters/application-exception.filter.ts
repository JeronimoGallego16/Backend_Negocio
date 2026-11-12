import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApplicationError,
  ApplicationErrorCode,
} from '../errors/application-error';

/**
 * Translates application errors into HTTP responses at the REST boundary.
 */
@Catch(ApplicationError)
export class ApplicationExceptionFilter implements ExceptionFilter<ApplicationError> {
  /**
   * Writes the HTTP response for an application error.
   *
   * @param exception - Application error to translate.
   * @param host - Nest execution context for the current request.
   */
  catch(exception: ApplicationError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const statusCode = this.getHttpStatus(exception.code);
    response.status(statusCode).json({
      statusCode,
      message: exception.message,
      error: this.getHttpError(statusCode),
    });
  }

  /**
   * Maps an application error category to its REST status code.
   *
   * @param code - Semantic category of the application error.
   * @returns The corresponding HTTP status code.
   */
  private getHttpStatus(code: ApplicationErrorCode): HttpStatus {
    switch (code) {
      case ApplicationErrorCode.INVALID_INPUT:
        return HttpStatus.BAD_REQUEST;
      case ApplicationErrorCode.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case ApplicationErrorCode.CONFLICT:
        return HttpStatus.CONFLICT;
    }
  }

  /**
   * Returns the standard HTTP status label used in NestJS error responses.
   *
   * @param statusCode - HTTP status code for the application error.
   * @returns The standard HTTP error label.
   */
  private getHttpError(statusCode: HttpStatus): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      default:
        throw new Error(`Unsupported HTTP status code: ${statusCode}`);
    }
  }
}
