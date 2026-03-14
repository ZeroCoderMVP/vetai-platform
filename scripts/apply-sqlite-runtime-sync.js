const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const migrationName = "20260314093000_sqlite_runtime_schema_sync";
const rootDir = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const dbPath = process.env.VETAI_DB_PATH
  ? (path.isAbsolute(process.env.VETAI_DB_PATH)
      ? process.env.VETAI_DB_PATH
      : path.resolve(rootDir, process.env.VETAI_DB_PATH))
  : path.resolve(rootDir, "dev.db");
const migrationPath = path.resolve(
  rootDir,
  "prisma",
  "migrations",
  migrationName,
  "migration.sql",
);

if (!fs.existsSync(dbPath)) {
  throw new Error(`SQLite database not found: ${dbPath}`);
}

if (!fs.existsSync(migrationPath)) {
  throw new Error(`Migration file not found: ${migrationPath}`);
}

const sql = fs.readFileSync(migrationPath, "utf8");
const checksum = crypto.createHash("sha256").update(sql).digest("hex");
const backupPath = `${dbPath}.bak.${new Date().toISOString().replace(/[:.]/g, "-")}`;

fs.copyFileSync(dbPath, backupPath);

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const existingMigration = db
  .prepare("SELECT id FROM _prisma_migrations WHERE migration_name = ?")
  .get(migrationName);

if (existingMigration) {
  console.log(
    JSON.stringify(
      {
        status: "skipped",
        reason: "migration already recorded",
        dbPath,
        backupPath,
        migrationName,
      },
      null,
      2,
    ),
  );
  db.close();
  process.exit(0);
}

const migrationId = crypto.randomUUID();
const startedAt = Date.now();

db.prepare(
  `
    INSERT INTO _prisma_migrations (
      id,
      checksum,
      finished_at,
      migration_name,
      logs,
      rolled_back_at,
      started_at,
      applied_steps_count
    ) VALUES (?, ?, NULL, ?, NULL, NULL, ?, 0)
  `,
).run(migrationId, checksum, migrationName, startedAt);

try {
  db.exec(sql);
  const finishedAt = Date.now();
  db.prepare(
    `
      UPDATE _prisma_migrations
      SET finished_at = ?, applied_steps_count = 1
      WHERE id = ?
    `,
  ).run(finishedAt, migrationId);

  console.log(
    JSON.stringify(
      {
        status: "applied",
        dbPath,
        backupPath,
        migrationName,
      },
      null,
      2,
    ),
  );
} catch (error) {
  db.prepare(
    `
      UPDATE _prisma_migrations
      SET logs = ?, rolled_back_at = ?
      WHERE id = ?
    `,
  ).run(error instanceof Error ? error.stack || error.message : String(error), Date.now(), migrationId);
  throw error;
} finally {
  db.close();
}
