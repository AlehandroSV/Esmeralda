import { EntityDef } from "./schema-parser.js";

export function generateMigration(entities: EntityDef[], direction: "up" | "down"): string {
  const lines: string[] = [];

  if (direction === "up") {
    for (const entity of entities) {
      lines.push(generateCreateTable(entity));
    }
  } else {
    // Down migration drops tables in reverse order
    for (const entity of entities.reverse()) {
      lines.push(`    Jade.dropTable("${entity.tableName}")`);
    }
  }

  return lines.join("\n\n");
}

function generateCreateTable(entity: EntityDef): string {
  const lines: string[] = [];
  lines.push(`    Jade.createTable("${entity.tableName}", {`);

  for (const col of entity.columns) {
    let line = `        ${col.name} = Jade.${col.type}()`;

    if (col.length && col.type === "String") {
      line = `        ${col.name} = Jade.String(${col.length})`;
    }

    if (col.primaryKey) line += ":primaryKey()";
    if (col.unique) line += ":unique()";
    if (col.notNull) line += ":notNull()";
    if (col.default !== undefined) {
      if (col.default === "CURRENT_TIMESTAMP") {
        line += ":defaultNow()";
      } else {
        line += `:default(${col.default})`;
      }
    }

    lines.push(line + ",");
  }

  lines.push(`    })`);
  return lines.join("\n");
}
