import { Command } from "commander";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { ensureDir, writeFile, fileExists } from "../core/file-manager.js";

interface InitOptions {
  name?: string;
}

export function registerInit(program: Command): void {
  program
    .command("init")
    .description("Scaffold a new Jade project")
    .option("-n, --name <name>", "Project name", "my-app")
    .action(async (options: InitOptions) => {
      const projectName = options.name || "my-app";
      const projectPath = path.resolve(process.cwd(), projectName);

      Logger.info(`Creating Jade project: ${projectName}`);

      // Create directories
      ensureDir(path.join(projectPath, "schema"));
      ensureDir(path.join(projectPath, "migrations"));
      ensureDir(path.join(projectPath, "seeds"));
      ensureDir(path.join(projectPath, "lib"));

      // Create jade.config.lua
      writeFile(
        path.join(projectPath, "jade.config.lua"),
        `return {
    database = {
        driver = "postgresql",
        host = "localhost",
        port = 5432,
        database = "${projectName}",
        user = "postgres",
        password = ""
    }
}
`
      );

      // Create schema/init.lua
      writeFile(
        path.join(projectPath, "schema", "init.lua"),
        `-- Schema definitions
-- Require your entity files here

return {}
`
      );

      // Create lib/app.lua
      writeFile(
        path.join(projectPath, "lib", "app.lua"),
        `local jade = require("jade")

-- Load configuration
local config = dofile("jade.config.lua")
jade.configure(config)

print("Jade is ready!")
`
      );

      Logger.success(`Project ${projectName} created successfully!`);
      Logger.info("Next steps:");
      Logger.info(`  cd ${projectName}`);
      Logger.info("  Add your entities in schema/");
    });
}
