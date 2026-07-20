import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import { Logger } from "../utils/logger.js";
import { findProjectRoot } from "../core/project.js";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

interface SchemaGenerateOptions {
  name?: string;
  output?: string;
}

export function registerSchemaGenerate(program: Command): void {
  program
    .command("schema-generate")
    .description("Generate schema files from declarative schema definition")
    .option("-n, --name <name>", "Schema name (default: schema)")
    .option("-o, --output <dir>", "Output directory (default: schema/)")
    .action(async (options: SchemaGenerateOptions) => {
      try {
        const projectRoot = findProjectRoot();
        if (!projectRoot) {
          Logger.error("Not a Jade project. Run 'esmeralda init' first.");
          process.exit(1);
        }

        Logger.info("Generating schema from declarative definition...");

        // Check if schema definition file exists
        const schemaDefPath = path.join(projectRoot, "schema.lua");
        if (!fs.existsSync(schemaDefPath)) {
          Logger.error("schema.lua not found in project root.");
          Logger.info("Create a schema.lua file with your declarative schema definition.");
          Logger.info("Example:");
          Logger.info(`
local Jade = require("jade")

local schema = Jade.Declarative.define(function(d)
    d:model("User", {
        name = "string",
        email = "string(100)",
        validations = {
            name = { presence = true },
            email = { uniqueness = true },
        },
    }):model("Post", {
        title = "string",
        body = "text",
        relations = {
            user = { type = "belongsTo", model = "User" },
        },
    })
end)

return schema
`);
          process.exit(1);
        }

        // Execute Lua script to generate schema files
        const outputDir = options.output || "schema";
        const schemaName = options.name || "schema";

        const script = `
          local jade = require("jade")
          local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
          jade.configure(config)

          -- Load schema definition
          local schema_def = dofile("${schemaDefPath.replace(/\\/g, "\\\\")}")

          -- Generate Lua files
          local files = jade.Declarative.toLuaFiles(schema_def)

          -- Output as JSON
          local result = {}
          for filename, content in pairs(files) do
              table.insert(result, { filename = filename, content = content })
          end
          print(require("dkjson").encode(result))
        `;

        const { stdout } = await exec("lua", ["-e", script]);
        const files = JSON.parse(stdout.trim());

        // Create output directory
        const outputPath = path.join(projectRoot, outputDir);
        fs.mkdirSync(outputPath, { recursive: true });

        // Write files
        for (const file of files) {
          const filePath = path.join(outputPath, file.filename);
          fs.writeFileSync(filePath, file.content, "utf-8");
          Logger.info(`  Generated: ${file.filename}`);
        }

        Logger.success(`Schema files generated in ${outputDir}/`);
      } catch (error: any) {
        Logger.error("Failed to generate schema:");
        Logger.error(error.message);
        if (process.env.DEBUG) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });
}

interface SchemaDiffOptions {
  preview?: boolean;
}

function schemaDiffAction(options: SchemaDiffOptions): void {
  (async () => {
    try {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        Logger.error("Not a Jade project. Run 'esmeralda init' first.");
        process.exit(1);
      }

      Logger.info("Comparing schema with database...");

      // Execute Lua script to generate diff
      const script = `
        local jade = require("jade")
        local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
        jade.configure(config)

        -- Load current schema from database
        local tables = jade.driver():execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
        local current_schema = { models = {} }

        for _, row in ipairs(tables) do
            local table_name = row.table_name
            local cols = jade.driver():execute("SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns WHERE table_name = '" .. table_name .. "' ORDER BY ordinal_position")

            local fields = {}
            for _, col in ipairs(cols) do
                local field = {
                    name = col.column_name,
                    type = col.data_type,
                    not_null = col.is_nullable == "NO",
                }
                if col.character_maximum_length then
                    field.length = col.character_maximum_length
                end
                if col.column_default and col.column_default:find("nextval") then
                    field.primary_key = true
                end
                fields[col.column_name] = field
            end

            current_schema.models[table_name] = {
                tableName = table_name,
                fields = fields,
            }
        end

        -- Load declarative schema
        local schema_def = dofile("${path.join(projectRoot, "schema.lua").replace(/\\/g, "\\\\")}")

        -- Generate diff
        local diff = jade.Declarative.diff(current_schema, schema_def)

        -- Output as JSON
        print(require("dkjson").encode(diff))
      `;

      const { stdout } = await exec("lua", ["-e", script]);
      const diff = JSON.parse(stdout.trim());

      // Display diff
      if (diff.tables_to_create.length > 0) {
        Logger.info("Tables to create:");
        for (const table of diff.tables_to_create) {
          Logger.info(`  + ${table.tableName}`);
        }
      }

      if (diff.tables_to_drop.length > 0) {
        Logger.info("Tables to drop:");
        for (const table of diff.tables_to_drop) {
          Logger.info(`  - ${table.tableName}`);
        }
      }

      if (diff.tables_to_alter.length > 0) {
        Logger.info("Tables to alter:");
        for (const table of diff.tables_to_alter) {
          Logger.info(`  ~ ${table.model.tableName}`);
          if (table.changes.columns_to_add.length > 0) {
            for (const col of table.changes.columns_to_add) {
              Logger.info(`    + ${col.name}`);
            }
          }
          if (table.changes.columns_to_drop.length > 0) {
            for (const col of table.changes.columns_to_drop) {
              Logger.info(`    - ${col.name}`);
            }
          }
        }
      }

      if (diff.tables_to_create.length === 0 && diff.tables_to_drop.length === 0 && diff.tables_to_alter.length === 0) {
        Logger.info("No changes detected.");
        return;
      }

      if (options.preview) {
        Logger.info("Preview mode - no migration generated.");
        return;
      }

      // Generate migration
      Logger.info("Generating migration...");
      // TODO: Implement migration generation from diff
      Logger.success("Migration generation not yet implemented.");
    } catch (error: any) {
      Logger.error("Failed to compare schema:");
      Logger.error(error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  })();
}

export function registerSchemaDiff(db: Command): void {
  db.command("diff")
    .description("Compare current schema with database and generate migration")
    .option("--preview", "Preview changes without generating migration")
    .action(schemaDiffAction);

  // Hidden alias for backwards compatibility
  db.command("schema-diff")
    .description("Compare current schema with database and generate migration (alias for 'db diff')")
    .option("--preview", "Preview changes without generating migration")
    .action(schemaDiffAction)
    .addHelpText("after", "\nTip: Use 'db diff' instead.");
}
