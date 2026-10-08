"use server";

import { redirect } from "next/navigation";

import { getCheckoutRace } from "@/db/queries/events";
import {
  attachPaymentRequest,
  closeOrder,
  createOrder,
} from "@/db/queries/registrations";
import { field, isEmail } from "@/lib/auth-form";
import { formatKm } from "@/lib/events";
import { createPaymentRequest, siteUrl, webhookUrl } from "@/lib/hitpay";
import {
  GENDERS,
  MAX_RUNNERS,
  PARTICIPANT_FIELDS,
  SHIRT_SIZES,
  ageOn,
  orderHref,
  runnerField,
  type CheckoutFormState,
  type Participant,
} from "@/lib/registrations";
import { getSession } from "@/lib/session";

const PHONE = /^\+?[\d\s()-]{7,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function oneOf<T extends string>(list: readonly T[], value: string) {
  return list.find((item) => item === value);
}

export async function checkoutAction(
  _prev: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  const slug = field(formData, "slug");
  const raceId = field(formData, "raceId");
  const quantity = Number(field(formData, "quantity"));

  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(`/events/${slug}`)}`);

  const checkout = await getCheckoutRace(slug, raceId);
  if (!checkout || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_RUNNERS) {
    return { error: "That ticket isn't available. Go back and pick again." };
  }
  const { eventId, event, race } = checkout;

  const values: Record<string, string> = {};
  const fieldErrors: Record<string, string> = {};
  const runners: Participant[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (let i = 0; i < quantity; i++) {
    const raw = Object.fromEntries(
      PARTICIPANT_FIELDS.map((key) => {
        const value = field(formData, runnerField(i, key));
        values[runnerField(i, key)] = value;
        return [key, value];
      }),
    ) as Record<(typeof PARTICIPANT_FIELDS)[number], string>;
    const error = (key: keyof Participant, message: string) => {
      fieldErrors[runnerField(i, key)] ??= message;
    };

    if (!raw.fullName) error("fullName", "Enter the runner's full name.");
    if (!isEmail(raw.email)) error("email", "Enter a valid email address.");
    if (!PHONE.test(raw.phone)) error("phone", "Enter a valid mobile number.");
    if (!DATE.test(raw.birthdate) || raw.birthdate >= today) {
      error("birthdate", "Enter a valid date of birth.");
    } else if (race.minAge > 0 && ageOn(raw.birthdate, event.startsAt) < race.minAge) {
      error("birthdate", `Runners must be ${race.minAge}+ on race day.`);
    }
    const gender = oneOf(GENDERS, raw.gender);
    if (!gender) error("gender", "Choose an option.");
    const shirtSize = oneOf(SHIRT_SIZES, raw.shirtSize);
    if (!shirtSize) error("shirtSize", "Choose a shirt size.");
    if (!raw.emergencyName) error("emergencyName", "Enter an emergency contact.");
    if (!PHONE.test(raw.emergencyPhone))
      error("emergencyPhone", "Enter a valid mobile number.");

    if (gender && shirtSize) runners.push({ ...raw, gender, shirtSize });
  }

  if (Object.keys(fieldErrors).length) {
    return { error: "Check the highlighted fields.", fieldErrors, values };
  }

  const order = await createOrder({
    userId: session.user.id,
    eventId,
    raceId: race.id,
    participants: runners,
  });
  if (!order) {
    return {
      error:
        race.spotsLeft < quantity && race.spotsLeft > 0
          ? `Only ${race.spotsLeft} spots left in this race.`
          : "This race has just sold out.",
      values,
    };
  }

  // Free races are confirmed on the spot.
  if (order.total === 0) redirect(orderHref(order));

  let checkoutUrl: string;
  try {
    const payment = await createPaymentRequest({
      amount: order.total,
      referenceNumber: order.id,
      name: runners[0].fullName,
      email: session.user.email,
      phone: runners[0].phone,
      purpose: `${event.title} – ${race.name} (${formatKm(race.km)}) × ${quantity}`,
      redirectUrl: siteUrl(orderHref(order)),
      webhookUrl: webhookUrl(),
    });
    await attachPaymentRequest(order.id, payment.id);
    checkoutUrl = payment.url;
  } catch (error) {
    console.error(error);
    await closeOrder(order.id, "failed");
    return {
      error: "We couldn't start the payment. Please try again in a moment.",
      values,
    };
  }

  redirect(checkoutUrl);
}
