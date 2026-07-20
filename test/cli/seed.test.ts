import { describe, it, expect } from "vitest";
import { Command } from "commander";
import { registerSeed } from "../../src/cli/seed.js";

describe("esmeralda db seed", () => {
  it("registers seed as a subcommand of db", () => {
    const db = new Command();
    registerSeed(db);

    const commands = db.commands.map(c => c.name());
    expect(commands).toContain("seed");
  });

  it("does not register seed on the top-level program", () => {
    const program = new Command();
    const db = program.command("db");
    registerSeed(db);

    const topCommands = program.commands.map(c => c.name());
    expect(topCommands).not.toContain("seed");
  });

  it("registers seed with correct description", () => {
    const db = new Command();
    registerSeed(db);

    const seedCmd = db.commands.find(c => c.name() === "seed");
    expect(seedCmd).toBeDefined();
    expect(seedCmd!.description()).toBe("Run seed files");
  });
});
