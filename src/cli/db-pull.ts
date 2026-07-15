import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { Logger } from "../utils/logger.js";
import { findProjectRoot } from "../core/project.js";
import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

export function registerDbPull(program: Command): void {
  program
    .command("db pull")
    .description("Introspect database and generate entity files")
    .option("-t, --table <name>", "Introspect specific table only")
    .action(async (options: { table?: string }) => {
      const projectRoot = findProjectRoot();
      if (!projectRoot) {
        Logger.error("Not a Jade project. Run 'esmeralda init' first.");
        process.exit(1);
      }

      Logger.info("Introspecting database...");

      try {
        const script = `
          local jade = require("jade")
          local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
          jade.configure(config)

          -- Get table list from database
          local tables = jade.driver():execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name")
          local result = {}
          for _, row in ipairs(tables) do
              table.insert(result, row.table_name)
          end
          print(jade.util.inflection and require("dkjson").encode(result) or "[]")
        `;

        const { stdout } = await exec("lua", ["-e", script]);
        const tables = JSON.parse(stdout.trim());

        Logger.info(`Found ${tables.length} tables`);

        // Generate entity files for each table
        const schemaDir = path.join(projectRoot, "schema");
        fs.mkdirSync(schemaDir, { recursive: true });

        for (const tableName of tables) {
          if (options.table && tableName !== options.table) continue;

          Logger.info(`  Generating entity: ${tableName}`);

          // Get columns for this table
          const columnScript = `
            local jade = require("jade")
            local config = dofile("${path.join(projectRoot, "jade.config.lua").replace(/\\/g, "\\\\")}")
            jade.configure(config)
            local cols = jade.driver():execute("SELECT column_name, data_type, character_maximum_length, is_nullable, column_default FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position")
            print(require("dkjson").encode(cols))
          `;

          const { stdout: colOutput } = await exec("lua", ["-e", columnScript]);
          const columns = JSON.parse(colOutput.trim());

          // Generate Lua entity file
          const entityName = tableName.charAt(0).toUpperCase() + tableName.slice(1, -1);
          const luaContent = generateEntityLua(entityName, tableName, columns);

          const filename = `${tableName}.lua`;
          const filePath = path.join(schemaDir, filename);
          fs.writeFileSync(filePath, luaContent, "utf-8");
        }

        Logger.success("Entity files generated in schema/");
      } catch (error: any) {
        Logger.error("Failed to introspect database:");
        Logger.error(error.message);
        process.exit(1);
      }
    });
}

function generateEntityLua(entityName: string, tableName: string, columns: any[]): string {
  const lines: string[] = [];

  lines.push(`local Jade = require("jade")`);
  lines.push(``);
  lines.push(`return Jade.Entity("${tableName}", {`);

  for (const col of columns) {
    const typeMap: Record<string, string> = {
      "integer": "Integer",
      "bigint": "Integer",
      "smallint": "Integer",
      "serial": "Integer",
      "bigserial": "Integer",
      "numeric": "Decimal",
      "real": "Float",
      "double precision": "Float",
      "varchar": "String",
      "character varying": "String",
      "text": "Text",
      "boolean": "Boolean",
      "date": "Date",
      "timestamp with time zone": "Timestamp",
      "timestamp without time zone": "Timestamp",
      "timestamp": "Timestamp",
      "uuid": "UUID",
      "json": "JSON",
      "jsonb": "JSON",
    };

    const typeName = typeMap[col.data_type] || "Text";
    let colDef = `    ${col.column_name} = Jade.${typeName}()`;

    if (col.character_maximum_length && typeName === "String") {
      colDef = `    ${col.column_name} = Jade.String(${col.character_maximum_length})`;
    }

    if (col.is_nullable === "NO") {
      colDef += ":notNull()";
    }

    if (col.column_default && col.column_default.includes("nextval")) {
      colDef += ":primaryKey()";
    } else if (col.column_default === "true" || col.column_default === "false") {
      colDef += `:default(${col.column_default})`;
    }

    lines.push(colDef + ",");
  }

  lines.push(`})`);

  return lines.join("\n");
}
