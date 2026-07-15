import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { findProjectRoot } from "../core/project.js";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

interface MigrateOptions {
  preview?: boolean;
}

export function registerMigrate(program: Command): void {
  program
    .command("migrate")
    .description("Run pending migrations")
    .option("--preview", "Show SQL without executing")
    .action(async (options: MigrateOptions) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        Logger.error("Not a Jade project. Run 'esmeralda init' first.");
        process.exit(1);
      }

      const migrationsDir = path.join(projectRoot, "migrations");
      if (!fs.existsSync(migrationsDir)) {
        Logger.error("Migrations directory not found.");
        process.exit(1);
      }

      // List migration files
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith(".lua") && !f.startsWith("_"))
        .sort();

      if (files.length === 0) {
        Logger.warn("No migrations found.");
        return;
      }

      Logger.info(`Found ${files.length} migration(s)`);
      Logger.info("Running migrations...");

      // Execute each migration via Lua
      for (const file of files) {
        Logger.info(`  Applying: ${file}`);

        if (options.preview) {
          Logger.info(`    [preview] Would execute migration`);
          continue;
        }

        try {
          const script = `
            local jade = require("jade")
            local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
            jade.configure(config)
            jade.migration.init(jade.driver())
            local migration = dofile("${path.join(migrationsDir, file).replace(/\\/g, "\\\\")}")
            migration.up()
          `;

          await exec("lua", ["-e", script]);
          Logger.success(`  Applied: ${file}`);
        } catch (error: any) {
          Logger.error(`  Failed: ${file}`);
          Logger.error(error.message);
          process.exit(1);
        }
      }

      Logger.success("All migrations applied!");
    });
}
