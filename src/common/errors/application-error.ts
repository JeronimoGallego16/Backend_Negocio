/**
 * Identifies an application error without coupling it to a transport protocol.
 */
export enum ApplicationErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
}

/**
 * Represents an application-level failure with a stable semantic code.
 */
export class ApplicationError extends Error {
  /**
   * Creates an application error.
   *
   * @param code - Semantic category of the error.
   * @param message - Human-readable description of the failure.
   */
  constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = ApplicationError.name;
  }
}

/**
 * Creates transport-independent application errors.
 */
export class ApplicationErrors {
  /**
   * Creates an application error for invalid input.
   *
   * @param message - Service-defined description of the invalid input.
   * @returns An invalid-input application error.
   */
  static invalidInput(message: string): ApplicationError {
    return new ApplicationError(ApplicationErrorCode.INVALID_INPUT, message);
  }

  /**
   * Creates an application error for a resource that could not be found.
   *
   * @param message - Service-defined description of the missing resource.
   * @returns A not-found application error.
   */
  static notFound(message: string): ApplicationError {
    return new ApplicationError(ApplicationErrorCode.NOT_FOUND, message);
  }

  /**
   * Creates an application error for a conflict with existing data.
   *
   * @param message - Service-defined description of the conflict.
   * @returns A conflict application error.
   */
  static conflict(message: string): ApplicationError {
    return new ApplicationError(ApplicationErrorCode.CONFLICT, message);
  }
}
