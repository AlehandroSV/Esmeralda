import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { findProjectRoot } from "../core/project.js";
import { writeFile, ensureDir } from "../core/file-manager.js";

interface MigrateCreateOptions {
  name?: string;
}

export function registerMigrateCreate(migrate: Command): void {
  migrate
    .command("create")
    .description("Create a new empty migration file")
    .argument("[name]", "Migration name")
    .action(async (name?: string) => {
      if (!name) {
        Logger.error("Please provide a migration name.");
        Logger.info("Usage: esmeralda migrate create <name>");
        process.exit(1);
      }

      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        Logger.error("Not a Jade project. Run 'esmeralda init' first.");
        process.exit(1);
      }

      const migrationsDir = path.join(projectRoot, "migrations");
      ensureDir(migrationsDir);

      const timestamp = Date.now();
      const filename = `${timestamp}_${name}.lua`;
      const filePath = path.join(migrationsDir, filename);

      const content = `-- Migration: ${name}
-- Created by Esmeralda
-- ${new Date().toISOString()}

local Jade = require("jade")

local M = {}

function M.up()
    -- TODO: implement up migration
end

function M.down()
    -- TODO: implement down migration
end

return M
`;

      writeFile(filePath, content);

      Logger.success(`Migration created: ${filename}`);
      Logger.info(`Edit: ${filePath}`);
    });
}
