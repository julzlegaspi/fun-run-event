import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

// HitPay payment requests (hosted checkout). Sandbox unless HITPAY_ENV is
// "production". Docs: https://docs.hitpayapp.com

const baseUrl =
  process.env.HITPAY_ENV === "production"
    ? "https://api.hit-pay.com"
    : "https://api.sandbox.hit-pay.com";

export type PaymentRequestStatus =
  | "pending"
  | "completed"
  | "failed"
  | "expired"
  | "canceled";

export type PaymentRequest = {
  id: string;
  url: string; // hosted checkout page
  status: PaymentRequestStatus;
  amount: string; // "1500.00"
  currency: string;
  reference_number: string | null;
  payments?: { id: string; status: string; amount: string }[];
};

// Public origin for HitPay's redirect and webhook URLs; same as Better Auth's.
export function siteUrl(path: string) {
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return new URL(path, origin).toString();
}

// HitPay formats amounts as strings, sometimes with separators ("1,900.00").
export function parseAmount(amount: string | number | undefined) {
  return Number(String(amount ?? "").replace(/,/g, ""));
}

// HitPay refuses webhook URLs it can't reach (it rejects localhost outright),
// so local checkouts skip the webhook and rely on the order page reconciling.
export function webhookUrl() {
  const url = new URL(siteUrl("/api/webhooks/hitpay"));
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  return local ? undefined : url.toString();
}

async function hitpay<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = process.env.HITPAY_API_KEY;
  if (!apiKey) throw new Error("HITPAY_API_KEY is not set");

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "X-BUSINESS-API-KEY": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HitPay ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

export function createPaymentRequest(input: {
  amount: number; // whole PHP
  referenceNumber: string;
  name: string;
  email: string;
  phone?: string;
  purpose: string;
  redirectUrl: string;
  webhookUrl?: string;
}) {
  return hitpay<PaymentRequest>("/v1/payment-requests", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount.toFixed(2),
      currency: "PHP",
      reference_number: input.referenceNumber,
      name: input.name,
      email: input.email,
      phone: input.phone,
      purpose: input.purpose.slice(0, 255),
      redirect_url: input.redirectUrl,
      webhook: input.webhookUrl,
      // Our own sweep expires pending orders a little after this.
      expires_after: "30 mins",
      send_email: true,
    }),
  });
}

export function getPaymentRequest(id: string) {
  return hitpay<PaymentRequest>(
    `/v1/payment-requests/${encodeURIComponent(id)}`,
  );
}

// HitPay signs the raw JSON body with HMAC-SHA256 using the webhook salt.
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const salt = process.env.HITPAY_SALT;
  if (!salt || !signature) return false;
  const expected = createHmac("sha256", salt).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ---- Payouts (Transfers API, beta; must be enabled on the HitPay account) ----

// HitPay validation errors: `{ message, errors: { field: [messages] } }`.
export class HitPayError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

// Like hitpay(), but keeps 4xx details so forms can show them.
async function hitpayChecked<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await hitpay<T>(path, init);
  } catch (error) {
    const match = error instanceof Error && error.message.match(/^HitPay (\d+): ([\s\S]*)$/);
    if (!match) throw error;
    const status = Number(match[1]);
    let body: { message?: string; errors?: Record<string, string[] | string> } = {};
    try {
      body = JSON.parse(match[2]);
    } catch {}
    const fieldErrors = Object.fromEntries(
      Object.entries(body.errors ?? {}).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    );
    throw new HitPayError(
      status,
      status === 403
        ? "Payouts aren't enabled on the platform's HitPay account yet."
        : (body.message ?? `HitPay error ${status}`),
      fieldErrors,
    );
  }
}

// Philippine bank accounts paid in PHP.
const PH_BANK_TRANSFER = {
  country: "ph",
  currency: "php",
  transfer_method: "bank_transfer",
  transfer_type: "local",
  holder_type: "individual",
} as const;

type SchemaField = {
  key: string;
  type?: string;
  options?: { value: string; label: string }[];
};

// The beneficiary schema names the bank field (`bank_id` or `bank_swift_code`
// depending on the corridor) and lists the banks as its options.
let bankCache: { at: number; key: string; banks: { value: string; label: string }[] } | undefined;
const BANK_CACHE_MS = 24 * 60 * 60 * 1000;

export async function getPhBanks() {
  if (bankCache && Date.now() - bankCache.at < BANK_CACHE_MS) return bankCache;
  const fields = await hitpayChecked<SchemaField[]>("/v1/beneficiaries/schema", {
    method: "POST",
    body: JSON.stringify(PH_BANK_TRANSFER),
  });
  const field = fields.find((f) => f.key === "bank_id" || f.key === "bank_swift_code");
  if (!field?.options?.length) throw new Error("HitPay returned no PH bank list");
  bankCache = {
    at: Date.now(),
    key: field.key,
    banks: [...field.options].sort((a, b) => a.label.localeCompare(b.label)),
  };
  return bankCache;
}

export type Beneficiary = {
  id: string;
  status: string;
  bank_name?: string;
  account_number?: string;
  holder_name: string;
};

export async function createBeneficiary(input: {
  holderName: string;
  bankCode: string;
  accountNumber: string;
  email: string;
  address: { street: string; city: string; postcode: string };
}) {
  const { key } = await getPhBanks();
  return hitpayChecked<Beneficiary>("/v1/beneficiaries", {
    method: "POST",
    body: JSON.stringify({
      ...PH_BANK_TRANSFER,
      holder_name: input.holderName,
      [key]: input.bankCode,
      account_number: input.accountNumber,
      email: input.email,
      address: input.address,
    }),
  });
}

export async function deleteBeneficiary(id: string) {
  await hitpayChecked(`/v1/beneficiaries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type TransferStatus =
  | "scheduled"
  | "processing"
  | "paid"
  | "failed"
  | "canceled";

export type Transfer = { id: string; status: TransferStatus };

// Draws from the platform's PHP wallet; the platform pays the transfer fee.
export function createTransfer(input: {
  beneficiaryId: string;
  amount: number; // whole PHP
  reference: string; // our payout id
  remark: string;
}) {
  return hitpayChecked<Transfer>("/v1/transfers", {
    method: "POST",
    body: JSON.stringify({
      beneficiary_id: input.beneficiaryId,
      source_currency: "php",
      payment_amount: input.amount,
      reference: input.reference,
      remark: input.remark.slice(0, 120),
    }),
  });
}

export function getTransfer(id: string) {
  return hitpayChecked<Transfer>(`/v1/transfers/${encodeURIComponent(id)}`);
}
