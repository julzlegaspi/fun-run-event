"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import {
  claimUnassignedEvents,
  PayoutError,
  resolveUnconfirmedPayout,
  savePayoutAccount,
  startPayout,
} from "@/db/queries/payouts";
import { field, isEmail } from "@/lib/auth-form";
import { isAdmin, type DashboardFormState } from "@/lib/dashboard";
import { createBeneficiary, getPhBanks, HitPayError } from "@/lib/hitpay";
import { requireOrganizer, requireSession } from "@/lib/session";

const ACCOUNT_FIELDS = [
  "holderName",
  "bankCode",
  "accountNumber",
  "email",
  "street",
  "city",
  "postcode",
] as const;

// HitPay's validation keys onto our form fields.
const HITPAY_FIELDS: Record<string, (typeof ACCOUNT_FIELDS)[number]> = {
  holder_name: "holderName",
  bank_id: "bankCode",
  bank_swift_code: "bankCode",
  account_number: "accountNumber",
  email: "email",
  "address.street": "street",
  "address.city": "city",
  "address.postcode": "postcode",
};

export async function savePayoutAccountAction(
  _prev: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const { user } = await requireOrganizer("/dashboard/payouts");
  const values = Object.fromEntries(
    ACCOUNT_FIELDS.map((name) => [name, field(formData, name)]),
  ) as Record<(typeof ACCOUNT_FIELDS)[number], string>;
  values.accountNumber = values.accountNumber.replace(/[\s-]/g, "");

  const fieldErrors: Record<string, string> = {};
  if (!values.holderName) fieldErrors.holderName = "Enter the name on the account.";
  if (!values.bankCode) fieldErrors.bankCode = "Choose your bank.";
  if (!/^\d{6,20}$/.test(values.accountNumber)) {
    fieldErrors.accountNumber = "Enter the account number (digits only).";
  }
  if (!isEmail(values.email)) fieldErrors.email = "Enter a valid email address.";
  if (!values.street) fieldErrors.street = "Enter the account holder's street address.";
  if (!values.city) fieldErrors.city = "Enter the city.";
  if (!/^\d{4}$/.test(values.postcode)) fieldErrors.postcode = "Enter the 4-digit ZIP code.";
  if (Object.keys(fieldErrors).length) {
    return { error: "Check the highlighted fields.", fieldErrors, values };
  }

  try {
    const { banks } = await getPhBanks();
    const bank = banks.find((b) => b.value === values.bankCode);
    if (!bank) {
      return { error: "Check the highlighted fields.", fieldErrors: { bankCode: "Choose your bank." }, values };
    }
    const beneficiary = await createBeneficiary({
      holderName: values.holderName,
      bankCode: bank.value,
      accountNumber: values.accountNumber,
      email: values.email,
      address: { street: values.street, city: values.city, postcode: values.postcode },
    });
    await savePayoutAccount(
      user.id,
      { ...values, bankName: bank.label },
      beneficiary,
    );
    await claimUnassignedEvents(user.id);
  } catch (error) {
    if (!(error instanceof HitPayError)) {
      console.error(error);
      return { error: "We couldn't save your bank details. Please try again.", values };
    }
    const mapped = Object.fromEntries(
      Object.entries(error.fieldErrors)
        .filter(([key]) => HITPAY_FIELDS[key])
        .map(([key, message]) => [HITPAY_FIELDS[key], message]),
    );
    return { error: error.message, fieldErrors: mapped, values };
  }

  revalidatePath("/dashboard", "layout");
  return { success: "Payout account saved." };
}

export async function releasePayoutAction(
  _prev: DashboardFormState,
  formData: FormData,
): Promise<DashboardFormState> {
  const { user } = await requireSession("/dashboard/payouts/release");
  if (!isAdmin(user)) notFound();

  try {
    await startPayout(field(formData, "eventId"), user.id);
  } catch (error) {
    if (!(error instanceof PayoutError)) throw error;
    revalidatePath("/dashboard", "layout");
    return { error: error.message };
  }
  revalidatePath("/dashboard", "layout");
  return { success: "Payout sent to HitPay." };
}

export async function resolvePayoutAction(formData: FormData) {
  const { user } = await requireSession("/dashboard/payouts/release");
  if (!isAdmin(user)) notFound();
  await resolveUnconfirmedPayout(field(formData, "payoutId"), field(formData, "sent") === "yes");
  revalidatePath("/dashboard", "layout");
}
