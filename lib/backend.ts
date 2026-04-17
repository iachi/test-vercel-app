import "server-only";

export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const key = process.env.INTERNAL_API_KEY;
  if (!key) {
    throw new Error("INTERNAL_API_KEY is not set");
  }

  const base =
    process.env.INTERNAL_API_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  const url = `${base}/api/py${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(init.headers);
  headers.set("X-Internal-Key", key);

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Backend ${res.status} ${res.statusText} for ${url}: ${body}`,
    );
  }
  return res;
}
