import { describe, it, expect } from "vitest";
import { parseSchemaFile } from "../../src/core/schema-parser.js";

describe("Schema Parser", () => {
  it("parses Entity definitions", () => {
    const content = `
      local User = Jade.Entity("users", {
          id = Jade.Integer():primaryKey(),
          name = Jade.String(120),
          email = Jade.String():unique(),
      })
    `;

    const entities = parseSchemaFile(content);
    expect(entities).toHaveLength(1);
    expect(entities[0].tableName).toBe("users");
    expect(entities[0].columns).toHaveLength(3);
  });

  it("parses column types", () => {
    const content = `
      local User = Jade.Entity("users", {
          id = Jade.Integer():primaryKey(),
          name = Jade.String(120):notNull(),
      })
    `;

    const entities = parseSchemaFile(content);
    const columns = entities[0].columns;

    expect(columns[0].name).toBe("id");
    expect(columns[0].type).toBe("INTEGER");
    expect(columns[0].primaryKey).toBe(true);

    expect(columns[1].name).toBe("name");
    expect(columns[1].length).toBe(120);
    expect(columns[1].notNull).toBe(true);
  });

  it("parses multiple entities", () => {
    const content = `
      local User = Jade.Entity("users", {
          id = Jade.Integer():primaryKey(),
      })
      local Post = Jade.Entity("posts", {
          id = Jade.Integer():primaryKey(),
      })
    `;

    const entities = parseSchemaFile(content);
    expect(entities).toHaveLength(2);
    expect(entities[0].tableName).toBe("users");
    expect(entities[1].tableName).toBe("posts");
  });
});
