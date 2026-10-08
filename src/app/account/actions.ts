"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { promoteToOrganizer } from "@/db/queries/organizers";
import { auth } from "@/lib/auth";
import {
  type AuthFormState,
  errorMessage,
  field,
  MIN_PASSWORD,
  password,
} from "@/lib/auth-form";
import { requireSession } from "@/lib/session";

export async function updateNameAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = field(formData, "name");
  if (!name) return { error: "Enter your name.", values: { name } };

  try {
    await auth.api.updateUser({ body: { name }, headers: await headers() });
  } catch (error) {
    return { error: errorMessage(error), values: { name } };
  }
  revalidatePath("/account");
  return { success: "Name updated.", values: { name } };
}

export async function changePasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const currentPassword = password(formData, "currentPassword");
  const newPassword = password(formData, "password");
  const confirm = password(formData, "confirmPassword");

  if (!currentPassword) return { error: "Enter your current password." };
  if (newPassword.length < MIN_PASSWORD)
    return {
      error: `Use at least ${MIN_PASSWORD} characters for your new password.`,
    };
  if (newPassword !== confirm) return { error: "New passwords don't match." };

  try {
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    return { error: errorMessage(error) };
  }
  return { success: "Password changed. You've been signed out everywhere else." };
}

export async function becomeOrganizerAction() {
  const { user } = await requireSession("/account");
  await promoteToOrganizer(user.id);
  revalidatePath("/account");
  redirect("/dashboard/events/new");
}
