"use server";

import { backendFetch } from "@/lib/backend";
import type { Contact, ContactInput } from "@/lib/models/contact";
import { normalizePhone, validateContact } from "@/lib/models/contact";

export type CreateContactResult =
  | { ok: true; contact: Contact }
  | { ok: false; error: string };

export async function createContact(
  input: ContactInput,
): Promise<CreateContactResult> {
  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    return { ok: false, error: Object.values(errors)[0] ?? "Invalid input." };
  }

  const payload = {
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
  };

  try {
    const res = await backendFetch("/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const contact = (await res.json()) as Contact;
    return { ok: true, contact };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
