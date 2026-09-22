import { Client } from "pg";
import { execSync } from "child_process";
import { config } from "dotenv";

export default async function globalSetup() {
  config({ path: ".env.test" });
  const testDbUrl = process.env.DATABASE_URL!;
  const dbName = new URL(testDbUrl).pathname.replace("/", "");
  const adminUrl = testDbUrl.replace(`/${dbName}`, "/postgres");

  const client = new Client({ connectionString: adminUrl });
  await client.connect();
  const { rowCount } = await client.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );
  if (rowCount === 0) {
    await client.query(`CREATE DATABASE ${dbName}`);
  }
  await client.end();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: "inherit",
  });
}
