import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { findProjectRoot } from "../core/project.js";
import { parseSchemaFile } from "../core/schema-parser.js";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

interface DbPushOptions {
  force?: boolean;
}

export function registerDbPush(program: Command): void {
  program
    .command("db push")
    .description("Push schema directly to database (skip migrations)")
    .option("--force", "Skip confirmation")
    .action(async (options: DbPushOptions) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        Logger.error("Not a Jade project. Run 'esmeralda init' first.");
        process.exit(1);
      }

      const schemaDir = path.join(projectRoot, "schema");
      if (!fs.existsSync(schemaDir)) {
        Logger.error("Schema directory not found.");
        return;
      }

      // Parse schema files
      const files = fs.readdirSync(schemaDir).filter(f => f.endsWith(".lua") && f !== "init.lua");
      const entities = [];

      for (const file of files) {
        const content = fs.readFileSync(path.join(schemaDir, file), "utf-8");
        const parsed = parseSchemaFile(content);
        entities.push(...parsed);
      }

      if (entities.length === 0) {
        Logger.warn("No entities found in schema/");
        return;
      }

      Logger.info(`Found ${entities.length} entities`);
      Logger.info("Pushing schema to database...");

      if (!options.force) {
        Logger.warn("This will modify your database schema directly.");
        Logger.info("Use --force to skip this confirmation.");
        return;
      }

      try {
        // Generate and execute SQL
        const sqlStatements = generateSchemaSQL(entities);

        for (const sql of sqlStatements) {
          Logger.info(`  Executing: ${sql.substring(0, 80)}...`);

          const script = `
            local jade = require("jade")
            local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
            jade.configure(config)
            jade.driver():execute([[${sql}]])
          `;

          await exec("lua", ["-e", script]);
        }

        Logger.success("Schema pushed to database!");
      } catch (error: any) {
        Logger.error("Failed to push schema:");
        Logger.error(error.message);
        process.exit(1);
      }
    });
}

function generateSchemaSQL(entities: any[]): string[] {
  const statements: string[] = [];

  for (const entity of entities) {
    const columns = entity.columns || [];
    const colDefs: string[] = [];

    for (const col of columns) {
      let def = `"${col.name}" ${col.type || "TEXT"}`;

      if (col.length && col.type === "string") {
        def = `"${col.name}" VARCHAR(${col.length})`;
      }

      if (col.primaryKey) def += " PRIMARY KEY";
      if (col.notNull) def += " NOT NULL";
      if (col.unique) def += " UNIQUE";
      if (col.default !== undefined) def += ` DEFAULT ${col.default}`;

      colDefs.push(def);
    }

    const sql = `CREATE TABLE IF NOT EXISTS "${entity.tableName}" (\n  ${colDefs.join(",\n  ")}\n)`;
    statements.push(sql);
  }

  return statements;
}
