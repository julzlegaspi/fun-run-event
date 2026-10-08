import { getParticipants } from "@/db/queries/dashboard";
import { getManagedEvent } from "@/db/queries/organizers";
import { getSession } from "@/lib/session";

// Quote every cell, and defuse values a spreadsheet would run as a formula.
function cell(value: string | number | undefined) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

const HEADERS = [
  "Race",
  "Full name",
  "Email",
  "Phone",
  "Birthdate",
  "Age on race day",
  "Gender",
  "Shirt size",
  "Emergency contact",
  "Emergency phone",
  "Order",
  "Paid at",
];

export async function GET(
  request: Request,
  { params }: RouteContext<"/dashboard/events/[slug]/participants.csv">,
) {
  const { slug } = await params;
  const session = await getSession();
  const event = session && (await getManagedEvent(session.user, slug));
  // Same 404 for signed-out users and non-organizers, like the pages.
  if (!event) return new Response("Not found", { status: 404 });

  const race = new URL(request.url).searchParams.get("race");
  const raceId = event.races.find((r) => r.id === race)?.id;
  const runners = await getParticipants(event, raceId);

  const lines = [
    HEADERS.map(cell).join(","),
    ...runners.map((r) =>
      [
        r.raceName,
        r.fullName,
        r.email,
        r.phone,
        r.birthdate,
        r.age,
        r.gender,
        r.shirtSize,
        r.emergencyName,
        r.emergencyPhone,
        r.orderId,
        r.paidAt,
      ]
        .map(cell)
        .join(","),
    ),
  ];

  // BOM so Excel opens UTF-8 names (ñ, accents) correctly.
  return new Response(`﻿${lines.join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}-participants.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
