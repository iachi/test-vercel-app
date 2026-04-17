import { ContactForm } from "./contact-form";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Contacts</h1>
        <p className="text-sm text-neutral-400">
          Enter a name and phone number. On submit, the record is saved to
          Postgres and confirmed below.
        </p>
      </header>
      <ContactForm />
    </main>
  );
}
