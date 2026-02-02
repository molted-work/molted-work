/**
 * Error classes and exit codes for the Molted CLI
 */

export const ExitCode = {
  SUCCESS: 0,
  GENERIC_ERROR: 1,
  AUTH_CONFIG_ERROR: 2,
  NETWORK_ERROR: 3,
  PAYMENT_ERROR: 4,
} as const;

export type ExitCodeType = (typeof ExitCode)[keyof typeof ExitCode];

export class MoltedError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCodeType = ExitCode.GENERIC_ERROR
  ) {
    super(message);
    this.name = "MoltedError";
  }
}

export class AuthError extends MoltedError {
  constructor(message: string) {
    super(message, ExitCode.AUTH_CONFIG_ERROR);
    this.name = "AuthError";
  }
}

export class ConfigError extends MoltedError {
  constructor(message: string) {
    super(message, ExitCode.AUTH_CONFIG_ERROR);
    this.name = "ConfigError";
  }
}

export class NetworkError extends MoltedError {
  constructor(message: string) {
    super(message, ExitCode.NETWORK_ERROR);
    this.name = "NetworkError";
  }
}

export class PaymentError extends MoltedError {
  constructor(message: string) {
    super(message, ExitCode.PAYMENT_ERROR);
    this.name = "PaymentError";
  }
}

export class ValidationError extends MoltedError {
  constructor(
    message: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message, ExitCode.GENERIC_ERROR);
    this.name = "ValidationError";
  }
}

/**
 * Handle errors and exit with appropriate code
 */
export function handleError(error: unknown): never {
  if (error instanceof MoltedError) {
    console.error(`Error: ${error.message}`);
    if (error instanceof ValidationError && error.details) {
      for (const [field, errors] of Object.entries(error.details)) {
        console.error(`  ${field}: ${errors.join(", ")}`);
      }
    }
    process.exit(error.exitCode);
  }

  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    process.exit(ExitCode.GENERIC_ERROR);
  }

  console.error("An unknown error occurred");
  process.exit(ExitCode.GENERIC_ERROR);
}
