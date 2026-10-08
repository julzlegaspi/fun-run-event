"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { promoteToOrganizer } from "@/db/queries/organizers";
import { auth } from "@/lib/auth";
import {
  type AuthFormState,
  errorMessage,
  field,
  isEmail,
  messages,
  MIN_PASSWORD,
  password,
} from "@/lib/auth-form";
import { safeRedirect } from "@/lib/session";

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  const pw = password(formData, "password");
  const redirectTo = safeRedirect(field(formData, "next"));
  const values = { email };

  if (!isEmail(email) || !pw)
    return { error: "Enter your email and password.", values };

  try {
    await auth.api.signInEmail({
      body: { email, password: pw },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error), values };
  }
  return { redirectTo };
}

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const pw = password(formData, "password");
  const confirm = password(formData, "confirmPassword");
  const redirectTo = safeRedirect(field(formData, "next"));
  const values = { name, email };

  if (!name) return { error: "Enter your name.", values };
  if (!isEmail(email)) return { error: "Enter a valid email address.", values };
  if (pw.length < MIN_PASSWORD)
    return {
      error: `Use at least ${MIN_PASSWORD} characters for your password.`,
      values,
    };
  if (pw !== confirm) return { error: "Passwords don't match.", values };

  try {
    const { user } = await auth.api.signUpEmail({
      body: { name, email, password: pw },
      headers: await headers(),
    });
    if (field(formData, "accountType") === "organizer") {
      await promoteToOrganizer(user.id);
    }
  } catch (error) {
    return { error: errorMessage(error), values };
  }
  return { redirectTo };
}

export async function signInWithGoogleAction(formData: FormData) {
  const callbackURL = safeRedirect(field(formData, "next"));
  const { url } = await auth.api.signInSocial({
    body: { provider: "google", callbackURL, errorCallbackURL: "/sign-in" },
    headers: await headers(),
  });
  if (!url) throw new Error("Google sign-in did not return a redirect URL");
  redirect(url);
}

export async function requestPasswordResetAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = field(formData, "email");
  if (!isEmail(email))
    return { error: "Enter a valid email address.", values: { email } };

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error), values: { email } };
  }
  // Same message whether or not the account exists, so emails can't be probed.
  return {
    success: `If an account exists for ${email}, we've sent a link to reset your password.`,
  };
}

export async function resetPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const token = field(formData, "token");
  const pw = password(formData, "password");
  const confirm = password(formData, "confirmPassword");

  if (!token) return { error: messages.INVALID_TOKEN };
  if (pw.length < MIN_PASSWORD)
    return {
      error: `Use at least ${MIN_PASSWORD} characters for your password.`,
    };
  if (pw !== confirm) return { error: "Passwords don't match." };

  try {
    await auth.api.resetPassword({
      body: { token, newPassword: pw },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return { redirectTo: "/sign-in?reset=1" };
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
}
