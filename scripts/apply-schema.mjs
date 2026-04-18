import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(__dirname, "..", "sql", "schema.sql");

const url = process.env.DATABASE_URL;
if (!url) {
  console.warn("[apply-schema] DATABASE_URL not set — skipping.");
  process.exit(0);
}

const sql = readFileSync(schemaPath, "utf8");
const parsed = new URL(url);
parsed.searchParams.delete("sslmode");
const client = new pg.Client({
  connectionString: parsed.toString(),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("[apply-schema] schema applied");
} catch (err) {
  console.error("[apply-schema] failed:", err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
