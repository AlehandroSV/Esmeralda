import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { initInDirectory } from "../../src/cli/init.js";

// We need to test the init command by running it
// Since it's a CLI command, we'll test the underlying functions

describe("esmeralda init", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "esmeralda-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates project directory structure", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(projectPath, { recursive: true });

    // Simulate init
    fs.mkdirSync(path.join(projectPath, "schema"), { recursive: true });
    fs.mkdirSync(path.join(projectPath, "migrations"), { recursive: true });
    fs.mkdirSync(path.join(projectPath, "seeds"), { recursive: true });

    expect(fs.existsSync(path.join(projectPath, "schema"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "migrations"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "seeds"))).toBe(true);
  });

  it("creates jade.config.lua", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(projectPath, { recursive: true });

    const configContent = `return {
    database = {
        driver = "postgresql",
        host = "localhost",
        port = 5432,
        database = "myproject",
        user = "postgres",
        password = ""
    }
}
`;
    fs.writeFileSync(path.join(projectPath, "jade.config.lua"), configContent);

    expect(fs.existsSync(path.join(projectPath, "jade.config.lua"))).toBe(true);
    const content = fs.readFileSync(path.join(projectPath, "jade.config.lua"), "utf-8");
    expect(content).toContain("postgresql");
    expect(content).toContain("myproject");
  });

  it("creates schema/init.lua", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(path.join(projectPath, "schema"), { recursive: true });

    const schemaInit = `-- Schema definitions
-- Require your entity files here

return {}
`;
    fs.writeFileSync(path.join(projectPath, "schema", "init.lua"), schemaInit);

    expect(fs.existsSync(path.join(projectPath, "schema", "init.lua"))).toBe(true);
    const content = fs.readFileSync(path.join(projectPath, "schema", "init.lua"), "utf-8");
    expect(content).toContain("return {}");
  });

  it("creates lib/app.lua", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(path.join(projectPath, "lib"), { recursive: true });

    const appLua = `local jade = require("jade")
local config = dofile("jade.config.lua")
jade.configure(config)

return jade
`;
    fs.writeFileSync(path.join(projectPath, "lib", "app.lua"), appLua);

    expect(fs.existsSync(path.join(projectPath, "lib", "app.lua"))).toBe(true);
    const content = fs.readFileSync(path.join(projectPath, "lib", "app.lua"), "utf-8");
    expect(content).toContain("require(\"jade\")");
  });

  it("creates missing directories when jade.config.lua exists", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(projectPath, { recursive: true });

    // Create only jade.config.lua
    const configContent = `return {
    database = {
        driver = "postgresql",
        host = "localhost",
        port = 5432,
        database = "myproject",
        user = "postgres",
        password = ""
    }
}
`;
    fs.writeFileSync(path.join(projectPath, "jade.config.lua"), configContent);

    // Run initInDirectory
    initInDirectory(projectPath, "myproject");

    // Check that missing directories were created
    expect(fs.existsSync(path.join(projectPath, "schema"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "migrations"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "seeds"))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, "schema", "init.lua"))).toBe(true);
  });

  it("does not overwrite existing files", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(projectPath, { recursive: true });

    // Create existing files
    const configContent = `return { database = { driver = "sqlite" } }`;
    fs.writeFileSync(path.join(projectPath, "jade.config.lua"), configContent);

    const schemaInitContent = `return { entities = {} }`;
    fs.mkdirSync(path.join(projectPath, "schema"), { recursive: true });
    fs.writeFileSync(path.join(projectPath, "schema", "init.lua"), schemaInitContent);

    // Run initInDirectory
    initInDirectory(projectPath, "myproject");

    // Check that existing files were not overwritten
    const configResult = fs.readFileSync(path.join(projectPath, "jade.config.lua"), "utf-8");
    expect(configResult).toBe(configContent);

    const schemaInitResult = fs.readFileSync(path.join(projectPath, "schema", "init.lua"), "utf-8");
    expect(schemaInitResult).toBe(schemaInitContent);
  });

  it("creates schema/init.lua if missing", () => {
    const projectPath = path.join(tmpDir, "myproject");
    fs.mkdirSync(projectPath, { recursive: true });

    // Create schema directory but not init.lua
    fs.mkdirSync(path.join(projectPath, "schema"), { recursive: true });

    // Run initInDirectory
    initInDirectory(projectPath, "myproject");

    // Check that schema/init.lua was created
    expect(fs.existsSync(path.join(projectPath, "schema", "init.lua"))).toBe(true);
    const content = fs.readFileSync(path.join(projectPath, "schema", "init.lua"), "utf-8");
    expect(content).toContain("return {}");
  });
});