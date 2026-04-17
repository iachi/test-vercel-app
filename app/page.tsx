import { backendFetch } from "@/lib/backend";

export const dynamic = "force-dynamic";

type HealthResponse = { status: string };

export default async function Home() {
  let result: HealthResponse | null = null;
  let error: string | null = null;

  try {
    const res = await backendFetch("/health");
    result = (await res.json()) as HealthResponse;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Next.js + FastAPI on Vercel</h1>
      <p className="text-neutral-400">
        Frontend server-fetches the FastAPI backend at{" "}
        <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-sm">
          /api/py/health
        </code>{" "}
        using a shared internal key.
      </p>

      {result && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
          <div className="text-sm uppercase tracking-wide text-emerald-400">
            Backend reachable
          </div>
          <pre className="mt-2 text-sm text-emerald-100">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4">
          <div className="text-sm uppercase tracking-wide text-red-400">
            Backend error
          </div>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-red-100">
            {error}
          </pre>
        </div>
      )}
    </main>
  );
}
