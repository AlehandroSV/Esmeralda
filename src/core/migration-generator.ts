import { EntityDef, ColumnDef } from "./schema-parser.js";

export function generateMigration(entities: EntityDef[], direction: "up" | "down"): string {
  const lines: string[] = [];

  if (direction === "up") {
    for (const entity of entities) {
      lines.push(generateCreateTable(entity));
    }
  } else {
    // Down migration drops tables in reverse order
    for (const entity of [...entities].reverse()) {
      lines.push(`    jade.driver():execute("DROP TABLE IF EXISTS ${entity.tableName} CASCADE")`);
    }
  }

  return lines.join("\n\n");
}

function generateCreateTable(entity: EntityDef): string {
  const colDefs: string[] = [];

  for (const col of entity.columns) {
    let def: string;

    // Integer primary keys become SERIAL (auto-increment)
    if (col.primaryKey && (col.type === "INTEGER" || col.type === "BIGINT")) {
      def = `        ${col.name} SERIAL PRIMARY KEY`;
    } else {
      def = `        ${col.name} ${getSQLType(col)}`;
      if (col.primaryKey) def += " PRIMARY KEY";
      if (col.notNull && !col.primaryKey) def += " NOT NULL";
      if (col.unique) def += " UNIQUE";
      if (col.default !== undefined) {
        def += ` DEFAULT ${getSQLDefault(col)}`;
      }
    }

    colDefs.push(def);
  }

  const sql = `CREATE TABLE IF NOT EXISTS ${entity.tableName} (\n${colDefs.join(",\n")}\n)`;
  return `    jade.driver():execute([[\n${sql}\n    ]])`;
}

function getSQLType(col: ColumnDef): string {
  const typeMap: Record<string, string> = {
    "VARCHAR": col.length ? `VARCHAR(${col.length})` : "VARCHAR(255)",
    "TEXT": "TEXT",
    "INTEGER": "INTEGER",
    "BIGINT": "BIGSERIAL",
    "FLOAT": "DOUBLE PRECISION",
    "DECIMAL": "DECIMAL(10,2)",
    "BOOLEAN": "BOOLEAN",
    "TIMESTAMP": "TIMESTAMPTZ",
    "DATE": "DATE",
    "UUID": "UUID",
    "JSON": "JSONB",
  };
  return typeMap[col.type] || "TEXT";
}

function getSQLDefault(col: ColumnDef): string {
  if (col.default === "true") return "TRUE";
  if (col.default === "false") return "FALSE";
  if (col.default === "CURRENT_TIMESTAMP") return "NOW()";
  if (typeof col.default === "string") return `'${col.default}'`;
  return String(col.default);
}
