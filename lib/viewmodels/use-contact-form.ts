"use client";

import { useState } from "react";

import { createContact } from "@/app/actions";
import type {
  Contact,
  ContactInput,
  FieldErrors,
} from "@/lib/models/contact";
import { validateContact } from "@/lib/models/contact";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; contact: Contact }
  | { kind: "error"; message: string };

export type ContactFormViewModel = {
  name: string;
  phone: string;
  errors: FieldErrors;
  status: Status;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
  submit: () => Promise<void>;
  reset: () => void;
};

export function useContactForm(): ContactFormViewModel {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const submit = async () => {
    const input: ContactInput = { name, phone };
    const nextErrors = validateContact(input);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus({ kind: "idle" });
      return;
    }

    setStatus({ kind: "submitting" });
    const result = await createContact(input);
    if (result.ok) {
      setStatus({ kind: "success", contact: result.contact });
      setName("");
      setPhone("");
    } else {
      setStatus({ kind: "error", message: result.error });
    }
  };

  const reset = () => {
    setName("");
    setPhone("");
    setErrors({});
    setStatus({ kind: "idle" });
  };

  return {
    name,
    phone,
    errors,
    status,
    setName: (value) => {
      setName(value);
      if (status.kind === "success" || status.kind === "error") {
        setStatus({ kind: "idle" });
      }
    },
    setPhone: (value) => {
      setPhone(value);
      if (status.kind === "success" || status.kind === "error") {
        setStatus({ kind: "idle" });
      }
    },
    submit,
    reset,
  };
}
