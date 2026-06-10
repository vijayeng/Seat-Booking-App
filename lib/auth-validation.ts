export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthFieldErrors = Partial<{
  email: string;
  password: string;
}>;

export type AuthValidationResult =
  | {
      success: true;
      data: AuthCredentials;
    }
  | {
      success: false;
      errors: AuthFieldErrors;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateAuthCredentials(body: unknown): AuthValidationResult {
  const errors: AuthFieldErrors = {};

  if (!isRecord(body)) {
    return {
      success: false,
      errors: {
        email: "Email is required.",
        password: "Password is required.",
      },
    };
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Email must be a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      email,
      password,
    },
  };
}
