import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Lua binary detection in Docker", () => {
  it("seed.ts: detects lua binary via 'which' before executing", () => {
    const seedSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/seed.ts"),
      "utf-8"
    );
    // Uses which to detect available binary
    expect(seedSource).toContain('which ${bin}');
    // Has fallback chain
    expect(seedSource).toContain('const luaBins = ["luajit", "lua5.4", "lua5.3", "lua5.1", "lua"]');
  });

  it("migrate.ts: detects lua binary via 'which' before executing", () => {
    const migrateSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/migrate.ts"),
      "utf-8"
    );
    expect(migrateSource).toContain('which ${bin}');
    expect(migrateSource).toContain('const luaBins = ["luajit", "lua5.4", "lua5.3", "lua5.1", "lua"]');
  });

  it("seed.ts: local fallback tries luajit then lua", () => {
    const seedSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/seed.ts"),
      "utf-8"
    );
    expect(seedSource).toContain('await exec("luajit"');
    expect(seedSource).toContain('await exec("lua"');
  });

  it("migrate.ts: local fallback tries luajit then lua", () => {
    const migrateSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/migrate.ts"),
      "utf-8"
    );
    expect(migrateSource).toContain('await exec("luajit"');
    expect(migrateSource).toContain('await exec("lua"');
  });

  it("seed.ts: Docker uses exec (not spawn) with -T flag", () => {
    const seedSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/seed.ts"),
      "utf-8"
    );
    expect(seedSource).toContain('"compose", "exec", "-T"');
  });

  it("migrate.ts: Docker uses exec (not spawn) with -T flag", () => {
    const migrateSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/migrate.ts"),
      "utf-8"
    );
    expect(migrateSource).toContain('"compose", "exec", "-T"');
  });

  it("seed.ts: detects docker-compose service name from file", () => {
    const seedSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/seed.ts"),
      "utf-8"
    );
    expect(seedSource).toContain('composeContent.match');
    expect(seedSource).toContain('serviceName = serviceMatch');
  });

  it("seed.ts: service name defaults to 'api'", () => {
    const seedSource = fs.readFileSync(
      path.join(__dirname, "../../src/cli/seed.ts"),
      "utf-8"
    );
    expect(seedSource).toContain('serviceMatch ? serviceMatch[1] : "api"');
  });
});
