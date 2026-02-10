/**
 * Data migration script: MySQL SQL dump → PostgreSQL (via Prisma)
 *
 * Parses kujawab.sql (MySQL dump) directly — no MySQL server needed.
 *
 * Usage:
 *   1. Ensure PostgreSQL is running and DATABASE_URL is set in .env
 *   2. Run: npx tsx scripts/migrate-data.ts
 */

import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORY_MAP: Record<number, string> = {
  1: "KOMPUTER",
  2: "MATEMATIKA",
  3: "FISIKA",
  4: "KIMIA",
  5: "BIOLOGI",
  6: "ASTRONOMI",
  7: "KEBUMIAN",
  8: "EKONOMI",
  9: "GEOGRAFI",
};

const NOTIFICATION_TYPE_MAP: Record<number, string> = {
  1: "NEW_ANSWER",
  2: "NEW_COMMENT",
  3: "ANSWER_UPVOTED",
  4: "ANSWER_DOWNVOTED",
};

// ─── SQL Dump Parser ──────────────────────────────────────────────────

function parseSqlDump(sql: string, tableName: string): Record<string, any>[][] {
  // Find all INSERT INTO `tableName` statements and parse them
  const results: Record<string, any>[][] = [];
  const insertRegex = new RegExp(
    `INSERT INTO \`${tableName}\`\\s*\\(([^)]+)\\)\\s*VALUES`,
    "g"
  );

  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(sql)) !== null) {
    const columnsStr = match[1];
    const columns = columnsStr
      .split(",")
      .map((c) => c.trim().replace(/`/g, ""));

    // Find the VALUES data - everything from after "VALUES\n" until we hit ";\n"
    const startIdx = match.index + match[0].length;
    const endIdx = findStatementEnd(sql, startIdx);
    const valuesStr = sql.substring(startIdx, endIdx);

    const rows = parseValues(valuesStr, columns);
    results.push(rows);
  }

  // Flatten all INSERT blocks for this table
  return results;
}

function findStatementEnd(sql: string, startIdx: number): number {
  // Walk through the string respecting string literals to find the terminating semicolon
  let i = startIdx;
  while (i < sql.length) {
    const ch = sql[i];
    if (ch === "'") {
      // Skip over string literal
      i++;
      while (i < sql.length) {
        if (sql[i] === "\\") {
          i += 2; // skip escaped char
        } else if (sql[i] === "'") {
          i++;
          break;
        } else {
          i++;
        }
      }
    } else if (ch === ";") {
      return i;
    } else {
      i++;
    }
  }
  return sql.length;
}

function parseValues(
  valuesStr: string,
  columns: string[]
): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  let i = 0;

  while (i < valuesStr.length) {
    // Find next opening paren for a row
    const parenIdx = valuesStr.indexOf("(", i);
    if (parenIdx === -1) break;

    i = parenIdx + 1;
    const values: any[] = [];

    while (i < valuesStr.length) {
      // Skip whitespace
      while (i < valuesStr.length && valuesStr[i] === " ") i++;

      if (valuesStr[i] === ")") {
        i++;
        break;
      }

      if (valuesStr[i] === ",") {
        i++;
        // Skip whitespace after comma
        while (i < valuesStr.length && valuesStr[i] === " ") i++;
        continue;
      }

      if (valuesStr[i] === "'") {
        // String value
        i++;
        let str = "";
        while (i < valuesStr.length) {
          if (valuesStr[i] === "\\") {
            const next = valuesStr[i + 1];
            if (next === "'") {
              str += "'";
            } else if (next === "\\") {
              str += "\\";
            } else if (next === "n") {
              str += "\n";
            } else if (next === "r") {
              str += "\r";
            } else if (next === "t") {
              str += "\t";
            } else if (next === "0") {
              str += "\0";
            } else {
              str += next;
            }
            i += 2;
          } else if (valuesStr[i] === "'") {
            i++;
            break;
          } else {
            str += valuesStr[i];
            i++;
          }
        }
        values.push(str);
      } else if (
        valuesStr.substring(i, i + 4).toUpperCase() === "NULL"
      ) {
        values.push(null);
        i += 4;
      } else {
        // Numeric value
        let num = "";
        while (
          i < valuesStr.length &&
          valuesStr[i] !== "," &&
          valuesStr[i] !== ")"
        ) {
          num += valuesStr[i];
          i++;
        }
        const trimmed = num.trim();
        values.push(
          trimmed.includes(".") ? parseFloat(trimmed) : parseInt(trimmed, 10)
        );
      }
    }

    // Build row object
    const row: Record<string, any> = {};
    for (let c = 0; c < columns.length; c++) {
      row[columns[c]] = c < values.length ? values[c] : null;
    }
    rows.push(row);
  }

  return rows;
}

function getTableRows(sql: string, tableName: string): Record<string, any>[] {
  const blocks = parseSqlDump(sql, tableName);
  return blocks.flat();
}

// ─── Date helpers ─────────────────────────────────────────────────────

function parseDate(val: any): Date {
  if (val == null) return new Date();
  const s = String(val);
  if (s === "0000-00-00 00:00:00" || s === "0000-00-00") {
    return new Date("2015-01-01T00:00:00Z");
  }
  return new Date(s);
}

// ─── SQL escaping for raw inserts ─────────────────────────────────────

function escSql(val: any): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  // Escape single quotes by doubling them
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── Batch raw INSERT helper ──────────────────────────────────────────

async function batchInsert(
  table: string,
  columns: string[],
  rows: string[][],
  batchSize = 500
) {
  const colList = columns.map((c) => `"${c}"`).join(", ");
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const valuesList = batch.map((r) => `(${r.join(", ")})`).join(",\n");
    await prisma.$executeRawUnsafe(
      `INSERT INTO "${table}" (${colList}) VALUES\n${valuesList}`
    );
  }
}

// ─── Migration functions ──────────────────────────────────────────────

async function migrateUsers(sql: string): Promise<Set<number>> {
  console.log("Migrating users...");
  const rows = getTableRows(sql, "users");

  const insertRows: string[][] = [];
  const validIds = new Set<number>();

  for (const u of rows) {
    validIds.add(u.id);
    insertRows.push([
      escSql(u.id),
      escSql(u.firstname ?? ""),
      escSql(u.lastname ?? ""),
      escSql(u.username),
      escSql(u.email),
      escSql(u.password),
      escSql(Boolean(u.confirmed)),
      escSql(u.confirmation_code ?? null),
      escSql(u.remember_token ?? null),
      escSql(u.profile_picture ?? "/profpic_placeholder.jpg"),
      escSql(u.bio ?? null),
      escSql(u.location ?? null),
      escSql(u.website ?? null),
      escSql(u.oauth2_id ?? null),
      escSql(u.oauth2_provider ?? null),
      escSql(parseDate(u.created_at)),
      escSql(parseDate(u.updated_at)),
    ]);
  }

  await batchInsert(
    "users",
    [
      "id",
      "first_name",
      "last_name",
      "username",
      "email",
      "password",
      "confirmed",
      "confirmation_code",
      "remember_token",
      "profile_picture",
      "bio",
      "location",
      "website",
      "oauth2_id",
      "oauth2_provider",
      "created_at",
      "updated_at",
    ],
    insertRows
  );

  console.log(`  Migrated ${rows.length} users`);
  return validIds;
}

async function migrateAdmins(sql: string, validUserIds: Set<number>) {
  console.log("Migrating admins...");
  const rows = getTableRows(sql, "admin");
  let skipped = 0;

  for (const a of rows) {
    if (!validUserIds.has(a.user_id)) {
      skipped++;
      continue;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO "admins" ("id", "user_id") VALUES (${a.id}, ${a.user_id})`
    );
  }

  console.log(
    `  Migrated ${rows.length - skipped} admins` +
      (skipped ? ` (skipped ${skipped} with invalid user_id)` : "")
  );
}

async function migrateProblemSets(
  sql: string
): Promise<Set<number>> {
  console.log("Migrating problemsets...");
  const rows = getTableRows(sql, "problemsets");
  const validIds = new Set<number>();

  // Deduplicate codes: published rows always keep their code, duplicates get NULL
  const publishedCodes = new Set<string>();
  for (const s of rows) {
    if (s.code && Boolean(s.published)) {
      publishedCodes.add(s.code);
    }
  }

  const insertRows: string[][] = [];
  let nulledCodes = 0;
  const usedCodes = new Set<string>();
  for (const s of rows) {
    validIds.add(s.id);
    const category =
      s.category != null ? CATEGORY_MAP[s.category] ?? null : null;

    let code: string | null = s.code === "" || s.code == null ? null : s.code;
    if (code) {
      if (usedCodes.has(code)) {
        console.warn(`  WARN: Duplicate code '${code}' on problemset ${s.id} — setting to NULL`);
        code = null;
        nulledCodes++;
      } else if (!Boolean(s.published) && publishedCodes.has(code)) {
        console.warn(`  WARN: Unpublished duplicate code '${code}' on problemset ${s.id} — setting to NULL`);
        code = null;
        nulledCodes++;
      } else {
        usedCodes.add(code);
      }
    }

    insertRows.push([
      escSql(s.id),
      category ? escSql(category) : "NULL",
      escSql(code),
      escSql(s.name),
      escSql(s.problem_count),
      escSql(Boolean(s.published)),
      escSql(parseDate(s.created_at)),
      escSql(parseDate(s.updated_at)),
    ]);
  }

  // Category is an enum — need to cast
  const colList = [
    '"id"',
    '"category"',
    '"code"',
    '"name"',
    '"problem_count"',
    '"published"',
    '"created_at"',
    '"updated_at"',
  ].join(", ");

  for (let i = 0; i < insertRows.length; i += 500) {
    const batch = insertRows.slice(i, i + 500);
    const valuesList = batch
      .map((r) => {
        // Replace the category value with a cast
        const parts = [...r];
        parts[1] = parts[1] === "NULL" ? "NULL" : `${parts[1]}::"Category"`;
        return `(${parts.join(", ")})`;
      })
      .join(",\n");
    await prisma.$executeRawUnsafe(
      `INSERT INTO "problemsets" (${colList}) VALUES\n${valuesList}`
    );
  }

  console.log(
    `  Migrated ${rows.length} problemsets` +
      (nulledCodes ? ` (nulled ${nulledCodes} duplicate codes on unpublished drafts)` : "")
  );
  return validIds;
}

async function migrateProblems(
  sql: string,
  validProblemSetIds: Set<number>
): Promise<Set<number>> {
  console.log("Migrating problems...");
  const rows = getTableRows(sql, "problems");
  const validIds = new Set<number>();
  let skipped = 0;

  const insertRows: string[][] = [];
  for (const p of rows) {
    if (!validProblemSetIds.has(p.problemset_id)) {
      console.warn(
        `  WARN: Skipping problem ${p.id} — invalid problemset_id ${p.problemset_id}`
      );
      skipped++;
      continue;
    }
    validIds.add(p.id);
    insertRows.push([
      escSql(p.id),
      escSql(p.problemset_id),
      escSql(p.number ?? null),
      escSql(p.description),
      escSql(p.view_count ?? 0),
      escSql(parseDate(p.created_at)),
      escSql(parseDate(p.updated_at)),
    ]);
  }

  await batchInsert(
    "problems",
    [
      "id",
      "problemset_id",
      "number",
      "description",
      "view_count",
      "created_at",
      "updated_at",
    ],
    insertRows
  );

  console.log(
    `  Migrated ${rows.length - skipped} problems` +
      (skipped ? ` (skipped ${skipped})` : "")
  );
  return validIds;
}

async function migrateExtraDescriptions(
  sql: string,
  validProblemSetIds: Set<number>
) {
  console.log("Migrating extra_descriptions...");
  const rows = getTableRows(sql, "extra_description");
  let skipped = 0;

  const insertRows: string[][] = [];
  for (const e of rows) {
    if (!validProblemSetIds.has(e.problemset_id)) {
      skipped++;
      continue;
    }
    insertRows.push([
      escSql(e.id),
      escSql(e.problemset_id),
      escSql(e.start_number),
      escSql(e.end_number),
      escSql(e.description),
      escSql(parseDate(e.created_at)),
      escSql(parseDate(e.updated_at)),
    ]);
  }

  await batchInsert(
    "extra_descriptions",
    [
      "id",
      "problemset_id",
      "start_number",
      "end_number",
      "description",
      "created_at",
      "updated_at",
    ],
    insertRows
  );

  console.log(
    `  Migrated ${rows.length - skipped} extra descriptions` +
      (skipped ? ` (skipped ${skipped})` : "")
  );
}

async function migrateAnswers(
  sql: string,
  validProblemIds: Set<number>,
  validUserIds: Set<number>
): Promise<Set<number>> {
  console.log("Migrating answers...");
  const rows = getTableRows(sql, "answers");
  const validIds = new Set<number>();
  let skipped = 0;

  const insertRows: string[][] = [];
  for (const a of rows) {
    if (!validProblemIds.has(a.problem_id)) {
      console.warn(
        `  WARN: Skipping answer ${a.id} — invalid problem_id ${a.problem_id}`
      );
      skipped++;
      continue;
    }
    if (!validUserIds.has(a.author_id)) {
      console.warn(
        `  WARN: Skipping answer ${a.id} — invalid author_id ${a.author_id}`
      );
      skipped++;
      continue;
    }
    validIds.add(a.id);
    insertRows.push([
      escSql(a.id),
      escSql(a.problem_id),
      escSql(a.author_id),
      escSql(a.description),
      escSql(parseDate(a.created_at)),
      escSql(parseDate(a.updated_at)),
    ]);
  }

  await batchInsert(
    "answers",
    ["id", "problem_id", "author_id", "description", "created_at", "updated_at"],
    insertRows
  );

  console.log(
    `  Migrated ${rows.length - skipped} answers` +
      (skipped ? ` (skipped ${skipped})` : "")
  );
  return validIds;
}

async function migrateComments(
  sql: string,
  validAnswerIds: Set<number>,
  validUserIds: Set<number>
) {
  console.log("Migrating comments...");
  const rows = getTableRows(sql, "comments");
  let skipped = 0;

  const insertRows: string[][] = [];
  for (const c of rows) {
    if (!validAnswerIds.has(c.answer_id)) {
      skipped++;
      continue;
    }
    if (!validUserIds.has(c.author_id)) {
      skipped++;
      continue;
    }
    insertRows.push([
      escSql(c.id),
      escSql(c.answer_id),
      escSql(c.author_id),
      escSql(c.content),
      escSql(parseDate(c.created_at)),
      escSql(parseDate(c.updated_at)),
    ]);
  }

  await batchInsert(
    "comments",
    ["id", "answer_id", "author_id", "content", "created_at", "updated_at"],
    insertRows
  );

  console.log(
    `  Migrated ${rows.length - skipped} comments` +
      (skipped ? ` (skipped ${skipped})` : "")
  );
}

async function migrateVotes(
  sql: string,
  validAnswerIds: Set<number>,
  validUserIds: Set<number>
) {
  console.log("Migrating votes (upvotes + downvotes)...");

  const seen = new Set<string>();
  const insertRows: string[][] = [];
  let skipped = 0;

  // Upvotes
  const upRows = getTableRows(sql, "upvotes");
  for (const u of upRows) {
    if (!validAnswerIds.has(u.answer_id) || !validUserIds.has(u.voter_id)) {
      skipped++;
      continue;
    }
    const key = `${u.answer_id}-${u.voter_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    insertRows.push([
      escSql(u.answer_id),
      escSql(u.voter_id),
      escSql(1),
    ]);
  }

  // Downvotes
  const downRows = getTableRows(sql, "downvotes");
  for (const d of downRows) {
    if (!validAnswerIds.has(d.answer_id) || !validUserIds.has(d.voter_id)) {
      skipped++;
      continue;
    }
    const key = `${d.answer_id}-${d.voter_id}`;
    if (seen.has(key)) {
      console.warn(
        `  WARN: Conflict — user ${d.voter_id} has both up/downvote on answer ${d.answer_id}, keeping upvote`
      );
      continue;
    }
    seen.add(key);
    insertRows.push([
      escSql(d.answer_id),
      escSql(d.voter_id),
      escSql(-1),
    ]);
  }

  await batchInsert(
    "votes",
    ["answer_id", "voter_id", "value"],
    insertRows
  );

  console.log(
    `  Migrated ${insertRows.length} votes` +
      (skipped ? ` (skipped ${skipped} with invalid FKs)` : "")
  );
}

async function migrateProblemHistory(
  sql: string,
  validProblemIds: Set<number>,
  validUserIds: Set<number>
) {
  console.log("Migrating problem_history...");
  const rows = getTableRows(sql, "problem_history");
  let skipped = 0;

  const insertRows: string[][] = [];
  for (const h of rows) {
    if (!validProblemIds.has(h.problem_id)) {
      skipped++;
      continue;
    }
    if (!validUserIds.has(h.author_id)) {
      skipped++;
      continue;
    }
    insertRows.push([
      escSql(h.id),
      escSql(h.problem_id),
      escSql(h.author_id),
      escSql(h.description),
      escSql(parseDate(h.time)),
    ]);
  }

  await batchInsert(
    "problem_history",
    ["id", "problem_id", "author_id", "description", "created_at"],
    insertRows
  );

  console.log(
    `  Migrated ${rows.length - skipped} problem history entries` +
      (skipped ? ` (skipped ${skipped})` : "")
  );
}

async function migrateNotifications(
  sql: string,
  validUserIds: Set<number>
) {
  console.log("Migrating notifications...");
  const rows = getTableRows(sql, "notifications");
  let skipped = 0;

  const colList = [
    '"id"',
    '"type"',
    '"sent_time"',
    '"receiver_id"',
    '"sender_id"',
    '"params"',
    '"read"',
  ].join(", ");

  const insertRows: string[][] = [];
  for (const n of rows) {
    const typeName = NOTIFICATION_TYPE_MAP[n.type];
    if (!typeName) {
      skipped++;
      continue;
    }
    if (!validUserIds.has(n.receiver_id) || !validUserIds.has(n.sender_id)) {
      skipped++;
      continue;
    }

    let params: string = "NULL";
    if (n.params) {
      try {
        JSON.parse(n.params); // validate
        params = escSql(n.params); // store as valid JSON string
      } catch {
        params = escSql(JSON.stringify({ raw: n.params }));
      }
    }

    insertRows.push([
      escSql(n.id),
      `'${typeName}'::"NotificationType"`,
      escSql(parseDate(n.sent_time)),
      escSql(n.receiver_id),
      escSql(n.sender_id),
      params,
      escSql(Boolean(n.read)),
    ]);
  }

  // Custom batch insert because of enum cast
  for (let i = 0; i < insertRows.length; i += 500) {
    const batch = insertRows.slice(i, i + 500);
    const valuesList = batch.map((r) => `(${r.join(", ")})`).join(",\n");
    await prisma.$executeRawUnsafe(
      `INSERT INTO "notifications" (${colList}) VALUES\n${valuesList}`
    );
  }

  console.log(
    `  Migrated ${insertRows.length} notifications` +
      (skipped ? ` (skipped ${skipped})` : "")
  );
}

async function migratePasswordReminders(sql: string) {
  console.log("Migrating password_reminders...");
  const rows = getTableRows(sql, "password_reminders");

  const insertRows: string[][] = [];
  for (const r of rows) {
    insertRows.push([
      escSql(r.email),
      escSql(r.token),
      escSql(parseDate(r.created_at)),
    ]);
  }

  await batchInsert(
    "password_reminders",
    ["email", "token", "created_at"],
    insertRows
  );

  console.log(`  Migrated ${rows.length} password reminders`);
}

async function resetSequences() {
  console.log("Resetting auto-increment sequences...");
  const tables = [
    { table: "users", seq: "users_id_seq" },
    { table: "admins", seq: "admins_id_seq" },
    { table: "problemsets", seq: "problemsets_id_seq" },
    { table: "problems", seq: "problems_id_seq" },
    { table: "extra_descriptions", seq: "extra_descriptions_id_seq" },
    { table: "answers", seq: "answers_id_seq" },
    { table: "comments", seq: "comments_id_seq" },
    { table: "votes", seq: "votes_id_seq" },
    { table: "problem_history", seq: "problem_history_id_seq" },
    { table: "notifications", seq: "notifications_id_seq" },
    { table: "password_reminders", seq: "password_reminders_id_seq" },
  ];

  for (const { table, seq } of tables) {
    await prisma.$executeRawUnsafe(
      `SELECT setval('"${seq}"', COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
    );
  }
  console.log("  Sequences reset");
}

// ─── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting migration from MySQL dump to PostgreSQL...\n");

  const dumpPath = join(__dirname, "..", "kujawab.sql");
  console.log(`Reading SQL dump from ${dumpPath}...`);
  const sql = readFileSync(dumpPath, "utf-8");
  console.log(`  Read ${(sql.length / 1024 / 1024).toFixed(1)} MB\n`);

  try {
    const validUserIds = await migrateUsers(sql);
    await migrateAdmins(sql, validUserIds);
    const validProblemSetIds = await migrateProblemSets(sql);
    const validProblemIds = await migrateProblems(sql, validProblemSetIds);
    await migrateExtraDescriptions(sql, validProblemSetIds);
    const validAnswerIds = await migrateAnswers(
      sql,
      validProblemIds,
      validUserIds
    );
    await migrateComments(sql, validAnswerIds, validUserIds);
    await migrateVotes(sql, validAnswerIds, validUserIds);
    await migrateProblemHistory(sql, validProblemIds, validUserIds);
    await migrateNotifications(sql, validUserIds);
    await migratePasswordReminders(sql);
    await resetSequences();

    console.log("\nMigration complete!");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
