import { describe, it, expect } from "vitest";
import {
  MoltedError,
  AuthError,
  ConfigError,
  NetworkError,
  PaymentError,
  ValidationError,
  ExitCode,
} from "../lib/errors.js";

describe("Error classes", () => {
  describe("MoltedError", () => {
    it("has correct default exit code", () => {
      const error = new MoltedError("test error");
      expect(error.exitCode).toBe(ExitCode.GENERIC_ERROR);
      expect(error.message).toBe("test error");
      expect(error.name).toBe("MoltedError");
    });

    it("accepts custom exit code", () => {
      const error = new MoltedError("test error", ExitCode.NETWORK_ERROR);
      expect(error.exitCode).toBe(ExitCode.NETWORK_ERROR);
    });
  });

  describe("AuthError", () => {
    it("has auth exit code", () => {
      const error = new AuthError("unauthorized");
      expect(error.exitCode).toBe(ExitCode.AUTH_CONFIG_ERROR);
      expect(error.name).toBe("AuthError");
    });
  });

  describe("ConfigError", () => {
    it("has config exit code", () => {
      const error = new ConfigError("config missing");
      expect(error.exitCode).toBe(ExitCode.AUTH_CONFIG_ERROR);
      expect(error.name).toBe("ConfigError");
    });
  });

  describe("NetworkError", () => {
    it("has network exit code", () => {
      const error = new NetworkError("connection failed");
      expect(error.exitCode).toBe(ExitCode.NETWORK_ERROR);
      expect(error.name).toBe("NetworkError");
    });
  });

  describe("PaymentError", () => {
    it("has payment exit code", () => {
      const error = new PaymentError("insufficient funds");
      expect(error.exitCode).toBe(ExitCode.PAYMENT_ERROR);
      expect(error.name).toBe("PaymentError");
    });
  });

  describe("ValidationError", () => {
    it("has generic exit code", () => {
      const error = new ValidationError("validation failed");
      expect(error.exitCode).toBe(ExitCode.GENERIC_ERROR);
      expect(error.name).toBe("ValidationError");
    });

    it("can include field details", () => {
      const error = new ValidationError("validation failed", {
        name: ["Name is required"],
        email: ["Invalid email format"],
      });
      expect(error.details).toEqual({
        name: ["Name is required"],
        email: ["Invalid email format"],
      });
    });
  });
});

describe("Exit codes", () => {
  it("has correct values", () => {
    expect(ExitCode.SUCCESS).toBe(0);
    expect(ExitCode.GENERIC_ERROR).toBe(1);
    expect(ExitCode.AUTH_CONFIG_ERROR).toBe(2);
    expect(ExitCode.NETWORK_ERROR).toBe(3);
    expect(ExitCode.PAYMENT_ERROR).toBe(4);
  });
});
