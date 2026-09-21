import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
const apiDirectory = fileURLToPath(new URL("../", import.meta.url));
const directory = mkdtempSync(join(tmpdir(), "deoly-baseline-"));
const url = `file:${join(directory, "fresh.db")}`;
const schema = join(directory, "schema.prisma");
const env = { ...process.env, DATABASE_URL: url };
const prisma = new PrismaClient({ datasources: { db: { url } } });
function run(...args) {
  execFileSync(process.execPath, [require.resolve("prisma/build/index.js"), ...args], {
    cwd: apiDirectory, env, stdio: "inherit"
  });
}

try {
  writeFileSync(join(directory, "fresh.db"), "");
  cpSync(join(apiDirectory, "prisma/schema.prisma"), schema);
  cpSync(join(apiDirectory, "prisma/migrations"), join(directory, "migrations"), { recursive: true });
  run("migrate", "deploy", "--schema", schema);
  run("migrate", "deploy", "--schema", schema);
  run("migrate", "status", "--schema", schema);
  run("migrate", "diff", "--from-url", url, "--to-schema-datamodel", schema, "--exit-code");
  for (let attempt = 0; attempt < 2; attempt++) {
    run("db", "seed");
    assert.equal(await prisma.user.count(), 3);
    assert.equal(await prisma.friendship.count(), 2);
    assert.equal(await prisma.post.count(), 6);
    assert.equal(await prisma.comment.count(), 1);
    assert.equal(await prisma.reaction.count(), 2);
    assert.deepEqual(await prisma.$queryRawUnsafe("PRAGMA foreign_key_check"), []);
  }
  console.log("Verified: fresh migration, repeat deploy, schema match, seed and reseed, foreign keys.");
} finally {
  await prisma.$disconnect();
  rmSync(directory, { recursive: true, force: true });
}
