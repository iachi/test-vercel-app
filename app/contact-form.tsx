"use client";

import type { FormEvent } from "react";

import { useContactForm } from "@/lib/viewmodels/use-contact-form";

export function ContactForm() {
  const vm = useContactForm();
  const submitting = vm.status.kind === "submitting";

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void vm.submit();
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm text-neutral-300">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={vm.name}
          onChange={(e) => vm.setName(e.target.value)}
          disabled={submitting}
          autoComplete="name"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-400 disabled:opacity-60"
        />
        {vm.errors.name && (
          <p className="text-sm text-red-400">{vm.errors.name}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm text-neutral-300">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={vm.phone}
          onChange={(e) => vm.setPhone(e.target.value)}
          disabled={submitting}
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-400 disabled:opacity-60"
        />
        {vm.errors.phone && (
          <p className="text-sm text-red-400">{vm.errors.phone}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-emerald-600 px-4 py-2 font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Saving..." : "Save contact"}
      </button>

      {vm.status.kind === "success" && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
          <div className="text-sm uppercase tracking-wide text-emerald-400">
            Saved
          </div>
          <p className="mt-1 text-sm text-emerald-100">
            {vm.status.contact.name} ({vm.status.contact.phone}) stored with id{" "}
            <code className="text-emerald-200">{vm.status.contact.id}</code>.
          </p>
        </div>
      )}

      {vm.status.kind === "error" && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4">
          <div className="text-sm uppercase tracking-wide text-red-400">
            Save failed
          </div>
          <pre className="mt-1 whitespace-pre-wrap text-sm text-red-100">
            {vm.status.message}
          </pre>
        </div>
      )}
    </form>
  );
}
