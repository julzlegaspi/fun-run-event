import "server-only";

import { APIError } from "better-auth/api";

// Returned to `useActionState` by the auth and account server actions. On
// success the form refreshes the client session and navigates to `redirectTo`;
// `values` refills fields after an error.
export type AuthFormState = {
  error?: string;
  success?: string;
  redirectTo?: string;
  values?: Record<string, string>;
};

export const MIN_PASSWORD = 8;

export function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

// Passwords aren't trimmed: leading/trailing spaces are the user's choice.
export function password(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  USER_ALREADY_EXISTS:
    "An account with this email already exists. Sign in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "An account with this email already exists. Sign in instead.",
  INVALID_TOKEN:
    "This reset link is invalid or has expired. Request a new one.",
  INVALID_PASSWORD: "Your current password is incorrect.",
  PASSWORD_TOO_SHORT: `Use at least ${MIN_PASSWORD} characters.`,
};

export function errorMessage(error: unknown) {
  if (error instanceof APIError) {
    const code = error.body?.code;
    if (code && messages[code]) return messages[code];
    if (error.status === "TOO_MANY_REQUESTS")
      return "Too many attempts. Wait a minute and try again.";
    if (error.body?.message) return error.body.message;
  }
  console.error(error);
  return "Something went wrong. Please try again.";
}
