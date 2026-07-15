import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { findProjectRoot } from "../core/project.js";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

interface SeedOptions {
  name?: string;
}

export function registerSeed(program: Command): void {
  program
    .command("seed")
    .description("Run seed files")
    .argument("[name]", "Seed file name (without extension)")
    .action(async (name?: string) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        Logger.error("Not a Jade project. Run 'esmeralda init' first.");
        process.exit(1);
      }

      const seedsDir = path.join(projectRoot, "seeds");
      if (!fs.existsSync(seedsDir)) {
        Logger.error("Seeds directory not found.");
        return;
      }

      // List seed files
      let files = fs.readdirSync(seedsDir).filter(f => f.endsWith(".lua"));

      if (name) {
        files = files.filter(f => f.includes(name));
      }

      if (files.length === 0) {
        Logger.warn("No seed files found.");
        return;
      }

      Logger.info(`Running ${files.length} seed file(s)...`);

      for (const file of files) {
        Logger.info(`  Seeding: ${file}`);

        try {
          const script = `
            local jade = require("jade")
            local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
            jade.configure(config)
            dofile("${path.join(seedsDir, file).replace(/\\/g, "\\\\")}")
          `;

          await exec("lua", ["-e", script]);
          Logger.success(`  Seeded: ${file}`);
        } catch (error: any) {
          Logger.error(`  Failed: ${file}`);
          Logger.error(error.message);
          process.exit(1);
        }
      }

      Logger.success("All seeds executed!");
    });
}
