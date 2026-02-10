/**
 * Data migration script: MySQL (old kujawab) → PostgreSQL (new kujawab)
 *
 * Usage:
 *   1. npm install --save-dev mysql2 tsx
 *   2. Set env vars: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, DATABASE_URL
 *   3. Run: npx tsx scripts/migrate-data.ts
 *
 * This script migrates all data from the old MySQL database to the new PostgreSQL database.
 * Tables are migrated in dependency order to respect foreign key constraints.
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
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

async function getConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST ?? "localhost",
    user: process.env.MYSQL_USER ?? "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE ?? "kujawab",
  });
}

async function migrateUsers(conn: mysql.Connection) {
  console.log("Migrating users...");
  const [rows] = await conn.query("SELECT * FROM users ORDER BY id");
  const users = rows as any[];

  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.id,
        firstName: u.firstname ?? "",
        lastName: u.lastname ?? "",
        username: u.username,
        email: u.email,
        password: u.password,
        confirmed: Boolean(u.confirmed),
        confirmationCode: u.confirmation_code ?? null,
        rememberToken: u.remember_token ?? null,
        profilePicture: u.profile_picture ?? "/profpic_placeholder.jpg",
        bio: u.bio ?? null,
        location: u.location ?? null,
        website: u.website ?? null,
        oauth2Id: u.oauth2_id ?? null,
        oauth2Provider: u.oauth2_provider ?? null,
        createdAt: u.created_at,
        updatedAt: u.updated_at,
      },
    });
  }
  console.log(`  Migrated ${users.length} users`);
}

async function migrateAdmins(conn: mysql.Connection) {
  console.log("Migrating admins...");
  const [rows] = await conn.query("SELECT * FROM admin ORDER BY id");
  const admins = rows as any[];

  for (const a of admins) {
    await prisma.admin.create({
      data: {
        id: a.id,
        userId: a.user_id,
      },
    });
  }
  console.log(`  Migrated ${admins.length} admins`);
}

async function migrateProblemSets(conn: mysql.Connection) {
  console.log("Migrating problemsets...");
  const [rows] = await conn.query("SELECT * FROM problemsets ORDER BY id");
  const sets = rows as any[];

  for (const s of sets) {
    await prisma.problemSet.create({
      data: {
        id: s.id,
        category: s.category != null ? (CATEGORY_MAP[s.category] as any) : null,
        code: s.code ?? null,
        name: s.name,
        problemCount: s.problem_count,
        published: Boolean(s.published),
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      },
    });
  }
  console.log(`  Migrated ${sets.length} problemsets`);
}

async function migrateProblems(conn: mysql.Connection) {
  console.log("Migrating problems...");
  const [rows] = await conn.query("SELECT * FROM problems ORDER BY id");
  const problems = rows as any[];

  for (const p of problems) {
    await prisma.problem.create({
      data: {
        id: p.id,
        problemSetId: p.problemset_id,
        number: p.number ?? null,
        description: p.description,
        viewCount: p.view_count ?? 0,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      },
    });
  }
  console.log(`  Migrated ${problems.length} problems`);
}

async function migrateExtraDescriptions(conn: mysql.Connection) {
  console.log("Migrating extra_descriptions...");
  const [rows] = await conn.query("SELECT * FROM extra_description ORDER BY id");
  const extras = rows as any[];

  for (const e of extras) {
    await prisma.extraDescription.create({
      data: {
        id: e.id,
        problemSetId: e.problemset_id,
        startNumber: e.start_number,
        endNumber: e.end_number,
        description: e.description,
        createdAt: e.created_at,
        updatedAt: e.updated_at,
      },
    });
  }
  console.log(`  Migrated ${extras.length} extra descriptions`);
}

async function migrateAnswers(conn: mysql.Connection) {
  console.log("Migrating answers...");
  const [rows] = await conn.query("SELECT * FROM answers ORDER BY id");
  const answers = rows as any[];

  for (const a of answers) {
    await prisma.answer.create({
      data: {
        id: a.id,
        problemId: a.problem_id,
        authorId: a.author_id,
        description: a.description,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
      },
    });
  }
  console.log(`  Migrated ${answers.length} answers`);
}

async function migrateComments(conn: mysql.Connection) {
  console.log("Migrating comments...");
  const [rows] = await conn.query("SELECT * FROM comments ORDER BY id");
  const comments = rows as any[];

  for (const c of comments) {
    await prisma.comment.create({
      data: {
        id: c.id,
        answerId: c.answer_id,
        authorId: c.author_id,
        content: c.content,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      },
    });
  }
  console.log(`  Migrated ${comments.length} comments`);
}

async function migrateVotes(conn: mysql.Connection) {
  console.log("Migrating votes (upvotes + downvotes)...");

  // Track seen pairs to deduplicate
  const seen = new Set<string>();
  let count = 0;

  const [upRows] = await conn.query("SELECT * FROM upvotes ORDER BY id");
  for (const u of upRows as any[]) {
    const key = `${u.answer_id}-${u.voter_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await prisma.vote.create({
      data: {
        answerId: u.answer_id,
        voterId: u.voter_id,
        value: 1,
      },
    });
    count++;
  }

  const [downRows] = await conn.query("SELECT * FROM downvotes ORDER BY id");
  for (const d of downRows as any[]) {
    const key = `${d.answer_id}-${d.voter_id}`;
    if (seen.has(key)) {
      // User has both upvote and downvote — skip the downvote (upvote takes precedence)
      console.warn(`  Conflict: user ${d.voter_id} has both up/downvote on answer ${d.answer_id}, keeping upvote`);
      continue;
    }
    seen.add(key);
    await prisma.vote.create({
      data: {
        answerId: d.answer_id,
        voterId: d.voter_id,
        value: -1,
      },
    });
    count++;
  }

  console.log(`  Migrated ${count} votes`);
}

async function migrateProblemHistory(conn: mysql.Connection) {
  console.log("Migrating problem_history...");
  const [rows] = await conn.query("SELECT * FROM problem_history ORDER BY id");
  const history = rows as any[];

  for (const h of history) {
    await prisma.problemHistory.create({
      data: {
        id: h.id,
        problemId: h.problem_id,
        authorId: h.author_id,
        description: h.description,
        createdAt: h.time,
      },
    });
  }
  console.log(`  Migrated ${history.length} problem history entries`);
}

async function migrateNotifications(conn: mysql.Connection) {
  console.log("Migrating notifications...");
  const [rows] = await conn.query("SELECT * FROM notifications ORDER BY id");
  const notifications = rows as any[];

  let skipped = 0;
  for (const n of notifications) {
    const typeName = NOTIFICATION_TYPE_MAP[n.type];
    if (!typeName) {
      skipped++;
      continue;
    }

    let params: any = null;
    if (n.params) {
      try {
        params = JSON.parse(n.params);
      } catch {
        // Old data might not be valid JSON, store as-is wrapped in an object
        params = { raw: n.params };
      }
    }

    await prisma.notification.create({
      data: {
        id: n.id,
        type: typeName as any,
        sentTime: n.sent_time,
        receiverId: n.receiver_id,
        senderId: n.sender_id,
        params,
        read: Boolean(n.read),
      },
    });
  }
  console.log(`  Migrated ${notifications.length - skipped} notifications (skipped ${skipped} with unknown type)`);
}

async function migratePasswordReminders(conn: mysql.Connection) {
  console.log("Migrating password_reminders...");
  const [rows] = await conn.query("SELECT * FROM password_reminders ORDER BY created_at");
  const reminders = rows as any[];

  for (const r of reminders) {
    await prisma.passwordReminder.create({
      data: {
        email: r.email,
        token: r.token,
        createdAt: r.created_at,
      },
    });
  }
  console.log(`  Migrated ${reminders.length} password reminders`);
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

async function main() {
  console.log("Starting migration from MySQL to PostgreSQL...\n");

  const conn = await getConnection();

  try {
    await migrateUsers(conn);
    await migrateAdmins(conn);
    await migrateProblemSets(conn);
    await migrateProblems(conn);
    await migrateExtraDescriptions(conn);
    await migrateAnswers(conn);
    await migrateComments(conn);
    await migrateVotes(conn);
    await migrateProblemHistory(conn);
    await migrateNotifications(conn);
    await migratePasswordReminders(conn);
    await resetSequences();

    console.log("\nMigration complete!");
  } catch (error) {
    console.error("\nMigration failed:", error);
    process.exit(1);
  } finally {
    await conn.end();
    await prisma.$disconnect();
  }
}

main();
