export type ContactInput = {
  name: string;
  phone: string;
};

export type Contact = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

export type FieldErrors = Partial<Record<keyof ContactInput, string>>;

const PHONE_RE = /^\+?\d{7,15}$/;

export function normalizePhone(raw: string): string {
  return raw.replace(/[\s\-()]/g, "");
}

export function validateContact(input: ContactInput): FieldErrors {
  const errors: FieldErrors = {};

  const name = input.name.trim();
  if (!name) errors.name = "Name is required.";
  else if (name.length > 100) errors.name = "Name is too long (max 100).";

  const phone = normalizePhone(input.phone);
  if (!phone) errors.phone = "Phone is required.";
  else if (!PHONE_RE.test(phone))
    errors.phone = "Enter 7-15 digits, optional leading +.";

  return errors;
}
